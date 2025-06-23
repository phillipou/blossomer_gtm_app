from unittest.mock import patch, MagicMock
from blossomer_gtm_api.services.website_scraper import validate_url


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
