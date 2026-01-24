# NihongoPartner 技術スタック

> 最終更新: 2026-01-24

## 概要

本プロジェクトは **Next.js フルスタックアーキテクチャ** を採用しており、別途バックエンドサービスは必要ありません。すべてのバックエンドロジックは Next.js の API Routes と Server Actions で実装し、WebSocket リアルタイム通信をサポートするため Google Cloud Run にデプロイします。

---

## コア技術スタック

### フレームワーク層

| 技術 | バージョン | 用途 |
|------|------------|------|
| **Next.js** | 16.1.x | フルスタックフレームワーク (App Router) |
| **React** | 19.2.x | UI ライブラリ |
| **TypeScript** | 5.9.x | 型安全 |
| **Node.js** | 22.x LTS | ランタイム環境 |

### UI 層

| 技術 | バージョン | 用途 |
|------|------------|------|
| **Tailwind CSS** | 4.1.x | スタイルフレームワーク |
| **shadcn/ui** | latest | UI コンポーネントライブラリ |
| **Radix UI** | latest | アクセシビリティ基盤コンポーネント |
| **Lucide React** | latest | アイコンライブラリ |
| **Framer Motion** | 11.x | アニメーションライブラリ |

### 状態管理

| 技術 | バージョン | 用途 |
|------|------------|------|
| **Zustand** | 5.0.x | クライアント状態管理 |
| **TanStack Query** | 5.x | サーバー状態/キャッシュ管理 |

### 国際化 (i18n)

| 技術 | バージョン | 用途 |
|------|------------|------|
| **next-intl** | 4.x | 国際化フレームワーク |

対応言語：簡体字中国語 (zh)、日本語 (ja)、英語 (en)

### Google Cloud サービス

| サービス | 用途 |
|----------|------|
| **Vertex AI (Gemini)** | コア AI 能力：会話理解、意思決定、コンテンツ生成 |
| **Cloud Speech-to-Text** | 日本語音声認識 |
| **Cloud Text-to-Speech** | 日本語音声合成 |
| **Firestore** | ユーザーデータ、学習履歴、会話記録の保存 |
| **Cloud Run** | アプリケーションデプロイ（WebSocket 対応） |
| **Cloud Storage** | 音声ファイルキャッシュ（オプション） |

### 開発ツール

| ツール | バージョン | 用途 |
|--------|------------|------|
| **pnpm** | 10.x | パッケージマネージャー |
| **ESLint** | 9.x | コード検査 |
| **Prettier** | 3.x | コードフォーマット |
| **Vitest** | 4.0.x | 単体テスト |
| **Playwright** | 1.x | E2E テスト |

---

## アーキテクチャ決定

### なぜ Next.js フルスタックを選んだのか？

1. **統一技術スタック** - フロントエンドとバックエンドで同一言語とフレームワークを使用し、複雑さを低減
2. **API Routes** - 内蔵のバックエンド機能、追加サーバー不要
3. **Server Actions** - データ変更操作を簡素化
4. **Server Components** - より良いパフォーマンスと SEO
5. **Google Cloud SDK** - Node.js SDK のサポートが良好

### なぜ Vercel ではなく Cloud Run にデプロイするのか？

1. **WebSocket サポート** - Cloud Run は永続接続をサポート、Vercel Serverless はサポートしない
2. **Google Cloud 統合** - Vertex AI、Speech API などのサービスとのネットワーク遅延が低い
3. **Hackathon 要件** - Google Cloud プラットフォームの使用要件を満たす

### なぜ Firestore を選んだのか？

1. **リアルタイム同期** - 内蔵のリアルタイムリスニング機能
2. **運用不要** - サーバーレスアーキテクチャ
3. **Google Cloud ネイティブ** - 他の GCP サービスとシームレスに統合
4. **柔軟なデータモデル** - ユーザープロファイル、会話記録などの半構造化データに適合

---

## システムアーキテクチャ図

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

## プロジェクト構造

