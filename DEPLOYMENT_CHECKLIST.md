# 🚀 ScienceLift AI Features - Deployment Checklist

Complete this checklist to successfully deploy the new AI features.

## Phase 1: Pre-Deployment (15 minutes)

### Configuration
- [ ] Verify OpenAI API key is valid
  ```bash
  # Test the API key
  python -c "
  import openai
  openai.api_key = 'YOUR_KEY_HERE'
  try:
      response = openai.ChatCompletion.create(
          model='gpt-3.5-turbo',
          messages=[{'role': 'user', 'content': 'test'}],
          max_tokens=5
      )
      print('✓ API key is valid')
  except Exception as e:
      print(f'✗ Error: {e}')
  "
  ```

- [ ] Add API key to `.env` file:
  ```
  OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
  ```

- [ ] Add `.env` to `.gitignore`:
  ```bash
  echo ".env" >> .gitignore
  ```

- [ ] Verify dependencies installed:
  ```bash
  cd backend
  pip install -r requirements.txt -U
  python -c "import openai; print(f'OpenAI {openai.__version__} installed ✓')"
  ```

### Database
- [ ] Create chat tables:
  ```bash
  cd backend
  python create_chat_tables.py
  ```
  Expected output: "✓ Migration completed successfully"

- [ ] Verify tables created:
  ```bash
  sqlite3 scienceLift.db ".tables" | grep chat
  # Should show: chat_conversations chat_messages
  ```

## Phase 2: Backend Testing (15 minutes)

### Start Backend
- [ ] Start backend server:
  ```bash
  cd backend
  python main.py
  ```
  Watch for: "Application startup" in logs

### API Testing
- [ ] Test health endpoint:
  ```bash
  curl http://localhost:8000/health
  # Should return: {"status": "healthy"}
  ```

- [ ] Get auth token for testing:
  ```bash
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "your_email@example.com",
      "password": "your_password"
    }'
  # Extract: access_token from response
  ```

- [ ] Test chat endpoint:
  ```bash
  curl -X POST http://localhost:8000/api/v1/papers/1/chat \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is this paper about?"}'
  # Should return: {"response": "...", "conversation_id": ...}
  ```

- [ ] Test summary endpoint:
  ```bash
  curl -X POST http://localhost:8000/api/v1/papers/1/summary \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"style": "balanced"}'
  # Should return: {"summary": "...", "style": "balanced"}
  ```

- [ ] Test research questions:
  ```bash
  curl http://localhost:8000/api/v1/papers/1/research-questions \
    -H "Authorization: Bearer YOUR_TOKEN"
  # Should return: {"questions": [...], "paper_id": 1}
  ```

### Automated Tests
- [ ] Run all AI tests:
  ```bash
  cd backend
  pytest test_ai_features.py -v
  ```
  Expected: All tests pass (28 total)

- [ ] Check test results:
  ```
  28 passed in 45s
  ```

## Phase 3: Frontend Testing (10 minutes)

### Build Frontend
- [ ] Install frontend dependencies:
  ```bash
  cd frontend
  npm install
  ```

- [ ] Build frontend:
  ```bash
  npm run build
  ```
  Watch for: "✓ compiled successfully" or similar

- [ ] Start frontend dev server:
  ```bash
  npm run dev
  ```
  Available at: http://localhost:3000

### Manual Testing
- [ ] Load application:
  - [ ] Open http://localhost:3000 in browser
  - [ ] Login or create account
  - [ ] Navigate to a paper detail page

- [ ] Test AI Chat:
  - [ ] Find "✨ AI Research Assistant" section
  - [ ] Click "💬 Ask AI" button
  - [ ] Type: "What is the main methodology?"
  - [ ] Verify response appears within 5 seconds
  - [ ] Type follow-up question
  - [ ] Refresh page and verify conversation persists

- [ ] Test Summaries:
  - [ ] Click "Summary" tab
  - [ ] Select "Technical" style
  - [ ] Click "Generate"
  - [ ] Verify summary generates within 8 seconds
  - [ ] Try other styles

- [ ] Test Analysis:
  - [ ] Click "Analysis" tab
  - [ ] Click "Analyze Trends"
  - [ ] Verify analysis appears within 10 seconds

