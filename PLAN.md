# 中文填字游戏 MVP 实施计划

## Context

从零搭建一款 Web 端中文填字游戏。玩家依据提示与交叉关键字推理词条（成语、俗谚、诗词、文化典故），填满网格通关。

目标是快速跑通 MVP：**LLM 实时出词条 → 前端算法排版成十字交叉网格 → 玩家在浏览器内交互填字并校验**。当前项目仓库只有 `README.md`，所有代码自建。

已确认的技术决策：
- 平台：Web（桌面优先，兼顾响应式）
- 技术栈：React 18 + TypeScript + Vite
- 网格：传统十字交叉（黑格 + 白格）
- 内容：LLM 出词条，算法排版
- Key：MVP 用前端直调（localStorage 存 Anthropic Key），`PuzzleProvider` 抽象预留后端代理
- MVP 范围：核心填字玩法（渲染/输入/导航/交叉高亮）+ 提示查看 + 错误反馈
- 不在 MVP：关卡存档、排行榜、社交分享（接口预留）

---

## 架构分层

- **存储层** `src/storage/`：localStorage 封装（API Key、生成配置）
- **生成层** `src/llm/` + `src/generator/`：`PuzzleProvider` 接口产出候选词；生成器纯算法排版，不依赖 LLM
- **游戏状态层** `src/game/`：`useReducer` 状态机，持有 `GameState`，暴露 action
- **UI 层** `src/components/` + `src/hooks/`：纯表现，通过 hook 消费状态/生成

`PuzzleProvider` 接口：

```ts
interface PuzzleProvider {
  generateCandidates(opts: {
    theme?: string; difficulty: Difficulty; count: number;
  }): Promise<PuzzleWord[]>;
}
```

MVP 实现 `AnthropicDirectProvider`（`@anthropic-ai/sdk` + `dangerouslyAllowBrowser: true`），未来可替换为 `BackendProxyProvider`。

---

## 核心数据结构

- `PuzzleWord { id, answer, clue, length, category }` — LLM 产物，无坐标
- `PlacedWord { id, direction: 'across'|'down', row, col, length, number }` — 排版后
- `Cell { row, col, isBlack, correctChar?, inputChar?, acrossId?, downId?, number? }`
- `Grid { rows, cols, cells: Cell[][], words: Record<string, PlacedWord> }`
- `GameState { grid, focus: { row, col, direction }, errorCells: Set<string>, status: 'idle'|'playing'|'solved' }`

交叉格的 `acrossId` 与 `downId` 同时非空；单元格 key 用 `${row}:${col}`。

---

## 谜题生成流水线

**Step 1 · LLM 出词条**
- Prompt 要求严格 JSON 数组，字段 `{ word, length, category, clue }`，长度 2–6，类别 enum（成语/俗语/诗句/典故/常用词），一次要 25–30 个以留足交叉空间，附 few-shot。
- 防御：`JSON.parse` 失败则剥代码围栏重试 1 次；逐词校验 `/^\p{Script=Han}+$/u` 与长度；去重。

**Step 2 · 算法排版（回溯）**

```
放最长词于中心做骨架
for 剩余词（按长度降序）:
  for 已放词:
    for 两词共享字符:
      计算垂直方向候选位置
      若 fitsGrid && noConflict && noAdjacentParallel:
        score = 交叉数 - 贴边惩罚
        收集候选
  选最高分放下；压栈；无候选则回溯
300ms 超时或达到目标词数则停
```

约束：同向词不相邻（相邻格必须是黑格或词端）；评分偏好多交叉、靠近中心。

**Step 3 · 落黑 + 编号**
所有非白格置 `isBlack: true`；按 row/col 顺序给每个 `PlacedWord` 首格赋递增 number。

**失败策略**：排版不出解 → 降低目标词数；仍失败 → 再次 `generateCandidates` 追加 15 词；重试上限 2 次。

---

## UI 组件

- `<CrosswordBoard>`：CSS Grid `repeat(N, 40px)`，监听 keydown（字母键填字前进；Backspace 删字后退；方向键切向/移格；Tab 跳下一词）
- `<Cell>`：黑/白/编号/高亮/错误/光标
- `<ClueList>`：横纵双列，点击聚焦首格并设方向
- `<SettingsPanel>`：API Key（password 输入）+ 主题/难度下拉 + 生成按钮 + Key 风险告知
- `<Toolbar>`：校验 / 清除 / 重开

