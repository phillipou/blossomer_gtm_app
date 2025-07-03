import os
import urllib.parse
import socket
import requests
import logging
from urllib import robotparser
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from backend.app.services.dev_file_cache import (
    load_cached_scrape,
    save_scrape_to_cache,
)
import time

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from firecrawl import FirecrawlApp, ScrapeOptions
except ImportError:
    FirecrawlApp = None  # type: ignore
    ScrapeOptions = None  # type: ignore

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")


def validate_url(url: str, user_agent: str = "BlossomerBot") -> dict:
    """
    Validate a website URL for syntax, reachability, and robots.txt compliance.
    Returns a dict with validation results.
    """
    result: dict[str, Any] = {
        "is_valid": False,
        "reason": None,
        "reachable": False,
        "robots_allowed": None,
        "http_status": None,
        "final_url": None,
    }

    # 1. Normalize and parse URL
    parsed = urllib.parse.urlparse(url)
    if not parsed.scheme:
        url = "http://" + url  # Default to http if missing
        parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        result["reason"] = f"Invalid URL scheme: {parsed.scheme}"
        return result
    if not parsed.netloc:
        result["reason"] = "URL missing network location (domain)"
        return result
    # Stricter check: netloc must contain at least one dot (e.g., example.com)
    if "." not in parsed.netloc:
        result["reason"] = "URL netloc must contain a dot (e.g., example.com)"
        return result

    # 2. DNS resolution
    if not parsed.hostname:
        result["reason"] = "URL missing hostname for DNS resolution"
        return result
    try:
        socket.gethostbyname(parsed.hostname)
    except Exception as e:
        result["reason"] = f"DNS resolution failed: {e}"
        return result

    # 3. HTTP reachability
    try:
        resp = requests.head(
            url,
            allow_redirects=True,
            timeout=5,
            headers={"User-Agent": user_agent},
        )
        result["http_status"] = resp.status_code
        result["final_url"] = resp.url
        if resp.status_code >= 400:
            result["reason"] = f"HTTP error: {resp.status_code}"
            return result
        result["reachable"] = True
    except Exception as e:
        result["reason"] = f"HTTP request failed: {e}"
        return result

    # 4. robots.txt compliance
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
        allowed = rp.can_fetch(user_agent, url)
        result["robots_allowed"] = allowed
        if not allowed:
            result["reason"] = "Blocked by robots.txt"
            return result
    except Exception as e:
        logger.warning(f"robots.txt fetch failed for {robots_url}: {e}")
        # If robots.txt is missing/unreachable, default to allow
        result["robots_allowed"] = True

    result["is_valid"] = True
    return result


