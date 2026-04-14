# FitHub Deployment & CI/CD Guide

Complete automation guide for deploying FitHub to AWS with GitHub Actions.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Setup](#aws-setup)
3. [GitHub Configuration](#github-configuration)
4. [Deployment Workflow](#deployment-workflow)
5. [Monitoring & Scaling](#monitoring--scaling)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Requirements
- GitHub account with admin access to the repository
- AWS account
- Terraform installed locally (v1.5+)
- AWS CLI configured
- Docker installed

### Skills Needed
- Basic Git/GitHub knowledge
- Familiarity with AWS services
- Understanding of CI/CD pipelines

---

## AWS Setup

### Step 1: Create AWS Account & Configure Credentials

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Set region to: us-east-1
# Set output format to: json
```

### Step 2: Create S3 Bucket for Terraform State

```bash
# Create S3 bucket for storing Terraform state (must be globally unique)
aws s3 mb s3://fithub-terraform-state-YOUR-ACCOUNT-ID --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket fithub-terraform-state-YOUR-ACCOUNT-ID \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket fithub-terraform-state-YOUR-ACCOUNT-ID \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 3: Create DynamoDB Table for Terraform Locks

```bash
aws dynamodb create-table \
  --table-name fithub-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 4: Create IAM User for GitHub Actions

```bash
# Create IAM user
aws iam create-user --user-name fithub-github-actions

# Attach policies for ECS, EC2, RDS, S3, CloudFront
aws iam attach-user-policy \
  --user-name fithub-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-user-policy \
  --user-name fithub-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-user-policy \
  --user-name fithub-github-actions \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

# Create access key
aws iam create-access-key --user-name fithub-github-actions
# Save the AccessKeyId and SecretAccessKey - you'll need these in GitHub
```

---

## GitHub Configuration

### Step 1: Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID=<from IAM user>
AWS_SECRET_ACCESS_KEY=<from IAM user>
TF_STATE_BUCKET=fithub-terraform-state-YOUR-ACCOUNT-ID
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# For production database (if using PlanetScale or AWS RDS)
DATABASE_URL_PROD=mysql://user:password@host/dbname
PROD_CLOUDFRONT_DISTRIBUTION=E1234ABCD567
STAGING_CLOUDFRONT_DISTRIBUTION=E7890EFGH123
```

### Step 2: Create Protected Branches

Settings → Branches → Branch Protection Rules

For `main` branch:
- ✅ Require pull request reviews before merging (2 reviewers recommended)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require code reviews from code owners

### Step 3: Configure Environments

Settings → Environments

Create two environments: `staging` and `production`

For `production`:
- Add required reviewers (yourself)
- Add deployment branches: `main`

For `staging`:
- Add deployment branches: `develop`

---

## Deployment Workflow

### Development Flow

```
develop (staging) ← PR from feature branch → main (production)
   ↓                                            ↓
GitHub Actions runs tests, builds Docker,    GitHub Actions runs tests, builds Docker,
deploys to staging environment              deploys to production environment
```

### Step 1: Make a Feature Branch

```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

### Step 2: Open Pull Request to `develop`

- Go to GitHub
- Click "New pull request"
- Base: `develop`, Compare: `feature/your-feature`
- Add description
- Create PR

GitHub Actions will:
- ✅ Run linting
- ✅ Run tests
- ✅ Build Docker images
- ✅ Push to Container Registry

### Step 3: Merge to `develop` (Staging Deploy)

Merge the PR to `develop`. GitHub Actions will:
- ✅ Run all tests
- ✅ Build Docker images
- ✅ Deploy to staging ECS cluster
- ✅ Run health checks
- ✅ Notify Slack

### Step 4: Create PR to `main` (Production)

```bash
# Switch to main
git checkout main
git pull origin main

# Create PR from develop to main
# Go to GitHub → Pull requests → New
```

### Step 5: Review & Merge to `main` (Production Deploy)

After PR is approved:
- Merge to `main`
- GitHub Actions runs production deployment workflow
- **Requires manual approval** at production environment step
- Approve the deployment
- GitHub Actions continues with:
  - Database migrations
  - Backend deployment to production ECS
  - Frontend deployment to production S3/CloudFront
  - Health checks
  - Automatic rollback if health checks fail

---

## Monitoring & Scaling

### CloudWatch Logs

```bash
# View backend logs
aws logs tail /ecs/fithub-production --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/fithub-production \
  --filter-pattern "ERROR"
```

### ECS Metrics

```bash
# View ECS service metrics
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod
```

### Auto-Scaling

Current configuration:
- **Min tasks**: 2 (production) / 1 (staging)
- **Max tasks**: 10 (production) / 3 (staging)
- **Scale up** when CPU > 70%
- **Scale down** when CPU < 30%

Modify in `terraform/main.tf`:
```terraform
resource "aws_autoscaling_target" "ecs_target" {
  max_capacity = 10  # Change this
  min_capacity = 2   # Change this
}
```

### Performance Monitoring

Set up CloudWatch dashboards:

```bash
# Monitor key metrics in AWS Console
# CloudWatch → Dashboards → Create dashboard
# Add widgets for:
# - ECS CPU utilization
# - ECS memory utilization
# - ALB latency
# - ALB request count
# - RDS CPU
# - RDS connections
```

---

## Troubleshooting

### Deployment Failed

**Check logs:**
```bash
aws logs tail /ecs/fithub-production --follow
```

**Check ECS service:**
```bash
aws ecs describe-services \
  --cluster fithub-production \
  --services fithub-backend-prod
```

**Rollback:**
```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster fithub-production \
  --service fithub-backend-prod \
  --task-definition fithub-backend-prod:PREVIOUS \
  --force-new-deployment
```

### Database Connection Issues

```bash
# Check RDS cluster status
aws rds describe-db-clusters \
  --db-cluster-identifier fithub-production-cluster

# Get connection string from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id fithub-production-db-password
```

### Container Registry Issues

```bash
# Login to GitHub Container Registry
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u USERNAME --password-stdin

# Pull image manually
docker pull ghcr.io/your-username/fithub-backend:prod
```

### High Latency/Load

1. Check auto-scaling metrics
2. Increase task resources in `terraform/main.tf`
3. Add caching in CloudFront
4. Optimize database queries

---

## Scaling AWS Infrastructure

### Increase Backend Resources

Edit `terraform/main.tf`:
```terraform
resource "aws_ecs_task_definition" "backend" {
  cpu    = "512"    # Increase from 256
  memory = "1024"   # Increase from 512
}
```

Apply changes:
```bash
cd terraform
terraform plan
terraform apply
```

### Add Read Replicas to Database

```terraform
resource "aws_rds_cluster_instance" "read_replica" {
  identifier         = "fithub-production-read-replica"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.small"
}
```

### Enable CDN Caching

Edit CloudFront cache settings in `terraform/main.tf`:
```terraform
cache_behavior {
  default_ttl = 3600  # Cache for 1 hour
  max_ttl     = 86400 # Max cache for 1 day
}
```

---

## Cost Optimization

### Recommended AWS Cost Savers

1. **Use Spot Instances for Staging**
   ```terraform
   capacity_providers = ["FARGATE_SPOT"]  # Free tier equivalent
   ```

2. **Enable Data Compression**
   ```terraform
   storage_encrypted = true
   ```

3. **Set Auto-Scaling Policies**
   - Already configured ✓

4. **Use Reserved Instances (RDS)**
   - 30-40% savings for 1-year commitment

5. **Delete Unused Resources**
   ```bash
   # Remove staging if not needed
   terraform destroy -target=aws_ecs_cluster.staging
   ```

---

## Next Steps

1. ✅ Set up AWS account & credentials
2. ✅ Create S3 bucket & DynamoDB table
3. ✅ Create IAM user & get access keys
4. ✅ Add secrets to GitHub
5. ✅ Create feature branch from `develop`
6. ✅ Make changes locally
7. ✅ Push to feature branch
8. ✅ Open PR to `develop` → Auto-deploy to staging
9. ✅ Merge to `develop` & verify staging
10. ✅ Open PR `develop` → `main`
11. ✅ Get approval & merge to `main` → Auto-deploy to production
12. ✅ Verify in CloudWatch logs
13. ✅ Monitor metrics in AWS Console

**You now have fully automated CI/CD! 🚀**