焦点三元组 `(row, col, direction)`：输入沿 direction 推进；到词尾跳下一词空格；Backspace 空格回退并保留方向。

---

## 目录结构

```
src/
  llm/          types.ts · anthropicProvider.ts · prompts.ts · index.ts
  generator/    types.ts · layout.ts · validate.ts · blacken.ts
  game/         types.ts · reducer.ts · selectors.ts
  components/   CrosswordBoard.tsx · Cell.tsx · ClueList.tsx · SettingsPanel.tsx · Toolbar.tsx
  hooks/        useGame.ts · usePuzzle.ts · useKeyboard.ts
  storage/      settings.ts
  utils/        chinese.ts · id.ts
  App.tsx · main.tsx · styles.css
vite.config.ts · tsconfig.json · package.json
```

---

## 依赖选型

- 状态：`useReducer + Context`（MVP 体量够用；复杂化再换 zustand）
- LLM：`@anthropic-ai/sdk`（`dangerouslyAllowBrowser: true`）
- 样式：CSS Modules
- 汉字：手工遍历 code point + `/\p{Script=Han}/u`
- 工具：vitest、eslint、prettier

---

## 执行步骤

1. `npm create vite@latest`（react-ts）+ eslint/prettier/vitest — **验证**：`npm run dev` 白屏起
2. 三层 `types.ts` 定义 — **验证**：`tsc --noEmit` 通过
3. `<CrosswordBoard>` + `<Cell>` 静态渲染喂 mock `Grid` — **验证**：肉眼看到黑白格
4. `game/reducer.ts` + `useKeyboard` + 焦点高亮 — **验证**：mock 数据下输入/方向键/Tab 交互正确
5. `storage/settings.ts` + `<SettingsPanel>` — **验证**：Key 可存取
6. `anthropicProvider` + prompt + JSON 校验 — **验证**：控制台拿到合法词条数组
7. `generator/layout.ts` 回溯 + `blacken.ts` — **验证**：vitest 用固定词列 50 次 > 95% 成功
8. `usePuzzle`：Provider → 排版 → dispatch 初始化 — **验证**：点击生成出真实谜题
9. `<ClueList>` 点击聚焦 + 当前词高亮 — **验证**：交互联动
10. 校验按钮 + 错误红底 + `status='solved'` 弹窗 — **验证**：填错/填对均有反馈
11. 响应式 CSS + 移动端虚拟键盘处理 — **验证**：手机模拟器可玩
12. README + Vercel 静态部署

---

## 关键实现文件

- `src/generator/layout.ts` — 排版回溯算法（最核心、最易出问题）
- `src/llm/anthropicProvider.ts` + `src/llm/prompts.ts` — LLM 交互与防御
- `src/game/reducer.ts` — 状态机，决定交互手感
- `src/components/CrosswordBoard.tsx` + `src/hooks/useKeyboard.ts` — 输入与焦点
- `src/hooks/usePuzzle.ts` — 生成流水线编排

---

## 验证方案

- **单元测试**
  - `layout.test.ts`：10 词预设跑 50 次成功率 > 95%；同长词、无交叉字等边界走回退
  - `reducer.test.ts`：覆盖所有 action（输入、后退、切向、切词、校验、solved 判定）
  - `validate.test.ts`：LLM 输出 JSON 异常、非汉字、长度不符的防御
- **端到端手测**：`npm run dev` → 设置里填 Anthropic Key → 选主题"成语"难度"中" → 点击生成 → 方向键导航 → 全部填完 → 点校验 → 出现 solved

---

## 风险与缓解

- **LLM 格式漂移**：Prompt 强调"仅输出 JSON，无前后缀"；解析失败剥代码围栏重试一次；最终失败提示用户重试
- **排版失败率**：候选 25+ 保足量；失败自动追加词条；再失败降目标词数
- **Key 泄露 / CORS**：UI 明示"Key 仅存本地，勿在公共设备使用"；`PuzzleProvider` 抽象便于切后端代理；文档注明生产应走代理
- **中文对齐**：CSS Grid + 固定 40px 方格，`font-family: system-ui` + `text-align: center`，不依赖字符宽度
- **回溯性能**：300ms 超时 + 评分剪枝；保底缩网格
