import { useState, useEffect } from 'react';
import { LLMConfig } from '../types';
import { loadLLMConfig, saveLLMConfig } from '../services/llmService';
import './LLMSettings.css';

interface LLMSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: LLMConfig) => void;
}

export default function LLMSettings({ isOpen, onClose, onSave }: LLMSettingsProps) {
  const [config, setConfig] = useState<LLMConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedConfig = loadLLMConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const handleSave = () => {
    saveLLMConfig(config);
    setSaved(true);
    onSave?.(config);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>LLM 设置</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="baseUrl">API Base URL</label>
            <input
              id="baseUrl"
              type="text"
              placeholder="https://api.openai.com/v1"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
            <p className="form-hint">支持 OpenAI 兼容的 API 接口</p>
          </div>

          <div className="form-group">
            <label htmlFor="modelName">模型名称</label>
            <input
              id="modelName"
              type="text"
              placeholder="gpt-3.5-turbo 或 claude-3-opus"
              value={config.modelName}
              onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <div className="input-with-button">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="form-hint">Key 保存在本地浏览器，不会上传</p>
          </div>
        </div>

        <div className="modal-footer">
          {saved && <span className="saved-indicator">✓ 已保存</span>}
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存设置</button>
        </div>
      </div>
    </div>
  );
}
