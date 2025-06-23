from unittest.mock import patch, MagicMock
from blossomer_gtm_api.services.website_scraper import (
    validate_url,
    firecrawl_scrape_url,
    extract_website_content,
    firecrawl_crawl_site,
)
import pytest
import logging

logger = logging.getLogger(__name__)


def test_valid_url_allowed_by_robots():
    """Test a valid, reachable URL allowed by robots.txt."""
    with patch("socket.gethostbyname", return_value="127.0.0.1"), patch(
        "requests.head"
    ) as mock_head, patch("urllib.robotparser.RobotFileParser") as mock_rp:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "http://example.com/"
        mock_head.return_value = mock_resp
        mock_rp_instance = MagicMock()
        mock_rp_instance.can_fetch.return_value = True
        mock_rp.return_value = mock_rp_instance

        result = validate_url("http://example.com/")
        assert result["is_valid"] is True
        assert result["reachable"] is True
        assert result["robots_allowed"] is True
        assert result["reason"] is None
        assert result["http_status"] == 200
        assert result["final_url"] == "http://example.com/"


def test_valid_url_disallowed_by_robots():
    """Test a valid, reachable URL disallowed by robots.txt."""
    with patch("socket.gethostbyname", return_value="127.0.0.1"), patch(
        "requests.head"
    ) as mock_head, patch("urllib.robotparser.RobotFileParser") as mock_rp:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "http://example.com/"
        mock_head.return_value = mock_resp
        mock_rp_instance = MagicMock()
        mock_rp_instance.can_fetch.return_value = False
        mock_rp.return_value = mock_rp_instance

        result = validate_url("http://example.com/")
        assert result["is_valid"] is False
        assert result["robots_allowed"] is False
        assert result["reason"] == "Blocked by robots.txt"


def test_invalid_url_syntax():
    """Test an invalid URL (malformed)."""
    result = validate_url("not_a_url")
    assert result["is_valid"] is False
    assert result["reason"] == "URL netloc must contain a dot (e.g., example.com)"


def test_unreachable_domain():
    """Test a URL with a domain that fails DNS resolution."""
    with patch("socket.gethostbyname", side_effect=OSError("DNS fail")):
        result = validate_url("http://doesnotexist.tld/")
        assert result["is_valid"] is False
        assert "DNS resolution failed" in result["reason"]


def test_http_error():
    """Test a URL that returns an HTTP error (e.g., 404)."""
    with patch("socket.gethostbyname", return_value="127.0.0.1"), patch(
        "requests.head"
    ) as mock_head:
        mock_resp = MagicMock()
        mock_resp.status_code = 404
        mock_resp.url = "http://example.com/404"
        mock_head.return_value = mock_resp
        result = validate_url("http://example.com/404")
        assert result["is_valid"] is False
        assert result["http_status"] == 404
        assert result["reason"] == "HTTP error: 404"


def test_robots_txt_missing():
    """Test a valid URL where robots.txt is missing/unreachable (should default to allowed)."""
    with patch("socket.gethostbyname", return_value="127.0.0.1"), patch(
        "requests.head"
    ) as mock_head, patch("urllib.robotparser.RobotFileParser") as mock_rp:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "http://example.com/"
        mock_head.return_value = mock_resp
        mock_rp_instance = MagicMock()
        mock_rp_instance.can_fetch.side_effect = Exception("robots.txt unreachable")
        mock_rp_instance.read.side_effect = Exception("robots.txt unreachable")
        mock_rp.return_value = mock_rp_instance

        result = validate_url("http://example.com/")
        assert result["is_valid"] is True
        assert result["robots_allowed"] is True


def test_firecrawl_scrape_url_success(monkeypatch):
    """
    Test firecrawl_scrape_url returns expected data when Firecrawl API responds successfully.
    """
    test_url = "https://example.com"
    expected = {"markdown": "# Example", "json": {"title": "Example"}}

    class MockResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return expected

    def mock_post(*args, **kwargs):
        return MockResponse()

    monkeypatch.setenv("FIRECRAWL_API_KEY", "dummy-key")
    with patch("requests.post", mock_post):
        result = firecrawl_scrape_url(test_url)
        assert result == expected


def test_firecrawl_scrape_url_missing_api_key(monkeypatch):
    """
    Test firecrawl_scrape_url raises ValueError if FIRECRAWL_API_KEY is missing.
    """
    test_url = "https://example.com"
    monkeypatch.delenv("FIRECRAWL_API_KEY", raising=False)
    with pytest.raises(ValueError) as excinfo:
        firecrawl_scrape_url(test_url)
    assert "FIRECRAWL_API_KEY is required" in str(excinfo.value)


def test_firecrawl_crawl_site_options(mocker):
    """
    Test firecrawl_crawl_site passes only_main_content and wait_for to ScrapeOptions.
    """
    test_url = "https://example.com"
    called_kwargs = {}

    class MockScrapeOptions:
        def __init__(self, formats, onlyMainContent, waitFor):
            called_kwargs["formats"] = formats
            called_kwargs["onlyMainContent"] = onlyMainContent
            called_kwargs["waitFor"] = waitFor

    class MockFirecrawlApp:
        def __init__(self, api_key):
            pass

        def crawl_url(self, url, limit, scrape_options):
            return MagicMock(
                dict=lambda: {"data": ["main content"], "metadata": {"pages": limit}}
            )

    mocker.patch(
        "blossomer_gtm_api.services.website_scraper.FirecrawlApp", MockFirecrawlApp
    )
    mocker.patch(
        "blossomer_gtm_api.services.website_scraper.ScrapeOptions", MockScrapeOptions
    )
    mocker.patch("os.getenv", return_value="dummy-key")

    result = firecrawl_crawl_site(
        test_url, limit=3, formats=["markdown"], only_main_content=False, wait_for=2222
    )
    assert result["data"] == ["main content"]
    assert result["metadata"]["pages"] == 3
    assert called_kwargs["onlyMainContent"] is False
    assert called_kwargs["waitFor"] == 2222


def test_extract_website_content_crawl(mocker):
    """
    Test extract_website_content in crawl mode with only_main_content and wait_for options.
    """
    test_url = "http://example.com"
    # Patch validate_url to always return valid
    mocker.patch(
        "blossomer_gtm_api.services.website_scraper.validate_url",
        lambda url: {"is_valid": True, "reachable": True},
    )
    # Patch firecrawl_crawl_site to return dummy crawl result
    mocker.patch(
        "blossomer_gtm_api.services.website_scraper.firecrawl_crawl_site",
        lambda url, limit, formats, only_main_content, wait_for: {
            "data": ["main content"],
            "metadata": {
                "pages": limit,
                "main": only_main_content,
                "wait": wait_for,
            },
        },
    )
    result = extract_website_content(
        test_url, crawl=True, crawl_limit=2, only_main_content=True, wait_for=1500
    )
    assert result["url"] == test_url
    assert result["validation"]["is_valid"] is True
    assert result["content"] == ["main content"]
    assert result["metadata"]["pages"] == 2
    assert result["metadata"]["main"] is True
    assert result["metadata"]["wait"] == 1500
