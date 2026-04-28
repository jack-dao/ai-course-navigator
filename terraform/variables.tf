variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ai-slug-navigator"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "aislugnavigator.com"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.micro"
}

variable "ec2_key_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
  default     = "ai-slug-navigator"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH into the backend EC2 (e.g. \"203.0.113.5/32\"). Deploys go through SSM, so this is only for emergency human access."
  type        = string
}

variable "database_url" {
  description = "Supabase PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "direct_url" {
  description = "Supabase direct connection URL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for Supabase token verification"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}
