#!/bin/bash
# Railway Deployment - Quick Start

cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🚂 Railway - Easiest Deployment Platform              ║
║                                                              ║
║     Get your app live in 5 minutes with auto-deploys        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

STEP 1: Create Railway Account (2 min)
   Go to: https://railway.app
   Click: Sign up with GitHub
   Choose: Your fithub repository

STEP 2: Add Environment Variables (1 min)
   Railway Dashboard → Variables
   Add these:
   
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   SECRET_KEY=change-me-to-something-secure
   GOOGLE_SCHOLAR_API_KEY=86ea0ba4485ffff75a64df040c750ae7fb8455e13da606ab71c7bb70fcb6fdf2
   NLM_API_KEY=951d55d8d51dc86852251ada4339ccb79308
   CROSSREF_EMAIL=sanchitpanda490@gmail.com

STEP 3: Deploy (1 min)
   That's it! Railway auto-deploys when you push to main:
   
   $ git commit -m "Deploy to Railway"
   $ git push origin main
   
   Railway builds and deploys automatically ✓

STEP 4: Check Status (1 min)
   Go to Railway Dashboard:
   - See your app is live
   - View logs
   - See your URL (something.railway.app)
   - Click "View Live" to see your app

STEP 5: Custom Domain (Optional)
   Railway → Project Settings → Networking
   Add your domain (fithub.app)
   Update DNS CNAME to Railway URL

═══════════════════════════════════════════════════════════════

✨ FEATURES:
   ✓ Auto-deploy from GitHub
   ✓ Automatic PostgreSQL database
   ✓ Free SSL/HTTPS
   ✓ Real-time logs
   ✓ One-click rollback
   ✓ Monitoring & metrics
   ✓ $5/month free credit

💰 PRICING:
   ~$15-30/month total
   (Much cheaper than AWS!)

🆘 TROUBLESHOOTING:
   Build failing?
   → Check logs in Railway dashboard
   → Make sure Dockerfile exists
   
   App not starting?
   → View logs for error
   → Check environment variables
   
   Database error?
   → Railway provides DATABASE_URL automatically
   → Check your app reads it correctly

═══════════════════════════════════════════════════════════════

Ready? Let's go:

1. Open: https://railway.app
2. Click: "Start a New Project"
3. Select: "Deploy from GitHub"
4. Choose: your fithub repo
5. Add variables (from Step 2 above)
6. Click: "Deploy"
7. Done! Watch deployment in dashboard
8. Visit: your-app.railway.app

That's it! Auto-deploys forever after that 🚀

═══════════════════════════════════════════════════════════════
EOF
