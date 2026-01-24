# NihongoPartner - AI 日本語学習アシスタント

## プロジェクト概要

Google Cloud AI を活用したエージェント型日本語学習アプリケーションです。ユーザーは音声またはテキストで AI とシーン別の会話練習を行い、AI が自動的に弱点を分析して個別の学習教材を生成します。

**ステータス**: ドキュメント計画段階、コーディング未開始

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **スタイル**: Tailwind CSS 4 + shadcn/ui
- **状態管理**: Zustand 5 + TanStack Query 5
- **国際化**: next-intl 4 (zh/ja/en)
- **AI**: Google Vertex AI (Gemini)
- **音声**: Google Speech-to-Text / Text-to-Speech
- **データベース**: Firestore
- **デプロイ**: Cloud Run（WebSocket 対応）
- **パッケージ管理**: pnpm 10

## プロジェクト構造

```
src/
├── app/
│   ├── [locale]/          # 国際化ルーティング
│   │   ├── (auth)/        # 認証ページ
│   │   └── (main)/        # メイン機能ページ
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   └── features/          # 機能コンポーネント
├── lib/google-cloud/      # GCP SDK ラッパー
├── hooks/                 # カスタム Hooks
├── stores/                # Zustand Stores
├── i18n/                  # 国際化設定
├── messages/              # 翻訳ファイル（zh/ja/en.json）
└── types/                 # TypeScript 型定義
```

## コア機能

1. **シーン会話** - レストラン/買い物/自己紹介などのシーンでの音声会話練習
2. **スマート分析** - 会話後に自動でエラーを分析し、弱点を特定
3. **教材生成** - 弱点に基づいてリアルタイムで学習コンテンツを生成
4. **パス推薦** - 履歴データに基づいて次の練習内容を推薦

## ドキュメント索引

| ドキュメント | 内容 |
|--------------|------|
| [NihongoPartner.md](./NihongoPartner.md) | PRD - 製品要件、ユーザーストーリー、受け入れ基準 |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md) | 技術選定、アーキテクチャ図、依存バージョン、デプロイ設定 |
| [docs/FRONTEND_GUIDELINES.md](./docs/FRONTEND_GUIDELINES.md) | コンポーネント規約、スタイル、状態管理、i18n、テスト |
| [docs/API_GUIDELINES.md](./docs/API_GUIDELINES.md) | Route Handlers、Server Actions、エラー処理、GCP 連携 |
| [docs/PROJECT_GUIDELINES.md](./docs/PROJECT_GUIDELINES.md) | ESLint/Prettier 設定、Git 規約、CI/CD |

## 開発規約のポイント

- コンポーネントファイルは kebab-case、コンポーネント名は PascalCase
- Server Components を優先し、インタラクションが必要な場合は `'use client'` を使用
- 型インポートは `import type { X }` を使用
- API エラーは `AppError` クラスで統一し、多言語エラーメッセージに対応
- ユーザーに表示されるすべてのテキストは `useTranslations()` で国際化

## よく使うコマンド

```bash
pnpm dev          # 開発サーバーを起動
pnpm build        # 本番ビルド
pnpm lint         # コードチェック
pnpm test         # テストを実行
```
