# Automatic Fitness Paper Import Setup Guide

## How It Works

Your FitHub platform now includes an automated system that continuously imports fitness research papers from external sources without requiring manual admin intervention.

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FastAPI Backend (main.py)                              │
│  ├─ Starts background scheduler on app startup          │
│  └─ Paper Aggregation Job runs every 24 hours           │
│      ├─ Searches 5 categories across multiple sources   │
│      ├─ Fetches from CrossRef API (main source)         │
│      ├─ Checks for duplicates using DOI                 │
│      ├─ Creates ResearchPaper objects in database       │
│      ├─ Generates AI summaries (using local model)      │
│      └─ Updates papers on the frontend automatically    │
└─────────────────────────────────────────────────────────┘
```

## What's Configured

### Categories Searched (5 Fitness Categories)

1. **Hypertrophy** - Muscle growth & resistance training
   - "muscle hypertrophy resistance training"
   - "protein synthesis gains"
   - "progressive overload training"

2. **Strength** - Maximal strength & powerlifting
   - "strength training maximal strength"
   - "powerlifting technique"
   - "neural adaptation strength"

3. **Nutrition** - Diet & supplementation
   - "protein nutrition muscle growth"
   - "nutrient timing recovery"
   - "supplementation efficacy"

4. **Recovery** - Sleep, active recovery, overtraining
   - "sleep recovery athletic performance"
   - "active recovery methods"
   - "overtraining syndrome"

5. **Injury Prevention** - Joint health, mobility, rehab
   - (Can be configured with appropriate search terms)

### Data Sources

- **CrossRef API** - Access to millions of peer-reviewed papers
  - Provides DOI, title, authors, journal, publication date
  - Free to use with email parameter
  - Most comprehensive source for fitness research

- **PubMed API** - Medical literature (infrastructure ready)
  - Can be extended to search PubMed for fitness studies

### Schedule

- **Frequency**: Every 24 hours (configurable)
- **Timing**: Runs automatically in background
- **No Manual Intervention**: System handles duplicates, errors, and database updates

## Current Features

✅ **Automatic Scheduling** - APScheduler manages background jobs
✅ **Duplicate Detection** - Uses DOI to prevent duplicate papers
✅ **AI Summaries** - Local transformers model (HuggingFace)
✅ **Category Assignment** - Papers automatically categorized
✅ **Error Handling** - Graceful error management with logging
✅ **Database Storage** - Papers persisted to SQLite/PostgreSQL
✅ **Real-time Display** - Papers appear on frontend immediately

## Configuration

### Default Token Lifespan (Already Updated)

```python
# config.py
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30     # 30 days
```

### CrossRef Email (Required)

Set in `backend/app/core/config.py`:
```python
CROSSREF_EMAIL: str = "noemail@example.com"  # Update to your email
```

The CrossRef API requires an email parameter for identification.

### Paper Aggregation Schedule (Customizable)

Edit `backend/app/jobs/paper_jobs.py`:
```python
# Line 104: Change 'hours=24' to different interval
scheduler.add_job(
    aggregate_papers_job,
    'interval',
    hours=24,  # Change this value
    id='aggregate_papers',
    name='Aggregate papers from external sources'
)
```

Options:
- `minutes=30` - Every 30 minutes
- `hours=6` - Every 6 hours
- `hours=24` - Every 24 hours (default)
- `days=1` - Once per day

## How to Use

1. **Start Backend**:
   ```bash
   cd backend
   python main.py
   ```
   Watch logs for: `"Paper aggregation scheduler started"`

2. **Trigger Manual Run** (Optional):
   ```bash
   # Add endpoint to trigger import manually
   # Or use: from app.jobs.paper_jobs import aggregate_papers_job; await aggregate_papers_job()
   ```

3. **Monitor Progress**:
   - Check Docker logs / terminal output
   - Look for: `Added paper: [title]` messages
   - Papers appear in Database and Frontend within seconds

4. **View Results**:
   - Home page shows new papers in feed
   - Papers can be filtered by category
   - AI summaries appear after generation

## Adding More Search Categories

To add more specific fitness research categories:

```python
# In backend/app/jobs/paper_jobs.py, expand the queries dict:

queries = {
    CategoryEnum.HYPERTROPHY: [
        "muscle hypertrophy resistance training",
        # Add more queries...
    ],
    # New category
    CategoryEnum.YOUR_CATEGORY: [
        "your search query 1",
        "your search query 2",
        "your search query 3",
    ]
}
```

## Adding PubMed Integration

Extend the job to also search PubMed:

```python
# In aggregate_papers_job():
papers = await PaperAggregationService.fetch_from_crossref(query)
papers += await PaperAggregationService.fetch_from_pubmed(query)  # Add this
```

## OpenAI Integration (Optional)

For better AI summaries, configure OpenAI API:

```python
# .env file or system environment
OPENAI_API_KEY=sk-your-key-here

# In paper_jobs.py, change:
summary = await AIService.summarize_paper(
    paper_obj.title,
    paper_obj.abstract,
    use_openai=True  # Switch to True
)
```

## Troubleshooting

### Papers not importing?

1. Check backend logs for scheduler status
2. Verify `CROSSREF_EMAIL` is set
3. Check internet connection for API calls
4. Verify database is writable

### Duplicates appearing?

- System should prevent via DOI checking
- Check database for papers with same DOI
- Clear and re-import if needed

### Slow import speed?

- Normal with large result sets
- Fetch from CrossRef: ~2-5 seconds per query
- AI summary generation: ~1-2 seconds per paper
- Total: ~1-2 hours for full cycle across categories

### Want to change schedule?

Edit hours parameter in paper_jobs.py line 104:
- Increase hours for less frequent imports
- Decrease hours for more frequent imports
- Minimum recommended: 1-2 hours to avoid rate limits

## Next Steps

1. ✅ Scheduler is now active - papers import automatically
2. 📧 Update CROSSREF_EMAIL in config.py for your domain
3. 🔍 Start backend and monitor logs for first import
4. 📊 Watch papers populate in frontend
5. 🎯 Adjust search queries based on results
6. 🤖 Consider enabling OpenAI for better summaries

## Architecture Notes

- **Async Processing** - Uses asyncio for non-blocking API calls
- **Database Sessions** - Creates temporary DB connection for each job run
- **Error Recovery** - Continues on individual paper errors
- **Logging** - All activities logged for monitoring
- **Rate Limiting** - Respects API rate limits (CrossRef: 50 req/sec)

Your fitness paper platform is now self-sustaining! 🏋️
