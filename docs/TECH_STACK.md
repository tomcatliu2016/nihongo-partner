# NihongoPartner 技术栈

> 最后更新: 2026-01-17

## 概述

本项目采用 **Next.js 全栈架构**，不需要单独的后端服务。所有后端逻辑通过 Next.js 的 API Routes 和 Server Actions 实现，部署到 Google Cloud Run 以支持 WebSocket 实时通信。

---

## 核心技术栈

### 框架层

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.x | 全栈框架 (App Router) |
| **React** | 19.2.x | UI 库 |
| **TypeScript** | 5.9.x | 类型安全 |
| **Node.js** | 22.x LTS | 运行时环境 |

### UI 层

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 4.1.x | 样式框架 |
| **shadcn/ui** | latest | UI 组件库 |
| **Radix UI** | latest | 无障碍基础组件 |
| **Lucide React** | latest | 图标库 |
| **Framer Motion** | 11.x | 动画库 |

### 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 5.0.x | 客户端状态管理 |
| **TanStack Query** | 5.x | 服务端状态/缓存管理 |

### 国际化 (i18n)

| 技术 | 版本 | 用途 |
|------|------|------|
| **next-intl** | 4.x | 国际化框架 |

支持语言：简体中文 (zh)、日语 (ja)、英语 (en)

### Google Cloud 服务

| 服务 | 用途 |
|------|------|
| **Vertex AI (Gemini)** | 核心 AI 能力：对话理解、决策、内容生成 |
| **Cloud Speech-to-Text** | 日语语音识别 |
| **Cloud Text-to-Speech** | 日语语音合成 |
| **Firestore** | 用户数据、学习历史、对话记录存储 |
| **Cloud Run** | 应用部署（支持 WebSocket） |
| **Cloud Storage** | 音频文件缓存（可选） |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | 10.x | 包管理器 |
| **ESLint** | 9.x | 代码检查 |
| **Prettier** | 3.x | 代码格式化 |
| **Vitest** | 4.0.x | 单元测试 |
| **Playwright** | 1.x | E2E 测试 |

---

## 架构决策

### 为什么选择 Next.js 全栈？

1. **统一技术栈** - 前后端使用同一语言和框架，降低复杂度
2. **API Routes** - 内置后端能力，无需额外服务器
3. **Server Actions** - 简化数据变更操作
4. **Server Components** - 更好的性能和 SEO
5. **Google Cloud SDK** - Node.js SDK 支持良好

### 为什么部署到 Cloud Run 而非 Vercel？

1. **WebSocket 支持** - Cloud Run 支持持久连接，Vercel Serverless 不支持
2. **Google Cloud 集成** - 与 Vertex AI、Speech API 等服务网络延迟更低
3. **Hackathon 要求** - 满足使用 Google Cloud 平台的要求

### 为什么选择 Firestore？

1. **实时同步** - 内置实时监听能力
2. **免运维** - 无服务器架构
3. **Google Cloud 原生** - 与其他 GCP 服务无缝集成
4. **灵活数据模型** - 适合用户档案、对话记录等半结构化数据

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 Application                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    App Router                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │ │
│  │  │   Pages     │  │  Layouts    │  │  Components   │  │ │
│  │  │ (RSC + CC)  │  │   (RSC)     │  │  (CC + RSC)   │  │ │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Layer                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │ │
│  │  │   Route     │  │   Server    │  │  WebSocket    │  │ │
│  │  │  Handlers   │  │   Actions   │  │   Handler     │  │ │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                   Google Cloud Platform                      │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Vertex AI   │  │ Speech-to-   │  │ Text-to-     │       │
│  │  (Gemini)    │  │ Text API     │  │ Speech API   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Firestore   │  │ Cloud Run    │  │ Cloud        │       │
│  │  Database    │  │ (Hosting)    │  │ Storage      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

## 项目结构

