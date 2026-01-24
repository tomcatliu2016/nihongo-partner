# NihongoPartner - AI 日本語学習アシスタント

Google Cloud AI を活用したエージェント型日本語学習アプリケーションです。ユーザーは音声またはテキストで AI とシーン別の会話練習を行い、AI が自動的に弱点を分析して個別の学習教材を生成します。

## 機能

- **シーン別会話練習** - レストランでの注文、買い物、自己紹介などの実践的なシーン会話
- **音声インタラクション** - 音声入力と AI 音声応答に対応
- **スマート分析** - 会話後に自動でエラーを分析し、文法・語彙・語順の弱点を特定
- **教材生成** - 弱点に基づいてリアルタイムで個別学習コンテンツを生成
- **学習パス推薦** - 履歴データに基づいて次の練習内容を推薦
- **多言語対応** - 中国語/日本語/英語インターフェース
- **ダークモード** - ライト/ダークテーマの切り替えに対応

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) + React 19 + TypeScript 5.9 |
| スタイル | Tailwind CSS 4 + shadcn/ui |
| 状態管理 | Zustand 5 + TanStack Query 5 |
| 国際化 | next-intl 4 (zh/ja/en) |
| AI サービス | Google Vertex AI (Gemini 2.0) |
| 音声サービス | Google Speech-to-Text / Text-to-Speech |
| データベース | Firestore |
| 認証 | Firebase Auth (Google + Email/Password) |
| パッケージ管理 | pnpm 10 |

## クイックスタート

### 前提条件

- Node.js 18+
- pnpm 10+
- Google Cloud プロジェクト（Vertex AI、Speech-to-Text、Text-to-Speech、Firestore が有効）
- Firebase プロジェクト（Authentication が有効）

### 1. プロジェクトのクローン

```bash
git clone https://github.com/your-username/nihongo-partner.git
cd nihongo-partner
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

環境変数テンプレートをコピーします：

```bash
cp .env.example .env.local
```

`.env.local` を編集し、以下の設定を入力します：

```bash
# Google Cloud 設定
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=asia-northeast1

# Firebase クライアント設定（Firebase Console から取得）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin（サーバーサイド）
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Google Cloud サービスアカウントの設定

