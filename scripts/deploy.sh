#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"
SERVICE_NAME="nihongo-partner"

# 解析参数
VERBOSE=""
for arg in "$@"; do
  case $arg in
    --verbose|-v)
      VERBOSE="--verbosity=debug"
      ;;
  esac
done

echo "=========================================="
echo "Deploying NihongoPartner to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
if [ -n "$VERBOSE" ]; then
  echo "Mode: Verbose"
fi
echo "=========================================="

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=$REGION" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  $VERBOSE

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo "Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
