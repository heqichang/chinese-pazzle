export interface Position {
  row: number;
  col: number;
}

export interface WordEntry {
  id: string;
  text: string;
  clue: string;
  start: Position;
  direction: 'horizontal' | 'vertical';
}

export interface Cell {
  isBlack: boolean;
  char: string | null;
  wordIds: string[];
  clueNumber: number | null;
}

export interface Puzzle {
  id: string;
  name: string;
  gridSize: number;
  grid: Cell[][];
  words: WordEntry[];
}

export interface GameState {
  puzzle: Puzzle;
  userGrid: (string | null)[][];
  selectedCell: Position | null;
  selectedDirection: 'horizontal' | 'vertical';
  usedChars: string[];
  completed: boolean;
}
