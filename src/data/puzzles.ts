import { Puzzle, WordEntry } from '../types';

export function validateCrossword(words: WordEntry[], gridSize: number): boolean {
  const grid: (string | null)[][] = [];
  
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      grid[row][col] = null;
    }
  }

  for (const word of words) {
    for (let i = 0; i < word.text.length; i++) {
      let row = word.start.row;
      let col = word.start.col;
      
      if (word.direction === 'horizontal') {
        col += i;
      } else {
        row += i;
      }

      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
        console.error(`Word "${word.text}" out of bounds at (${row},${col})`);
        return false;
      }

      const currentChar = grid[row][col];
      const newChar = word.text[i];

      if (currentChar !== null && currentChar !== newChar) {
        console.error(
          `Conflict at (${row},${col}): existing="${currentChar}", new="${newChar}" for word "${word.text}"`
        );
        return false;
      }

      grid[row][col] = newChar;
    }
  }

  return true;
}

export function createGridFromWords(words: WordEntry[], gridSize: number): Puzzle['grid'] {
  if (!validateCrossword(words, gridSize)) {
    throw new Error('Invalid crossword layout');
  }

  const grid: Puzzle['grid'] = [];
  
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      grid[row][col] = {
        isBlack: true,
        char: null,
        wordIds: [],
        clueNumber: null,
      };
    }
  }

  let clueNumber = 1;
  const usedNumbers = new Map<string, number>();

  for (const word of words) {
    const key = `${word.start.row}-${word.start.col}`;
    let number: number;
    
    if (usedNumbers.has(key)) {
      number = usedNumbers.get(key)!;
    } else {
      number = clueNumber++;
      usedNumbers.set(key, number);
    }

    for (let i = 0; i < word.text.length; i++) {
      let row = word.start.row;
      let col = word.start.col;
      
      if (word.direction === 'horizontal') {
        col += i;
      } else {
        row += i;
      }

      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
        continue;
      }

      grid[row][col].isBlack = false;
      grid[row][col].wordIds.push(word.id);

      if (i === 0 && grid[row][col].clueNumber === null) {
        grid[row][col].clueNumber = number;
      }
    }
  }

  return grid;
}

const puzzle1Words: WordEntry[] = [
  {
    id: 'h1',
    text: '一心一意',
    clue: '形容心思、意念专一',
    start: { row: 0, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '一言九鼎',
    clue: '形容说话极有分量',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'v2',
    text: '意气风发',
    clue: '形容精神振奋、气概昂扬',
    start: { row: 0, col: 3 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '风调雨顺',
    clue: '形容风雨适合农时，也比喻局势良好',
    start: { row: 2, col: 3 },
    direction: 'horizontal',
  },
];

const puzzle2Words: WordEntry[] = [
  {
    id: 'h1',
    text: '百花齐放',
    clue: '比喻艺术界繁荣景象',
    start: { row: 0, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '百折不挠',
    clue: '形容意志坚强',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'v2',
    text: '花好月圆',
    clue: '比喻美好圆满',
    start: { row: 0, col: 1 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '好逸恶劳',
    clue: '喜欢安逸，厌恶劳动',
    start: { row: 1, col: 1 },
    direction: 'horizontal',
  },
];

const puzzle3Words: WordEntry[] = [
  {
    id: 'h1',
    text: '学富五车',
    clue: '形容学问渊博',
    start: { row: 0, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '学而不厌',
    clue: '学习从不满足',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'v2',
    text: '五光十色',
    clue: '形容色彩鲜艳',
    start: { row: 0, col: 2 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '光彩夺目',
    clue: '形容鲜艳耀眼',
    start: { row: 1, col: 2 },
    direction: 'horizontal',
  },
];

const puzzle4Words: WordEntry[] = [
  {
    id: 'h1',
    text: '龙飞凤舞',
    clue: '形容书法气势奔放',
    start: { row: 0, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '龙马精神',
    clue: '比喻精神旺盛',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'v2',
    text: '凤毛麟角',
    clue: '比喻稀少可贵',
    start: { row: 0, col: 2 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '毛骨悚然',
    clue: '形容恐惧惊骇的样子',
    start: { row: 1, col: 2 },
    direction: 'horizontal',
  },
];

const puzzle5Words: WordEntry[] = [
  {
    id: 'h1',
    text: '春风化雨',
    clue: '比喻良好的教育',
    start: { row: 0, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '春暖花开',
    clue: '春天气候温暖，百花盛开',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'v2',
    text: '雨过天晴',
    clue: '比喻政治上由黑暗到光明',
    start: { row: 0, col: 3 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '天长地久',
    clue: '形容时间悠久或爱情永恒',
    start: { row: 2, col: 3 },
    direction: 'horizontal',
  },
];

export const puzzles: Puzzle[] = [
  {
    id: 'puzzle1',
    name: '心意与意志',
    gridSize: 7,
    words: puzzle1Words,
    grid: createGridFromWords(puzzle1Words, 7),
  },
  {
    id: 'puzzle2',
    name: '百花与圆满',
    gridSize: 7,
    words: puzzle2Words,
    grid: createGridFromWords(puzzle2Words, 7),
  },
  {
    id: 'puzzle3',
    name: '学习与努力',
    gridSize: 7,
    words: puzzle3Words,
    grid: createGridFromWords(puzzle3Words, 7),
  },
  {
    id: 'puzzle4',
    name: '龙凤与杰出',
    gridSize: 7,
    words: puzzle4Words,
    grid: createGridFromWords(puzzle4Words, 7),
  },
  {
    id: 'puzzle5',
    name: '春风与美好',
    gridSize: 7,
    words: puzzle5Words,
    grid: createGridFromWords(puzzle5Words, 7),
  },
];
