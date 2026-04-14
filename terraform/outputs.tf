output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the load balancer - use this as your API endpoint"
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "CloudFront distribution domain - use for frontend CDN"
}

output "rds_endpoint" {
  value       = aws_rds_cluster.main.endpoint
  description = "RDS cluster endpoint for database connections"
  sensitive   = true
}

output "rds_reader_endpoint" {
  value       = aws_rds_cluster.main.reader_endpoint
  description = "Read-only RDS endpoint for queries"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket name for frontend assets"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS cluster name"
}

output "ecs_service_name" {
  value       = aws_ecs_service.backend.name
  description = "ECS service name for backend"
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.ecs.name
  description = "CloudWatch log group for ECS logs"
}

output "environment" {
  value       = var.environment
  description = "Deployment environment (staging/production)"
}

output "aws_region" {
  value       = var.aws_region
  description = "AWS region where resources are deployed"
}

# Connection strings (sensitive outputs)
output "database_connection_string" {
  value       = "postgresql://${aws_rds_cluster.main.master_username}:****@${aws_rds_cluster.main.endpoint}:3306/${local.db_name}"
  description = "PostgreSQL connection string (password hidden)"
  sensitive   = true
}

output "next_public_api_url" {
  value       = "https://${aws_lb.main.dns_name}"
  description = "Backend API URL for Next.js frontend environment variable"
}

# Deployment instructions
output "deployment_instructions" {
  value = <<-EOT
    
    ========================================
    Deployment Complete! 🎉
    ========================================
    
    Frontend (S3 + CloudFront):
      - Bucket: ${aws_s3_bucket.frontend.id}
      - CDN: ${aws_cloudfront_distribution.frontend.domain_name}
      - Upload: aws s3 sync out s3://${aws_s3_bucket.frontend.id}
    
    Backend (ECS):
      - Cluster: ${aws_ecs_cluster.main.name}
      - Service: ${aws_ecs_service.backend.name}
      - API: ${aws_lb.main.dns_name}
      - Logs: aws logs tail ${aws_cloudwatch_log_group.ecs.name} --follow
    
    Database (RDS):
      - Endpoint: ${aws_rds_cluster.main.endpoint}
      - Database: ${local.db_name}
      - Username: ${aws_rds_cluster.main.master_username}
      - Secret: ${aws_secretsmanager_secret.db_password.name}
    
    Next Steps:
      1. Update your domain CNAME to: ${aws_cloudfront_distribution.frontend.domain_name}
      2. Add backend API domain: ${aws_lb.main.dns_name}
      3. Configure SSL/TLS certificates
      4. Set up monitoring alerts in CloudWatch
      5. Enable WAF for production security
    
    Monitoring:
      - CloudWatch: https://console.aws.amazon.com/cloudwatch
      - ECS: https://console.aws.amazon.com/ecs/v2/clusters
      - RDS: https://console.aws.amazon.com/rds/
      - S3: https://console.aws.amazon.com/s3/
    
    ========================================
  EOT
  
  description = "Deployment summary and next steps"
}
