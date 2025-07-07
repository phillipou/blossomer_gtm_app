"""
Test cases for dev_file_cache.
"""
import pytest
import os
import json
import tempfile
import shutil
from unittest.mock import patch, mock_open
from backend.app.services.dev_file_cache import (
    url_to_filename,
    load_cached_scrape,
    save_scrape_to_cache,
    CACHE_DIR
)


class TestUrlToFilename:
    """Test cases for url_to_filename function."""
    
    def test_url_to_filename_basic(self):
        """Test basic URL to filename conversion."""
        url = "https://example.com"
        result = url_to_filename(url)
        
        # Should return a path within CACHE_DIR
        assert result.startswith(CACHE_DIR)
        assert result.endswith(".json")
        
        # Should be deterministic
        result2 = url_to_filename(url)
        assert result == result2
    
    def test_url_to_filename_different_urls(self):
        """Test that different URLs produce different filenames."""
        url1 = "https://example.com"
        url2 = "https://different.com"
        
        result1 = url_to_filename(url1)
        result2 = url_to_filename(url2)
        
        assert result1 != result2
    
    def test_url_to_filename_special_characters(self):
        """Test URL with special characters."""
        url = "https://example.com/path?param=value&other=test"
        result = url_to_filename(url)
        
        # Should handle special characters safely
        assert result.startswith(CACHE_DIR)
        assert result.endswith(".json")
        assert "?" not in result
        assert "&" not in result
        assert "=" not in result
    
    def test_url_to_filename_unicode(self):
        """Test URL with unicode characters."""
        url = "https://example.com/测试"
        result = url_to_filename(url)
        
        # Should handle unicode safely
        assert result.startswith(CACHE_DIR)
        assert result.endswith(".json")
    
    def test_url_to_filename_long_url(self):
        """Test very long URL."""
        url = "https://example.com/" + "a" * 1000
        result = url_to_filename(url)
        
        # Should handle long URLs
        assert result.startswith(CACHE_DIR)
        assert result.endswith(".json")
        # Hash should be consistent length (64 char SHA256 hash + ".json")
        filename = os.path.basename(result)
        assert len(filename) == 69  # 64 char hash + ".json" = 69 chars


