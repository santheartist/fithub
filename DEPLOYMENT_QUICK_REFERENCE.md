# Deployment Quick Reference

## One-Command Deploy Flow

### Backend Deployment Status
```bash
# Check running services
aws ecs list-services --cluster fithub-production --query 'serviceArns' --output text

# View logs in real-time
aws logs tail /ecs/fithub-production --follow

# Check task status
aws ecs describe-tasks \
  --cluster fithub-production \
  --tasks $(aws ecs list-tasks --cluster fithub-production --query 'taskArns[0]' --output text)
```

### Frontend Deployment Status
```bash
# Check S3 sync status
aws s3 ls s3://fithub-prod-frontend/ --recursive | wc -l

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD567 \
  --paths "/*"

# Check distribution status
aws cloudfront get-distribution --id E1234ABCD567 --query 'Distribution.Status'
```

### Database Status
```bash
# Check RDS cluster
aws rds describe-db-clusters --db-cluster-identifier fithub-production-cluster

# Get connection string
aws secretsmanager get-secret-value --secret-id fithub-production-db-password

# Run database migration
docker run \
  -e DATABASE_URL=$DATABASE_URL \
  ghcr.io/your-org/fithub-backend:prod \
  alembic upgrade head
```

---

## GitHub Actions Workflow

### Trigger Staging Deploy (develop branch)
```bash
git checkout develop
git pull origin develop
git push origin feature-branch  # Creates PR
# Merge PR to develop → Auto-deploys to staging
```

### Trigger Production Deploy (main branch)
```bash
git checkout main
git pull origin main
# Create PR from develop to main
# Wait for reviews
# Merge PR to main
# Approve production deployment in GitHub
# Auto-deploys to production
```

### Manual Force Deployment
```bash
# Force redeploy without code changes
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --force-new-deployment

# Invalidate frontend cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD567 \
  --paths "/*"
```

---

## Monitoring Quick Links

- **GitHub Actions**: https://github.com/YOUR_ORG/fithub/actions
- **AWS ECS**: https://console.aws.amazon.com/ecs/v2/clusters
- **CloudWatch Logs**: https://console.aws.amazon.com/logs/home
- **RDS Dashboard**: https://console.aws.amazon.com/rds/
- **S3 Buckets**: https://console.aws.amazon.com/s3/
- **CloudFront CDN**: https://console.aws.amazon.com/cloudfront/
- **Cost Explorer**: https://console.aws.amazon.com/cost-management

---

## Rollback Procedures

### Rollback Backend
```bash
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --task-definition fithub-backend-prod:PREVIOUS \
  --force-new-deployment
```

### Rollback Frontend
```bash
# List object versions
aws s3api list-object-versions \
  --bucket fithub-prod-frontend \
  --max-items 10

# Restore previous version
aws s3api copy-object \
  --bucket fithub-prod-frontend \
  --copy-source fithub-prod-frontend/index.html?versionId=PREVIOUS_VERSION_ID \
  --key index.html
```

### Rollback Database
```bash
# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier fithub-production-restored \
  --snapshot-identifier fithub-production-cluster-snapshot-TIMESTAMP
```

---

## Emergency Procedures

### Scale Up Immediately
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/fithub-production/fithub-backend-prod \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 5 \
  --max-capacity 20

# Or manually
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --desired-count 10
```

### Disable Auto-Scaling
```bash
aws application-autoscaling deregister-scalable-target \
  --service-namespace ecs \
  --resource-id service/fithub-production/fithub-backend-prod \
  --scalable-dimension ecs:service:DesiredCount
```

### Stop Everything
```bash
# Scale down to zero
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --desired-count 0
```

---

## Environment Variables

### Required for GitHub Actions
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `TF_STATE_BUCKET`
- `SLACK_WEBHOOK`
- `DATABASE_URL_PROD`

### Required for Terraform
```bash
export AWS_REGION=us-east-1
export TF_VAR_environment=production
export TF_VAR_backend_image=ghcr.io/your-org/fithub-backend:prod
export TF_VAR_frontend_image=ghcr.io/your-org/fithub-frontend:prod
```

---

## Cost Monitoring

```bash
# Get monthly costs
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-04-30 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## Common Issues

### "Container exited with code 1"
```bash
# Check container logs
aws logs filter-log-events \
  --log-group-name /ecs/fithub-production \
  --start-time $(($(date +%s)*1000))
```

### "Task failed to place"
- Check resource availability
- Scale up cluster or reduce task size
- Check security groups allow traffic

### "Database connection refused"
- Check RDS security group allows ECS security group
- Verify database is running
- Check credentials in Secrets Manager

### "CloudFront slow"
- Check cache hit ratio
- Increase TTL in terraform/main.tf
- Review cache behaviors for API vs static files

---

## Performance Tuning

### Improve Backend Response Time
```terraform
# In terraform/main.tf
resource "aws_ecs_task_definition" "backend" {
  cpu    = "512"    # 4x default
  memory = "2048"   # 4x default
}

# Add more tasks
desired_count = 5  # Instead of 2
```

### Improve Database Performance
```bash
# Enable performance insights
aws rds modify-db-instance \
  --db-instance-identifier fithub-prod-instance-1 \
  --enable-performance-insights
```

### Improve Frontend CDN
```terraform
# In terraform/main.tf - increase cache TTL
cache_behavior {
  default_ttl = 86400  # 1 day instead of 1 hour
  max_ttl     = 604800  # 1 week
}
```

---

## Security Checklist

- [ ] Enable MFA on AWS account
- [ ] Rotate IAM access keys quarterly
- [ ] Enable S3 bucket versioning ✓ (already done)
- [ ] Enable RDS backup ✓ (already done)
- [ ] Enable CloudTrail logging
- [ ] Set up WAF rules on CloudFront
- [ ] Enable GuardDuty threat detection
- [ ] Review IAM policies quarterly
- [ ] Use Secrets Manager for all credentials ✓ (already done)
- [ ] Enable encryption at rest ✓ (already done)
- [ ] Enable encryption in transit ✓ (already done)