- [ ] Test Research Questions:
  - [ ] Click "Research Questions" tab
  - [ ] Click "Generate Questions"
  - [ ] Verify 5 questions appear within 6 seconds

## Phase 4: Integration Testing (10 minutes)

### Backend-Frontend Communication
- [ ] Verify API calls work:
  - [ ] Chat: Response appears in UI ✓
  - [ ] Summary: Text renders properly ✓
  - [ ] Analysis: Long text displays well ✓
  - [ ] Questions: List formatted correctly ✓

- [ ] Check error handling:
  - [ ] Network error handling ✓
  - [ ] Invalid input handling ✓
  - [ ] Rate limit response ✓
  - [ ] Auth error handling ✓

- [ ] Monitor backend logs:
  - [ ] No 500 errors ✓
  - [ ] No SQL errors ✓
  - [ ] No import errors ✓
  - [ ] All requests succeed ✓

## Phase 5: Security Review (5 minutes)

### Code Review
- [ ] API key not exposed in frontend:
  ```bash
  grep -r "OPENAI_API_KEY" frontend/
  # Should return: nothing
  ```

- [ ] API key not in logs:
  - [ ] Check console output
  - [ ] Check application logs
  - [ ] No sensitive data leaked ✓

### Authentication
- [ ] All endpoints require auth:
  ```bash
  curl http://localhost:8000/api/v1/papers/1/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}'
  # Should return: 401 Unauthorized
  ```

- [ ] Token validation works:
  - [ ] Invalid token: 401 ✓
  - [ ] Expired token: 401 ✓
  - [ ] Valid token: 200 ✓

## Phase 6: Documentation Review (5 minutes)

### Documentation Files
- [ ] README_AI_IMPLEMENTATION.md - Overview ✓
- [ ] AI_QUICKSTART.md - User guide ✓
- [ ] AI_FEATURES.md - Feature details ✓
- [ ] AI_DEPLOYMENT.md - Deployment guide ✓
- [ ] AI_INTEGRATION.md - Technical summary ✓
- [ ] API_REFERENCE.md - API documentation ✓

### Team Knowledge
- [ ] Team has read AI_QUICKSTART.md
- [ ] Team understands cost implications
- [ ] Team knows how to monitor usage
- [ ] Team can handle basic troubleshooting

## Phase 7: Monitoring Setup (10 minutes)

### Logs
- [ ] Backend logs configured:
  ```bash
  tail -f backend.log
  ```

- [ ] Database logs monitored:
  - [ ] New chat_conversations rows
  - [ ] New chat_messages rows
  - [ ] No warnings or errors

### Metrics to Track
Daily (for first week):
- [ ] Number of conversations created
- [ ] Number of API calls
- [ ] Average response time
- [ ] Error rate
- [ ] Estimated daily cost

Weekly:
- [ ] User engagement rate
- [ ] Most used features
- [ ] Error patterns
- [ ] Weekly cost vs budget

### Budget Monitoring
- [ ] Set OpenAI budget alerts:
  ```
  OpenAI Console → Usage → Billing
  Set hard limit: $100/month (adjust as needed)
  ```

- [ ] Track actual vs estimated:
  - [ ] Estimated: Monitor daily
  - [ ] Adjust after first week
  - [ ] Set realistic limits

## Phase 8: Deployment to Staging (optional)

If deploying to staging first:

- [ ] Update staging .env:
  ```
  OPENAI_API_KEY=staging-key
  ```

- [ ] Run migrations on staging DB:
  ```bash
  python create_chat_tables.py
  ```

- [ ] Deploy backend:
  ```bash
  docker-compose -f docker-compose.yml up -d backend
  ```

- [ ] Deploy frontend:
  ```bash
  docker-compose -f docker-compose.yml up -d frontend
  ```

- [ ] Run smoke tests on staging:
  ```bash
  pytest test_ai_features.py -v --staging
  ```

- [ ] Team testing on staging (1 hour)

- [ ] Fix any issues found

## Phase 9: Production Deployment

