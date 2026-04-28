#!/bin/bash
# Runs on the EC2 backend instance via SSM (see .github/workflows/deploy.yml).
# Pulls latest main, fetches secrets from AWS Secrets Manager (read via the
# instance profile, no creds needed), and restarts the backend container.

set -euo pipefail

REPO_DIR="/home/ec2-user/ai-slug-navigator"
SECRET_ID="ai-slug-navigator/app-secrets"
REGION="us-west-2"

# jq is now installed via user_data, but existing instances pre-dating that
# change need a one-time install on the next deploy.
command -v jq >/dev/null || sudo dnf install -y jq

cd "$REPO_DIR"
git pull origin main

SECRETS=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text)

DATABASE_URL=$(echo "$SECRETS" | jq -r .DATABASE_URL)
DIRECT_URL=$(echo "$SECRETS" | jq -r .DIRECT_URL)
JWT_SECRET=$(echo "$SECRETS" | jq -r .JWT_SECRET)
GEMINI_API_KEY=$(echo "$SECRETS" | jq -r .GEMINI_API_KEY)

cd backend
docker build -t ai-slug-navigator-backend .
docker stop ai-slug-backend 2>/dev/null || true
docker rm ai-slug-backend 2>/dev/null || true
docker run -d \
  --name ai-slug-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DIRECT_URL="$DIRECT_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  ai-slug-navigator-backend
