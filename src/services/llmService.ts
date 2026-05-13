import { EntryType, LLMConfig, Puzzle, WordEntry } from '../types';
import { validateCrossword, createGridFromWords } from '../data/puzzles';

const typeLabels: Record<EntryType, string> = {
  idiom: '成语',
  proverb: '俗谚',
  poetry: '诗词',
  allusion: '文化典故',
};

function buildPrompt(entryTypes: EntryType[], gridSize: number): string {
  const entryTypesText = entryTypes.map((t) => typeLabels[t]).join('、');
  const maxIndex = gridSize - 1;
  return `你是一位专业的中文填字游戏出题专家。请严格按照所有规则生成一个有效的填字游戏。

【词条类型】${entryTypesText}

========== 【绝对不可违反的硬性规则】 ==========

1. 网格大小：${gridSize}×${gridSize}
   - row 和 col 从 0 开始，最大只能是 ${maxIndex}
   - 4 字词条 horizontal：start.col 最大只能是 ${maxIndex - 3}（因为 0+3=3 < ${gridSize}）
   - 4 字词条 vertical：start.row 最大只能是 ${maxIndex - 3}
   - 5 字词条 horizontal：start.col 最大只能是 ${maxIndex - 4}
   - 5 字词条 vertical：start.row 最大只能是 ${maxIndex - 4}

2. 边界计算公式（必须遵守）：
   - horizontal: start.col + len - 1 <= ${maxIndex}
   - vertical: start.row + len - 1 <= ${maxIndex}

3. 错误示例（绝对不能出现）：
   ❌ 7×7 网格中，4 字词 start.col=5 → 5+3=8 >= 7 超出边界
   ❌ 7×7 网格中，4 字词 start.row=5 → 5+3=8 >= 7 超出边界

4. 正确示例：
   ✅ 7×7 网格中，4 字词 start.col=0 → 0+3=3 < 7
   ✅ 7×7 网格中，4 字词 start.col=3 → 3+3=6 < 7
   ✅ 7×7 网格中，4 字词 start.row=0 → 0+3=3 < 7

========== 【交叉规则】 ==========

所有词条必须通过共享汉字形成连通图：
- h1 (一心一意, row=0, col=0, horizontal): 占用 (0,0)(0,1)(0,2)(0,3)
- v1 (一言九鼎, row=0, col=0, vertical): 占用 (0,0)(1,0)(2,0)(3,0) → 在 (0,0) 与 h1 共享"一"
- v2 (意气风发, row=0, col=3, vertical): 占用 (0,3)(1,3)(2,3)(3,3) → 在 (0,3) 与 h1 共享"意"
- h2 (风调雨顺, row=2, col=3, horizontal): 占用 (2,3)(2,4)(2,5)(2,6) → 在 (2,3) 与 v2 共享"风"

========== 【词条规范】 ==========

- 成语：固定 4 字
- 俗谚：4-6 字
- 诗词：4-7 字（从诗句中截取的名句）
- 典故：4-6 字
- 横向词至少 2 个，纵向词至少 2 个
- 总共 4-6 个词

========== 【输出格式 - 只输出 JSON】 ==========

{
  "name": "题目主题",
  "gridSize": ${gridSize},
  "words": [
    {
      "id": "h1",
      "text": "成语4字",
      "clue": "详细提示",
      "start": {"row": 0, "col": 0},
      "direction": "horizontal",
      "type": "idiom"
    },
    {
      "id": "v1",
      "text": "成语4字",
      "clue": "详细提示",
      "start": {"row": 0, "col": 0},
      "direction": "vertical",
      "type": "idiom"
    }
  ]
}

========== 【生成前自我检查】 ==========

1. 每个词的边界检查：start.col + len - 1 <= ${maxIndex}
2. 每个词的边界检查：start.row + len - 1 <= ${maxIndex}
3. 所有交叉位置的汉字必须相同
4. 横向词 >= 2，纵向词 >= 2

确认所有约束都满足后，只输出 JSON。`;
}

