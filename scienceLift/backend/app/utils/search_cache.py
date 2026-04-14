"""
Search result caching utility for frequently searched papers.

This module provides simple in-memory caching with TTL to speed up repeated searches.
Ideal for frequently searched terms like popular keywords.
"""

from functools import wraps
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class SearchCache:
    """Simple in-memory cache for search results with TTL expiration."""
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache.
        
        Args:
            ttl_seconds: Time to live for cached entries (default: 1 hour)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds
    
    @staticmethod
    def _make_cache_key(query: str, category: Optional[str], sort_by: str, skip: int, limit: int) -> str:
        """Generate a unique cache key for search parameters."""
        key_data = f"{query}:{category}:{sort_by}:{skip}:{limit}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, query: str, category: Optional[str], sort_by: str, skip: int, limit: int) -> Optional[Dict]:
        """
        Retrieve cached search results if available and not expired.
        
        Args:
            query: Search query string
            category: Optional category filter
            sort_by: Sort option (relevance, date, popularity)
            skip: Pagination offset
            limit: Results per page
            
        Returns:
            Cached results dict or None if not found/expired
        """
        key = self._make_cache_key(query, category, sort_by, skip, limit)
        
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if entry has expired
        if datetime.now() > entry['expires_at']:
            del self.cache[key]
            return None
        
        logger.debug(f"Cache HIT for key: {key}")
        return entry['data']
    
    def set(self, query: str, category: Optional[str], sort_by: str, skip: int, limit: int, data: Dict) -> None:
        """
        Store search results in cache.
        
        Args:
            query: Search query string
            category: Optional category filter
            sort_by: Sort option
            skip: Pagination offset
            limit: Results per page
            data: Results to cache
        """
        key = self._make_cache_key(query, category, sort_by, skip, limit)
        
        self.cache[key] = {
            'data': data,
            'expires_at': datetime.now() + timedelta(seconds=self.ttl_seconds),
            'created_at': datetime.now(),
            'size': len(json.dumps(data))
        }
        
        logger.debug(f"Cache SET for key: {key} (TTL: {self.ttl_seconds}s)")
    
    def clear(self) -> None:
        """Clear all cached entries."""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def cleanup_expired(self) -> int:
        """
        Remove expired entries from cache.
        
        Returns:
            Number of entries removed
        """
        expired_keys = [
            key for key, entry in self.cache.items()
            if datetime.now() > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dict with cache stats (size, entries, etc)
        """
        total_size = sum(entry['size'] for entry in self.cache.values())
        return {
            'entries': len(self.cache),
            'total_size_bytes': total_size,
            'ttl_seconds': self.ttl_seconds,
            'oldest_entry_age_seconds': min(
                (datetime.now() - entry['created_at']).total_seconds()
                for entry in self.cache.values()
            ) if self.cache else 0
        }


# Global cache instance
_search_cache = SearchCache(ttl_seconds=3600)  # 1 hour cache


def get_search_cache() -> SearchCache:
    """Get the global search cache instance."""
    return _search_cache


def cache_search_results(func: Callable) -> Callable:
    """
    Decorator to cache search results.
    
    Usage:
        @cache_search_results
        def search_papers(...):
            ...
    """
    @wraps(func)
    def wrapper(q: str, *args, skip: int = 0, limit: int = 10, category: Optional[str] = None, sort_by: str = "relevance", **kwargs):
        # Skip cache for non-paginated searches (skip != 0 is less commonly cached)
        cache = get_search_cache()
        
        # Try to get from cache
        cached_result = cache.get(q, category, sort_by, skip, limit)
        if cached_result is not None:
            return cached_result
        
        # Execute function
        result = func(q, *args, skip=skip, limit=limit, category=category, sort_by=sort_by, **kwargs)
        
        # Cache the result
        cache.set(q, category, sort_by, skip, limit, result)
        
        return result
    
    return wrapper
