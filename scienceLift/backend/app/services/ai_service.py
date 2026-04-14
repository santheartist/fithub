import httpx
import logging
from typing import List, Dict, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    openai_available = True
except ImportError:
    openai_available = False


class AIService:
    """Service for aggregating papers from multiple sources and generating AI insights"""
    
    def __init__(self):
        self.openai_client = None
        if openai_available:
            if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10:
                try:
                    self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    logger.info("✓ OpenAI client initialized successfully")
                except Exception as e:
                    logger.error(f"✗ Failed to initialize OpenAI client: {str(e)}")
            else:
                logger.warning("⚠ OPENAI_API_KEY not configured or invalid - AI features will be limited")
        else:
            logger.warning("⚠ OpenAI library not available - AI features will be limited")
    
    async def search_crossref(self, query: str, limit: int = 10) -> List[Dict]:
        """Search CrossRef API for papers"""
        url = f"https://api.crossref.org/works?query={query}&rows={limit}"
        
        try:
            async with httpx.AsyncClient() as client:
                headers = {"User-Agent": f"ScienceLift ({settings.CROSSREF_EMAIL})"}
                response = await client.get(url, headers=headers, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    papers = []
                    
                    for item in data.get("message", {}).get("items", []):
                        paper = {
                            "title": item.get("title", [""])[0] if item.get("title") else "",
                            "abstract": item.get("abstract", ""),
                            "authors": [{"name": f"{a.get('given', '')} {a.get('family', '')}"} 
                                       for a in item.get("author", [])],
                            "doi": item.get("DOI", ""),
                            "paper_url": item.get("URL", ""),
                            "source": "CrossRef",
                            "published_date": item.get("issued", {}).get("date-parts", [[]])[0],
                            "journal": item.get("container-title", [""])[0] if item.get("container-title") else "",
                        }
                        papers.append(paper)
                    
                    return papers
        except Exception as e:
            print(f"CrossRef search error: {e}")
        
        return []
    
    async def search_nlm(self, query: str, limit: int = 10) -> List[Dict]:
        """Search NLM/PubMed API for papers"""
        url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "db": "pubmed",
                    "term": query,
                    "retmax": limit,
                    "rettype": "json",
                    "api_key": settings.NLM_API_KEY
                }
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    # Return PubMed IDs for further processing
                    pmids = data.get("esearchresult", {}).get("idlist", [])
                    return [{"pmid": pmid, "source": "NLM"} for pmid in pmids]
        except Exception as e:
            print(f"NLM search error: {e}")
        
        return []
    
    async def chat(self, paper_title: str, paper_abstract: str, messages: List[Dict]) -> str:
        """Multi-turn chat about a paper using OpenAI"""
        if not self.openai_client:
            logger.error("OpenAI client not available for chat")
            return "AI service not configured. Please set a valid OPENAI_API_KEY in environment."
        
        try:
            # Build conversation with paper context
            system_prompt = f"""You are a research paper expert assistant. 
            You are helping users understand this paper:
            Title: {paper_title}
            Abstract: {paper_abstract}
            
            Provide clear, accurate, and helpful explanations about this paper."""
            
            formatted_messages = [{"role": "system", "content": system_prompt}]
            formatted_messages.extend(messages)
            
            logger.debug(f"Calling OpenAI chat API with {len(formatted_messages)} messages")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=500
            )
            
            result = response.choices[0].message.content
            logger.info(f"✓ Chat response generated successfully ({len(result)} chars)")
            return result
        except Exception as e:
            logger.error(f"✗ Chat error: {type(e).__name__}: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    async def generate_summary(self, title: str, abstract: str, style: str = "balanced") -> Dict[str, str]:
        """Generate AI summary of paper in different styles"""
        if not self.openai_client:
            logger.warning("OpenAI client not available for summary generation")
            return {"summary": "Summary generation not available - AI service not configured", "style": style}
        
        if not abstract:
            logger.warning("No abstract provided for summary generation")
            return {"summary": "No abstract available to summarize", "style": style}
        
        try:
            style_prompts = {
                "technical": "Write a highly technical summary suitable for experts in the field.",
                "simple": "Write a simple, easy-to-understand summary for general audience.",
                "balanced": "Write a balanced summary that is both accurate and accessible."
            }
            
            prompt = f"""Paper Title: {title}

Abstract: {abstract}

{style_prompts.get(style, style_prompts['balanced'])}

Provide a concise summary in 2-3 sentences."""
            
            logger.debug(f"Generating {style} summary for: {title[:50]}")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300
            )
            
            result = response.choices[0].message.content
            logger.info(f"✓ Summary generated successfully ({len(result)} chars)")
            return {
                "summary": result,
                "style": style
            }
        except Exception as e:
            logger.error(f"✗ Summary generation error: {type(e).__name__}: {str(e)}")
            return {"summary": f"Error generating summary: {str(e)}", "style": style}
    
    async def extract_key_points(self, title: str, abstract: str) -> List[str]:
        """Extract key points from paper"""
        if not self.openai_client or not abstract:
            logger.warning("OpenAI client not available for key points extraction")
            return []
        
        try:
            prompt = f"""Paper Title: {title}

Abstract: {abstract}

Extract 3-5 key points from this paper. Return as a numbered list."""
            
            logger.debug(f"Extracting key points from: {title[:50]}")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=300
            )
            
            # Parse numbered list response
            content = response.choices[0].message.content
            lines = content.split("\n")
            points = [line.strip().lstrip("0123456789.-) ") for line in lines if line.strip()]
            logger.info(f"✓ Extracted {len(points)} key points")
            return points[:5]
        except Exception as e:
            logger.error(f"✗ Key points extraction error: {type(e).__name__}: {str(e)}")
            return []
    
    async def analyze_trends(self, papers: List[Dict]) -> Dict:
        """Analyze trends across multiple papers"""
        if not self.openai_client or not papers:
            logger.warning("OpenAI client not available or no papers for trend analysis")
            return {"trends": [], "common_themes": [], "insights": ""}
        
        try:
            papers_text = "\n".join([f"- {p.get('title', '')}: {p.get('abstract', '')[:200]}" for p in papers])
            
            prompt = f"""Analyze these research papers and identify:
1. Major research trends
2. Common themes
3. Key insights

Papers:
{papers_text}

Provide structured analysis."""
            
            logger.debug(f"Analyzing trends across {len(papers)} papers")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            
            logger.info(f"✓ Trend analysis completed for {len(papers)} papers")
            return {
                "trends": [],
                "common_themes": [],
                "insights": response.choices[0].message.content
            }
        except Exception as e:
            logger.error(f"✗ Trend analysis error: {type(e).__name__}: {str(e)}")
            return {"trends": [], "common_themes": [], "insights": f"Error: {str(e)}"}
    
    async def compare_papers(self, papers: List[Dict]) -> Dict:
        """Compare multiple papers"""
        if not self.openai_client or not papers or len(papers) < 2:
            logger.warning("OpenAI client not available or insufficient papers for comparison")
            return {"similarities": [], "differences": [], "insights": "", "recommendation": ""}
        
        try:
            papers_text = "\n".join([f"Paper {i+1}: {p.get('title', '')} - {p.get('abstract', '')[:150]}" 
                                    for i, p in enumerate(papers)])
            
            prompt = f"""Compare these research papers:

{papers_text}

Identify:
1. Key similarities
2. Important differences
3. Overall insights
4. Which paper is most relevant and why"""
            
            logger.debug(f"Comparing {len(papers)} papers")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=600
            )
            
            logger.info(f"✓ Paper comparison completed for {len(papers)} papers")
            return {
                "similarities": [],
                "differences": [],
                "insights": response.choices[0].message.content,
                "recommendation": ""
            }
        except Exception as e:
            logger.error(f"✗ Comparison error: {type(e).__name__}: {str(e)}")
            return {"similarities": [], "differences": [], "insights": f"Error: {str(e)}", "recommendation": ""}
    
    async def _generate_research_questions_impl(self, title: str, abstract: str) -> List[str]:
        """Generate follow-up research questions (implementation)"""
        if not self.openai_client or not abstract:
            logger.warning("OpenAI client not available or no abstract for research questions")
            return []
        
        try:
            prompt = f"""Based on this research paper, generate 3-5 interesting follow-up research questions:

Title: {title}
Abstract: {abstract}

Format as a numbered list."""
            
            logger.debug(f"Generating research questions for: {title[:50]}")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            lines = content.split("\n")
            questions = [line.strip().lstrip("0123456789.-) ") for line in lines if line.strip()]
            logger.info(f"✓ Generated {len(questions)} research questions")
            return questions[:5]
        except Exception as e:
            logger.error(f"✗ Research questions error: {type(e).__name__}: {str(e)}")
            return []
    
    # ===== Static methods for routes =====
    @staticmethod
    async def chat_about_paper(paper_title: str, paper_abstract: str, paper_content: str, 
                               user_question: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """Static method for chat_about_paper route"""
        messages = conversation_history or []
        messages.append({"role": "user", "content": user_question})
        return await ai_service.chat(paper_title, paper_abstract, messages)
    
    @staticmethod
    async def generate_paper_summary(title: str, authors: str, abstract: str, summary_style: str = "balanced") -> str:
        """Static method for generate_paper_summary route"""
        result = await ai_service.generate_summary(title, abstract, summary_style)
        return result.get("summary", "Unable to generate summary")
    
    @staticmethod
    async def analyze_paper_trends(papers: List[Dict]) -> Dict:
        """Static method for analyze_paper_trends route"""
        return await ai_service.analyze_trends(papers)
    
    @staticmethod
    async def compare_papers(papers: List[Dict]) -> Dict:
        """Static method for compare_papers route (renamed to avoid conflict)"""
        return await ai_service.compare_papers(papers)
    
    @staticmethod
    async def generate_research_questions(title: str, abstract: str) -> List[str]:
        """Static method for generate_research_questions route"""
        return await ai_service._generate_research_questions_impl(title, abstract)


ai_service = AIService()