class TestLoadCachedScrape:
    """Test cases for load_cached_scrape function."""
    
    def test_load_cached_scrape_file_exists(self):
        """Test loading cached scrape when file exists."""
        test_data = {"content": "Test content", "url": "https://example.com"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                # Create a cached file
                url = "https://example.com"
                cache_file = url_to_filename(url)
                os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                
                with open(cache_file, "w") as f:
                    json.dump(test_data, f)
                
                result = load_cached_scrape(url)
                assert result == test_data
    
    def test_load_cached_scrape_file_not_exists(self):
        """Test loading cached scrape when file doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://nonexistent.com"
                result = load_cached_scrape(url)
                assert result is None
    
    def test_load_cached_scrape_creates_directory(self):
        """Test that load_cached_scrape creates cache directory if it doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            cache_dir = os.path.join(temp_dir, "cache")
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", cache_dir):
                url = "https://example.com"
                result = load_cached_scrape(url)
                
                # Should create directory even if no file exists
                assert os.path.exists(cache_dir)
                assert result is None
    
    def test_load_cached_scrape_json_error(self):
        """Test loading cached scrape when JSON is invalid."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                cache_file = url_to_filename(url)
                os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                
                # Create file with invalid JSON
                with open(cache_file, "w") as f:
                    f.write("invalid json")
                
                with pytest.raises(json.JSONDecodeError):
                    load_cached_scrape(url)
    
    def test_load_cached_scrape_timing(self):
        """Test that load_cached_scrape includes timing information."""
        test_data = {"content": "Test content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                with patch("builtins.print") as mock_print:
                    url = "https://example.com"
                    cache_file = url_to_filename(url)
                    os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                    
                    with open(cache_file, "w") as f:
                        json.dump(test_data, f)
                    
                    result = load_cached_scrape(url)
                    
                    # Should print timing information
                    mock_print.assert_called_once()
                    call_args = mock_print.call_args[0][0]
                    assert "[TIMING] Cache file read took" in call_args
                    assert result == test_data
    
    def test_load_cached_scrape_no_file_timing(self):
        """Test timing when file doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                with patch("builtins.print") as mock_print:
                    url = "https://example.com"
                    result = load_cached_scrape(url)
                    
                    # Should print timing information for check
                    mock_print.assert_called_once()
                    call_args = mock_print.call_args[0][0]
                    assert "[TIMING] Cache file check took" in call_args
                    assert result is None


class TestSaveScrapeToCache:
    """Test cases for save_scrape_to_cache function."""
    
    def test_save_scrape_to_cache_basic(self):
        """Test basic save operation."""
        test_data = {"content": "Test content", "url": "https://example.com"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                save_scrape_to_cache(url, test_data)
                
                # Verify file was created
                cache_file = url_to_filename(url)
                assert os.path.exists(cache_file)
                
                # Verify content
                with open(cache_file, "r") as f:
                    saved_data = json.load(f)
                assert saved_data == test_data
    
    def test_save_scrape_to_cache_creates_directory(self):
        """Test that save_scrape_to_cache creates cache directory if it doesn't exist."""
        test_data = {"content": "Test content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            cache_dir = os.path.join(temp_dir, "cache")
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", cache_dir):
                url = "https://example.com"
                save_scrape_to_cache(url, test_data)
                
                # Should create directory
                assert os.path.exists(cache_dir)
                
                # Verify file was created
                cache_file = url_to_filename(url)
                assert os.path.exists(cache_file)
    
    def test_save_scrape_to_cache_overwrites(self):
        """Test that save_scrape_to_cache overwrites existing files."""
        original_data = {"content": "Original content"}
        new_data = {"content": "New content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                
                # Save original data
                save_scrape_to_cache(url, original_data)
                
                # Verify original data
                cache_file = url_to_filename(url)
                with open(cache_file, "r") as f:
                    saved_data = json.load(f)
                assert saved_data == original_data
                
                # Save new data
                save_scrape_to_cache(url, new_data)
                
                # Verify new data overwrote original
                with open(cache_file, "r") as f:
                    saved_data = json.load(f)
                assert saved_data == new_data
    
    def test_save_scrape_to_cache_complex_data(self):
        """Test saving complex data structures."""
        complex_data = {
            "content": "Test content",
            "metadata": {
                "title": "Test Title",
                "description": "Test Description"
            },
            "links": [
                {"url": "https://link1.com", "text": "Link 1"},
                {"url": "https://link2.com", "text": "Link 2"}
            ],
            "numbers": [1, 2, 3.14, -5],
            "boolean": True,
            "null_value": None
        }
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                save_scrape_to_cache(url, complex_data)
                
                # Verify complex data was saved correctly
                cache_file = url_to_filename(url)
                with open(cache_file, "r") as f:
                    saved_data = json.load(f)
                assert saved_data == complex_data
    
    def test_save_scrape_to_cache_timing(self):
        """Test that save_scrape_to_cache includes timing information."""
        test_data = {"content": "Test content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                with patch("builtins.print") as mock_print:
                    url = "https://example.com"
                    save_scrape_to_cache(url, test_data)
                    
                    # Should print timing information
                    mock_print.assert_called_once()
                    call_args = mock_print.call_args[0][0]
                    assert "[TIMING] Cache file save took" in call_args
    
    def test_save_scrape_to_cache_file_permissions(self):
        """Test file permissions and accessibility."""
        test_data = {"content": "Test content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                save_scrape_to_cache(url, test_data)
                
                cache_file = url_to_filename(url)
                # File should be readable
                assert os.access(cache_file, os.R_OK)
                # File should be writable
                assert os.access(cache_file, os.W_OK)


class TestCacheIntegration:
    """Integration tests for cache functionality."""
    
    def test_save_and_load_roundtrip(self):
        """Test saving and loading the same data."""
        test_data = {
            "content": "Test website content",
            "html": "<html><body>Test</body></html>",
            "metadata": {
                "title": "Test Page",
                "description": "Test description"
            }
        }
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com/test"
                
                # Save data
                save_scrape_to_cache(url, test_data)
                
                # Load data
                loaded_data = load_cached_scrape(url)
                
                # Should be identical
                assert loaded_data == test_data
    
    def test_multiple_urls_independence(self):
        """Test that different URLs maintain separate cache entries."""
        data1 = {"content": "Content 1", "url": "https://example1.com"}
        data2 = {"content": "Content 2", "url": "https://example2.com"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url1 = "https://example1.com"
                url2 = "https://example2.com"
                
                # Save different data for different URLs
                save_scrape_to_cache(url1, data1)
                save_scrape_to_cache(url2, data2)
                
                # Load data for each URL
                loaded1 = load_cached_scrape(url1)
                loaded2 = load_cached_scrape(url2)
                
                # Should maintain separate data
                assert loaded1 == data1
                assert loaded2 == data2
                assert loaded1 != loaded2
    
    def test_cache_persistence_across_calls(self):
        """Test that cache persists across multiple function calls."""
        test_data = {"content": "Persistent content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://example.com"
                
                # Save data
                save_scrape_to_cache(url, test_data)
                
                # Load data multiple times
                loaded1 = load_cached_scrape(url)
                loaded2 = load_cached_scrape(url)
                loaded3 = load_cached_scrape(url)
                
                # All loads should return the same data
                assert loaded1 == test_data
                assert loaded2 == test_data
                assert loaded3 == test_data
    
    def test_cache_with_empty_data(self):
        """Test caching empty or minimal data."""
        empty_data = {}
        minimal_data = {"content": ""}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url1 = "https://empty.com"
                url2 = "https://minimal.com"
                
                # Save empty and minimal data
                save_scrape_to_cache(url1, empty_data)
                save_scrape_to_cache(url2, minimal_data)
                
                # Load data
                loaded_empty = load_cached_scrape(url1)
                loaded_minimal = load_cached_scrape(url2)
                
                # Should preserve empty/minimal data
                assert loaded_empty == empty_data
                assert loaded_minimal == minimal_data
    
    def test_cache_directory_path_construction(self):
        """Test that cache directory is constructed correctly."""
        # Test that CACHE_DIR is properly constructed
        expected_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "../../backend/app/services/../../dev_cache/website_scrapes"
        )
        expected_path = os.path.normpath(expected_path)
        
        # The actual CACHE_DIR should be relative to the service file
        assert "dev_cache/website_scrapes" in CACHE_DIR
        assert CACHE_DIR.endswith("dev_cache/website_scrapes")
    
    def test_concurrent_access_simulation(self):
        """Test simulated concurrent access to cache."""
        test_data = {"content": "Concurrent test content"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                url = "https://concurrent.com"
                
                # Save data
                save_scrape_to_cache(url, test_data)
                
                # Simulate multiple concurrent reads
                results = []
                for _ in range(5):
                    result = load_cached_scrape(url)
                    results.append(result)
                
                # All results should be identical
                for result in results:
                    assert result == test_data
    
    def test_cache_with_special_url_characters(self):
        """Test caching with URLs containing special characters."""
        test_data = {"content": "Special URL content"}
        special_url = "https://example.com/path?param=value&other=test#fragment"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.app.services.dev_file_cache.CACHE_DIR", temp_dir):
                # Save and load with special URL
                save_scrape_to_cache(special_url, test_data)
                loaded_data = load_cached_scrape(special_url)
                
                assert loaded_data == test_data