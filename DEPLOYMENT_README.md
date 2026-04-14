# 🚀 FitHub - Production Ready CI/CD Pipeline

Complete automated deployment pipeline for FitHub using GitHub Actions, AWS, and Terraform.

## 📋 What You Get

✅ **Fully Automated CI/CD**
- Automatic testing on every commit
- Automatic Docker image building
- Automatic deployment to staging/production
- Automatic rollback on failures

✅ **Production Infrastructure**
- AWS ECS for containerized backend
- AWS S3 + CloudFront CDN for frontend
- AWS RDS Aurora MySQL for database
- Auto-scaling based on CPU/memory load
- Multi-AZ high availability

✅ **Monitoring & Observability**
- CloudWatch logs for all containers
- Real-time performance metrics
- Automated alerts on failures
- Health check validation

✅ **Security**
- Encryption at rest and in transit
- Private VPC with security groups
- Secrets management for API keys
- IAM roles with least privileges

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Repository                 │
│  ├── develop branch (staging)                       │
│  ├── main branch (production)                       │
│  └── feature branches                               │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD                   │
│  1. Lint code (Python + TypeScript)                │
│  2. Run tests                                       │
│  3. Build Docker images                            │
│  4. Push to Container Registry                     │
│  5. Deploy to Staging/Production                   │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  STAGING    │   │ PRODUCTION   │
│             │   │              │
│ ECS Cluster │   │ ECS Cluster  │
│ RDS (1 DB)  │   │ RDS (2 DBs)  │
│ S3 + CDN    │   │ S3 + CDN     │
│ 1-2 tasks   │   │ 2-10 tasks   │
└─────────────┘   └──────────────┘
```

---

## 📦 Deployment Flow

### Feature Development
```
1. Create branch from develop
2. Make code changes
3. Commit & push
4. Create PR to develop
   ↓
   GitHub Actions runs:
   - Linting
   - Tests
   - Security scan
   - Build Docker
5. Merge PR to develop
   ↓
   GitHub Actions deploys to STAGING
6. Test in staging
```

### Production Release
```
1. Create PR from develop → main
2. Get 2 code reviews
3. Merge to main
   ↓
   GitHub Actions runs:
   - All tests
   - Build Docker
   - Deploy to PRODUCTION (requires manual approval)
4. Click "Approve" in GitHub
   ↓
   GitHub Actions:
   - Runs migrations
   - Deploys backend
   - Deploys frontend
   - Health checks
   - Auto-rollback if fails
```

---

## 🚦 Quick Start (5 min setup)

### 1. Prerequisites
```bash
# Install required tools
brew install awscli terraform  # macOS
# or use apt/choco on Linux/Windows

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

### 2. Run Setup Script

**macOS/Linux:**
```bash
bash scripts/setup-github-actions.sh
```

**Windows PowerShell:**
```powershell
# Manually run the commands from DEPLOYMENT.md
# Or create a PowerShell version of the script
```

### 3. Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets (from setup script output):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `TF_STATE_BUCKET`
- `SLACK_WEBHOOK` (optional, for notifications)

### 4. First Deployment

```bash
# Create feature branch
git checkout -b feature/initial-setup
git push -u origin feature/initial-setup

# Create PR to develop
# GitHub will show staging deployment in progress

# Once staging succeeds, merge to develop
# Then create PR to main for production
```

---

## 📊 Monitoring

### View Logs in Real-Time
```bash
# Staging logs
aws logs tail /ecs/fithub-staging --follow

# Production logs  
aws logs tail /ecs/fithub-production --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/fithub-production \
  --filter-pattern "ERROR"
```

### CloudWatch Metrics
```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=fithub-backend-prod
```

