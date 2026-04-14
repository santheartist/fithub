# Railway Deployment - Simplest One-Click Deployment

This is the **easiest way to deploy FitHub** with automatic deployments on every git push.

## What is Railway?

Railway is a cloud platform that:
- ✅ Auto-deploys when you push to GitHub
- ✅ No infrastructure setup needed
- ✅ Built-in database (PostgreSQL)
- ✅ Automatic SSL/HTTPS
- ✅ One-click rollbacks
- ✅ Free tier included ($5/month free credit)

**Cost**: ~$12-30/month for full stack (database + backend + frontend)

---

## 🚀 Setup in 5 Minutes

### Step 1: Connect GitHub to Railway (1 min)

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account
5. Select your `fithub` repository
6. Click **"Deploy"**

That's it! Railway will auto-detect your project.

### Step 2: Add Environment Variables (2 min)

Railway → Your Project → Variables

Add these:
```
ENVIRONMENT=production
DATABASE_URL=postgresql://...  (auto-filled by Railway)
LOG_LEVEL=INFO
GOOGLE_SCHOLAR_API_KEY=86ea0ba4485ffff75a64df040c750ae7fb8455e13da606ab71c7bb70fcb6fdf2
NLM_API_KEY=951d55d8d51dc86852251ada4339ccb79308
CROSSREF_EMAIL=sanchitpanda490@gmail.com
SECRET_KEY=your-secret-key-change-me
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
```

### Step 3: Deploy (1 min)

Railway will automatically:
1. Detect Dockerfile
2. Build Docker image
3. Deploy backend service
4. Deploy frontend service
5. Provision PostgreSQL database
6. Give you a live URL

### Step 4: Done! (1 min)

Every time you push to `main`:
```bash
git commit -m "Update code"
git push origin main
# Railway auto-deploys in 2-3 minutes ✓
```

---

## 📁 Files You Need

### railway.json (Config File)
Create this in root directory:

```json
{
  "services": {
    "backend": {
      "dockerfile": "./scienceLift/backend/Dockerfile",
      "buildContext": "./",
      "variables": {
        "PORT": 8000
      }
    },
    "frontend": {
      "dockerfile": "./scienceLift/frontend/Dockerfile",
      "buildContext": "./",
      "variables": {
        "PORT": 3000
      }
    }
  }
}
```

---

## 🔄 How Auto-Deployment Works

```
You push to main
    ↓
GitHub tells Railway
    ↓
Railway builds Docker image
    ↓
Railway deploys new version
    ↓
Your app updates automatically ✓
(Takes 2-3 minutes)
```

No GitHub Actions needed. No manual deployment. Just push and it's live.

---

## 📊 Built-in Features

### Automatic Database
Railway provisions PostgreSQL automatically:
- Backup: ✓
- SSL: ✓
- Auto-scaling: ✓
- Monitoring: ✓

### Monitoring Dashboard
- View logs in real-time
- See CPU/memory usage
- Monitor response times
- Track deployments

### Rollback
Click **"Rollback"** in Railway dashboard to revert to previous version (instant)

### Custom Domain
Railway → Project Settings → Domains
Add your domain (e.g., `fithub.app`)

---

## 💰 Pricing

Railway pricing is based on resource usage:

| Component | Cost | Notes |
|-----------|------|-------|
| Backend container | $0.20/hour idle | ~$5/month if always on |
| PostgreSQL database | $0.004/GB used | ~$10/month for 1GB |
| Frontend static | Free | S3 static hosting |
| **Total estimate** | | **~$15-30/month** |

Free $5 credit every month = effectively $10-25/month

---

## 📊 Deployment Status

### View Logs
Railway Dashboard → Logs tab → See real-time logs

### Check Deployment
Railway Dashboard → Deployments tab → See all deployments

### Monitor Performance
Railway Dashboard → Metrics tab → CPU, memory, response time

---

## 🆘 Troubleshooting

### Build Failed
1. Check logs in Railway dashboard
2. Make sure `Dockerfile` exists
3. Check environment variables set correctly

### App Not Starting
1. Check backend is listening on PORT 8000
2. Check database URL in secrets
3. View logs for error message

### Database Connection
Railway provides DATABASE_URL automatically:
```bash
# Already set, backend reads automatically
```

### Custom Domain Not Working
1. Go to Railway → Domains → Add custom domain
2. Update your DNS CNAME to Railway URL
3. Wait 5-10 minutes for DNS propagation

---

## 📁 Backend Dockerfile (Already Have This?)

If you don't have one, create `scienceLift/backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY scienceLift/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scienceLift/backend ./

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📁 Frontend Dockerfile (Already Have This?)

If you don't have one, create `scienceLift/frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY scienceLift/frontend/package*.json ./
RUN npm ci

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY scienceLift/frontend .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🎯 Next Steps

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Connect GitHub repo
4. Add environment variables
5. Push to main branch
6. Watch deployment in Railway dashboard
7. Done! Your app is live 🎉

---

## 🆚 Railway vs AWS

| Feature | Railway | AWS |
|---------|---------|-----|
| Setup time | 5 minutes | 1-2 hours |
| Complexity | Super simple | Complex |
| Auto-deploy | ✓ Built-in | Need GitHub Actions |
| Cost | $15-30/month | $240/month |
| Database | Easy | Manual setup |
| Scaling | Automatic | Manual |
| Dev experience | Great | Great |

**Railway = Get running fast. AWS = Max control & scale.**

---

## Final Command

```bash
# That's literally it:
git push origin main

# Railway does everything else!
```

**No GitHub Actions. No terraform. No infrastructure. Just deploy.** 🚀
