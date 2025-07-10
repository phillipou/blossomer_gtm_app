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
import urllib.parse
from typing import Optional, Dict, Any

CACHE_DIR = os.path.join(os.path.dirname(__file__), "../../dev_cache/website_scrapes")


def canonicalize_url_for_cache(url: str) -> str:
    """
    Canonicalize URL for consistent cache keys across URL variations.
    Handles common variations that refer to the same resource.
    """
    # Basic cleanup
    url = url.strip().lower()
    
    # Parse the URL
    parsed = urllib.parse.urlparse(url)
    
    # Add scheme if missing (prefer https for consistency)
    if not parsed.scheme:
        url = "https://" + url
        parsed = urllib.parse.urlparse(url)
    
    # Normalize netloc (remove default ports)
    netloc = parsed.netloc
    if netloc.endswith(":443") and parsed.scheme == "https":
        netloc = netloc[:-4]
    elif netloc.endswith(":80") and parsed.scheme == "http":
        netloc = netloc[:-3]
    
    # Normalize path (remove trailing slash unless it's root)
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    
    # Build canonical URL (ignore query/fragment for caching website content)
    canonical = f"https://{netloc}{path}"
    return canonical


def url_to_filename(url: str) -> str:
    """Hash the canonicalized URL to a filename for safe, unique cache storage."""
    canonical_url = canonicalize_url_for_cache(url)
    h = hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{h}.json")


def load_cached_scrape(url: str) -> Optional[Dict[str, Any]]:
    """Load cached scrape result for a URL, or return None if not cached."""
    import time

    t0 = time.monotonic()

    os.makedirs(CACHE_DIR, exist_ok=True)
    fname = url_to_filename(url)

    if os.path.exists(fname):
        with open(fname, "r") as f:
            result = json.load(f)
        t1 = time.monotonic()
        print(f"[TIMING] Cache file read took {t1 - t0:.3f}s")
        return result

    t1 = time.monotonic()
    print(f"[TIMING] Cache file check took {t1 - t0:.3f}s")
    return None


def save_scrape_to_cache(url: str, data: Dict[str, Any]) -> None:
    """Save scrape result to cache for a URL."""
    import time

    t0 = time.monotonic()

    os.makedirs(CACHE_DIR, exist_ok=True)
    fname = url_to_filename(url)
    
    # Store the canonical URL in the data for consistency
    canonical_url = canonicalize_url_for_cache(url)
    cache_data = data.copy()
    cache_data["url"] = canonical_url
    
    with open(fname, "w") as f:
        json.dump(cache_data, f)

    t1 = time.monotonic()
    print(f"[TIMING] Cache file save took {t1 - t0:.3f}s")