1. [Google Cloud Console](https://console.cloud.google.com) でサービスアカウントを作成
2. 以下のロールを付与：
   - Vertex AI User
   - Cloud Speech Client
   - Cloud Datastore User
3. JSON キーファイルをダウンロードし、プロジェクトルートに `service-account.json` として保存

### 5. Firebase Authentication の設定

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. Authentication → Sign-in method に移動
3. 以下のサインイン方法を有効化：
   - Email/Password
   - Google
4. Settings → Authorized domains に `localhost` を追加

### 6. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認します。

## プロジェクト構造

```
src/
├── app/
│   ├── [locale]/              # 国際化ルーティング
│   │   ├── (auth)/            # 認証ページ（login、register など）
│   │   └── (main)/            # メイン機能ページ（dashboard、practice など）
│   └── api/                   # API Routes
├── components/
│   ├── ui/                    # shadcn/ui コンポーネント
│   └── features/              # 機能コンポーネント
│       ├── auth/              # 認証関連コンポーネント
│       ├── conversation/      # 会話関連コンポーネント
│       ├── analysis/          # 分析関連コンポーネント
│       ├── materials/         # 教材関連コンポーネント
│       └── dashboard/         # ダッシュボードコンポーネント
├── lib/
│   ├── firebase/              # Firebase クライアントラッパー
│   └── google-cloud/          # GCP SDK ラッパー
├── stores/                    # Zustand Stores
├── hooks/                     # カスタム Hooks
├── i18n/                      # 国際化設定
├── messages/                  # 翻訳ファイル（zh/ja/en.json）
└── types/                     # TypeScript 型定義
```

## 利用可能なスクリプト

```bash
# 開発
pnpm dev              # 開発サーバーを起動（Turbopack）

# ビルド
pnpm build            # 本番ビルド
pnpm start            # 本番サーバーを起動

# コード品質
pnpm lint             # ESLint チェック
pnpm lint:fix         # ESLint 自動修正
pnpm format           # Prettier フォーマット
pnpm format:check     # Prettier フォーマットチェック

# テスト
pnpm test             # 単体テストを実行（Vitest）
pnpm test:ui          # テスト UI を実行
pnpm test:coverage    # テストカバレッジを実行
pnpm test:e2e         # E2E テストを実行（Playwright）
pnpm test:e2e:ui      # E2E テスト UI を実行
```

## テスト

### 単体テスト

Vitest + React Testing Library を使用：

```bash
# すべての単体テストを実行
pnpm test

# ウォッチモード
pnpm test -- --watch

# カバレッジを確認
pnpm test:coverage
```

### E2E テスト

Playwright を使用：

```bash
# 初回実行時はブラウザのインストールが必要
npx playwright install

# E2E テストを実行
pnpm test:e2e

# UI モードを使用
pnpm test:e2e:ui

# 特定のテストファイルを実行
pnpm test:e2e -- e2e/navigation.spec.ts
```

## ローカルデプロイ

### Docker を使用

1. Docker イメージをビルド：

```bash
docker build -t nihongo-partner .
```

2. コンテナを実行：

```bash
docker run -p 3000:3000 \
  -e GOOGLE_CLOUD_PROJECT_ID=your-project-id \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key \
  # ... その他の環境変数
  nihongo-partner
```

### Node.js を使用

1. 本番版をビルド：

```bash
pnpm build
```

2. 本番サーバーを起動：

```bash
pnpm start
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で実行されます。

## クラウドデプロイ

### Cloud Run デプロイ

1. [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) がインストールされていることを確認

2. Docker 認証を設定：

```bash
gcloud auth configure-docker
```

3. イメージをビルドしてプッシュ：

```bash
# イメージをビルド
docker build -t gcr.io/YOUR_PROJECT_ID/nihongo-partner .

# Container Registry にプッシュ
docker push gcr.io/YOUR_PROJECT_ID/nihongo-partner
```

4. Cloud Run にデプロイ：

```bash
gcloud run deploy nihongo-partner \
  --image gcr.io/YOUR_PROJECT_ID/nihongo-partner \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID"
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|----------------|----------|------|
| `/api/conversation/start` | POST | 新しい会話を開始 |
| `/api/conversation/message` | POST | メッセージを送信 |
| `/api/conversation/end` | POST | 会話を終了して分析を生成 |
| `/api/analysis/[id]` | GET | 分析レポートを取得 |
| `/api/materials/generate` | POST | 学習教材を生成 |
| `/api/materials/[id]` | GET | 学習教材を取得 |
| `/api/recommendations` | GET | 学習推薦を取得 |
| `/api/speech/transcribe` | POST | 音声をテキストに変換 |
| `/api/speech/synthesize` | POST | テキストを音声に変換 |

## ドキュメント

| ドキュメント | 説明 |
|--------------|------|
| [CLAUDE.md](./CLAUDE.md) | プロジェクト概要と開発規約 |
| [NihongoPartner.md](./NihongoPartner.md) | PRD - 製品要件定義書 |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md) | 技術選定とアーキテクチャ |
| [docs/FRONTEND_GUIDELINES.md](./docs/FRONTEND_GUIDELINES.md) | フロントエンド開発規約 |
| [docs/API_GUIDELINES.md](./docs/API_GUIDELINES.md) | API 開発規約 |
| [docs/PROJECT_GUIDELINES.md](./docs/PROJECT_GUIDELINES.md) | プロジェクト規約 |

## よくある質問

### Firebase ログインが失敗する

1. Firebase Console で対応するサインイン方法が有効になっていることを確認
2. `.env.local` の Firebase 設定が正しいことを確認
3. Authorized domains に `localhost` が含まれていることを確認

### Google Cloud API 呼び出しが失敗する

1. サービスアカウント JSON ファイルのパスが正しいことを確認
2. サービスアカウントに十分な権限があることを確認
3. 関連する API が GCP Console で有効になっていることを確認

### 音声機能が動作しない

1. ブラウザが MediaRecorder API をサポートしていることを確認
2. マイクの許可が付与されていることを確認
3. Speech-to-Text と Text-to-Speech API が有効になっていることを確認

## コントリビューションガイド

1. プロジェクトを Fork
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. Pull Request を作成

## ライセンス

[MIT](LICENSE)
