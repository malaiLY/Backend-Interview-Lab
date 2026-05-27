# Backend Interview Lab

Java 后端面试刷题复习系统 — 本地运行的前端刷题平台，支持题库检索、分类筛选、题卡复习、错题本、模拟面试和学习进度统计。

## 技术栈

- **React 18** + **TypeScript**
- **Vite** — 构建工具
- **Tailwind CSS** — 样式
- **Zustand** — 状态管理（localStorage 持久化）
- **Fuse.js** — 模糊搜索
- **Recharts** — 图表
- **react-markdown** — Markdown 渲染

## 功能

| 页面 | 说明 |
|------|------|
| **Dashboard** | 统计面板：总题数、掌握率、各模块进度图表、今日推荐复习 |
| **题库** | 搜索 + 模块/难度/状态筛选，点击进入详情 |
| **题目详情** | Markdown 答案渲染，标记 我会/模糊/不会/已掌握 |
| **题卡复习** | 翻牌式刷题，优先抽取不会和模糊的题 |
| **错题本** | 集中展示不会 + 模糊的题，一键开始错题复习 |
| **模拟面试** | 选模块/难度/数量，随机出题，自评，生成报告 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 打开浏览器
# http://localhost:5173
```

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览构建产物 |
| `pnpm parse:questions` | 从 docs/ 解析 Markdown 生成题库数据 |

## 项目结构

```
src/
  app/
    router.tsx              # 路由配置
  components/
    layout/
      AppLayout.tsx         # 整体布局（侧边栏 + 顶栏）
      Sidebar.tsx           # 侧边栏导航
    QuestionCard.tsx        # 题目卡片（复用）
    StatusButtons.tsx       # 状态标记按钮（复用）
  pages/
    Dashboard.tsx           # 首页统计
    QuestionBank.tsx        # 题库浏览
    QuestionDetail.tsx      # 题目详情
    ReviewCards.tsx          # 题卡复习
    Mistakes.tsx            # 错题本
    Interview.tsx           # 模拟面试
  store/
    useStudyStore.ts        # Zustand 状态管理
  types/
    question.ts             # Question / Module / Difficulty
    review.ts               # ReviewRecord
    interview.ts            # InterviewSession
  utils/
    stats.ts                # 统计计算（纯函数）
    search.ts               # Fuse.js 搜索封装
    review.ts               # 复习队列算法
  data/
    questions.json          # 296 道题（从 Markdown 解析）

docs/                       # Markdown 面试八股文源文件
scripts/
  parseMarkdownToQuestions.ts  # Markdown → JSON 解析脚本
```

## 题库数据

当前包含 **296 道题**，覆盖 8 个模块：

| 模块 | 题数 |
|------|------|
| JavaSE | 72 |
| JUC 并发 | 43 |
| JVM | 29 |
| Spring | 20 |
| MySQL | 51 |
| Redis | 60 |
| 消息队列 | 9 |
| 计算机网络 | 12 |

添加新题目：将 Markdown 文件放入 `docs/`，运行 `pnpm parse:questions` 即可重新生成。

## 数据持久化

- 学习进度（每道题的状态、复习次数、错误次数）存储在 `localStorage`
- 模拟面试历史记录存储在 `localStorage`
- 刷新页面数据不丢失