```
nihongo-partner/
├── src/
│   ├── app/
│   │   ├── [locale]/               # 国际化路由
│   │   │   ├── (auth)/             # 认证相关页面组
│   │   │   ├── (main)/             # 主应用页面组
│   │   │   │   ├── dashboard/      # 仪表板
│   │   │   │   ├── practice/       # 对话练习
│   │   │   │   ├── analysis/       # 学习分析
│   │   │   │   └── materials/      # 学习材料
│   │   │   ├── layout.tsx          # 语言布局
│   │   │   └── page.tsx            # 首页
│   │   └── api/                    # API Route Handlers
│   │       ├── conversation/       # 对话相关 API
│   │       ├── analysis/           # 分析相关 API
│   │       ├── speech/             # 语音处理 API
│   │       └── materials/          # 材料生成 API
│   │
│   ├── i18n/                   # 国际化配置
│   │   ├── config.ts           # 语言配置
│   │   ├── request.ts          # 服务端请求配置
│   │   └── routing.ts          # 路由配置
│   │
│   ├── messages/               # 翻译文件
│   │   ├── zh.json             # 简体中文
│   │   ├── ja.json             # 日语
│   │   └── en.json             # 英语
│   │
│   ├── components/             # React 组件
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── features/           # 功能组件
│   │   │   ├── conversation/   # 对话相关组件
│   │   │   ├── analysis/       # 分析相关组件
│   │   │   └── materials/      # 材料相关组件
│   │   └── layouts/            # 布局组件
│   │
│   ├── lib/                    # 工具库
│   │   ├── google-cloud/       # Google Cloud SDK 封装
│   │   │   ├── gemini.ts       # Gemini API 客户端
│   │   │   ├── speech.ts       # Speech API 客户端
│   │   │   └── firestore.ts    # Firestore 客户端
│   │   ├── utils/              # 通用工具函数
│   │   └── constants/          # 常量定义
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── use-conversation.ts
│   │   ├── use-speech.ts
│   │   └── use-analysis.ts
│   │
│   ├── stores/                 # Zustand Stores
│   │   ├── conversation-store.ts
│   │   └── user-store.ts
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   ├── conversation.ts
│   │   ├── user.ts
│   │   └── analysis.ts
│   │
│   └── styles/                 # 全局样式
│       └── globals.css
│
├── public/                     # 静态资源
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   └── e2e/                    # E2E 测试
│
├── docs/                       # 文档
│   ├── TECH_STACK.md           # 技术栈文档
│   ├── FRONTEND_GUIDELINES.md  # 前端开发规范
│   ├── API_GUIDELINES.md       # API 开发规范
│   └── PROJECT_GUIDELINES.md   # 项目通用规范
│
├── .env.example                # 环境变量示例
├── .env.local                  # 本地环境变量 (git ignored)
├── next.config.ts              # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── package.json
├── pnpm-lock.yaml
├── Dockerfile                  # Cloud Run 部署
└── README.md
```

---

## 环境变量

```bash
# .env.example

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Vertex AI (Gemini)
VERTEX_AI_LOCATION=asia-northeast1

# Firebase/Firestore
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 依赖包清单

### dependencies

```json
{
  "next": "^16.1.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "next-intl": "^4.0.0",
  "@google-cloud/vertexai": "^1.9.0",
  "@google-cloud/speech": "^6.7.0",
  "@google-cloud/text-to-speech": "^5.5.0",
  "firebase": "^11.1.0",
  "firebase-admin": "^13.0.0",
  "zustand": "^5.0.10",
  "@tanstack/react-query": "^5.62.0",
  "tailwindcss": "^4.1.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-slot": "^1.1.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.469.0",
  "framer-motion": "^11.15.0",
  "zod": "^3.24.0"
}
```

### devDependencies

```json
{
  "typescript": "^5.9.0",
  "@types/node": "^22.0.0",
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
  "eslint": "^9.17.0",
  "eslint-config-next": "^16.1.0",
  "@typescript-eslint/eslint-plugin": "^8.19.0",
  "@typescript-eslint/parser": "^8.19.0",
  "prettier": "^3.4.0",
  "prettier-plugin-tailwindcss": "^0.6.0",
  "vitest": "^4.0.17",
  "@vitest/browser-playwright": "^4.0.0",
  "@testing-library/react": "^16.0.0",
  "playwright": "^1.49.0"
}
```

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Google Cloud 凭证

# 3. 启动开发服务器
pnpm dev

# 4. 打开浏览器
open http://localhost:3000
```

---

## 部署

### Cloud Run 部署

```bash
# 构建并推送镜像
gcloud builds submit --tag gcr.io/$PROJECT_ID/nihongo-partner

# 部署到 Cloud Run
gcloud run deploy nihongo-partner \
  --image gcr.io/$PROJECT_ID/nihongo-partner \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 参考链接

- [Next.js 16 文档](https://nextjs.org/docs)
- [React 19.2 文档](https://react.dev/)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://zustand.docs.pmnd.rs/)
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Cloud Run 文档](https://cloud.google.com/run/docs)

---

## 相关文档

- [前端开发规范](./FRONTEND_GUIDELINES.md)
- [API 开发规范](./API_GUIDELINES.md)
- [项目通用规范](./PROJECT_GUIDELINES.md)
