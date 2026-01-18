# 部署到 Google Cloud Run

本文档介绍如何将 NihongoPartner 部署到 Google Cloud Run。

## 前置条件

1. **Google Cloud 账号**：已创建 GCP 项目
2. **gcloud CLI**：已安装并登录
3. **已启用的 API**：
   - Cloud Run API
   - Cloud Build API
   - Vertex AI API
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
   - Firestore API（可选）

## 一、安装和配置 gcloud CLI

### 1.1 安装 gcloud CLI

**Windows**（PowerShell）：
```powershell
# 下载安装器
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")

# 运行安装器
& $env:Temp\GoogleCloudSDKInstaller.exe
```

或者从 https://cloud.google.com/sdk/docs/install 下载安装。

**macOS**：
```bash
brew install google-cloud-sdk
```

**Linux**：
```bash
curl https://sdk.cloud.google.com | bash
```

### 1.2 登录并配置项目

```bash
# 登录 Google Cloud
gcloud auth login

# 设置项目 ID（替换为你的项目 ID）
gcloud config set project YOUR_PROJECT_ID

# 设置默认区域（推荐东京，离中国近）
gcloud config set run/region asia-northeast1

# 验证配置
gcloud config list
```

## 二、启用必要的 API

```bash
# 一次性启用所有需要的 API
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com
```

## 三、配置服务账号和密钥

### 3.1 创建服务账号

```bash
# 创建服务账号
gcloud iam service-accounts create nihongo-partner-sa \
  --display-name="NihongoPartner Service Account"

# 获取服务账号邮箱
SA_EMAIL="nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

### 3.2 授予权限

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="nihongo-partner-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Vertex AI 权限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

# Speech API 权限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/speech.client"

# Text-to-Speech 权限（包含在 speech.client 中）

# Firestore 权限（如果使用）
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"
```

### 3.3 创建密钥并上传到 Secret Manager

```bash
# 创建服务账号密钥
gcloud iam service-accounts keys create ./sa-key.json \
  --iam-account=${SA_EMAIL}

# 上传到 Secret Manager
gcloud secrets create nihongo-partner-sa-key \
  --data-file=./sa-key.json

# 删除本地密钥文件（安全起见）
rm ./sa-key.json

# 授予 Cloud Run 访问密钥的权限
gcloud secrets add-iam-policy-binding nihongo-partner-sa-key \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

## 四、配置 Firebase Authentication（可选）

如果使用 Firebase Auth，需要设置相关密钥：

```bash
# 创建 Firebase 配置密钥
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

## 五、部署应用

### 5.1 首次部署

```bash
# 从项目根目录执行
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

### 5.2 使用 Secret Manager 中的密钥

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

### 5.3 部署输出

部署成功后会显示：
```
Service [nihongo-partner] revision [nihongo-partner-00001-xxx] has been deployed
Service URL: https://nihongo-partner-xxxxxxxxxx-an.a.run.app
```

## 六、验证部署

```bash
# 获取服务 URL
gcloud run services describe nihongo-partner \
  --region asia-northeast1 \
  --format="value(status.url)"

# 检查服务状态
gcloud run services list --region asia-northeast1
```

访问输出的 URL 验证应用是否正常运行。

## 七、更新部署

代码更新后，重新运行部署命令：

```bash
gcloud run deploy nihongo-partner --source .
```

或使用 Cloud Build 触发器实现自动部署（见下文）。

## 八、设置自定义域名（可选）

### 8.1 映射域名

```bash
gcloud run domain-mappings create \
  --service nihongo-partner \
  --domain your-domain.com \
  --region asia-northeast1
```

### 8.2 配置 DNS

按照输出的说明，在你的 DNS 提供商处添加相应记录。

## 九、CI/CD 自动部署（可选）

### 9.1 创建 cloudbuild.yaml

在项目根目录创建：

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

### 9.2 设置 GitHub 触发器

```bash
# 连接 GitHub 仓库
gcloud builds triggers create github \
  --repo-name=nihongo-partner \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

## 十、监控和日志

### 10.1 查看日志

```bash
# 实时日志
gcloud run services logs read nihongo-partner --region asia-northeast1

# 或使用 Cloud Console
# https://console.cloud.google.com/run/detail/asia-northeast1/nihongo-partner/logs
```

### 10.2 查看指标

访问 Cloud Console：
- https://console.cloud.google.com/run/detail/asia-northeast1/nihongo-partner/metrics

## 十一、成本优化

### 11.1 设置最小实例为 0

```bash
gcloud run services update nihongo-partner \
  --min-instances 0 \
  --region asia-northeast1
```

### 11.2 设置并发数

```bash
gcloud run services update nihongo-partner \
  --concurrency 80 \
  --region asia-northeast1
```

## 十二、常见问题

### Q: 部署失败 "Cloud Build API has not been enabled"

```bash
gcloud services enable cloudbuild.googleapis.com
```

### Q: 应用启动后报错 "Could not load credentials"

确保服务账号密钥已正确配置：
```bash
gcloud run services update nihongo-partner \
  --set-secrets "GOOGLE_APPLICATION_CREDENTIALS=/secrets/key.json:nihongo-partner-sa-key:latest"
```

### Q: 冷启动时间过长

增加最小实例数（会增加成本）：
```bash
gcloud run services update nihongo-partner --min-instances 1
```

### Q: 如何回滚到之前的版本

```bash
# 查看所有版本
gcloud run revisions list --service nihongo-partner --region asia-northeast1

# 回滚到指定版本
gcloud run services update-traffic nihongo-partner \
  --to-revisions nihongo-partner-00001-abc=100 \
  --region asia-northeast1
```

## 十三、清理资源

如果不再需要，删除部署：

```bash
# 删除 Cloud Run 服务
gcloud run services delete nihongo-partner --region asia-northeast1

# 删除密钥
gcloud secrets delete nihongo-partner-sa-key

# 删除服务账号
gcloud iam service-accounts delete nihongo-partner-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## 快速部署脚本

项目提供了快速部署脚本 `scripts/deploy.sh`，可简化部署流程。

### 脚本说明

**脚本自动完成**：
- ✅ 第五步：部署应用到 Cloud Run

**仍需手动完成**：
- ❌ 第一步：安装配置 gcloud CLI（首次）
- ❌ 第二步：启用必要的 API（首次）
- ⚠️ 第三步：服务账号配置（可选，不配置则使用默认账号）
- ⚠️ 第四步：Firebase 配置（可选）
- ⚠️ 第六步及之后：域名、CI/CD 等（按需）

### 首次部署

首次部署前，需要先完成以下准备工作：

```bash
# 1. 登录 Google Cloud（只需一次）
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. 启用必要的 API（只需一次）
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com

# 3. 运行部署脚本
./scripts/deploy.sh
```

### 后续更新

代码更新后，只需运行：

```bash
./scripts/deploy.sh
```

### 脚本内容

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

### 运行脚本

```bash
# Linux / macOS / Git Bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows PowerShell
bash scripts/deploy.sh
```
