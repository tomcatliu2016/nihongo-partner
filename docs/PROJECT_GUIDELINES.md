# プロジェクト共通規約

> 最終更新: 2026-01-17

## 目次

1. [コードスタイル](#1-コードスタイル)
2. [Git 規約](#2-git-規約)
3. [環境設定](#3-環境設定)
4. [依存関係管理](#4-依存関係管理)
5. [ドキュメント規約](#5-ドキュメント規約)
6. [コードレビュー](#6-コードレビュー)
7. [リリースフロー](#7-リリースフロー)

---

## 1. コードスタイル

### 1.1 ESLint 設定

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

### 1.2 Prettier 設定

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

### 1.3 TypeScript 設定

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

### 1.4 命名規則

| 種類 | 規則 | 例 |
|------|------|------|
| 変数/関数 | camelCase | `userName`, `getUserProfile` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| 型/インターフェース | PascalCase | `UserProfile`, `ConversationSession` |
| コンポーネント | PascalCase | `ConversationPanel`, `MessageBubble` |
| ファイル | kebab-case | `conversation-panel.tsx`, `use-conversation.ts` |
| CSS クラス | kebab-case (Tailwind) | `text-primary`, `bg-background` |
| 環境変数 | SCREAMING_SNAKE_CASE | `GOOGLE_CLOUD_PROJECT_ID` |

### 1.5 コメント規約

```typescript
// 単一行コメント：複雑なロジックの説明
const result = complexCalculation() // 貪欲法アルゴリズムで最適化

/**
 * 複数行コメント：関数/クラスのドキュメント
 * @param userId - ユーザー ID
 * @param options - クエリオプション
 * @returns ユーザープロファイル、存在しない場合は null を返します
 */
async function getUserProfile(
  userId: string,
  options?: QueryOptions
): Promise<UserProfile | null> {
  // ...
}

// TODO: 未対応の作業項目
// TODO(username): 担当者を指定した未対応項目
// FIXME: 修正が必要な問題
// HACK: 一時的な解決策、後日最適化が必要
// NOTE: 重要な説明
```

---

## 2. Git 規約

### 2.1 ブランチ命名

```
main              # 本番ブランチ、常にデプロイ可能な状態を維持します
develop           # 開発ブランチ、機能の統合
feature/*         # 機能ブランチ
bugfix/*          # バグ修正ブランチ
hotfix/*          # 緊急修正ブランチ
release/*         # リリース準備ブランチ

例：
feature/conversation-practice
feature/speech-recognition
bugfix/message-display-error
hotfix/auth-token-expiry
release/v1.0.0
```

### 2.2 Commit 規約

[Conventional Commits](https://www.conventionalcommits.org/) 規約を使用します：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type の種類**：

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント更新 |
| `style` | コードフォーマット（機能に影響なし） |
| `refactor` | リファクタリング（新機能でも修正でもない） |
| `perf` | パフォーマンス最適化 |
| `test` | テスト関連 |
| `chore` | ビルド/ツール/依存関係の更新 |
| `ci` | CI/CD 設定 |

**例**：

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

### 2.4 Pull Request 規約

**PR タイトル形式**：Commit 形式と同様です

```
feat(conversation): add speech input support
fix(auth): resolve token refresh race condition
```

**PR テンプレート**：

```markdown
<!-- .github/pull_request_template.md -->

## 概要
<!-- この PR の目的を簡潔に説明してください -->

## 変更内容
<!-- 主な変更点をリストアップしてください -->
-
-
-

## テスト
<!-- これらの変更をどのようにテストしたか説明してください -->
- [ ] 単体テスト通過
- [ ] E2E テスト通過
- [ ] 手動テスト通過

## スクリーンショット（該当する場合）
<!-- UI 変更のスクリーンショットを添付してください -->

## 関連 Issue
<!-- 関連する Issue をリンクしてください -->
Closes #

## チェックリスト
- [ ] コードがプロジェクト規約に準拠しています
- [ ] 必要なテストを追加しました
- [ ] 関連ドキュメントを更新しました
- [ ] コードをセルフレビューしました
```

---

## 3. 環境設定

### 3.1 環境変数管理

```bash
# 環境変数ファイルの階層（優先度の高い順）
.env.local          # ローカルオーバーライド、Git にコミットしません
.env.development    # 開発環境
.env.production     # 本番環境
.env                # すべての環境で共有されるデフォルト値
```

```bash
# .env.example（Git にコミット、テンプレートとして使用）

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

### 3.2 環境変数の型定義

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

### 3.3 VS Code 設定

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

## 4. 依存関係管理

### 4.1 pnpm ワークスペース設定

```yaml
# pnpm-workspace.yaml（monorepo の場合）
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4.2 依存関係の分類原則

```json
{
  "dependencies": {
    // 実行時に必要な依存関係
    "next": "^16.1.0",
    "react": "^19.2.0"
  },
  "devDependencies": {
    // 開発/ビルド時に必要、本番環境では不要
    "typescript": "^5.9.0",
    "vitest": "^4.0.17"
  },
  "peerDependencies": {
    // 共有依存関係（通常はライブラリ開発で使用）
  },
  "optionalDependencies": {
    // オプション依存関係、インストール失敗しても中断しません
  }
}
```

### 4.3 バージョン固定戦略

```json
{
  "dependencies": {
    // ^ を使用して minor と patch の更新を許可します
    "react": "^19.2.0",

    // ~ を使用して patch 更新のみを許可します
    "some-stable-lib": "~2.1.0",

    // 正確なバージョンに固定（重要な依存関係の場合）
    "critical-lib": "1.2.3"
  }
}
```

### 4.4 依存関係更新フロー

```bash
# 古くなった依存関係を確認します
pnpm outdated

# インタラクティブに更新します
pnpm update --interactive

# 最新バージョンに更新します
pnpm update --latest

# 更新後にテストを実行します
pnpm test

# 更新をコミットします
git add pnpm-lock.yaml package.json
git commit -m "chore(deps): update dependencies"
```

---

## 5. ドキュメント規約

### 5.1 README 構成

```markdown
# プロジェクト名

プロジェクトの簡潔な説明（一文で）。

## 機能

- 機能 1
- 機能 2
- 機能 3

## クイックスタート

### 前提条件

- Node.js 22+
- pnpm 10+
- Google Cloud アカウント

### インストール

\`\`\`bash
git clone https://github.com/xxx/nihongo-partner.git
cd nihongo-partner
pnpm install
\`\`\`

### 設定

\`\`\`bash
cp .env.example .env.local
# .env.local を編集して設定を入力してください
\`\`\`

### 実行

\`\`\`bash
pnpm dev
\`\`\`

## プロジェクト構成

\`\`\`
src/
├── app/        # ページと API
├── components/ # React コンポーネント
├── lib/        # ユーティリティライブラリ
└── ...
\`\`\`

## 技術スタック

- Next.js 16
- React 19
- TypeScript 5.9
- Tailwind CSS 4

## 開発ドキュメント

- [技術スタック](./docs/TECH_STACK.md)
- [フロントエンド規約](./docs/FRONTEND_GUIDELINES.md)
- [API 規約](./docs/API_GUIDELINES.md)

## 貢献ガイド

[CONTRIBUTING.md](./CONTRIBUTING.md) をお読みください

## ライセンス

MIT
```

### 5.2 API ドキュメント

```typescript
/**
 * 新しい会話セッションを作成します
 *
 * @route POST /api/conversation
 *
 * @param {Object} body - リクエストボディ
 * @param {string} body.scenario - シナリオタイプ ('restaurant' | 'shopping' | 'introduction')
 * @param {number} [body.difficulty=1] - 難易度レベル (1-5)
 *
 * @returns {Object} レスポンス
 * @returns {boolean} returns.success - 成功したかどうか
 * @returns {Object} returns.data - セッションデータ
 * @returns {string} returns.data.id - セッション ID
 * @returns {string} returns.data.scenario - シナリオタイプ
 * @returns {number} returns.data.difficulty - 難易度レベル
 * @returns {Date} returns.data.createdAt - 作成日時
 *
 * @example
 * // リクエスト
 * POST /api/conversation
 * Content-Type: application/json
 * Authorization: Bearer <token>
 *
 * {
 *   "scenario": "restaurant",
 *   "difficulty": 2
 * }
 *
 * // 成功レスポンス (201)
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
 * // エラーレスポンス (400)
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "リクエストパラメータが無効です"
 *   }
 * }
 */
```

### 5.3 コンポーネントドキュメント

```typescript
/**
 * 会話メッセージバブルコンポーネント
 *
 * ユーザーまたは Agent の会話メッセージを表示します。テキストと音声をサポートしています。
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
  /** メッセージデータ */
  message: Message
  /** 音声再生コールバック */
  onPlayAudio?: () => void
  /** タイムスタンプを表示するかどうか */
  showTimestamp?: boolean
  /** カスタムクラス名 */
  className?: string
}
```

---

## 6. コードレビュー

### 6.1 レビューチェックリスト

**機能性**：
- [ ] コードが期待通りの機能を実装しています
- [ ] エッジケースが処理されています
- [ ] エラーハンドリングが適切です

**コード品質**：
- [ ] コードが簡潔で読みやすいです
- [ ] 重複コードがありません
- [ ] 命名が明確で正確です
- [ ] 型定義が正しいです

**パフォーマンス**：
- [ ] 明らかなパフォーマンス問題がありません
- [ ] 不要な再レンダリングを回避しています
- [ ] 大量データのシナリオが最適化されています

**セキュリティ**：
- [ ] 入力が検証およびサニタイズされています
- [ ] 機密情報の漏洩がありません
- [ ] 権限チェックが適切です

**テスト**：
- [ ] 重要なパスがテストでカバーされています
- [ ] テストケースが意味のあるものです
- [ ] テストがパスします

### 6.2 レビューフィードバック規約

```markdown
# レビューフィードバックの種類

## 必須修正 (Blocking)
マージ前に問題を修正する必要があります。

## 修正推奨 (Suggestion)
改善できますが、マージをブロックしません。

## 質問 (Question)
説明や議論を求めています。

## メモ (Note)
知識や代替案を共有しています。

# フィードバックの例

**必須修正**：ここで null のケースが処理されていないため、実行時エラーが発生する可能性があります。

**修正推奨**：この計算結果をキャッシュするために `useMemo` の使用を検討してください。

**質問**：ここで `any` 型を使用した理由は何ですか？より良い方法はありますか？

**メモ**：Next.js 16 では `useCache` hook が追加されました。このシナリオにより適しているかもしれません。
```

---

## 7. リリースフロー

### 7.1 バージョン番号規約

[セマンティックバージョニング](https://semver.org/lang/ja/) を使用します：

```
MAJOR.MINOR.PATCH

- MAJOR: 互換性のない API 変更
- MINOR: 後方互換性のある新機能
- PATCH: 後方互換性のあるバグ修正

例：
1.0.0 -> 1.0.1  # バグ修正
1.0.1 -> 1.1.0  # 新機能
1.1.0 -> 2.0.0  # 破壊的変更
```

### 7.2 リリースチェックリスト

```markdown
## リリース前チェック

### コード
- [ ] すべてのテストがパスしています
- [ ] Lint チェックがパスしています
- [ ] TypeScript コンパイルエラーがありません
- [ ] 未処理の TODO/FIXME がありません

### ドキュメント
- [ ] CHANGELOG が更新されています
- [ ] README が更新されています（必要な場合）
- [ ] API ドキュメントが更新されています（必要な場合）

### デプロイ
- [ ] 環境変数が設定されています
- [ ] データベースマイグレーションが準備されています（必要な場合）
- [ ] ロールバック計画が準備されています

### 通知
- [ ] チームに通知しました
- [ ] ユーザーに通知しました（破壊的変更がある場合）
```

### 7.3 CHANGELOG フォーマット

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- 音声入力機能を追加しました

### Changed
- 会話レスポンス速度を最適化しました

### Fixed
- メッセージ表示順序のエラーを修正しました

## [1.1.0] - 2026-01-17

### Added
- ショッピングシナリオの会話練習を追加しました
- 学習分析レポートを追加しました

### Changed
- Next.js を 16.1.0 にアップグレードしました

### Fixed
- 認証トークン期限切れ後の更新問題を修正しました

## [1.0.0] - 2026-01-10

### Added
- 初期バージョンをリリースしました
- レストランシナリオの会話練習
- 音声認識と合成
- ユーザープロファイルシステム
```

### 7.4 CI/CD 設定

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

## 関連ドキュメント

- [技術スタックドキュメント](./TECH_STACK.md)
- [フロントエンド開発規約](./FRONTEND_GUIDELINES.md)
- [API 開発規約](./API_GUIDELINES.md)
