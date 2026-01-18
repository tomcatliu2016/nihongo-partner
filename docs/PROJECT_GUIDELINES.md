# 项目通用规范

> 最后更新: 2026-01-17

## 目录

1. [代码风格](#1-代码风格)
2. [Git 规范](#2-git-规范)
3. [环境配置](#3-环境配置)
4. [依赖管理](#4-依赖管理)
5. [文档规范](#5-文档规范)
6. [代码审查](#6-代码审查)
7. [发布流程](#7-发布流程)

---

## 1. 代码风格

### 1.1 ESLint 配置

```javascript
// eslint.config.mjs
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // React
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/self-closing-comp': 'error',

      // Import
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
    },
  },
]

export default eslintConfig
```

### 1.2 Prettier 配置

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 1.3 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.4 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `userName`, `getUserProfile` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| 类型/接口 | PascalCase | `UserProfile`, `ConversationSession` |
| 组件 | PascalCase | `ConversationPanel`, `MessageBubble` |
| 文件 | kebab-case | `conversation-panel.tsx`, `use-conversation.ts` |
| CSS 类 | kebab-case (Tailwind) | `text-primary`, `bg-background` |
| 环境变量 | SCREAMING_SNAKE_CASE | `GOOGLE_CLOUD_PROJECT_ID` |

### 1.5 注释规范

```typescript
// 单行注释：解释复杂逻辑
const result = complexCalculation() // 使用贪心算法优化

/**
 * 多行注释：用于函数/类文档
 * @param userId - 用户 ID
 * @param options - 查询选项
 * @returns 用户资料，如果不存在则返回 null
 */
async function getUserProfile(
  userId: string,
  options?: QueryOptions
): Promise<UserProfile | null> {
  // ...
}

// TODO: 待办事项
// TODO(username): 指定负责人的待办事项
// FIXME: 需要修复的问题
// HACK: 临时解决方案，需要后续优化
// NOTE: 重要说明
```

---

## 2. Git 规范

### 2.1 分支命名

```
main              # 生产分支，始终保持可部署状态
develop           # 开发分支，功能集成
feature/*         # 功能分支
bugfix/*          # Bug 修复分支
hotfix/*          # 紧急修复分支
release/*         # 发布准备分支

示例：
feature/conversation-practice
feature/speech-recognition
bugfix/message-display-error
hotfix/auth-token-expiry
release/v1.0.0
```

### 2.2 Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（既不是新功能也不是修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖更新 |
| `ci` | CI/CD 配置 |

**示例**：

```bash
feat(conversation): add speech input support

- Integrate Google Speech-to-Text API
- Add microphone permission handling
- Create AudioRecorder component

Closes #123

---

fix(auth): resolve token refresh race condition

The previous implementation could cause duplicate refresh requests
when multiple API calls were made simultaneously.

- Add mutex lock for token refresh
- Queue pending requests during refresh

Fixes #456

---

chore(deps): upgrade Next.js to 16.1.0

BREAKING CHANGE: Next.js 16 requires Node.js 22+
```

### 2.3 Git Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci'],
    ],
    'subject-max-length': [2, 'always', 72],
  },
}
```

### 2.4 Pull Request 规范

**PR 标题格式**：与 Commit 格式一致

```
feat(conversation): add speech input support
fix(auth): resolve token refresh race condition
```

**PR 模板**：

```markdown
<!-- .github/pull_request_template.md -->

## 概述
<!-- 简要描述此 PR 的目的 -->

## 变更内容
<!-- 列出主要变更 -->
-
-
-

## 测试
<!-- 描述如何测试这些变更 -->
- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 手动测试通过

## 截图（如适用）
<!-- 附上 UI 变更的截图 -->

## 相关 Issue
<!-- 关联相关的 Issue -->
Closes #

## Checklist
- [ ] 代码符合项目规范
- [ ] 已添加必要的测试
- [ ] 已更新相关文档
- [ ] 已自查代码
```

---

## 3. 环境配置

### 3.1 环境变量管理

```bash
# 环境变量文件层级（优先级从高到低）
.env.local          # 本地覆盖，不提交到 Git
.env.development    # 开发环境
.env.production     # 生产环境
.env                # 所有环境共享的默认值
```

```bash
# .env.example（提交到 Git，作为模板）

# ============================================
# Google Cloud Configuration
# ============================================
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=asia-northeast1

# ============================================
# Firebase Configuration
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ============================================
# Application Settings
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# Optional: Rate Limiting (Upstash Redis)
# ============================================
# UPSTASH_REDIS_URL=
# UPSTASH_REDIS_TOKEN=
```

### 3.2 环境变量类型定义

```typescript
// src/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Server-side only
  GOOGLE_CLOUD_PROJECT_ID: z.string().min(1),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  VERTEX_AI_LOCATION: z.string().default('asia-northeast1'),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // Public (accessible in browser)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
```

### 3.3 VS Code 配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.suggest.autoImports": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

---

## 4. 依赖管理

### 4.1 pnpm 工作区配置

```yaml
# pnpm-workspace.yaml（如果是 monorepo）
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4.2 依赖分类原则

```json
{
  "dependencies": {
    // 运行时必需的依赖
    "next": "^16.1.0",
    "react": "^19.2.0"
  },
  "devDependencies": {
    // 开发/构建时需要，生产环境不需要
    "typescript": "^5.9.0",
    "vitest": "^4.0.17"
  },
  "peerDependencies": {
    // 共享依赖（通常用于库开发）
  },
  "optionalDependencies": {
    // 可选依赖，安装失败不会中断
  }
}
```

### 4.3 版本锁定策略

```json
{
  "dependencies": {
    // 使用 ^ 允许 minor 和 patch 更新
    "react": "^19.2.0",

    // 使用 ~ 只允许 patch 更新
    "some-stable-lib": "~2.1.0",

    // 锁定精确版本（对于关键依赖）
    "critical-lib": "1.2.3"
  }
}
```

### 4.4 依赖更新流程

```bash
# 查看过期依赖
pnpm outdated

# 交互式更新
pnpm update --interactive

# 更新到最新版本
pnpm update --latest

# 更新后运行测试
pnpm test

# 提交更新
git add pnpm-lock.yaml package.json
git commit -m "chore(deps): update dependencies"
```

---

## 5. 文档规范

### 5.1 README 结构

```markdown
# 项目名称

简短的项目描述（一句话）。

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 快速开始

### 前置要求

- Node.js 22+
- pnpm 10+
- Google Cloud 账号

### 安装

\`\`\`bash
git clone https://github.com/xxx/nihongo-partner.git
cd nihongo-partner
pnpm install
\`\`\`

### 配置

\`\`\`bash
cp .env.example .env.local
# 编辑 .env.local 填入配置
\`\`\`

### 运行

\`\`\`bash
pnpm dev
\`\`\`

## 项目结构

\`\`\`
src/
├── app/        # 页面和 API
├── components/ # React 组件
├── lib/        # 工具库
└── ...
\`\`\`

## 技术栈

- Next.js 16
- React 19
- TypeScript 5.9
- Tailwind CSS 4

## 开发文档

- [技术栈](./docs/TECH_STACK.md)
- [前端规范](./docs/FRONTEND_GUIDELINES.md)
- [API 规范](./docs/API_GUIDELINES.md)

## 贡献指南

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 许可证

MIT
```

### 5.2 API 文档

```typescript
/**
 * 创建新的对话会话
 *
 * @route POST /api/conversation
 *
 * @param {Object} body - 请求体
 * @param {string} body.scenario - 场景类型 ('restaurant' | 'shopping' | 'introduction')
 * @param {number} [body.difficulty=1] - 难度等级 (1-5)
 *
 * @returns {Object} 响应
 * @returns {boolean} returns.success - 是否成功
 * @returns {Object} returns.data - 会话数据
 * @returns {string} returns.data.id - 会话 ID
 * @returns {string} returns.data.scenario - 场景类型
 * @returns {number} returns.data.difficulty - 难度等级
 * @returns {Date} returns.data.createdAt - 创建时间
 *
 * @example
 * // 请求
 * POST /api/conversation
 * Content-Type: application/json
 * Authorization: Bearer <token>
 *
 * {
 *   "scenario": "restaurant",
 *   "difficulty": 2
 * }
 *
 * // 成功响应 (201)
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc-123",
 *     "scenario": "restaurant",
 *     "difficulty": 2,
 *     "createdAt": "2026-01-17T10:00:00Z"
 *   }
 * }
 *
 * // 错误响应 (400)
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "请求参数无效"
 *   }
 * }
 */
```

### 5.3 组件文档

```typescript
/**
 * 对话消息气泡组件
 *
 * 用于展示用户或 Agent 的对话消息，支持文本和语音。
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={{
 *     id: '1',
 *     role: 'user',
 *     content: 'こんにちは',
 *     timestamp: new Date(),
 *   }}
 *   onPlayAudio={() => playAudio(message.audioUrl)}
 * />
 * ```
 */
interface MessageBubbleProps {
  /** 消息数据 */
  message: Message
  /** 播放语音回调 */
  onPlayAudio?: () => void
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 自定义类名 */
  className?: string
}
```

---

## 6. 代码审查

### 6.1 审查清单

**功能性**：
- [ ] 代码实现了预期功能
- [ ] 边界情况已处理
- [ ] 错误处理完善

**代码质量**：
- [ ] 代码简洁易读
- [ ] 没有重复代码
- [ ] 命名清晰准确
- [ ] 类型定义正确

**性能**：
- [ ] 没有明显的性能问题
- [ ] 避免不必要的重渲染
- [ ] 大数据量场景已优化

**安全性**：
- [ ] 输入已验证和清理
- [ ] 没有敏感信息泄露
- [ ] 权限检查完善

**测试**：
- [ ] 测试覆盖关键路径
- [ ] 测试用例有意义
- [ ] 测试能够通过

### 6.2 审查反馈规范

```markdown
# 审查反馈类型

## 🔴 必须修改 (Blocking)
问题必须修复才能合并。

## 🟡 建议修改 (Suggestion)
可以改进但不阻塞合并。

## 🟢 提问 (Question)
寻求解释或讨论。

## 💡 备注 (Note)
分享知识或替代方案。

# 反馈示例

🔴 **必须修改**：这里没有处理 null 的情况，会导致运行时错误。

🟡 **建议**：可以考虑使用 `useMemo` 来缓存这个计算结果。

🟢 **问题**：为什么这里选择使用 `any` 类型？有没有更好的方式？

💡 **备注**：Next.js 16 新增了 `useCache` hook，可能更适合这个场景。
```

---

## 7. 发布流程

### 7.1 版本号规范

使用 [语义化版本](https://semver.org/lang/zh-CN/)：

```
MAJOR.MINOR.PATCH

- MAJOR: 不兼容的 API 变更
- MINOR: 向后兼容的新功能
- PATCH: 向后兼容的 Bug 修复

示例：
1.0.0 -> 1.0.1  # Bug 修复
1.0.1 -> 1.1.0  # 新功能
1.1.0 -> 2.0.0  # 破坏性变更
```

### 7.2 发布检查清单

```markdown
## 发布前检查

### 代码
- [ ] 所有测试通过
- [ ] Lint 检查通过
- [ ] TypeScript 编译无错误
- [ ] 无未处理的 TODO/FIXME

### 文档
- [ ] CHANGELOG 已更新
- [ ] README 已更新（如需要）
- [ ] API 文档已更新（如需要）

### 部署
- [ ] 环境变量已配置
- [ ] 数据库迁移已准备（如需要）
- [ ] 回滚方案已准备

### 通知
- [ ] 团队已通知
- [ ] 用户已通知（如有破坏性变更）
```

### 7.3 CHANGELOG 格式

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- 新增语音输入功能

### Changed
- 优化对话响应速度

### Fixed
- 修复消息显示顺序错误的问题

## [1.1.0] - 2026-01-17

### Added
- 新增购物场景对话练习
- 新增学习分析报告

### Changed
- 升级 Next.js 到 16.1.0

### Fixed
- 修复认证令牌过期后的刷新问题

## [1.0.0] - 2026-01-10

### Added
- 初始版本发布
- 餐厅场景对话练习
- 语音识别和合成
- 用户档案系统
```

### 7.4 CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build and Push to GCR
        run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/nihongo-partner

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy nihongo-partner \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/nihongo-partner \
            --platform managed \
            --region asia-northeast1 \
            --allow-unauthenticated
```

---

## 相关文档

- [技术栈文档](./TECH_STACK.md)
- [前端开发规范](./FRONTEND_GUIDELINES.md)
- [API 开发规范](./API_GUIDELINES.md)
