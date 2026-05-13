import { GameState, Puzzle, Position, WordEntry } from '../types';

export function createGameState(puzzle: Puzzle): GameState {
  const userGrid: (string | null)[][] = [];
  
  for (let row = 0; row < puzzle.gridSize; row++) {
    userGrid[row] = [];
    for (let col = 0; col < puzzle.gridSize; col++) {
      userGrid[row][col] = null;
    }
  }

  return {
    puzzle,
    userGrid,
    selectedCell: null,
    selectedDirection: 'horizontal',
    filledCells: new Set<string>(),
    completed: false,
  };
}

function isCellInWord(word: WordEntry, row: number, col: number): boolean {
  if (word.direction === 'horizontal') {
    if (row !== word.start.row) return false;
    return (
      col >= word.start.col &&
      col < word.start.col + word.text.length
    );
  } else {
    if (col !== word.start.col) return false;
    return (
      row >= word.start.row &&
      row < word.start.row + word.text.length
    );
  }
}

function findWordsForCell(
  puzzle: Puzzle,
  row: number,
  col: number
): WordEntry[] {
  return puzzle.words.filter((word) => isCellInWord(word, row, col));
}

export function selectCell(
  state: GameState,
  row: number,
  col: number
): GameState {
  const cell = state.puzzle.grid[row][col];
  
  if (cell.isBlack) {
    return state;
  }

  if (state.selectedCell) {
    if (
      state.selectedCell.row === row &&
      state.selectedCell.col === col
    ) {
      const words = findWordsForCell(state.puzzle, row, col);
      if (words.length > 1) {
        return {
          ...state,
          selectedDirection:
            state.selectedDirection === 'horizontal'
              ? 'vertical'
              : 'horizontal',
        };
      }
      return state;
    }

    const currentWords = findWordsForCell(state.puzzle, row, col);
    if (currentWords.length === 1) {
      return {
        ...state,
        selectedCell: { row, col },
        selectedDirection: currentWords[0].direction,
      };
    }

    const prevWords = findWordsForCell(
      state.puzzle,
      state.selectedCell.row,
      state.selectedCell.col
    );

    for (const prevWord of prevWords) {
      for (const currWord of currentWords) {
        if (prevWord.id === currWord.id) {
          return {
            ...state,
            selectedCell: { row, col },
            selectedDirection: prevWord.direction,
          };
        }
      }
    }
  }

  let direction: 'horizontal' | 'vertical' = 'horizontal';
  const words = findWordsForCell(state.puzzle, row, col);
  
  if (words.length === 1) {
    direction = words[0].direction;
  }

  return {
    ...state,
    selectedCell: { row, col },
    selectedDirection: direction,
  };
}

export function fillCell(
  state: GameState,
  char: string
): GameState {
  if (!state.selectedCell) return state;

  const { row, col } = state.selectedCell;
  const cell = state.puzzle.grid[row][col];

  if (cell.isBlack) return state;

  const newUserGrid = state.userGrid.map((r) => [...r]);
  newUserGrid[row][col] = char;

  const newFilledCells = new Set(state.filledCells);
  newFilledCells.add(`${row}-${col}`);

  const selectedCell = findNextEmptyCell(
    state.puzzle,
    newUserGrid,
    state.selectedCell,
    state.selectedDirection
  );

  return {
    ...state,
    userGrid: newUserGrid,
    filledCells: newFilledCells,
    selectedCell,
  };
}

function findNextEmptyCell(
  puzzle: Puzzle,
  userGrid: (string | null)[][],
  current: Position,
  direction: 'horizontal' | 'vertical'
): Position | null {
  const currentWords = findWordsForCell(
    puzzle,
    current.row,
    current.col
  );
  
  const word = currentWords.find((w) => w.direction === direction);

  if (word) {
    for (let i = 0; i < word.text.length; i++) {
      let row = word.start.row;
      let col = word.start.col;
      
      if (word.direction === 'horizontal') {
        col += i;
      } else {
        row += i;
      }

      if (
        userGrid[row][col] === null &&
        !puzzle.grid[row][col].isBlack
      ) {
        return { row, col };
      }
    }
  }

  for (let row = 0; row < puzzle.gridSize; row++) {
    for (let col = 0; col < puzzle.gridSize; col++) {
      if (
        userGrid[row][col] === null &&
        !puzzle.grid[row][col].isBlack
      ) {
        return { row, col };
      }
    }
  }

  return null;
}

export function clearCell(state: GameState): GameState {
  if (!state.selectedCell) return state;

  const { row, col } = state.selectedCell;
  const cell = state.puzzle.grid[row][col];

  if (cell.isBlack) return state;

  const newUserGrid = state.userGrid.map((r) => [...r]);
  newUserGrid[row][col] = null;

  const newFilledCells = new Set(state.filledCells);
  newFilledCells.delete(`${row}-${col}`);

  return {
    ...state,
    userGrid: newUserGrid,
    filledCells: newFilledCells,
  };
}

export function checkPuzzle(state: GameState): boolean {
  const { puzzle, userGrid } = state;

  for (const word of puzzle.words) {
    for (let i = 0; i < word.text.length; i++) {
      let row = word.start.row;
      let col = word.start.col;
      
      if (word.direction === 'horizontal') {
        col += i;
      } else {
        row += i;
      }

      if (row < 0 || row >= puzzle.gridSize || col < 0 || col >= puzzle.gridSize) {
        continue;
      }

      const userChar = userGrid[row][col];
      const answerChar = word.text[i];

      if (userChar !== answerChar) {
        return false;
      }
    }
  }

  return true;
}

const extraChars = [
  '天', '地', '人', '山', '水', '火', '风', '云', '雨', '雪',
  '大', '小', '中', '上', '下', '左', '右', '前', '后', '东',
  '南', '西', '北', '心', '手', '眼', '耳', '口', '舌', '头',
  '金', '木', '土', '石', '玉', '珠', '宝', '花', '草', '树',
  '鸟', '鱼', '虫', '兽', '马', '牛', '羊', '鸡', '狗', '猪',
  '日', '月', '星', '年', '月', '时', '分', '秒', '春', '夏',
  '秋', '冬', '寒', '热', '温', '凉', '红', '黄', '蓝', '绿',
  '白', '黑', '长', '短', '高', '低', '多', '少', '早', '晚',
  '快', '慢', '新', '旧', '好', '坏', '真', '假', '正', '反',
  '生', '死', '进', '出', '开', '关', '来', '去', '有', '无',
];

export function getCandidateChars(state: GameState): string[] {
  const answerChars = new Set<string>();
  
  for (const word of state.puzzle.words) {
    for (const char of word.text) {
      answerChars.add(char);
    }
  }

  const answerArray = Array.from(answerChars);
  
  const availableExtra = extraChars.filter(
    (c) => !answerChars.has(c)
  );

  const numExtra = Math.max(answerArray.length, 10);
  
  const shuffledExtra = shuffleArray(availableExtra).slice(0, numExtra);
  
  const allChars = [...answerArray, ...shuffledExtra];
  
  return shuffleArray(allChars);
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
