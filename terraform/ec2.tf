# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# AWS-managed prefix list of CloudFront origin-facing IPs. Used to restrict
# port 3000 to only CloudFront, blocking direct hits to the EC2 public IP.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# Security group for EC2
resource "aws_security_group" "backend" {
  name        = "${var.project_name}-backend-sg"
  description = "Security group for backend server"
  vpc_id      = aws_vpc.main.id

  # SSH — emergency human access only. Routine deploys use SSM (no SSH).
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH access (human emergency only)"
  }

  # HTTPS — only CloudFront origin IPs can reach it. Blocks direct hits.
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
    description     = "Backend HTTPS (CloudFront only)"
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-backend-sg"
  }
}

# EC2 key pair
resource "aws_key_pair" "deployer" {
  key_name   = var.ec2_key_name
  public_key = file("~/.ssh/${var.ec2_key_name}.pub")
}

# EC2 instance
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  key_name               = aws_key_pair.deployer.key_name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.backend.name

  # Install Docker + jq (for deploy script secret parsing) on startup.
  # SSM agent is preinstalled on Amazon Linux 2023.
  user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker jq amazon-ssm-agent git
    systemctl enable docker amazon-ssm-agent
    systemctl start docker amazon-ssm-agent
    usermod -aG docker ec2-user
    # Add swap for Docker builds (t4g.micro only has 1GB RAM)
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
  EOF

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = {
    Name = "${var.project_name}-backend"
  }
}

# Elastic IP so the IP doesn't change on restart
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id

  tags = {
    Name = "${var.project_name}-backend-eip"
  }
}
