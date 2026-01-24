# NihongoPartner 残タスク一覧

> 最終更新: 2026-01-18

## フェーズ 10: Firebase Auth 設定（コード完了済み、手動設定が必要）

### 10.1 Firebase Console 設定

- [ ] **Firebase プロジェクトの作成/選択**
  - https://console.firebase.google.com にアクセス
  - 新規プロジェクトを作成または既存の GCP プロジェクトを関連付け

- [ ] **Authentication サービスの有効化**
  - Authentication → Sign-in method に移動
  - [ ] Email/Password を有効化
  - [ ] Google を有効化

- [ ] **認証ドメインの設定**
  - Authentication → Settings → Authorized domains
  - [ ] `localhost`を追加（開発環境）
  - [ ] 本番ドメインを追加（デプロイ後）

- [ ] **Firebase 設定の取得**
  - Project settings → General → Your apps
  - [ ] Web app を追加
  - [ ] 設定を `.env.local` にコピー

### 10.2 Google Cloud Console 設定

- [ ] **OAuth 同意画面の設定**
  - https://console.cloud.google.com にアクセス
  - APIs & Services → OAuth consent screen
  - [ ] アプリ名を設定: `NihongoPartner`
  - [ ] ユーザーサポートメールを設定
  - [ ] 開発者連絡先情報を設定
  - [ ] 認証ドメインを追加

- [ ] **OAuth 認証情報の確認**
  - APIs & Services → Credentials
  - [ ] OAuth 2.0 Client ID が作成されていることを確認
  - [ ] Authorized JavaScript origins に開発/本番 URL が含まれていることを確認

### 10.3 環境変数の設定

- [ ] **`.env.local` の設定**
  ```bash
  # Firebase Console から以下の値を取得
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  ```

### 10.4 機能テスト

- [ ] **Google ログインテスト**
  - [ ] Google ボタンクリックで認証ウィンドウがポップアップ
  - [ ] 認証後 Dashboard に正常リダイレクト
  - [ ] Header にユーザーアバターが表示

- [ ] **メール登録テスト**
  - [ ] メールとパスワードを入力して送信
  - [ ] 確認メールを受信
  - [ ] 確認リンクをクリックして検証完了

- [ ] **メールログインテスト**
  - [ ] 確認済みユーザーが正常にログイン可能
  - [ ] 未確認ユーザーに確認プロンプトを表示

- [ ] **ログアウトテスト**
  - [ ] ユーザーメニュー → ログアウトをクリック
  - [ ] ログインページにリダイレクト

- [ ] **ルート保護テスト**
  - [ ] 未ログイン時の /dashboard アクセスは /login にリダイレクト
  - [ ] ログイン後は正常にアクセス可能

- [ ] **パスワードリセットテスト**
  - [ ] メールを入力してリセットリンクを送信
  - [ ] リセットメールを受信
  - [ ] パスワードリセット成功

---

## フェーズ 11: Firestore セキュリティルール（オプション）

- [ ] **セキュリティルールの設定**
  - Firestore → Rules
  - [ ] ユーザーデータのアクセス制御を追加
  - [ ] 会話データのアクセス制御を追加
  - [ ] 教材データのアクセス制御を追加

- [ ] **ルール例**
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null
          && request.auth.uid == userId;
      }
      match /conversations/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
      match /materials/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
      match /analysis/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
    }
  }
  ```

---

## フェーズ 12: デプロイ準備（保留）

### 12.1 Docker 設定

- [ ] `Dockerfile` を作成
- [ ] `.dockerignore` を作成
- [ ] ローカルで Docker ビルドをテスト

### 12.2 Cloud Run 設定

- [ ] `cloudbuild.yaml` を作成
- [ ] Secret Manager で環境変数を保存するよう設定
- [ ] Cloud Run サービスを設定
- [ ] カスタムドメインを設定

### 12.3 CI/CD 設定

- [ ] `.github/workflows/ci.yml` を作成
  - [ ] Lint チェック
  - [ ] 型チェック
  - [ ] ユニットテスト
  - [ ] E2E テスト

- [ ] `.github/workflows/deploy.yml` を作成
  - [ ] Cloud Run への自動デプロイ
  - [ ] 環境変数の注入

---

## フェーズ 13: 本番最適化（保留）

- [ ] **パフォーマンス最適化**
  - [ ] 画像最適化（next/image）
  - [ ] コード分割
  - [ ] 重要リソースのプリロード

- [ ] **SEO 最適化**
  - [ ] metadata の完備
  - [ ] sitemap の追加
  - [ ] robots.txt の追加

- [ ] **監視・アラート**
  - [ ] Cloud Monitoring の設定
  - [ ] エラーアラートの設定
  - [ ] パフォーマンス監視の設定

---

## クイックスタートチェックリスト

以下のステップを完了すれば使用開始できます：

```
1. [ ] Firebase Console でプロジェクトを作成
2. [ ] Email/Password と Google ログインを有効化
3. [ ] Firebase 設定を .env.local にコピー
4. [ ] pnpm dev を実行してテスト
```

---

## ファイル構造参照

```
完了済みの Auth 関連ファイル:
├── src/lib/firebase/
│   ├── config.ts          ✅ Firebase クライアント設定
│   ├── auth.ts            ✅ Auth サービスラッパー
│   └── index.ts           ✅ エクスポート
├── src/components/
│   ├── auth-provider.tsx  ✅ Auth 状態管理
│   ├── auth-guard.tsx     ✅ ルート保護
│   └── features/auth/
│       ├── google-button.tsx      ✅
│       ├── login-form.tsx         ✅
│       ├── register-form.tsx      ✅
│       ├── email-verify-banner.tsx ✅
│       ├── user-menu.tsx          ✅
│       └── index.ts               ✅
├── src/app/[locale]/(auth)/
│   ├── layout.tsx         ✅ Auth ページレイアウト
│   ├── login/page.tsx     ✅
│   ├── register/page.tsx  ✅
│   ├── verify-email/page.tsx    ✅
│   └── reset-password/page.tsx  ✅
└── src/messages/
    ├── zh.json            ✅ 中国語翻訳
    ├── ja.json            ✅ 日本語翻訳
    └── en.json            ✅ 英語翻訳
```
