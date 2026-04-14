"""
Utility functions for URL handling and manipulation.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def build_paper_url(doi: Optional[str] = None, url: Optional[str] = None) -> Optional[str]:
    """
    Build a paper URL from DOI or direct URL.
    
    Args:
        doi: DOI identifier
        url: Direct URL to paper
        
    Returns:
        Paper URL or None
    """
    if url:
        return url
    if doi:
        return f"https://doi.org/{doi}"
    return None


def extract_doi_from_url(url: str) -> Optional[str]:
    """Extract DOI from a URL."""
    if "doi.org/" in url:
        return url.split("doi.org/")[-1]
    return None


def is_valid_url(url: str) -> bool:
    """Check if a URL is valid."""
    try:
        from urllib.parse import urlparse
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception as e:
        logger.error(f"URL validation error: {str(e)}")
        return False
