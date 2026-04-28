# IAM role for EC2 backend instance — grants SSM management + Secrets Manager read.
# Replaces the need for SSH-based deploys: GitHub Actions can run commands via
# `aws ssm send-command` instead of opening port 22 to runner IP ranges.

resource "aws_iam_role" "backend_ec2" {
  name = "${var.project_name}-backend-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-backend-ec2-role"
  }
}

# SSM agent on the instance uses this to phone home and accept commands.
resource "aws_iam_role_policy_attachment" "backend_ssm" {
  role       = aws_iam_role.backend_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Lets the deploy script on EC2 fetch app secrets at runtime instead of having
# CI pass them via env (also avoids writing them into SSM command history).
resource "aws_iam_role_policy" "backend_secrets" {
  name = "${var.project_name}-backend-secrets-policy"
  role = aws_iam_role.backend_ec2.id

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

resource "aws_iam_instance_profile" "backend" {
  name = "${var.project_name}-backend-instance-profile"
  role = aws_iam_role.backend_ec2.name
}
