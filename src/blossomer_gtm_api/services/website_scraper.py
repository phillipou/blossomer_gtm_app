import urllib.parse
import socket
import requests
import logging
from urllib import robotparser

logger = logging.getLogger(__name__)


def validate_url(url: str, user_agent: str = "BlossomerBot") -> dict:
    """
    Validate a website URL for syntax, reachability, and robots.txt compliance.
    Returns a dict with validation results.
    """
    result = {
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