async function callLLM(config: LLMConfig, prompt: string, retryCount: number = 0): Promise<string> {
  const apiBody = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.modelName,
    messages: [
      {
        role: 'system',
        content: '你是一位专业的中文填字游戏出题专家。只输出 JSON，不输出任何解释文字。严格遵守所有约束，特别是交叉位置的汉字必须相同。'
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
  };

  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status >= 500 && retryCount < 2) {
      await sleep(1000);
      return callLLM(config, prompt, retryCount + 1);
    }
    throw new Error(`LLM请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM返回内容为空');
  }

  return content;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateAndFixWords(words: WordEntry[], gridSize: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (words.length < 4) {
    errors.push(`词条数量不足：${words.length} 个，至少需要 4 个`);
  }

  const horizontalWords = words.filter((w) => w.direction === 'horizontal');
  const verticalWords = words.filter((w) => w.direction === 'vertical');
  if (horizontalWords.length < 2 || verticalWords.length < 2) {
    errors.push(`横向词(${horizontalWords.length})和纵向词(${verticalWords.length})各至少需要 2 个`);
  }

  const grid: Record<string, string> = {};

  for (const word of words) {
    if (word.direction !== 'horizontal' && word.direction !== 'vertical') {
      errors.push(`词 "${word.text}" 的 direction 必须是 "horizontal" 或 "vertical"`);
      continue;
    }

    const len = word.text.length;
    if (word.direction === 'horizontal') {
      const endCol = word.start.col + len - 1;
      if (endCol >= gridSize) {
        errors.push(`词 "${word.text}" 超出边界：col 从 ${word.start.col} 到 ${endCol}，网格大小为 ${gridSize}`);
      }
      if (word.start.row >= gridSize) {
        errors.push(`词 "${word.text}" 的 row ${word.start.row} 超出范围`);
      }
    } else {
      const endRow = word.start.row + len - 1;
      if (endRow >= gridSize) {
        errors.push(`词 "${word.text}" 超出边界：row 从 ${word.start.row} 到 ${endRow}，网格大小为 ${gridSize}`);
      }
      if (word.start.col >= gridSize) {
        errors.push(`词 "${word.text}" 的 col ${word.start.col} 超出范围`);
      }
    }

    for (let i = 0; i < len; i++) {
      const char = word.text[i];
      const row = word.direction === 'horizontal' ? word.start.row : word.start.row + i;
      const col = word.direction === 'horizontal' ? word.start.col + i : word.start.col;
      const key = `${row},${col}`;

      if (grid[key] && grid[key] !== char) {
        errors.push(`交叉冲突：位置 (${row},${col}) 已有 "${grid[key]}"，但词 "${word.text}" 要求 "${char}"`);
      } else {
        grid[key] = char;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function parseLLMResponse(content: string): { name: string; gridSize: number; words: WordEntry[] } {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log('LLM 原始输出:', content);
    throw new Error('无法解析LLM返回的JSON内容');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.name || parsed.gridSize === undefined || !Array.isArray(parsed.words)) {
    throw new Error('LLM返回的数据缺少必要字段: name, gridSize, words');
  }

  const words: WordEntry[] = parsed.words.map((w: any, index: number) => {
    const direction = w.direction === 'vertical' ? 'vertical' : 'horizontal';
    const prefix = direction === 'horizontal' ? 'h' : 'v';
    const count = parsed.words.filter((x: any) => 
      (x.direction === 'vertical' ? 'vertical' : 'horizontal') === direction
    ).slice(0, index + 1).length;
    return {
      id: w.id || `${prefix}${count}`,
      text: String(w.text || ''),
      clue: String(w.clue || ''),
      start: {
        row: parseInt(String(w.start?.row ?? 0)),
        col: parseInt(String(w.start?.col ?? 0)),
      },
      direction,
      type: w.type as EntryType || 'idiom',
    };
  });

  return {
    name: parsed.name,
    gridSize: parseInt(String(parsed.gridSize)),
    words,
  };
}

export async function generatePuzzle(
  config: LLMConfig,
  entryTypes: EntryType[],
  gridSize: number = 7,
  maxAttempts: number = 3
): Promise<Puzzle> {
  if (!config.apiKey || !config.baseUrl || !config.modelName) {
    throw new Error('请先配置LLM参数（API Key、Base URL、Model Name）');
  }

  if (entryTypes.length === 0) {
    throw new Error('请至少选择一种词条类型');
  }

  const prompt = buildPrompt(entryTypes, gridSize);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const content = await callLLM(config, prompt);
      const parsed = parseLLMResponse(content);

      const actualGridSize = parsed.gridSize || gridSize;

      const validation = validateAndFixWords(parsed.words, actualGridSize);
      if (!validation.valid) {
        console.log(`第 ${attempt} 次尝试验证失败:`, validation.errors);
        if (attempt === maxAttempts) {
          throw new Error(`布局验证失败: ${validation.errors.join('；')}`);
        }
        await sleep(500);
        continue;
      }

      if (!validateCrossword(parsed.words, actualGridSize)) {
        console.log(`第 ${attempt} 次尝试交叉验证失败`);
        if (attempt === maxAttempts) {
          throw new Error('生成的填字布局无效，请重试');
        }
        await sleep(500);
        continue;
      }

      const puzzle: Puzzle = {
        id: `llm-${Date.now()}`,
        name: parsed.name,
        gridSize: actualGridSize,
        words: parsed.words,
        grid: createGridFromWords(parsed.words, actualGridSize),
      };

      return puzzle;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`第 ${attempt} 次尝试失败:`, message);
      if (attempt === maxAttempts) {
        throw err;
      }
      await sleep(800);
    }
  }

  throw new Error('多次尝试后仍无法生成有效题目，请重试');
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem('llm_config', JSON.stringify(config));
}

export function loadLLMConfig(): LLMConfig | null {
  const saved = localStorage.getItem('llm_config');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export { typeLabels };
