import { useState, useEffect, useCallback } from 'react';
import { GameState } from './types';
import { puzzles } from './data/puzzles';
import {
  createGameState,
  selectCell,
  fillCell,
  clearCell,
  checkPuzzle,
  getCandidateChars,
} from './utils/gameLogic';
import Grid from './components/Grid';
import Clues from './components/Clues';
import Candidates from './components/Candidates';
import './App.css';

function App() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>('');

  const loadRandomPuzzle = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    setCurrentPuzzleIndex(randomIndex);
    const puzzle = puzzles[randomIndex];
    setGameState(createGameState(puzzle));
    setMessage('');
  }, []);

  useEffect(() => {
    loadRandomPuzzle();
  }, [loadRandomPuzzle]);

  if (!gameState) {
    return <div className="loading">加载中...</div>;
  }

  const handleCellClick = (row: number, col: number) => {
    setGameState(selectCell(gameState, row, col));
    setMessage('');
  };

  const handleCharSelect = (char: string) => {
    if (!gameState.selectedCell) {
      setMessage('请先选择一个方格');
      return;
    }
    const newState = fillCell(gameState, char);
    setGameState(newState);
    if (checkPuzzle(newState)) {
      setGameState({ ...newState, completed: true });
      setMessage('🎉 恭喜！你完成了这道题！');
    } else {
      setMessage('');
    }
  };

  const handleClear = () => {
    if (!gameState.selectedCell) {
      setMessage('请先选择一个方格');
      return;
    }
    setGameState(clearCell(gameState));
    setMessage('');
  };

  const handleReset = () => {
    const puzzle = puzzles[currentPuzzleIndex];
    setGameState(createGameState(puzzle));
    setMessage('');
  };

  const handleNewPuzzle = () => {
    loadRandomPuzzle();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>成语填字游戏</h1>
        <div className="header-actions">
          <button onClick={handleReset} className="btn btn-secondary">
            重置本题
          </button>
          <button onClick={handleNewPuzzle} className="btn btn-primary">
            换一题
          </button>
        </div>
      </header>

      {message && <div className="message">{message}</div>}

      <main className="app-main">
        <div className="game-area">
          <Grid
            grid={gameState.puzzle.grid}
            userGrid={gameState.userGrid}
            selectedCell={gameState.selectedCell}
            selectedDirection={gameState.selectedDirection}
            onCellClick={handleCellClick}
          />

          <Candidates
            candidates={getCandidateChars(gameState)}
            onCharSelect={handleCharSelect}
            onClear={handleClear}
          />
        </div>

        <Clues words={gameState.puzzle.words} />
      </main>
    </div>
  );
}

export default App;
