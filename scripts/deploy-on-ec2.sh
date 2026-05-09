#!/bin/bash
# Runs on the EC2 backend instance via SSM (see .github/workflows/deploy.yml).
# Pulls latest main, fetches secrets from AWS Secrets Manager (read via the
# instance profile, no creds needed), and restarts the backend container.

set -euo pipefail

REPO_DIR="/home/ec2-user/ai-slug-navigator"
SECRET_ID="ai-slug-navigator/app-secrets"
REGION="us-west-2"
IMAGE_NAME="ai-slug-navigator-backend"
CONTAINER_NAME="ai-slug-backend"

# jq is now installed via user_data, but existing instances pre-dating that
# change need a one-time install on the next deploy.
command -v jq >/dev/null || sudo dnf install -y jq

git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
cd "$REPO_DIR"
git pull origin main

# Fetch secrets — write to temp files to avoid exposure via ps/docker-inspect
SECRETS_JSON=$(mktemp)
ENV_FILE=$(mktemp)
trap 'rm -f "$SECRETS_JSON" "$ENV_FILE"' EXIT

aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text > "$SECRETS_JSON"

# Validate required secrets exist
for key in DATABASE_URL DIRECT_URL JWT_SECRET GEMINI_API_KEY; do
  value=$(jq -r ".$key" "$SECRETS_JSON")
  if [ -z "$value" ] || [ "$value" = "null" ]; then
    echo "ERROR: Missing required secret: $key" >&2
    exit 1
  fi
done

# Write env file for Docker (secrets never appear in CLI args or docker inspect)
cat > "$ENV_FILE" <<EOL
DATABASE_URL=$(jq -r .DATABASE_URL "$SECRETS_JSON")
DIRECT_URL=$(jq -r .DIRECT_URL "$SECRETS_JSON")
JWT_SECRET=$(jq -r .JWT_SECRET "$SECRETS_JSON")
GEMINI_API_KEY=$(jq -r .GEMINI_API_KEY "$SECRETS_JSON")
NODE_ENV=production
PORT=3000
EOL
chmod 600 "$ENV_FILE"

cd backend

# Tag previous image for rollback before building new one
if docker image inspect "$IMAGE_NAME:latest" >/dev/null 2>&1; then
  docker tag "$IMAGE_NAME:latest" "$IMAGE_NAME:previous"
fi

docker build -t "$IMAGE_NAME:latest" .

docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 443:443 \
  --env-file "$ENV_FILE" \
  "$IMAGE_NAME:latest"

# Wait for container to be healthy
echo "Waiting for health check..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "Container is healthy."
    exit 0
  fi
  sleep 2
done

echo "ERROR: Container failed health check after 60s. Rolling back..." >&2
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
if docker image inspect "$IMAGE_NAME:previous" >/dev/null 2>&1; then
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 443:443 \
    --env-file "$ENV_FILE" \
    "$IMAGE_NAME:previous"
  echo "Rolled back to previous image."
fi
exit 1
