# 中文填字游戏 · 迭代路线图

> 配套文档：[PLAN.md](./PLAN.md) — 架构与设计细节。
> 本文档：把 12 步执行切分为 **5 个迭代**，每个迭代自成一个可演示的增量。

## 总览

| # | 迭代 | 核心产出 | 能向他人演示什么 |
|---|------|---------|------------------|
| 1 | 骨架 & 静态棋盘 | Vite 项目 + 核心类型 + 网格静态渲染 | "看，能显示一个黑白交叉的中文填字棋盘" |
| 2 | Mock 可玩 | reducer + 键盘导航 + 提示列表 + 校验 | "用内置 mock 词条从头填到 solved" |
| 3 | LLM 词条 | Settings + Anthropic Provider + Prompt 防御 | "点生成，控制台出一批合法词条 JSON" |
| 4 | 自动排版 & 贯通 | 回溯算法 + 黑格编号 + 生成流水线 | "点生成，LLM 出词 → 自动排版 → 直接开玩" |
| 5 | 打磨 & 上线 | 响应式 + 视觉打磨 + README + 部署 | "发一个公网链接，手机也能玩" |

每个迭代的产物应当：**独立可运行、可演示、可回退**。上一迭代不完成不进入下一迭代。

---

## 迭代 1 — 骨架 & 静态棋盘

**目标**：项目能跑起来，能看到一个由 mock 数据渲染出的静态中文填字网格。

**任务**
1. `npm create vite@latest`（react-ts）+ 基础配置（eslint / prettier / vitest / tsconfig strict）
2. 定义核心类型：`src/llm/types.ts`、`src/generator/types.ts`、`src/game/types.ts`
3. 写一份 mock `Grid` fixture（5–7 个词，手工排好的小网格）放到 `src/fixtures/mockPuzzle.ts`
4. 实现静态组件：`src/components/CrosswordBoard.tsx`、`src/components/Cell.tsx`
5. `App.tsx` 直接喂 mock 数据

**验收**
- `npm run dev` 打开页面，看到一个 11×11 左右的网格
- 黑格 / 白格 / 答案字符 / 编号角标都能正常渲染
- `tsc --noEmit` 与 `eslint` 无报错

**关键风险**
- 中文对齐：CSS Grid 固定 40px 方格 + `text-align: center`，不要依赖字符宽度

**可延后**：精细样式、hover 效果（下一迭代统一处理）

---

## 迭代 2 — Mock 可玩

**目标**：不依赖 LLM，用迭代 1 的 mock 数据能完整玩通一局。

**任务**
1. `src/game/reducer.ts` + `src/game/selectors.ts`：实现所有 action（INPUT、BACKSPACE、MOVE、TOGGLE_DIRECTION、JUMP_WORD、VALIDATE）
2. `src/hooks/useKeyboard.ts`：键盘事件 → action 映射
   - 汉字输入（IME composition 事件）+ 自动前进
   - Backspace 删字后退
   - ← ↑ → ↓ 切向或移格
   - Tab / Shift+Tab 跳下一词
   - 点击格子切焦点与方向
3. `src/components/ClueList.tsx`：横 / 纵双列，当前词高亮，点击聚焦对应首格
4. `src/components/Toolbar.tsx`：校验 / 清除 / 重开按钮
5. Cell 的高亮态：当前格（蓝底）/ 当前词（浅蓝）/ 错误格（红底）
6. `solved` 状态 → 简单弹窗或顶栏提示
7. **单测**：`reducer.test.ts` 覆盖全部 action，`selectors.test.ts` 覆盖当前词计算

**验收**
- 键盘能流畅地从第 1 词一路填到最后一词
- 交叉格修改时两条词的视图同步更新
- 故意填错 → 点校验 → 错误格变红
- 全部正确 → 自动进入 solved，弹出"通关"提示

**关键风险**
- IME 中文输入：用 `compositionend` 而非 `keydown` 接字符；先调通最简方案再优化
- 焦点状态机越界处理（词首 Backspace、词末 Space 等极端情况）

**可延后**：动画、音效、计时器

---

## 迭代 3 — LLM 词条接入

**目标**：用户填自己的 Anthropic API Key，点击"生成词条"，能从 LLM 拿到 25+ 条合法候选词并打印到控制台。**此迭代暂不排版**。

**任务**
1. `src/storage/settings.ts`：localStorage 封装（api key、主题、难度）
2. `src/components/SettingsPanel.tsx`：API Key（`type=password`）+ 主题下拉 + 难度下拉 + 风险告知文字
3. 安装 `@anthropic-ai/sdk`
4. `src/llm/prompts.ts`：系统提示 + few-shot 示例，要求严格 JSON 数组输出
5. `src/llm/anthropicProvider.ts`：实现 `PuzzleProvider` 接口，`dangerouslyAllowBrowser: true`
6. `src/llm/validate.ts`：JSON 解析 → 逐词校验（`/^\p{Script=Han}+$/u`、长度、category 枚举）→ 去重
7. 解析失败重试一次（剥代码围栏）
8. 在 Settings 加"测试生成"按钮，`console.log` 输出词条
9. **单测**：`validate.test.ts` 覆盖 JSON 异常、非汉字、长度不符、重复词

