import { Cell, Position } from '../types';
import './Grid.css';

interface GridProps {
  grid: Cell[][];
  userGrid: (string | null)[][];
  selectedCell: Position | null;
  selectedDirection: 'horizontal' | 'vertical';
  onCellClick: (row: number, col: number) => void;
}

function Grid({
  grid,
  userGrid,
  selectedCell,
  selectedDirection,
  onCellClick,
}: GridProps) {
  const gridSize = grid.length;

  const isCellHighlighted = (row: number, col: number): boolean => {
    if (!selectedCell) return false;

    if (selectedCell.row === row && selectedCell.col === col) {
      return true;
    }

    if (selectedDirection === 'horizontal') {
      return row === selectedCell.row;
    } else {
      return col === selectedCell.col;
    }
  };

  const isCellSelected = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    return selectedCell.row === row && selectedCell.col === col;
  };

  return (
    <div className="grid-container">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = isCellSelected(rowIndex, colIndex);
            const isHighlighted = isCellHighlighted(rowIndex, colIndex);
            const userChar = userGrid[rowIndex][colIndex];

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${cell.isBlack ? 'black' : ''} ${
                  !cell.isBlack && isSelected ? 'selected' : ''
                } ${!cell.isBlack && isHighlighted ? 'highlighted' : ''} ${
                  userChar ? 'filled' : ''
                }`}
                onClick={() => onCellClick(rowIndex, colIndex)}
              >
                {!cell.isBlack && (
                  <>
                    {cell.clueNumber && (
                      <span className="clue-number">{cell.clueNumber}</span>
                    )}
                    {userChar && <span className="char">{userChar}</span>}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Grid;
