# NihongoPartner - AI 日语学习助手

## 项目概述

基于 Google Cloud AI 的 Agentic 日语学习应用。用户通过语音/文字与 AI 进行场景对话练习，AI 自主分析薄弱点并生成个性化学习材料。

**状态**: 文档规划阶段，尚未开始编码

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态**: Zustand 5 + TanStack Query 5
- **国际化**: next-intl 4 (zh/ja/en)
- **AI**: Google Vertex AI (Gemini)
- **语音**: Google Speech-to-Text / Text-to-Speech
- **数据库**: Firestore
- **部署**: Cloud Run (支持 WebSocket)
- **包管理**: pnpm 10

## 项目结构

```
src/
├── app/
│   ├── [locale]/          # 国际化路由
│   │   ├── (auth)/        # 认证页面
│   │   └── (main)/        # 主功能页面
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui 组件
│   └── features/          # 业务组件
├── lib/google-cloud/      # GCP SDK 封装
├── hooks/                 # 自定义 Hooks
├── stores/                # Zustand Stores
├── i18n/                  # 国际化配置
├── messages/              # 翻译文件 (zh/ja/en.json)
└── types/                 # TypeScript 类型
```

## 核心功能

1. **场景对话** - 餐厅/购物/自我介绍等场景的语音对话练习
2. **智能分析** - 对话后自动分析错误，识别薄弱点
3. **材料生成** - 根据薄弱点实时生成学习内容
4. **路径推荐** - 基于历史数据推荐下次练习内容

## 文档索引

| 文档 | 内容 |
|------|------|
| [NihongoPartner.md](./NihongoPartner.md) | PRD - 产品需求、用户故事、验收标准 |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md) | 技术选型、架构图、依赖版本、部署配置 |
| [docs/FRONTEND_GUIDELINES.md](./docs/FRONTEND_GUIDELINES.md) | 组件规范、样式、状态管理、i18n、测试 |
| [docs/API_GUIDELINES.md](./docs/API_GUIDELINES.md) | Route Handlers、Server Actions、错误处理、GCP 集成 |
| [docs/PROJECT_GUIDELINES.md](./docs/PROJECT_GUIDELINES.md) | ESLint/Prettier 配置、Git 规范、CI/CD |

## 开发规范要点

- 组件文件用 kebab-case，组件名用 PascalCase
- 优先使用 Server Components，需要交互时用 `'use client'`
- 类型导入用 `import type { X }`
- API 错误统一用 `AppError` 类，支持多语言错误消息
- 所有用户可见文本必须使用 `useTranslations()` 国际化

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm lint         # 代码检查
pnpm test         # 运行测试
```
