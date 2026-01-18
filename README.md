# NihongoPartner - AI 日语学习助手

基于 Google Cloud AI 的 Agentic 日语学习应用。用户通过语音/文字与 AI 进行场景对话练习，AI 自主分析薄弱点并生成个性化学习材料。

## 功能特性

- **场景对话练习** - 餐厅点餐、购物、自我介绍等真实场景对话
- **语音交互** - 支持语音输入和 AI 语音回复
- **智能分析** - 对话后自动分析错误，识别语法/词汇/语序薄弱点
- **材料生成** - 根据薄弱点实时生成个性化学习内容
- **学习路径推荐** - 基于历史数据推荐下次练习内容
- **多语言支持** - 中文/日文/英文界面
- **暗色模式** - 支持浅色/深色主题切换

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5.9 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 状态管理 | Zustand 5 + TanStack Query 5 |
| 国际化 | next-intl 4 (zh/ja/en) |
| AI 服务 | Google Vertex AI (Gemini 2.0) |
| 语音服务 | Google Speech-to-Text / Text-to-Speech |
| 数据库 | Firestore |
| 认证 | Firebase Auth (Google + Email/Password) |
| 包管理 | pnpm 10 |

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 10+
- Google Cloud 项目 (启用 Vertex AI, Speech-to-Text, Text-to-Speech, Firestore)
- Firebase 项目 (启用 Authentication)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/nihongo-partner.git
cd nihongo-partner
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下配置：

```bash
# Google Cloud 配置
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=asia-northeast1

# Firebase 客户端配置 (从 Firebase Console 获取)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (服务端)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. 配置 Google Cloud 服务账号

1. 在 [Google Cloud Console](https://console.cloud.google.com) 创建服务账号
2. 授予以下角色：
   - Vertex AI User
   - Cloud Speech Client
   - Cloud Datastore User
3. 下载 JSON 密钥文件，保存为项目根目录的 `service-account.json`

### 5. 配置 Firebase Authentication

1. 访问 [Firebase Console](https://console.firebase.google.com)
2. 进入 Authentication → Sign-in method
3. 启用以下登录方式：
   - Email/Password
   - Google
4. 在 Settings → Authorized domains 添加 `localhost`

### 6. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/
│   ├── [locale]/              # 国际化路由
│   │   ├── (auth)/            # 认证页面 (login, register, etc.)
│   │   └── (main)/            # 主功能页面 (dashboard, practice, etc.)
│   └── api/                   # API Routes
├── components/
│   ├── ui/                    # shadcn/ui 组件
│   └── features/              # 业务组件
│       ├── auth/              # 认证相关组件
│       ├── conversation/      # 对话相关组件
│       ├── analysis/          # 分析相关组件
│       ├── materials/         # 材料相关组件
│       └── dashboard/         # 仪表盘组件
├── lib/
│   ├── firebase/              # Firebase 客户端封装
│   └── google-cloud/          # GCP SDK 封装
├── stores/                    # Zustand Stores
├── hooks/                     # 自定义 Hooks
├── i18n/                      # 国际化配置
├── messages/                  # 翻译文件 (zh/ja/en.json)
└── types/                     # TypeScript 类型
```

## 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器 (Turbopack)

# 构建
pnpm build            # 生产构建
pnpm start            # 启动生产服务器

# 代码质量
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 格式检查

# 测试
pnpm test             # 运行单元测试 (Vitest)
pnpm test:ui          # 运行测试 UI
pnpm test:coverage    # 运行测试覆盖率
pnpm test:e2e         # 运行 E2E 测试 (Playwright)
pnpm test:e2e:ui      # 运行 E2E 测试 UI
```

## 测试

### 单元测试

使用 Vitest + React Testing Library：

```bash
# 运行所有单元测试
pnpm test

# 监听模式
pnpm test -- --watch

# 查看覆盖率
pnpm test:coverage
```

### E2E 测试

使用 Playwright：

```bash
# 首次运行需要安装浏览器
npx playwright install

# 运行 E2E 测试
pnpm test:e2e

# 使用 UI 模式
pnpm test:e2e:ui

# 运行特定测试文件
pnpm test:e2e -- e2e/navigation.spec.ts
```

## 本地部署

### 使用 Docker

1. 构建 Docker 镜像：

```bash
docker build -t nihongo-partner .
```

2. 运行容器：

```bash
docker run -p 3000:3000 \
  -e GOOGLE_CLOUD_PROJECT_ID=your-project-id \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key \
  # ... 其他环境变量
  nihongo-partner
```

### 使用 Node.js

1. 构建生产版本：

```bash
pnpm build
```

2. 启动生产服务器：

```bash
pnpm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

## 云端部署

### Cloud Run 部署

1. 确保已安装 [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)

2. 配置 Docker 认证：

```bash
gcloud auth configure-docker
```

3. 构建并推送镜像：

```bash
# 构建镜像
docker build -t gcr.io/YOUR_PROJECT_ID/nihongo-partner .

# 推送到 Container Registry
docker push gcr.io/YOUR_PROJECT_ID/nihongo-partner
```

4. 部署到 Cloud Run：

```bash
gcloud run deploy nihongo-partner \
  --image gcr.io/YOUR_PROJECT_ID/nihongo-partner \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID"
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/conversation/start` | POST | 开始新对话 |
| `/api/conversation/message` | POST | 发送消息 |
| `/api/conversation/end` | POST | 结束对话并生成分析 |
| `/api/analysis/[id]` | GET | 获取分析报告 |
| `/api/materials/generate` | POST | 生成学习材料 |
| `/api/materials/[id]` | GET | 获取学习材料 |
| `/api/recommendations` | GET | 获取学习推荐 |
| `/api/speech/transcribe` | POST | 语音转文字 |
| `/api/speech/synthesize` | POST | 文字转语音 |

## 文档

| 文档 | 描述 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 项目概述和开发规范 |
| [NihongoPartner.md](./NihongoPartner.md) | PRD - 产品需求文档 |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md) | 技术选型和架构 |
| [docs/FRONTEND_GUIDELINES.md](./docs/FRONTEND_GUIDELINES.md) | 前端开发规范 |
| [docs/API_GUIDELINES.md](./docs/API_GUIDELINES.md) | API 开发规范 |
| [docs/PROJECT_GUIDELINES.md](./docs/PROJECT_GUIDELINES.md) | 项目规范 |
| [docs/REMAINING_TASKS.md](./docs/REMAINING_TASKS.md) | 剩余任务清单 |

## 常见问题

### Firebase 登录失败

1. 确认 Firebase Console 中已启用对应的登录方式
2. 确认 `.env.local` 中的 Firebase 配置正确
3. 确认 Authorized domains 中包含 `localhost`

### Google Cloud API 调用失败

1. 确认服务账号 JSON 文件路径正确
2. 确认服务账号有足够的权限
3. 确认相关 API 已在 GCP Console 中启用

### 语音功能不工作

1. 确认浏览器支持 MediaRecorder API
2. 确认已授予麦克风权限
3. 确认 Speech-to-Text 和 Text-to-Speech API 已启用

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)