def firecrawl_scrape_url(
    url: str, formats: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Scrape a single web page using Firecrawl and return LLM-ready data as a dict.
    """
    if FirecrawlApp is None:
        raise ImportError(
            "firecrawl-py SDK is not installed. Run 'poetry add firecrawl-py'."
        )
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        logger.error("FIRECRAWL_API_KEY is not set in the environment.")
        raise ValueError("FIRECRAWL_API_KEY is required.")
    app = FirecrawlApp(api_key=api_key)
    if formats is None:
        formats = ["markdown", "html"]
    try:
        scrape_result = app.scrape_url(url, formats=formats)
        return scrape_result.model_dump()
    except Exception as e:
        logger.error(f"Firecrawl scrape_url failed: {e}")
        raise ValueError(f"Firecrawl scrape_url failed: {e}")


def firecrawl_crawl_site(
    url: str,
    limit: int = 5,
    formats: Optional[List[str]] = None,
    only_main_content: bool = True,
    wait_for: int = 1000,
) -> Dict[str, Any]:
    """
    Crawl a website and all accessible subpages using Firecrawl. Returns a dict.
    Args:
        url (str): The root URL to crawl.
        limit (int): Max number of pages to crawl.
        formats (Optional[List[str]]): Output formats, e.g., ['markdown', 'html'].
        only_main_content (bool): If True, extract only the main content of each page.
        wait_for (int): Milliseconds to wait for dynamic content to load.
    Returns:
        Dict[str, Any]: Firecrawl crawl result as a dict.
    """
    if FirecrawlApp is None or ScrapeOptions is None:
        raise ImportError(
            "firecrawl-py SDK is not installed. Run 'poetry add firecrawl-py'."
        )
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        logger.error("FIRECRAWL_API_KEY is not set in the environment.")
        raise ValueError("FIRECRAWL_API_KEY is required.")
    app = FirecrawlApp(api_key=api_key)
    if formats is None:
        formats = ["markdown", "html"]
    try:
        scrape_options = ScrapeOptions(
            formats=formats,
            onlyMainContent=only_main_content,
            waitFor=wait_for,
        )
        crawl_result = app.crawl_url(url, limit=limit, scrape_options=scrape_options)
        return crawl_result.model_dump()
    except Exception as e:
        logger.error(f"Firecrawl crawl_url failed: {e}")
        raise ValueError(f"Firecrawl crawl_url failed: {e}")


def extract_website_content(
    url: str,
    crawl: bool = False,
    crawl_limit: int = 5,
    formats: Optional[List[str]] = None,
    only_main_content: bool = True,
    wait_for: int = 1000,
) -> Dict[str, Any]:
    """
    Validate the URL and extract (but do not store) website content using Firecrawl. Returns a dict.
    Args:
        url (str): The URL to process.
        crawl (bool): If True, crawl all accessible subpages. If False, scrape only the main page.
        crawl_limit (int): Max number of pages to crawl (if crawl=True).
        formats (Optional[List[str]]): Output formats, e.g., ['markdown', 'html'].
        only_main_content (bool): If True, extract only the main content of each page (crawl mode).
        wait_for (int): Milliseconds to wait for dynamic content to load (crawl mode).
    Returns:
        Dict[str, Any]: Structured result with validation, content, and metadata.
    """
    # Use file-based cache in development (not in production)
    if os.getenv("ENV") != "production":
        t_cache0 = time.monotonic()
        cached = load_cached_scrape(url)
        t_cache1 = time.monotonic()
        if cached is not None:
            # Validate cache structure
            if "content" not in cached or "html" not in cached:
                logger.warning(
                    f"[DEV CACHE] Cache for {url} missing 'content' or 'html'. "
                    "Forcing fresh scrape."
                )
                cached = None
            elif not cached["content"] and not cached["html"]:
                logger.warning(
                    f"[DEV CACHE] Cache for {url} has empty 'content' and 'html'. "
                    "Forcing fresh scrape."
                )
                cached = None
            else:
                print(
                    f"[DEV CACHE] Cache hit for URL: {url} (retrieval took {t_cache1 - t_cache0:.2f}s)"
                )
                return cached
        else:
            print(
                f"[DEV CACHE] Cache miss for URL: {url} (check took {t_cache1 - t_cache0:.2f}s)"
            )

    t_scrape0 = time.monotonic()
    validation = validate_url(url)
    if not validation["is_valid"] or not validation["reachable"]:
        logger.warning(f"URL validation failed: {validation}")
        raise ValueError(f"URL validation failed: {validation}")

    if formats is None:
        formats = ["markdown", "html"]

    if crawl:
        crawl_result = firecrawl_crawl_site(
            url,
            limit=crawl_limit,
            formats=formats,
            only_main_content=only_main_content,
            wait_for=wait_for,
        )
        # Concatenate all markdown and html from crawled pages
        content = "\n\n".join(
            [page.get("markdown", "") for page in crawl_result.get("data", [])]
        )
        html = "\n\n".join(
            [page.get("html", "") for page in crawl_result.get("data", [])]
        )
        metadata = crawl_result.get("metadata", {})
    else:
        scrape_result = firecrawl_scrape_url(url, formats=formats)
        content = scrape_result.get("markdown", "")
        html = scrape_result.get("html", "")
        metadata = scrape_result.get("metadata", {})

    t_scrape1 = time.monotonic()
    print(
        f"[DEV CACHE] Fresh scrape/crawl for URL: {url} took {t_scrape1 - t_scrape0:.2f}s"
    )

    result = {
        "url": url,
        "validation": validation,
        "content": content,
        "html": html,
        "metadata": metadata,
        "crawl": crawl,
    }
    if os.getenv("ENV") != "production":
        save_scrape_to_cache(url, result)
    return result


if __name__ == "__main__":
    from pprint import pprint

    # Example 1: Single page scrape
    url = "https://plandex.ai/"
    try:
        print("=== Single Page Scrape ===")
        result = extract_website_content(url, crawl=False)
        pprint(result)
    except Exception as e:
        print(f"Single page scrape failed: {e}")

    # Example 2: Multi-page crawl (up to 5 pages)
    try:
        print("\n=== Multi-Page Crawl ===")
        crawl_result = extract_website_content(url, crawl=True, crawl_limit=2)
        pprint(crawl_result)
    except Exception as e:
        print(f"Multi-page crawl failed: {e}")
