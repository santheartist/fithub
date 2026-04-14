"""Utility for URL handling"""

def extract_doi_from_url(url: str) -> str:
    """Extract DOI from URL"""
    if "doi.org" in url:
        return url.split("doi.org/")[-1]
    return None


def normalize_url(url: str) -> str:
    """Normalize URL for comparison"""
    return url.lower().strip()
