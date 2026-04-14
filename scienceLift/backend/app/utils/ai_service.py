"""
AI and paper aggregation services.
"""

import httpx
import logging
from typing import List, Dict, Optional
from app.core.config import settings
import json

logger = logging.getLogger(__name__)


class PaperAggregationService:
    """Service for aggregating papers from external sources."""
    
    @staticmethod
    async def fetch_from_crossref(query: str, max_results: int = 5) -> List[Dict]:
        """
        Fetch papers from CrossRef API.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to fetch
            
        Returns:
            List of paper dictionaries with metadata
        """
        logger.info(f"Fetching from CrossRef: query='{query}', max_results={max_results}")
        
        try:
            # Log configuration
            crossref_email = settings.CROSSREF_EMAIL
            logger.info(f"CROSSREF_EMAIL configured: {crossref_email}")
            
            # Build API URL
            base_url = "https://api.crossref.org/v1/works"
            params = {
                "query": query,
                "rows": max_results,
                "mailto": crossref_email
            }
            
            # Make API request
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"HTTP Request: GET {base_url}")
                response = await client.get(base_url, params=params)
            
            # Check response status
            logger.info(f"CrossRef response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"CrossRef API error: HTTP {response.status_code}")
                return []
            
            # Parse response
            data = response.json()
            logger.info(f"CrossRef response keys: {list(data.keys())}")
            
            # Extract papers from response
            message = data.get("message", {})
            items = message.get("items", [])
            logger.info(f"CrossRef found {len(items)} items for query '{query}'")
            
            if not items:
                logger.warning(f"No items found in CrossRef response for query '{query}'")
                return []
            
            # Parse each item
            papers = []
            for item in items:
                try:
                    paper = {
                        "title": item.get("title", ["Unknown"])[0] if item.get("title") else "Unknown",
                        "doi": item.get("DOI"),
                        "authors": ", ".join([
                            f"{author.get('given', '')} {author.get('family', '')}".strip()
                            for author in item.get("author", [])
                        ]) or "Unknown",
                        "journal_name": item.get("container-title", [None])[0] if item.get("container-title") else None,
                        "paper_url": item.get("URL") or f"https://doi.org/{item.get('DOI')}" if item.get("DOI") else None,
                        "source": "crossref"
                    }
                    
                    # Only add if we have title and URL
                    if paper.get("title") and paper.get("paper_url"):
                        papers.append(paper)
                        logger.debug(f"Parsed paper: {paper['title'][:60]}")
                except Exception as e:
                    logger.error(f"Error parsing item: {str(e)}")
                    continue
            
            logger.info(f"Successfully parsed {len(papers)} papers from CrossRef")
            return papers
            
        except Exception as e:
            logger.error(f"CrossRef fetch error: {type(e).__name__}: {str(e)}", exc_info=True)
            return []
    
    @staticmethod
    async def fetch_from_nlm(query: str, max_results: int = 5) -> List[Dict]:
        """
        Fetch papers from NLM/PubMed API.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to fetch
            
        Returns:
            List of paper dictionaries with metadata
        """
        logger.info(f"Fetching from NLM/PubMed: query='{query}', max_results={max_results}")
        
        try:
            nlm_api_key = settings.NLM_API_KEY
            if not nlm_api_key:
                logger.warning("NLM_API_KEY not configured, skipping NLM search")
                return []
            
            # Step 1: Search for papers and get UIDs
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            search_params = {
                "db": "pubmed",
                "term": query,
                "retmax": max_results,
                "rettype": "json",
                "api_key": nlm_api_key
            }
            
            logger.info(f"NLM Search Request: GET {search_url}")
            async with httpx.AsyncClient(timeout=30.0) as client:
                search_response = await client.get(search_url, params=search_params)
            
            logger.info(f"NLM search response status: {search_response.status_code}")
            if search_response.status_code != 200:
                logger.error(f"NLM search API error: HTTP {search_response.status_code}")
                return []
            
            search_data = search_response.json()
            uids = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not uids:
                logger.warning(f"No UIDs found in NLM for query '{query}'")
                return []
            
            logger.info(f"NLM found {len(uids)} papers for query '{query}'")
            
            # Step 2: Fetch detailed metadata for those UIDs
            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(uids),
                "rettype": "json",
                "api_key": nlm_api_key
            }
            
            logger.info(f"NLM Fetch Request: GET {fetch_url}")
            async with httpx.AsyncClient(timeout=30.0) as client:
                fetch_response = await client.get(fetch_url, params=fetch_params)
            
            logger.info(f"NLM fetch response status: {fetch_response.status_code}")
            if fetch_response.status_code != 200:
                logger.error(f"NLM fetch API error: HTTP {fetch_response.status_code}")
                return []
            
            fetch_data = fetch_response.json()
            articles = fetch_data.get("result", {}).get("uids", [])
            
            # Parse each article
            papers = []
            for uid in articles:
                try:
                    article = fetch_data.get("result", {}).get(uid, {})
                    
                    # Extract title
                    title = None
                    if "title" in article:
                        title = article["title"]
                    elif "articletitle" in article:
                        title = article["articletitle"]
                    
                    if not title:
                        continue
                    
                    # Extract authors
                    authors = "Unknown"
                    if "authors" in article and article["authors"]:
                        author_list = article["authors"]
                        if isinstance(author_list, list) and len(author_list) > 0:
                            if "name" in author_list[0]:
                                authors = ", ".join([a.get("name", "") for a in author_list[:5]])
                    
                    # Extract journal
                    journal = article.get("source", article.get("journal", "PubMed"))
                    
                    # Build paper URL and identifier
                    doi = article.get("doi", "")
                    pmid = uid
                    
                    paper_url = None
                    if doi:
                        paper_url = f"https://doi.org/{doi}"
                    else:
                        paper_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    
                    paper = {
                        "title": title,
                        "doi": doi,
                        "authors": authors,
                        "journal_name": journal,
                        "paper_url": paper_url,
                        "pmid": pmid,
                        "source": "nlm"
                    }
                    
                    papers.append(paper)
                    logger.debug(f"Parsed NLM paper: {title[:60]}")
                    
                except Exception as e:
                    logger.error(f"Error parsing NLM article {uid}: {str(e)}")
                    continue
            
            logger.info(f"Successfully parsed {len(papers)} papers from NLM")
            return papers
            
        except Exception as e:
            logger.error(f"NLM fetch error: {type(e).__name__}: {str(e)}", exc_info=True)
            return []
    
    @staticmethod
    async def fetch_from_google_scholar(query: str, max_results: int = 5) -> List[Dict]:
        """
        Fetch papers from Google Scholar via SerpAPI.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to fetch
            
        Returns:
            List of paper dictionaries with metadata
        """
        logger.info(f"Fetching from Google Scholar: query='{query}', max_results={max_results}")
        
        try:
            api_key = settings.GOOGLE_SCHOLAR_API_KEY
            if not api_key:
                logger.warning("GOOGLE_SCHOLAR_API_KEY not configured, skipping Google Scholar search")
                return []
            
            # Use SerpAPI to fetch Google Scholar results
            search_url = "https://serpapi.com/search"
            params = {
                "engine": "google_scholar",
                "q": query,
                "num": max_results,
                "api_key": api_key
            }
            
            logger.info(f"Google Scholar Request: GET {search_url}")
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(search_url, params=params)
            
            logger.info(f"Google Scholar response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"Google Scholar API error: HTTP {response.status_code}")
                return []
            
            data = response.json()
            organic_results = data.get("organic_results", [])
            
            logger.info(f"Google Scholar found {len(organic_results)} results for query '{query}'")
            
            if not organic_results:
                logger.warning(f"No results found in Google Scholar for query '{query}'")
                return []
            
            # Parse each result
            papers = []
            for item in organic_results:
                try:
                    title = item.get("title")
                    if not title:
                        continue
                    
                    # Extract authors from snippet if available
                    snippet = item.get("snippet", "")
                    publication = item.get("publication", "")
                    
                    # Try to parse authors from publication info
                    authors = "Unknown"
                    if publication:
                        # Format is usually "Authors - Journal, Year"
                        parts = publication.split(" - ")
                        if len(parts) > 0:
                            authors = parts[0].strip()
                    
                    # Extract journal/publication source
                    journal = item.get("journal", "")
                    if not journal and publication:
                        journal = publication
                    
                    # Get the link
                    link = item.get("link", "")
                    if not link:
                        # Try to construct from other fields
                        link = item.get("redirect_link", "")
                    
                    # Extract year
                    year = item.get("year", "")
                    
                    # Build paper object
                    paper = {
                        "title": title,
                        "authors": authors,
                        "journal_name": journal,
                        "paper_url": link,
                        "year": year,
                        "snippet": snippet,
                        "source": "google_scholar"
                    }
                    
                    # Only add if we have title and URL
                    if paper.get("title") and paper.get("paper_url"):
                        papers.append(paper)
                        logger.debug(f"Parsed Google Scholar paper: {title[:60]}")
                    
                except Exception as e:
                    logger.error(f"Error parsing Google Scholar result: {str(e)}")
                    continue
            
            logger.info(f"Successfully parsed {len(papers)} papers from Google Scholar")
            return papers
            
        except Exception as e:
            logger.error(f"Google Scholar fetch error: {type(e).__name__}: {str(e)}", exc_info=True)
            return []
    
    @staticmethod
    async def fetch_from_doaj(query: str, max_results: int = 5) -> List[Dict]:
        """
        Fetch papers from DOAJ (Directory of Open Access Journals).
        DOAJ has a free public API requiring no authentication.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to fetch
            
        Returns:
            List of paper dictionaries with metadata
        """
        logger.info(f"Fetching from DOAJ: query='{query}', max_results={max_results}")
        
        try:
            # DOAJ API endpoint for articles
            search_url = "https://doaj.org/api/v1/search/articles"
            
            # Build search parameters
            # DOAJ uses a more complex query syntax, but we'll use basic field search
            params = {
                "q": f"(title:\"{query}\" OR keywords:\"{query}\")",
                "page_size": max_results,
                "page": 1
            }
            
            logger.info(f"DOAJ Search Request: GET {search_url}")
            logger.info(f"Query: {params['q']}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(search_url, params=params)
            
            logger.info(f"DOAJ response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"DOAJ API error: HTTP {response.status_code}")
                return []
            
            data = response.json()
            results = data.get("results", [])
            
            logger.info(f"DOAJ found {len(results)} results for query '{query}'")
            
            if not results:
                logger.warning(f"No results found in DOAJ for query '{query}'")
                return []
            
            # Parse each result
            papers = []
            for item in results:
                try:
                    # DOAJ article structure
                    bibjson = item.get("bibjson", {})
                    
                    title = bibjson.get("title", "")
                    if not title:
                        continue
                    
                    # Extract authors
                    authors_list = bibjson.get("author", [])
                    authors = "Unknown"
                    if authors_list and isinstance(authors_list, list) and len(authors_list) > 0:
                        author_names = []
                        for author in authors_list[:5]:  # Limit to first 5
                            if isinstance(author, dict):
                                name = author.get("name", "")
                            else:
                                name = str(author)
                            if name:
                                author_names.append(name)
                        if author_names:
                            authors = ", ".join(author_names)
                    
                    # Extract journal
                    journal = bibjson.get("journal", {})
                    journal_name = journal.get("title", "DOAJ") if isinstance(journal, dict) else str(journal)
                    
                    # Extract DOI and URL
                    doi = ""
                    identifiers = bibjson.get("identifier", [])
                    if identifiers and isinstance(identifiers, list):
                        for identifier in identifiers:
                            if isinstance(identifier, dict):
                                if identifier.get("type") == "doi":
                                    doi = identifier.get("id", "")
                                    break
                    
                    # Get article link
                    link = ""
                    links = bibjson.get("link", [])
                    if links and isinstance(links, list) and len(links) > 0:
                        for link_item in links:
                            if isinstance(link_item, dict):
                                link = link_item.get("url", "")
                                if link:
                                    break
                    
                    # If no link from bibjson, try article fields
                    if not link:
                        link = item.get("id", "")
                    
                    # If still no link, construct one
                    if not link and doi:
                        link = f"https://doi.org/{doi}"
                    
                    # Extract year
                    year = bibjson.get("year", "")
                    
                    paper = {
                        "title": title,
                        "authors": authors,
                        "journal_name": journal_name,
                        "paper_url": link,
                        "doi": doi,
                        "year": year,
                        "source": "doaj"
                    }
                    
                    # Only add if we have title and URL
                    if paper.get("title") and paper.get("paper_url"):
                        papers.append(paper)
                        logger.debug(f"Parsed DOAJ paper: {title[:60]}")
                    
                except Exception as e:
                    logger.error(f"Error parsing DOAJ result: {str(e)}")
                    continue
            
            logger.info(f"Successfully parsed {len(papers)} papers from DOAJ")
            return papers
            
        except Exception as e:
            logger.error(f"DOAJ fetch error: {type(e).__name__}: {str(e)}", exc_info=True)
            return []


class AIService:
    """Service for AI-related operations."""
    
    @staticmethod
    async def summarize_paper(title: str, metadata: str, use_openai: bool = False) -> Optional[str]:
        """
        Generate a comprehensive summary for a paper using keyword analysis.
        
        Args:
            title: Paper title
            metadata: Additional metadata (journal, authors, etc.)
            use_openai: Whether to use OpenAI API
            
        Returns:
            Detailed summary string or None
        """
        try:
            # Use local model for now
            if not use_openai or not settings.OPENAI_API_KEY:
                logger.debug(f"Generating summary for: {title[:50]}")
                
                title_lower = title.lower()
                summary_parts = []
                
                # Main topic identification and detailed description
                has_resistance = any(word in title_lower for word in ['resistance', 'training', 'strength', 'exercise', 'workout'])
                has_protein = any(word in title_lower for word in ['protein', 'nutrition', 'diet', 'amino', 'macros', 'supplement'])
                has_hypertrophy = any(word in title_lower for word in ['hypertrophy', 'muscle growth', 'size', 'mass gain'])
                has_recovery = any(word in title_lower for word in ['recovery', 'sleep', 'fatigue', 'rest', 'regeneration', 'adaptation'])
                has_injury = any(word in title_lower for word in ['injury', 'prevention', 'rehabilitation', 'pain', 'joint'])
                has_performance = any(word in title_lower for word in ['performance', 'power', 'speed', 'endurance', 'capacity'])
                
                # Generate topic-specific detailed summaries
                if has_hypertrophy:
                    summary_parts.append(
                        "This research provides in-depth analysis on muscle hypertrophy mechanisms and how to optimize training for muscle growth. "
                        "It examines variables such as training volume, intensity, frequency, and exercise selection that influence muscle protein synthesis and adaptation. "
                        "The study offers evidence-based recommendations for progressive overload, time under tension, and recovery protocols necessary for maximizing hypertrophic gains."
                    )
                
                if has_resistance and not has_hypertrophy:
                    summary_parts.append(
                        "This study explores resistance training principles and their physiological effects on the neuromuscular system. "
                        "It investigates optimal training variables including load, rep ranges, rest periods, and exercise order for strength development. "
                        "The research provides insights into neural adaptations, motor unit recruitment patterns, and how training methodology impacts strength gains and performance improvements."
                    )
                
                if has_protein:
                    summary_parts.append(
                        "This research examines the critical relationship between protein intake and athletic performance or body composition. "
                        "It analyzes protein timing, distribution across meals, amino acid profiles, and optimal daily intake for muscle maintenance and growth. "
                        "The study includes evidence on how nutritional strategies interact with training to maximize adaptations and recovery."
                    )
                
                if has_recovery:
                    summary_parts.append(
                        "This paper investigates recovery mechanisms that are essential for fitness adaptation and performance improvements. "
                        "It examines sleep quality and duration, active recovery methods, hormonal balance, and stress management's role in training outcomes. "
                        "The research demonstrates how recovery optimization can enhance athletic performance and reduce overtraining syndrome through evidence-based interventions."
                    )
                
                if has_injury:
                    summary_parts.append(
                        "This research focuses on injury prevention strategies and rehabilitation protocols for active individuals and athletes. "
                        "It explores risk factors, screening methods, prehabilitation exercises, and exercise modifications that reduce injury occurrence. "
                        "The study provides practical guidance on safe training progressions and how to maintain performance while managing or preventing common athletic injuries."
                    )
                
                if has_performance and not summary_parts:
                    summary_parts.append(
                        "This study examines factors that enhance athletic performance including training methodologies, physiological adaptations, and optimized programming. "
                        "It identifies key performance indicators and evidence-based strategies for improving strength, power, speed, or endurance. "
                        "The research offers practical insights into periodization, exercise selection, and training variables that drive measurable performance improvements."
                    )
                
                # If no specific patterns found, create detailed generic summary
                if not summary_parts:
                    summary_parts.append(
                        "This research investigates important aspects of fitness science and physical performance. "
                        "It provides evidence-based findings that contribute to our understanding of training, nutrition, and athletic development. "
                        f"The study examines: {title[:80]} and offers practical applications for optimizing fitness outcomes."
                    )
                
                # Add key takeaway section
                summary_parts.append(
                    "Key Benefits: This research offers actionable insights backed by scientific evidence that can inform training decisions, "
                    "nutritional strategies, and recovery protocols. Understanding these findings helps optimize your fitness journey and avoid common pitfalls."
                )
                
                # Add call to action
                summary_parts.append(
                    f"Published in {metadata} | For detailed methodology, statistical analysis, and specific data points, read the full paper to dive deeper into the research."
                )
                
                summary = " ".join(summary_parts)
                return summary
            
            # TODO: Implement OpenAI integration
            return None
            
        except Exception as e:
            logger.error(f"AI summary generation error: {str(e)}", exc_info=True)
            return None
