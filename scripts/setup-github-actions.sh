#!/usr/bin/env bash
# GitHub Actions & AWS Setup Script for FitHub
# This script automates the GitHub Actions setup process

set -e  # Exit on error

echo "========================================"
echo "FitHub - GitHub Actions Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."
commands=("git" "aws" "terraform" "docker")
for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}✗ $cmd not found. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $cmd${NC}"
done

echo ""
echo "========================================"
echo "Step 1: AWS Credentials"
echo "========================================"
echo ""
echo "Enter your AWS Access Key ID:"
read -s AWS_ACCESS_KEY_ID
export AWS_ACCESS_KEY_ID

echo "Enter your AWS Secret Access Key:"
read -s AWS_SECRET_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY

echo ""
echo "Testing AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✓ AWS credentials valid${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION="us-east-1"
    echo "AWS Account ID: $AWS_ACCOUNT_ID"
else
    echo -e "${RED}✗ AWS credentials invalid${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Step 2: Create S3 Bucket for Terraform"
echo "========================================"
echo ""
BUCKET_NAME="fithub-terraform-state-${AWS_ACCOUNT_ID}"
echo "Creating S3 bucket: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}! S3 bucket already exists${NC}"
else
    aws s3 mb "s3://$BUCKET_NAME" --region $AWS_REGION
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    echo -e "${GREEN}✓ S3 bucket created${NC}"
fi

echo ""
echo "========================================"
echo "Step 3: Create DynamoDB Table"
echo "========================================"
echo ""
TABLE_NAME="fithub-terraform-locks"
echo "Creating DynamoDB table: $TABLE_NAME"

if aws dynamodb describe-table --table-name "$TABLE_NAME" 2>/dev/null; then
    echo -e "${YELLOW}! DynamoDB table already exists${NC}"
else
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region $AWS_REGION
    echo -e "${GREEN}✓ DynamoDB table created${NC}"
fi

echo ""
echo "========================================"
echo "Step 4: Create IAM User"
echo "========================================"
echo ""
IAM_USER="fithub-github-actions"
echo "Creating IAM user: $IAM_USER"

if aws iam get-user --user-name "$IAM_USER" 2>/dev/null; then
    echo -e "${YELLOW}! IAM user already exists${NC}"
else
    aws iam create-user --user-name "$IAM_USER"
    echo -e "${GREEN}✓ IAM user created${NC}"
fi

# Attach policies
echo "Attaching policies..."
POLICIES=(
    "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
    "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
    "arn:aws:iam::aws:policy/CloudFrontFullAccess"
    "arn:aws:iam::aws:policy/IAMFullAccess"
    "arn:aws:iam::aws:policy/CloudWatchFullAccess"
)

for policy in "${POLICIES[@]}"; do
    aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$policy" 2>/dev/null || true
done
echo -e "${GREEN}✓ Policies attached${NC}"

echo ""
echo "========================================"
echo "Step 5: Create Access Key"
echo "========================================"
echo ""
echo "Creating access key for GitHub Actions..."

# Delete old keys if they exist (keep only latest)
OLD_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER" --query 'AccessKeyMetadata[0].AccessKeyId' --output text 2>/dev/null)
if [ "$OLD_KEYS" != "None" ] && [ -n "$OLD_KEYS" ]; then
    aws iam delete-access-key --user-name "$IAM_USER" --access-key-id "$OLD_KEYS" 2>/dev/null || true
fi

ACCESS_KEY=$(aws iam create-access-key --user-name "$IAM_USER" --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output json)
GITHUB_ACCESS_KEY_ID=$(echo $ACCESS_KEY | grep -o '"[^"]*"' | sed -n '1p' | tr -d '"')
GITHUB_SECRET_ACCESS_KEY=$(echo $ACCESS_KEY | grep -o '"[^"]*"' | sed -n '2p' | tr -d '"')

echo -e "${GREEN}✓ Access key created${NC}"

echo ""
echo "========================================"
echo "Step 6: GitHub Secrets"
echo "========================================"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "  Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "Name: AWS_ACCESS_KEY_ID"
echo "Value: $GITHUB_ACCESS_KEY_ID"
echo ""
echo "Name: AWS_SECRET_ACCESS_KEY"
echo "Value: $GITHUB_SECRET_ACCESS_KEY"
echo ""
echo "Name: TF_STATE_BUCKET"
echo "Value: $BUCKET_NAME"
echo ""

echo "Use this command to add secrets via GitHub CLI (if installed):"
echo ""
echo "gh secret set AWS_ACCESS_KEY_ID --body '$GITHUB_ACCESS_KEY_ID'"
echo "gh secret set AWS_SECRET_ACCESS_KEY --body '$GITHUB_SECRET_ACCESS_KEY'"
echo "gh secret set TF_STATE_BUCKET --body '$BUCKET_NAME'"
echo ""

read -p "Press Enter once you've added the secrets to GitHub..."

echo ""
echo "========================================"
echo "Step 7: Initialize Terraform"
echo "========================================"
echo ""
cd terraform || exit 1
terraform init \
    -backend-config="bucket=$BUCKET_NAME" \
    -backend-config="key=fithub-terraform.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="encrypt=true" \
    -backend-config="dynamodb_table=$TABLE_NAME"

echo -e "${GREEN}✓ Terraform initialized${NC}"

echo ""
echo "========================================"
echo "Step 8: Verify Terraform"
echo "========================================"
echo ""
echo "Running Terraform validation..."
terraform validate
terraform fmt -recursive -check

cd ..

echo ""
echo "========================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Commit all files to your repository"
echo "  2. Create a feature branch"
echo "  3. Push to develop branch to trigger staging deployment"
echo "  4. Create PR to main branch for production deployment"
echo ""
echo "Monitor deployments:"
echo "  - GitHub Actions: https://github.com/YOUR_ORG/fithub/actions"
echo "  - AWS Console: https://console.aws.amazon.com"
echo "  - CloudWatch Logs: aws logs tail /ecs/fithub-staging --follow"
echo ""
