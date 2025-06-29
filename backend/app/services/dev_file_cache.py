"""
dev_file_cache.py - Simple file-based cache for website scraping (development only)

This utility caches website scrape results as JSON files, keyed by a hash of the URL.
Intended for development use to avoid repeated API calls (e.g., Firecrawl credits).

Usage:
    from backend.app.services.dev_file_cache import load_cached_scrape, save_scrape_to_cache

    data = load_cached_scrape(url)
    if data is not None:
        return data
    # ... do real scrape ...
    save_scrape_to_cache(url, result)
    return result
"""

import os
import hashlib
import json
from typing import Optional, Dict, Any

CACHE_DIR = os.path.join(os.path.dirname(__file__), "../../dev_cache/website_scrapes")


def url_to_filename(url: str) -> str:
    """Hash the URL to a filename for safe, unique cache storage."""
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{h}.json")


def load_cached_scrape(url: str) -> Optional[Dict[str, Any]]:
    """Load cached scrape result for a URL, or return None if not cached."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    fname = url_to_filename(url)
    if os.path.exists(fname):
        with open(fname, "r") as f:
            return json.load(f)
    return None


def save_scrape_to_cache(url: str, data: Dict[str, Any]) -> None:
    """Save scrape result to cache for a URL."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    fname = url_to_filename(url)
    with open(fname, "w") as f:
        json.dump(data, f)
