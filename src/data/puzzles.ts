import { Puzzle, WordEntry } from '../types';

function createGridFromWords(words: WordEntry[], gridSize: number): Puzzle['grid'] {
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
    text: '一马当先',
    clue: '形容领先或带头',
    start: { row: 0, col: 0 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '心想事成',
    clue: '心中所想的都能实现',
    start: { row: 3, col: 0 },
    direction: 'horizontal',
  },
  {
    id: 'v2',
    text: '意气风发',
    clue: '形容精神振奋、气概昂扬',
    start: { row: 0, col: 3 },
    direction: 'vertical',
  },
  {
    id: 'h3',
    text: '成千上万',
    clue: '形容数量很多',
    start: { row: 6, col: 3 },
    direction: 'horizontal',
  },
  {
    id: 'v3',
    text: '成人之美',
    clue: '成全他人的好事',
    start: { row: 3, col: 6 },
    direction: 'vertical',
  },
];

const puzzle2Words: WordEntry[] = [
  {
    id: 'h1',
    text: '百花齐放',
    clue: '比喻艺术界繁荣景象',
    start: { row: 0, col: 1 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '百折不挠',
    clue: '形容意志坚强',
    start: { row: 0, col: 1 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '花好月圆',
    clue: '比喻美好圆满',
    start: { row: 2, col: 2 },
    direction: 'horizontal',
  },
  {
    id: 'v2',
    text: '齐心协力',
    clue: '形容思想一致，共同努力',
    start: { row: 1, col: 5 },
    direction: 'vertical',
  },
  {
    id: 'h3',
    text: '万事如意',
    clue: '一切事情都符合心意',
    start: { row: 6, col: 2 },
    direction: 'horizontal',
  },
  {
    id: 'v3',
    text: '圆满成功',
    clue: '指事情完满成功',
    start: { row: 2, col: 4 },
    direction: 'vertical',
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
    id: 'h2',
    text: '废寝忘食',
    clue: '形容专心努力',
    start: { row: 3, col: 2 },
    direction: 'horizontal',
  },
  {
    id: 'v2',
    text: '五光十色',
    clue: '形容色彩鲜艳',
    start: { row: 0, col: 3 },
    direction: 'vertical',
  },
  {
    id: 'h3',
    text: '十年寒窗',
    clue: '形容长期刻苦读书',
    start: { row: 5, col: 3 },
    direction: 'horizontal',
  },
  {
    id: 'v3',
    text: '食古不化',
    clue: '比喻拘泥于旧法',
    start: { row: 3, col: 5 },
    direction: 'vertical',
  },
];

const puzzle4Words: WordEntry[] = [
  {
    id: 'h1',
    text: '龙飞凤舞',
    clue: '形容书法气势奔放',
    start: { row: 0, col: 1 },
    direction: 'horizontal',
  },
  {
    id: 'v1',
    text: '龙马精神',
    clue: '比喻精神旺盛',
    start: { row: 0, col: 1 },
    direction: 'vertical',
  },
  {
    id: 'h2',
    text: '凤毛麟角',
    clue: '比喻稀少可贵',
    start: { row: 2, col: 3 },
    direction: 'horizontal',
  },
  {
    id: 'v2',
    text: '舞文弄墨',
    clue: '指玩弄文字技巧',
    start: { row: 0, col: 4 },
    direction: 'vertical',
  },
  {
    id: 'h3',
    text: '精益求精',
    clue: '已经很好了，还求更好',
    start: { row: 5, col: 2 },
    direction: 'horizontal',
  },
  {
    id: 'v3',
    text: '角立杰出',
    clue: '形容出类拔萃',
    start: { row: 2, col: 6 },
    direction: 'vertical',
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
    id: 'h2',
    text: '风和日丽',
    clue: '形容天气晴朗暖和',
    start: { row: 3, col: 2 },
    direction: 'horizontal',
  },
  {
    id: 'v2',
    text: '雨过天晴',
    clue: '比喻政治上由黑暗到光明',
    start: { row: 0, col: 3 },
    direction: 'vertical',
  },
  {
    id: 'h3',
    text: '天高地厚',
    clue: '比喻恩情深厚',
    start: { row: 6, col: 3 },
    direction: 'horizontal',
  },
  {
    id: 'v3',
    text: '丽质天成',
    clue: '形容天生丽质',
    start: { row: 3, col: 5 },
    direction: 'vertical',
  },
];

export const puzzles: Puzzle[] = [
  {
    id: 'puzzle1',
    name: '心意与成功',
    gridSize: 9,
    words: puzzle1Words,
    grid: createGridFromWords(puzzle1Words, 9),
  },
  {
    id: 'puzzle2',
    name: '花开与圆满',
    gridSize: 9,
    words: puzzle2Words,
    grid: createGridFromWords(puzzle2Words, 9),
  },
  {
    id: 'puzzle3',
    name: '学习与努力',
    gridSize: 9,
    words: puzzle3Words,
    grid: createGridFromWords(puzzle3Words, 9),
  },
  {
    id: 'puzzle4',
    name: '龙凤与杰出',
    gridSize: 9,
    words: puzzle4Words,
    grid: createGridFromWords(puzzle4Words, 9),
  },
  {
    id: 'puzzle5',
    name: '春天与天气',
    gridSize: 9,
    words: puzzle5Words,
    grid: createGridFromWords(puzzle5Words, 9),
  },
];
