# Google Cloud Run へのデプロイ

このドキュメントでは、NihongoPartner を Google Cloud Run にデプロイする方法を説明します。

## 前提条件

1. **Google Cloud アカウント**：GCP プロジェクトが作成済みであること
2. **gcloud CLI**：インストール済みでログイン済みであること
3. **有効化が必要な API**：
   - Cloud Run API
   - Cloud Build API
   - Vertex AI API
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
   - Firestore API（オプション）

## 一、gcloud CLI のインストールと設定

### 1.1 gcloud CLI のインストール

**Windows**（PowerShell）：
```powershell
# インストーラーをダウンロード
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")

# インストーラーを実行
& $env:Temp\GoogleCloudSDKInstaller.exe
```

または https://cloud.google.com/sdk/docs/install からダウンロードしてインストールできます。

**macOS**：
```bash
brew install google-cloud-sdk
```

**Linux**：
```bash
curl https://sdk.cloud.google.com | bash
```

### 1.2 ログインとプロジェクトの設定

```bash
# Google Cloud にログイン
gcloud auth login

# プロジェクト ID を設定（ご自身のプロジェクト ID に置き換えてください）
gcloud config set project YOUR_PROJECT_ID

# デフォルトリージョンを設定（東京リージョンを推奨、中国から近いため）
gcloud config set run/region asia-northeast1

# 設定を確認
gcloud config list
```

## 二、必要な API の有効化

```bash
# 必要な API を一括で有効化
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com
```

## 三、サービスアカウントと認証情報の設定

### 3.1 サービスアカウントの作成

```bash
# サービスアカウントを作成
gcloud iam service-accounts create nihongo-partner-sa \
  --display-name="NihongoPartner Service Account"

# サービスアカウントのメールアドレスを取得
SA_EMAIL="nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

### 3.2 権限の付与

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="nihongo-partner-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Vertex AI の権限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

# Speech API の権限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/speech.client"

# Text-to-Speech の権限（speech.client に含まれています）

# Firestore の権限（使用する場合）
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"
```

### 3.3 キーの作成と Secret Manager へのアップロード