### Pre-Production
- [ ] Backup production database:
  ```bash
  sqlite3 scienceLift.db ".backup backup.db"
  mv backup.db backups/scienceLift_$(date +%Y%m%d_%H%M%S).db
  ```

- [ ] Final code review:
  - [ ] No hardcoded secrets
  - [ ] Error handling complete
  - [ ] Performance acceptable
  - [ ] Security verified

### Production Deployment
- [ ] Deploy backend:
  ```bash
  docker-compose -f docker-compose.yml up -d backend
  # Verify with: docker-compose logs -f backend
  ```

- [ ] Verify health:
  ```bash
  curl https://your-domain.com/health
  # Should return: {"status": "healthy"}
  ```

- [ ] Deploy frontend:
  ```bash
  docker-compose -f docker-compose.yml up -d frontend
  # Verify with: docker-compose logs -f frontend
  ```

- [ ] Run smoke tests:
  - [ ] Can login ✓
  - [ ] Can access papers ✓
  - [ ] Can chat with AI ✓
  - [ ] Can generate summaries ✓

- [ ] Monitoring dashboard active:
  - [ ] Logs streaming ✓
  - [ ] Metrics visible ✓
  - [ ] Alerts configured ✓

## Phase 10: Post-Deployment (ongoing)

### First 24 Hours
- [ ] Monitor errors hourly
- [ ] Track API usage
- [ ] Respond quickly to issues
- [ ] Review user feedback

### First Week
- [ ] Daily cost review
- [ ] Error pattern analysis
- [ ] Performance monitoring
- [ ] User engagement metrics

### Ongoing
- [ ] Weekly usage reports
- [ ] Monthly cost review
- [ ] Quarterly optimization
- [ ] Plan improvements

## Rollback Plan

If critical issues occur:

### Step 1: Disable AI Features (Fastest)
```python
# In app/api/routes/__init__.py
# Comment out: from app.api.routes.ai import router as ai_router
# Comment out: "ai_router"
```

### Step 2: Revert Container Images
```bash
docker-compose down
docker pull your-registry/scienceLift:v1.0.0
docker-compose up -d
```

### Step 3: Database Rollback
```bash
# Restore from backup
cp backups/scienceLift_YYYYMMDD_HHMMSS.db scienceLift.db
# Or drop chat tables if empty
sqlite3 scienceLift.db "DROP TABLE IF EXISTS chat_conversations;"
sqlite3 scienceLift.db "DROP TABLE IF EXISTS chat_messages;"
```

## Success Criteria

✅ Deployment successful when:
- [ ] All endpoints returning 200/404/401 as expected
- [ ] Chat responses under 5 seconds
- [ ] Summaries generating within 8 seconds
- [ ] No 500 errors in logs
- [ ] User can complete end-to-end flow
- [ ] Cost under estimated budget
- [ ] No security issues found
- [ ] Team trained and ready

## Support Resources

If issues occur:

1. **Check logs first:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

2. **Review documentation:**
   - AI_DEPLOYMENT.md (setup issues)
   - AI_FEATURES.md (feature problems)
   - API_REFERENCE.md (API issues)

3. **Run tests:**
   ```bash
   pytest test_ai_features.py -v
   ```

4. **Check common issues:**
   - "API key not found" → .env not set
   - Slow responses → OpenAI API overloaded
   - 401 errors → Token expired
   - Chat tables missing → Run migration script

## Sign-Off

- [ ] Deployment lead completed all phases
- [ ] Backend team verified implementation
- [ ] Frontend team verified integration
- [ ] DevOps team verified infrastructure
- [ ] Security team completed review
- [ ] Product team approved features
- [ ] Documentation complete
- [ ] Team trained

**Deployment Date:** _______________
**Deployed By:** _______________
**Verified By:** _______________

## Celebration! 🎉

You've successfully deployed ScienceLift AI features!

Next steps:
1. Monitor metrics daily for first week
2. Gather user feedback
3. Plan Phase 2 improvements
4. Consider semantic search and caching

---

**Questions?** See [AI_DEPLOYMENT.md](AI_DEPLOYMENT.md) for detailed guide
**Need help?** See [AI_FEATURES.md](AI_FEATURES.md) for troubleshooting
