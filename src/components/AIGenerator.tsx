import { useState } from 'react';
import { EntryType, Puzzle } from '../types';
import { generatePuzzle, loadLLMConfig, typeLabels } from '../services/llmService';
import './AIGenerator.css';

interface AIGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (puzzle: Puzzle) => void;
  onOpenSettings: () => void;
}

const allEntryTypes: EntryType[] = ['idiom', 'proverb', 'poetry', 'allusion'];

export default function AIGenerator({ isOpen, onClose, onGenerate, onOpenSettings }: AIGeneratorProps) {
  const [selectedTypes, setSelectedTypes] = useState<EntryType[]>(['idiom']);
  const [gridSize, setGridSize] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleType = (type: EntryType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError('请至少选择一种词条类型');
      return;
    }

    const config = loadLLMConfig();
    if (!config || !config.apiKey || !config.baseUrl || !config.modelName) {
      setError('请先在设置中配置 LLM 参数');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const puzzle = await generatePuzzle(config, selectedTypes, gridSize);
      onGenerate(puzzle);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI 出题</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>词条类型</label>
            <div className="type-checkboxes">
              {allEntryTypes.map((type) => (
                <label key={type} className={`type-checkbox ${selectedTypes.includes(type) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  <span>{typeLabels[type]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gridSize">网格大小</label>
            <select
              id="gridSize"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="grid-size-select"
            >
              <option value={6}>6×6</option>
              <option value={7}>7×7</option>
              <option value={8}>8×8</option>
              <option value={9}>9×9</option>
              <option value={10}>10×10</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="settings-hint">
            <span>需要配置 API Key？</span>
            <button className="link-button" onClick={onOpenSettings}>打开设置</button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || selectedTypes.length === 0}
          >
            {loading ? '⏳ 生成中...' : '🚀 生成题目'}
          </button>
        </div>
      </div>
    </div>
  );
}
