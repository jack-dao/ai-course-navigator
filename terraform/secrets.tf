# Secrets Manager — stores all application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}/app-secrets"

  tags = {
    Name = "${var.project_name}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DATABASE_URL   = var.database_url
    DIRECT_URL     = var.direct_url
    JWT_SECRET     = var.jwt_secret
    GEMINI_API_KEY = var.gemini_api_key
  })
}