```bash
# サービスアカウントキーを作成
gcloud iam service-accounts keys create ./sa-key.json \
  --iam-account=${SA_EMAIL}

# Secret Manager にアップロード
gcloud secrets create nihongo-partner-sa-key \
  --data-file=./sa-key.json

# ローカルのキーファイルを削除（セキュリティのため）
rm ./sa-key.json

# Cloud Run がキーにアクセスする権限を付与
gcloud secrets add-iam-policy-binding nihongo-partner-sa-key \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

## 四、Firebase Authentication の設定（オプション）

Firebase Auth を使用する場合は、関連する認証情報を設定する必要があります：

```bash
# Firebase 設定のシークレットを作成
gcloud secrets create firebase-config --data-file=- << EOF
{
  "apiKey": "YOUR_FIREBASE_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
EOF
```

## 五、アプリケーションのデプロイ

### 5.1 初回デプロイ

```bash
# プロジェクトのルートディレクトリから実行
gcloud run deploy nihongo-partner \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --service-account nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=asia-northeast1" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### 5.2 Secret Manager のキーを使用する場合

```bash
gcloud run deploy nihongo-partner \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --service-account nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=asia-northeast1" \
  --set-secrets "GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa-key/sa-key.json:nihongo-partner-sa-key:latest" \
  --memory 1Gi \
  --cpu 1
```

### 5.3 デプロイ結果の出力

デプロイが成功すると以下のように表示されます：
```
Service [nihongo-partner] revision [nihongo-partner-00001-xxx] has been deployed
Service URL: https://nihongo-partner-xxxxxxxxxx-an.a.run.app
```

## 六、デプロイの確認

```bash
# サービス URL を取得
gcloud run services describe nihongo-partner \
  --region asia-northeast1 \
  --format="value(status.url)"

# サービスの状態を確認
gcloud run services list --region asia-northeast1
```

出力された URL にアクセスして、アプリケーションが正常に動作しているか確認してください。

## 七、デプロイの更新

コードを更新した後、デプロイコマンドを再実行します：

```bash
gcloud run deploy nihongo-partner --source .
```

または Cloud Build トリガーを使用して自動デプロイを設定することもできます（下記参照）。

## 八、カスタムドメインの設定（オプション）

### 8.1 ドメインのマッピング

```bash
gcloud run domain-mappings create \
  --service nihongo-partner \
  --domain your-domain.com \
  --region asia-northeast1
```

### 8.2 DNS の設定

出力された指示に従って、DNS プロバイダーで適切なレコードを追加してください。

## 九、CI/CD 自動デプロイ（オプション）

### 9.1 cloudbuild.yaml の作成

プロジェクトのルートディレクトリに作成します：

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'nihongo-partner'
      - '--source'
      - '.'
      - '--region'
      - 'asia-northeast1'
      - '--allow-unauthenticated'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 9.2 GitHub トリガーの設定

```bash
# GitHub リポジトリを接続
gcloud builds triggers create github \
  --repo-name=nihongo-partner \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

## 十、監視とログ

### 10.1 ログの確認

```bash
# リアルタイムログ
gcloud run services logs read nihongo-partner --region asia-northeast1

# または Cloud Console を使用
# https://console.cloud.google.com/run/detail/asia-northeast1/nihongo-partner/logs
```

### 10.2 メトリクスの確認

Cloud Console にアクセスしてください：
- https://console.cloud.google.com/run/detail/asia-northeast1/nihongo-partner/metrics

## 十一、コストの最適化

### 11.1 最小インスタンス数を 0 に設定

```bash
gcloud run services update nihongo-partner \
  --min-instances 0 \
  --region asia-northeast1
```

### 11.2 同時実行数の設定

```bash
gcloud run services update nihongo-partner \
  --concurrency 80 \
  --region asia-northeast1
```

## 十二、よくある質問

### Q: デプロイ失敗 "Cloud Build API has not been enabled"

```bash
gcloud services enable cloudbuild.googleapis.com
```

### Q: アプリケーション起動後に "Could not load credentials" エラー

サービスアカウントキーが正しく設定されていることを確認してください：
```bash
gcloud run services update nihongo-partner \
  --set-secrets "GOOGLE_APPLICATION_CREDENTIALS=/secrets/key.json:nihongo-partner-sa-key:latest"
```

### Q: コールドスタートに時間がかかる

最小インスタンス数を増やしてください（コストが増加します）：
```bash
gcloud run services update nihongo-partner --min-instances 1
```

### Q: 以前のバージョンにロールバックする方法

```bash
# すべてのリビジョンを表示
gcloud run revisions list --service nihongo-partner --region asia-northeast1

# 指定したリビジョンにロールバック
gcloud run services update-traffic nihongo-partner \
  --to-revisions nihongo-partner-00001-abc=100 \
  --region asia-northeast1
```

## 十三、リソースのクリーンアップ

不要になった場合は、デプロイを削除します：

```bash
# Cloud Run サービスを削除
gcloud run services delete nihongo-partner --region asia-northeast1

# シークレットを削除
gcloud secrets delete nihongo-partner-sa-key

# サービスアカウントを削除
gcloud iam service-accounts delete nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## クイックデプロイスクリプト

プロジェクトにはクイックデプロイスクリプト `scripts/deploy.sh` が用意されており、デプロイプロセスを簡素化できます。

### スクリプトの説明

**スクリプトが自動的に行うこと**：
- ✅ 第五ステップ：Cloud Run へのアプリケーションのデプロイ

**手動で行う必要があること**：
- ❌ 第一ステップ：gcloud CLI のインストールと設定（初回のみ）
- ❌ 第二ステップ：必要な API の有効化（初回のみ）
- ⚠️ 第三ステップ：サービスアカウントの設定（オプション、設定しない場合はデフォルトアカウントを使用）
- ⚠️ 第四ステップ：Firebase の設定（オプション）
- ⚠️ 第六ステップ以降：ドメイン、CI/CD など（必要に応じて）

### 初回デプロイ

初回デプロイの前に、以下の準備作業を完了する必要があります：

```bash
# 1. Google Cloud にログイン（一度だけ必要）
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. 必要な API を有効化（一度だけ必要）
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com

# 3. デプロイスクリプトを実行
./scripts/deploy.sh
```

### 以降の更新

コードを更新した後は、以下を実行するだけです：

```bash
./scripts/deploy.sh
```

### スクリプトの内容

`scripts/deploy.sh`：

```bash
#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"
SERVICE_NAME="nihongo-partner"

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=$REGION" \
  --memory 1Gi \
  --cpu 1

echo "Deployment complete!"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
```

### スクリプトの実行

```bash
# Linux / macOS / Git Bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows PowerShell
bash scripts/deploy.sh
```
