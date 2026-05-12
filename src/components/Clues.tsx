import { WordEntry } from '../types';
import './Clues.css';

interface CluesProps {
  words: WordEntry[];
}

function Clues({ words }: CluesProps) {
  const horizontalClues = words.filter((w) => w.direction === 'horizontal');
  const verticalClues = words.filter((w) => w.direction === 'vertical');

  return (
    <div className="clues-container">
      <div className="clues-section">
        <h3 className="clues-title">横向</h3>
        <ul className="clues-list">
          {horizontalClues.map((word, index) => (
            <li key={word.id} className="clue-item">
              <span className="clue-number-badge">{index + 1}</span>
              <span className="clue-text">{word.clue}</span>
              <span className="clue-length">({word.text.length}字)</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="clues-section">
        <h3 className="clues-title">纵向</h3>
        <ul className="clues-list">
          {verticalClues.map((word, index) => (
            <li key={word.id} className="clue-item">
              <span className="clue-number-badge">{index + 1}</span>
              <span className="clue-text">{word.clue}</span>
              <span className="clue-length">({word.text.length}字)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Clues;