**验收**
- 填 Key → 点测试生成 → 控制台出 25 条符合 schema 的词条
- 人为断网或填错 Key → UI 给清晰错误提示
- 刷新页面后 Key 仍在（localStorage）

**关键风险**
- **模型选型**：推荐默认 `claude-opus-4-7`（质量稳）；若预算敏感给选项切 `claude-haiku-4-5-20251001`
- **CORS**：SDK 浏览器端走官方支持路径；若遇 CORS 立刻切后端代理思路（MVP 先不做，但要记录）
- **Prompt 注入风险**：主题字段应该做长度 + 字符白名单过滤

**可延后**：流式输出、生成进度条

---

## 迭代 4 — 自动排版 & 贯通

**目标**：把迭代 3 的 LLM 词条通过排版算法变成完整 `Grid`，端到端替换迭代 2 的 mock 数据，真正形成"生成 → 玩 → 通关"闭环。

**任务**
1. `src/generator/layout.ts`：回溯排版核心
   - 最长词中心起手
   - 候选位置打分（交叉数 - 贴边惩罚）
   - `noAdjacentParallel` 约束（同向词不相邻）
   - 300ms 超时 + 剪枝
2. `src/generator/blacken.ts`：非白格填黑 + 按 row/col 扫描给 `PlacedWord` 赋编号
3. `src/generator/validate.ts`：排版后一致性检查（每格 across/down 引用正确、交叉字符匹配）
4. `src/hooks/usePuzzle.ts`：编排生成流水线
   ```
   Provider.generate → layout → 失败？追加词条再 layout → 失败？降 targetCount → dispatch INIT
   ```
5. `App.tsx` 用 `usePuzzle` 替换 mock 数据；保留一个"使用 mock"开关便于调试
6. **单测**：`layout.test.ts` 用 10 词预设跑 50 次，成功率 > 95%；边界（同长词、无交叉字）走回退分支

**验收**
- Settings 里点"生成新谜题"：UI 出 loading → 出真实网格 → 能玩通
- 连续生成 10 次，至少 9 次正常出网格（失败也给用户友好提示，不白屏）
- 性能：排版过程 < 1s（含一次 LLM 追加的极端场景）

**关键风险**
- 排版失败率：第一版算法往往在同长词多、交叉字少时卡死，要把超时与降级路径写扎实
- 算法复杂度：避免 O(n!) 深度回溯，靠"评分 + 前 K 候选"剪枝

**可延后**：多解去重、对称性约束、保证连通性

---

## 迭代 5 — 打磨 & 上线

**目标**：产品体验可以发给朋友试玩，能在手机上完整走一局。

**任务**
1. 响应式：
   - 网格格子大小随屏宽自适应（clamp 32px–48px）
   - 移动端 ClueList 折叠到底部抽屉
   - 触屏点击格子弹出虚拟数字/文字输入（用隐藏 `<input>` 聚焦触发 IME）
2. 视觉打磨：配色（黑白 + 一种点缀色）、字体（`-apple-system`, `PingFang SC`, `Microsoft YaHei`）、loading 动画、错误/通关弹窗
3. 空态与引导：首次打开引导用户去 Settings 填 Key，给一个 mock 试玩样例
4. `README.md` 重写：截图 + 本地运行步骤 + Key 获取方式 + 风险说明
5. `.env.example`（即便现在用 localStorage，也留接口示例）
6. 部署：Vercel / Cloudflare Pages，push 触发静态部署

**验收**
- iPhone / Android 浏览器实机测试能完整通关
- 桌面 / 平板 / 手机三档断点视觉无塌陷
- 公网链接可访问，首屏 < 2s

**关键风险**
- 移动端 IME 行为各家不一致（iOS Safari 的 compositionend 时机有坑），预留时间手测
- CORS：直连 Anthropic 如遇浏览器拦截，至少在 README 注明已知限制

**可延后**：PWA、多语言、深色模式

---

## 里程碑与预估

| 迭代 | 估时 | 累计 | 产物状态 |
|------|------|------|---------|
| 1 | 1–2 天 | D2 | 内部 demo |
| 2 | 2–3 天 | D5 | 核心玩法走通 |
| 3 | 1–2 天 | D7 | 接入外部依赖 |
| 4 | 2–3 天 | D10 | **MVP 达成** |
| 5 | 1–2 天 | D12 | 可分享上线 |

**MVP 定义**：迭代 4 完成 = 产品功能闭环。迭代 5 是上线打磨，可视节奏延后。

---

## 各迭代间的强依赖

```
迭代 1 (types + board)
    ↓
迭代 2 (reducer + UI)      ← 产物：用 mock 可玩
    ↓
迭代 3 (LLM provider)      ← 可与迭代 4 并行启动 prompt 设计
    ↓
迭代 4 (layout + 串联)     ← 产物：真实谜题可玩 · MVP
    ↓
迭代 5 (打磨 + 部署)       ← 产物：可分享
```

迭代 3 的 Settings 面板 UI 若急着做，可以提到迭代 2 末尾（无强依赖）。
