#!/bin/bash
set -e

# ============================================
# Setup Firebase Secrets for Cloud Run
# Reads from .env.local and configures Cloud Run
# ============================================

REGION="asia-northeast1"
SERVICE_NAME="nihongo-partner"
ENV_FILE=".env.local"

echo "=========================================="
echo "Setting up Firebase Secrets for Cloud Run"
echo "=========================================="

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found!"
  exit 1
fi

# Read values from .env.local
echo "Reading configuration from $ENV_FILE..."

FIREBASE_CLIENT_EMAIL=$(grep "^FIREBASE_CLIENT_EMAIL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
FIREBASE_PRIVATE_KEY=$(grep "^FIREBASE_PRIVATE_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
PROJECT_ID=$(grep "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')

if [ -z "$FIREBASE_CLIENT_EMAIL" ]; then
  echo "Error: FIREBASE_CLIENT_EMAIL not found in $ENV_FILE"
  exit 1
fi

if [ -z "$FIREBASE_PRIVATE_KEY" ]; then
  echo "Error: FIREBASE_PRIVATE_KEY not found in $ENV_FILE"
  exit 1
fi

echo "Project ID: $PROJECT_ID"
echo "Client Email: $FIREBASE_CLIENT_EMAIL"
echo ""

# Get service account email
SA_EMAIL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null || echo "")

if [ -z "$SA_EMAIL" ]; then
  SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"
  echo "Using default service account: $SA_EMAIL"
else
  echo "Service Account: $SA_EMAIL"
fi

# Step 1: Create or update the secret
echo ""
echo "Step 1: Creating/updating firebase-private-key secret..."

# Convert \n to actual newlines in the private key
PRIVATE_KEY_DECODED=$(echo -e "$FIREBASE_PRIVATE_KEY")

# Check if secret exists
if gcloud secrets describe firebase-private-key --project=$PROJECT_ID &>/dev/null; then
  echo "Secret exists, adding new version..."
  echo "$PRIVATE_KEY_DECODED" | gcloud secrets versions add firebase-private-key --data-file=- --project=$PROJECT_ID
else
  echo "Creating new secret..."
  echo "$PRIVATE_KEY_DECODED" | gcloud secrets create firebase-private-key --data-file=- --project=$PROJECT_ID
fi

echo "✓ Secret created/updated"

# Step 2: Grant access to the service account
echo ""
echo "Step 2: Granting secret access to service account..."

gcloud secrets add-iam-policy-binding firebase-private-key \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID \
  --quiet

echo "✓ Access granted"

# Step 3: Update Cloud Run service
echo ""
echo "Step 3: Updating Cloud Run service..."

gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-env-vars "FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL" \
  --update-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID" \
  --update-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --update-env-vars "GOOGLE_CLOUD_LOCATION=$REGION" \
  --update-secrets "FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

echo "✓ Cloud Run service updated"

# Step 4: Verify
echo ""
echo "Step 4: Verifying configuration..."
echo ""

echo "Environment variables:"
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="table(spec.template.spec.containers[0].env.name,spec.template.spec.containers[0].env.value)"

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
