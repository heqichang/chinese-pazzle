import { useState, useMemo } from 'react';
import { pinyin } from 'pinyin-pro';
import './Candidates.css';

interface CandidatesProps {
  candidates: string[];
  onCharSelect: (char: string) => void;
  onClear: () => void;
}

const pinyinInitials = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W',
  'X', 'Y', 'Z',
];

function getPinyinInitial(char: string): string {
  const py = pinyin(char, { pattern: 'first', toneType: 'none' });
  return py.toUpperCase();
}

function Candidates({
  candidates,
  onCharSelect,
  onClear,
}: CandidatesProps) {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);

  const filteredCandidates = useMemo(() => {
    if (!selectedInitial) {
      return candidates;
    }

    return candidates.filter(
      (char) => getPinyinInitial(char) === selectedInitial
    );
  }, [candidates, selectedInitial]);

  const handleInitialClick = (initial: string) => {
    setSelectedInitial(selectedInitial === initial ? null : initial);
  };

  return (
    <div className="candidates-container">
      <div className="candidates-header">
        <h3 className="candidates-title">候选字</h3>
        <button onClick={onClear} className="btn btn-clear">
          清除选中
        </button>
      </div>

      <div className="pinyin-filter">
        <div className="filter-label">拼音首字母：</div>
        <div className="initials-row">
          {pinyinInitials.map((initial) => (
            <button
              key={initial}
              className={`initial-btn ${
                selectedInitial === initial ? 'active' : ''
              }`}
              onClick={() => handleInitialClick(initial)}
            >
              {initial}
            </button>
          ))}
        </div>
      </div>

      <div className="chars-grid">
        {filteredCandidates.length === 0 ? (
          <div className="no-results">该首字母下无候选字</div>
        ) : (
          filteredCandidates.map((char, index) => (
            <button
              key={`${char}-${index}`}
              className="char-btn"
              onClick={() => onCharSelect(char)}
            >
              {char}
            </button>
          ))
        )}
      </div>

      {selectedInitial && (
        <button
          className="clear-filter-btn"
          onClick={() => setSelectedInitial(null)}
        >
          清除筛选
        </button>
      )}
    </div>
  );
}

export default Candidates;
