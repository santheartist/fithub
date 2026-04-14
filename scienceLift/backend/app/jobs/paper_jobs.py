"""
Background job tasks for paper aggregation and maintenance.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.utils.ai_service import PaperAggregationService, AIService
from app.services.paper_service import PaperService
from app.models.models import ResearchPaper, CategoryEnum
import logging
import asyncio
import concurrent.futures

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)


async def aggregate_papers_job():
    """Scheduled job to fetch new papers from external sources and store summaries.
    
    Note: This job runs in a separate thread to avoid blocking API requests.
    SQLite WAL mode ensures the API can still read papers while this job writes.
    """
    db = SessionLocal()
    try:
        logger.info("=" * 80)
        logger.info("Starting paper aggregation job...")
        logger.info("Note: API requests can still be served while this job runs (SQLite WAL mode)")
        logger.info("=" * 80)
        
        queries = {
            CategoryEnum.HYPERTROPHY: [
                "muscle hypertrophy resistance training",
                "protein synthesis gains",
                "progressive overload training"
            ],
            CategoryEnum.STRENGTH: [
                "strength training maximal strength",
                "powerlifting technique",
                "neural adaptation strength"
            ],
            CategoryEnum.NUTRITION: [
                "protein nutrition muscle growth",
                "nutrient timing recovery",
                "supplementation efficacy"
            ],
            CategoryEnum.RECOVERY: [
                "sleep recovery athletic performance",
                "active recovery methods",
                "overtraining syndrome"
            ],
            CategoryEnum.INJURY_PREVENTION: [
                "injury prevention training",
                "sports injury rehabilitation",
                "preventive exercise protocols"
            ]
        }
        
        papers_added = 0
        papers_skipped = 0
        duplicates_count = 0
        missing_data_count = 0
        
        # Add some test papers directly to verify the database works
        logger.info("\n🧪 Adding test papers to verify database connectivity...")
        test_papers = [
            {
                "title": "Effects of Resistance Training on Muscle Hypertrophy: A Review",
                "authors": "Smith, J., Johnson, K., Williams, P.",
                "category": CategoryEnum.HYPERTROPHY,
                "doi": "10.1234/test.001",
                "journal_name": "Journal of Strength and Conditioning",
                "paper_url": "https://example.com/papers/001"
            },
            {
                "title": "Protein Synthesis and Muscle Growth Response",
                "authors": "Brown, A., Davis, M.",
                "category": CategoryEnum.NUTRITION,
                "doi": "10.1234/test.002",
                "journal_name": "Nutrition Reviews",
                "paper_url": "https://example.com/papers/002"
            },
            {
                "title": "Sleep and Recovery in Athletic Performance",
                "authors": "Wilson, T., Taylor, R.",
                "category": CategoryEnum.RECOVERY,
                "doi": "10.1234/test.003",
                "journal_name": "Sports Medicine",
                "paper_url": "https://example.com/papers/003"
            }
        ]
        
        for paper_data in test_papers:
            try:
                logger.info(f"  Adding test paper: {paper_data['title'][:60]}")
                paper_obj = ResearchPaper(
                    title=paper_data["title"],
                    authors=paper_data["authors"],
                    category=paper_data["category"],
                    doi=paper_data["doi"],
                    journal_name=paper_data["journal_name"],
                    paper_url=paper_data["paper_url"]
                )
                db.add(paper_obj)
                db.commit()
                db.refresh(paper_obj)
                logger.info(f"    ✓ Test paper saved (ID: {paper_obj.id})")
                papers_added += 1
            except Exception as e:
                logger.error(f"  Error adding test paper: {str(e)}", exc_info=True)
                db.rollback()
        
        logger.info(f"✓ Added {papers_added} test papers\n")
        
        for category, search_terms in queries.items():
            logger.info(f"\nProcessing category: {category.value}")
            
            for query in search_terms:
                logger.info(f"  Searching: '{query}'")
                
                try:
                    # Fetch from multiple sources
                    all_papers = []
                    
                    # 1. Fetch from CrossRef
                    logger.info(f"    [CrossRef] Fetching papers...")
                    crossref_papers = await PaperAggregationService.fetch_from_crossref(query, max_results=5)
                    logger.info(f"    [CrossRef] Found {len(crossref_papers)} papers")
                    if crossref_papers:
                        logger.debug(f"      Sample: {crossref_papers[0].get('title', 'NO TITLE')[:60]}")
                    all_papers.extend(crossref_papers)
                    
                    # 2. Fetch from NLM/PubMed
                    logger.info(f"    [NLM/PubMed] Fetching papers...")
                    nlm_papers = await PaperAggregationService.fetch_from_nlm(query, max_results=5)
                    logger.info(f"    [NLM/PubMed] Found {len(nlm_papers)} papers")
                    if nlm_papers:
                        logger.debug(f"      Sample: {nlm_papers[0].get('title', 'NO TITLE')[:60]}")
                    all_papers.extend(nlm_papers)
                    
                    # 3. Fetch from Google Scholar
                    logger.info(f"    [Google Scholar] Fetching papers...")
                    scholar_papers = await PaperAggregationService.fetch_from_google_scholar(query, max_results=5)
                    logger.info(f"    [Google Scholar] Found {len(scholar_papers)} papers")
                    if scholar_papers:
                        logger.debug(f"      Sample: {scholar_papers[0].get('title', 'NO TITLE')[:60]}")
                    all_papers.extend(scholar_papers)
                    
                    # 4. Fetch from DOAJ
                    logger.info(f"    [DOAJ] Fetching papers...")
                    doaj_papers = await PaperAggregationService.fetch_from_doaj(query, max_results=5)
                    logger.info(f"    [DOAJ] Found {len(doaj_papers)} papers")
                    if doaj_papers:
                        logger.debug(f"      Sample: {doaj_papers[0].get('title', 'NO TITLE')[:60]}")
                    all_papers.extend(doaj_papers)
                    
                    logger.info(f"  Total {len(all_papers)} papers from all sources for query: '{query}'")
                    
                    for paper_data in all_papers:
                        # Check if paper already exists by DOI or URL
                        # Only check DOI if it exists to avoid "IS NULL" matching all papers without DOI
                        doi = paper_data.get("doi")
                        url = paper_data.get("paper_url")
                        
                        # Build query to check for duplicates
                        # Use proper NULL handling for SQL
                        from sqlalchemy import or_, and_
                        query_conditions = []
                        
                        if doi:
                            query_conditions.append(ResearchPaper.doi == doi)
                        
                        if url:
                            query_conditions.append(ResearchPaper.paper_url == url)
                        
                        # Only query if we have at least one condition
                        existing = None
                        if query_conditions:
                            existing = db.query(ResearchPaper).filter(or_(*query_conditions)).first()
                        
                        if existing:
                            logger.debug(f"    SKIP (duplicate): {paper_data.get('title')[:60]}")
                            papers_skipped += 1
                            duplicates_count += 1
                            continue
                        
                        if not paper_data.get("title") or not paper_data.get("paper_url"):
                            logger.warning(f"    SKIP (missing data): title={bool(paper_data.get('title'))}, url={bool(paper_data.get('paper_url'))} | {paper_data.get('title', 'NO TITLE')[:60]}")
                            papers_skipped += 1
                            missing_data_count += 1
                            continue
                        
                        try:
                            source = paper_data.get("source", "unknown")
                            logger.info(f"    [{source.upper()}] Adding: {paper_data['title'][:70]}")
                            
                            # Create paper with link
                            paper_obj = ResearchPaper(
                                title=paper_data["title"],
                                authors=paper_data.get("authors", "Unknown"),
                                category=category,
                                doi=paper_data.get("doi"),
                                journal_name=paper_data.get("journal_name"),
                                paper_url=paper_data.get("paper_url")  # External link
                            )
                            db.add(paper_obj)
                            db.commit()
                            db.refresh(paper_obj)
                            logger.info(f"      ✓ Paper saved (ID: {paper_obj.id})")
                            
                            # Generate AI summary based on title and metadata
                            logger.debug(f"      Generating AI summary...")
                            summary = await AIService.summarize_paper(
                                paper_obj.title,
                                f"Journal: {paper_data.get('journal_name', 'N/A')}",
                                use_openai= False # Use OpenAI for better summaries
                            )
                            
                            if summary:
                                PaperService.update_ai_summary(db, paper_obj.id, summary)
                                logger.info(f"      ✓ Summary generated")
                            else:
                                logger.warning(f"      ! No summary generated")
                            
                            papers_added += 1
                        except Exception as e:
                            logger.error(f"    Error adding paper: {str(e)}", exc_info=True)
                            db.rollback()
                except Exception as e:
                    logger.error(f"  Error fetching papers for query '{query}': {str(e)}", exc_info=True)
        
        logger.info("\n" + "=" * 80)
        logger.info(f"Paper aggregation job completed!")
        logger.info(f"  ✓ Papers added: {papers_added}")
        logger.info(f"  ⊘ Papers skipped: {papers_skipped}")
        logger.info(f"    └─ Duplicates: {duplicates_count}")
        logger.info(f"    └─ Missing data: {missing_data_count}")
        logger.info(f"  Total processed: {papers_added + papers_skipped}")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Paper aggregation job error: {str(e)}", exc_info=True)
    finally:
        db.close()


def run_aggregate_papers_job():
    """
    Wrapper to run async aggregation job from BackgroundScheduler.
    Runs in a separate thread to avoid event loop conflicts.
    """
    try:
        logger.info("📥 Starting paper aggregation in separate thread...")
        # Run async code in a separate thread to avoid event loop conflicts with FastAPI
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            executor.submit(asyncio.run, aggregate_papers_job()).result()
        logger.info("✓ Paper aggregation completed successfully")
    except Exception as e:
        logger.error(f"Error running paper aggregation job: {str(e)}", exc_info=True)


def start_scheduler():
    """Start the background job scheduler."""
    if scheduler.running:
        logger.warning("Scheduler is already running")
        return
    
    try:
        # Run paper aggregation every 24 hours to keep papers fresh
        scheduler.add_job(
            run_aggregate_papers_job,
            'interval',
            hours=24,
            id='aggregate_papers',
            name='Aggregate papers from external sources',
            max_instances=1,  # Prevent overlapping jobs
            misfire_grace_time=600  # 10 minute grace period
        )
        
        scheduler.start()
        logger.info("✓ Background job scheduler started successfully")
        logger.info("✓ Paper aggregation job scheduled to run every 24 hours")
        logger.info("✓ SQLite WAL mode enabled for better concurrent access")
        
        # Check if database has papers already - only run initial aggregation if empty
        db = SessionLocal()
        try:
            paper_count = db.query(ResearchPaper).count()
            if paper_count == 0:
                logger.info("Database is empty. Running initial paper aggregation job...")
                run_aggregate_papers_job()
            else:
                logger.info(f"✓ Database already has {paper_count} papers. Skipping initial aggregation.")
                logger.info("  Papers will be updated on the next scheduled run (in 24 hours)")
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}", exc_info=True)


def stop_scheduler():
    """Stop the background job scheduler."""
    if scheduler.running:
        try:
            scheduler.shutdown(wait=True)
            logger.info("✓ Background job scheduler stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {str(e)}", exc_info=True)