```
nihongo-partner/
├── src/
│   ├── app/
│   │   ├── [locale]/               # 国際化ルーティング
│   │   │   ├── (auth)/             # 認証関連ページグループ
│   │   │   ├── (main)/             # メインアプリページグループ
│   │   │   │   ├── dashboard/      # ダッシュボード
│   │   │   │   ├── practice/       # 会話練習
│   │   │   │   ├── analysis/       # 学習分析
│   │   │   │   └── materials/      # 学習教材
│   │   │   ├── layout.tsx          # 言語レイアウト
│   │   │   └── page.tsx            # ホームページ
│   │   └── api/                    # API Route Handlers
│   │       ├── conversation/       # 会話関連 API
│   │       ├── analysis/           # 分析関連 API
│   │       ├── speech/             # 音声処理 API
│   │       └── materials/          # 教材生成 API
│   │
│   ├── i18n/                   # 国際化設定
│   │   ├── config.ts           # 言語設定
│   │   ├── request.ts          # サーバーサイドリクエスト設定
│   │   └── routing.ts          # ルーティング設定
│   │
│   ├── messages/               # 翻訳ファイル
│   │   ├── zh.json             # 簡体字中国語
│   │   ├── ja.json             # 日本語
│   │   └── en.json             # 英語
│   │
│   ├── components/             # React コンポーネント
│   │   ├── ui/                 # shadcn/ui 基礎コンポーネント
│   │   ├── features/           # 機能コンポーネント
│   │   │   ├── conversation/   # 会話関連コンポーネント
│   │   │   ├── analysis/       # 分析関連コンポーネント
│   │   │   └── materials/      # 教材関連コンポーネント
│   │   └── layouts/            # レイアウトコンポーネント
│   │
│   ├── lib/                    # ユーティリティライブラリ
│   │   ├── google-cloud/       # Google Cloud SDK ラッパー
│   │   │   ├── gemini.ts       # Gemini API クライアント
│   │   │   ├── speech.ts       # Speech API クライアント
│   │   │   └── firestore.ts    # Firestore クライアント
│   │   ├── utils/              # 汎用ユーティリティ関数
│   │   └── constants/          # 定数定義
│   │
│   ├── hooks/                  # カスタム Hooks
│   │   ├── use-conversation.ts
│   │   ├── use-speech.ts
│   │   └── use-analysis.ts
│   │
│   ├── stores/                 # Zustand Stores
│   │   ├── conversation-store.ts
│   │   └── user-store.ts
│   │
│   ├── types/                  # TypeScript 型定義
│   │   ├── conversation.ts
│   │   ├── user.ts
│   │   └── analysis.ts
│   │
│   └── styles/                 # グローバルスタイル
│       └── globals.css
│
├── public/                     # 静的アセット
├── tests/                      # テストファイル
│   ├── unit/                   # 単体テスト
│   └── e2e/                    # E2E テスト
│
├── docs/                       # ドキュメント
│   ├── TECH_STACK.md           # 技術スタックドキュメント
│   ├── FRONTEND_GUIDELINES.md  # フロントエンド開発規約
│   ├── API_GUIDELINES.md       # API 開発規約
│   └── PROJECT_GUIDELINES.md   # プロジェクト規約
│
├── .env.example                # 環境変数サンプル
├── .env.local                  # ローカル環境変数 (git ignored)
├── next.config.ts              # Next.js 設定
├── tailwind.config.ts          # Tailwind 設定
├── tsconfig.json               # TypeScript 設定
├── package.json
├── pnpm-lock.yaml
├── Dockerfile                  # Cloud Run デプロイ
└── README.md
```

---

## 環境変数

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

## 依存パッケージ一覧

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

## クイックスタート

```bash
# 1. 依存関係をインストール
pnpm install

# 2. 環境変数を設定
cp .env.example .env.local
# .env.local を編集して Google Cloud 認証情報を入力

# 3. 開発サーバーを起動
pnpm dev

# 4. ブラウザを開く
open http://localhost:3000
```

---

## デプロイ

### Cloud Run デプロイ

```bash
# イメージをビルドしてプッシュ
gcloud builds submit --tag gcr.io/$PROJECT_ID/nihongo-partner

# Cloud Run にデプロイ
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

## 参考リンク

- [Next.js 16 ドキュメント](https://nextjs.org/docs)
- [React 19.2 ドキュメント](https://react.dev/)
- [Tailwind CSS v4 ドキュメント](https://tailwindcss.com/docs)
- [Zustand ドキュメント](https://zustand.docs.pmnd.rs/)
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)

---

## 関連ドキュメント

- [フロントエンド開発規約](./FRONTEND_GUIDELINES.md)
- [API 開発規約](./API_GUIDELINES.md)
- [プロジェクト規約](./PROJECT_GUIDELINES.md)
