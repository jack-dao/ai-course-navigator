output "ec2_public_ip" {
  description = "Public IP of the backend EC2 instance"
  value       = aws_eip.backend.public_ip
}

output "ec2_instance_id" {
  description = "Instance ID of the backend EC2 (used by CI for SSM deploys)"
  value       = aws_instance.backend.id
}

output "s3_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.main.id
}

output "lambda_function_name" {
  description = "Name of the scraper Lambda function"
  value       = aws_lambda_function.scraper.function_name
}

output "acm_certificate_validation" {
  description = "DNS records needed for SSL certificate validation"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }
}