### Dashboard (Web)
1. Go to [AWS Console](https://console.aws.amazon.com/cloudwatch)
2. Dashboards → Create dashboard
3. Add widgets for ECS, RDS, S3, CloudFront metrics

---

## 🔄 Deployments

### Check Deployment Status

**Via GitHub:**
```
Actions → [Latest workflow] → Click to view details
```

**Via AWS:**
```bash
# Check ECS service
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod

# Check deployment progress
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod \
  --query 'services[0].deployments'
```

### Manual Deployment
```bash
# Force redeploy current version
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --force-new-deployment

# Or via GitHub - create empty commit
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### Rollback
```bash
# Automatic: GitHub Actions will rollback if health checks fail
# Manual: 
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --task-definition fithub-backend-prod:PREVIOUS
```

---

## 💰 Cost Estimation

### Staging Environment
- ECS Fargate: ~$15/month (1-2 tasks)
- RDS t3.micro: ~$30/month
- S3 + Transfer: ~$5/month
- **Total: ~$50/month**

### Production Environment  
- ECS Fargate: ~$60/month (2-10 tasks, auto-scaling)
- RDS Aurora: ~$100/month (2 replicas, backups)
- S3 + CDN: ~$30/month (10GB storage, 100GB transfer)
- **Total: ~$190/month**

### Cost Optimization Tips
```bash
# Use Spot instances (save 70%)
# Set sleep schedule for staging (save 50%)
# Delete unused snapshots (save 20%)
# Use Reserved Instances for production (save 30%)
```

---

## 🔐 Security

### API Keys & Secrets
All stored in AWS Secrets Manager, never in code:
- `GOOGLE_SCHOLAR_API_KEY`
- `NLM_API_KEY`  
- `DATABASE_URL`
- `SECRET_KEY`

### Access Control
- GitHub: Require 2 approvals for production merge
- AWS: IAM user with minimal permissions
- RDS: Private subnets, security groups
- S3: Public access blocked, CloudFront only

### Encryption
- Database: ✓ Encrypted at rest
- Traffic: ✓ HTTPS/TLS enforced
- Secrets: ✓ AWS Secrets Manager

---

## 📱 Environment Variables

### Backend (.env)
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GOOGLE_SCHOLAR_API_KEY=...
NLM_API_KEY=...
CROSSREF_EMAIL=...
SECRET_KEY=...
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.fithub.app
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 🆘 Troubleshooting

### Deployment Stuck
```bash
# Check service status
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod

# Check task status
aws ecs describe-tasks \
  --cluster fithub-production \
  --tasks $(aws ecs list-tasks --cluster fithub-production --query 'taskArns[0]' --output text)

# View logs
aws logs tail /ecs/fithub-production --follow
```

### Health Check Failing
```bash
# Test manually
curl -X GET http://ALB_DNS/health

# Check health check settings
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod \
  --query 'services[0].loadBalancers'
```

### Database Connection Error
```bash
# Check RDS cluster
aws rds describe-db-clusters \
  --db-cluster-identifier fithub-production-cluster

# Get connection string
aws secretsmanager get-secret-value \
  --secret-id fithub-production-db-password

# Test connectivity
psql -h ENDPOINT -U admin -d fithub_prod
```

### Out of Memory
```bash
# Increase task memory
# Edit terraform/main.tf:
resource "aws_ecs_task_definition" "backend" {
  memory = "1024"  # Increase from 512
}

# Apply changes
terraform apply
```

---

## 📖 Documentation Files

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete setup guide
- **[DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)** - Command reference
- **[terraform/](./terraform/)** - Infrastructure as Code
- **[.github/workflows/deploy.yml](./.github/workflows/deploy.yml)** - CI/CD pipeline

---

## 🎯 Next Steps

1. ✅ Run setup script (`scripts/setup-github-actions.sh`)
2. ✅ Add GitHub secrets
3. ✅ Create feature branch and test
4. ✅ Merge to develop (auto-deploy to staging)
5. ✅ Test in staging environment
6. ✅ Create PR to main (with reviews)
7. ✅ Approve production deployment
8. ✅ Monitor in CloudWatch

---

## 🆘 Getting Help

- **GitHub Actions**: Check Actions tab for logs
- **AWS Issues**: Check CloudWatch logs
- **Database Issues**: Check RDS console
- **Performance**: Check CloudWatch metrics

---

## 📞 Support

For issues, check:
1. GitHub Actions workflow logs
2. CloudWatch log groups
3. ECS task status
4. RDS cluster status
5. Application error logs

**All automated. All secure. All scalable. 🚀**
