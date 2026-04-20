# IAM role for Lambda
resource "aws_iam_role" "lambda_scraper" {
  name = "${var.project_name}-lambda-scraper-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-scraper-role"
  }
}

# Lambda basic execution policy (CloudWatch logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_scraper.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda access to Secrets Manager
resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${var.project_name}-lambda-secrets-policy"
  role = aws_iam_role.lambda_scraper.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      }
    ]
  })
}

# Lambda function (placeholder — will be updated by CI/CD)
resource "aws_lambda_function" "scraper" {
  function_name = "${var.project_name}-scraper"
  role          = aws_iam_role.lambda_scraper.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 900 # 15 minutes max for scraping
  memory_size   = 1024

  filename         = "${path.module}/scraper-lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/scraper-lambda.zip")

  environment {
    variables = {
      SECRETS_ARN = aws_secretsmanager_secret.app_secrets.arn
    }
  }

  tags = {
    Name = "${var.project_name}-scraper"
  }
}
