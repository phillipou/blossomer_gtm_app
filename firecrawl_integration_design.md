# Firecrawl Integration Design: Dual Cache Web Scraping System

## Context & Problem Statement

### Current Situation
The OpenAI API cannot access the web directly, so we need to implement web scraping for the `company/generate-ai` endpoint. Currently, the `product_overview.jinja2` template expects `website_content` but we only provide the URL, causing the AI to have insufficient context for analysis.

### Existing Infrastructure
- ✅ **Raw Firecrawl Cache (Layer 1)**: `dev_file_cache.py` with `load_cached_scrape()` and `save_scrape_to_cache()`
- ✅ **Processed Content Cache (Layer 2)**: `dev_file_cache.py` with `load_processed_from_cache()` and `save_processed_to_cache()`
- ✅ **Content Processing Pipeline**: `content_preprocessing.py` with chunking, filtering, and cleaning
- ✅ **Firecrawl Service**: `website_scraper.py` with `extract_website_content()` and `firecrawl_scrape_url()`
- ✅ **Context Orchestrator**: Already calls `extract_website_content()` but doesn't pass content to prompts

### What We Need
A dual cache system that:
1. **Layer 1**: Caches raw Firecrawl responses (HTML, markdown, metadata) to avoid API calls
2. **Layer 2**: Caches cleaned, processed text-only content ready for LLM consumption
3. **Integration**: Passes scraped content to the `product_overview.jinja2` template

## Architecture Overview

```
URL Request → Check Processed Cache → Check Raw Cache → Firecrawl API
     ↓              ↓ (hit)              ↓ (hit)         ↓ (fresh)
Return Text ← Process & Cache ← Extract Content ← API Response
```

### Cache Strategy
- **Raw Cache Key**: SHA256 hash of canonicalized URL
- **Processed Cache Key**: Same hash (different directory)
- **Cache Location**: `backend/dev_cache/website_scrapes/` and `backend/dev_cache/processed_content/`
- **Environment**: Only active in non-production (`ENV != "production"`)

## Detailed Implementation Plan

### Task 1: Enhance Website Scraper Service
**File**: `backend/app/services/website_scraper.py`

#### 1.1: Add Processed Content Cache Integration
- **Import**: Add `load_processed_from_cache`, `save_processed_to_cache` from `dev_file_cache.py`
- **New Function**: `get_processed_website_content(url: str) -> str`
  - Check processed cache first
  - If miss, call existing `extract_website_content()`
  - Process content using `content_preprocessing.py`
  - Cache processed result
  - Return clean text

#### 1.2: Create Content Processing Integration
**Dependencies**: 
- `HTMLSectionChunker` from `content_preprocessing.py`
- `BoilerplateFilter` from `content_preprocessing.py` 
- `LengthFilter` from `content_preprocessing.py`
- `CompositeFilter` from `content_preprocessing.py`

**New Function**: `process_raw_content(content: str, html: str) -> str`
```python
def process_raw_content(content: str, html: str) -> str:
    """
    Process raw Firecrawl content into clean text suitable for LLM consumption.
    
    Args:
        content (str): Markdown content from Firecrawl
        html (str): HTML content from Firecrawl
        
    Returns:
        str: Clean, processed text with boilerplate removed
    """
    # Initialize processing pipeline
    chunker = HTMLSectionChunker()
    filters = CompositeFilter([
        BoilerplateFilter(),
        LengthFilter(min_len=50, max_len=5000)  # Adjust for LLM context
    ])
    
    # Process content
    chunks = chunker.chunk(content, html)
    filtered_chunks = filters.filter(chunks)
    
    # Combine into single text block
    processed_text = "\n\n".join(filtered_chunks)
    
    # Additional cleaning
    processed_text = clean_text_for_llm(processed_text)
    
    return processed_text
```

#### 1.3: Add Text Cleaning Utilities
**New Function**: `clean_text_for_llm(text: str) -> str`
```python
def clean_text_for_llm(text: str) -> str:
    """
    Final text cleaning for LLM consumption.
    
    - Remove excessive whitespace
    - Remove navigation elements
    - Remove contact forms
    - Preserve structured content (headers, lists, paragraphs)
    """
    import re
    
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    # Remove common navigation patterns
    nav_patterns = [
        r'Skip to (?:main )?content',
        r'Home\s+About\s+(?:Services|Products)\s+Contact',
        r'Menu\s+Toggle',
        r'Search\s+for:',
    ]
    for pattern in nav_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Remove contact form patterns
    text = re.sub(r'Email\*?\s+Name\*?\s+Message\*?', '', text, flags=re.IGNORECASE)
    
    return text.strip()
```

#### 1.4: Update Main Function Signature
**Modify**: `extract_website_content()` to include `return_processed: bool = False`
```python
def extract_website_content(
    url: str,
    crawl: bool = False,
    crawl_limit: int = 5,
    formats: Optional[List[str]] = None,
    only_main_content: bool = True,
    wait_for: int = 1000,
    return_processed: bool = False,  # NEW PARAMETER
) -> Dict[str, Any]:
```

**New Logic**:
- If `return_processed=True`, check processed cache first
- If processed cache hit, return `{"url": url, "processed_content": cached_text}`
- If processed cache miss, continue with existing flow but also generate processed content
- Store processed content in Layer 2 cache
- Return both raw and processed content

### Task 2: Create Web Scraping Service Wrapper
**New File**: `backend/app/services/web_content_service.py`

```python
"""
Web Content Service - High-level interface for website content extraction.

Provides a clean API for getting website content with dual caching:
1. Raw Firecrawl response cache
2. Processed text cache ready for LLM consumption
"""

from typing import Dict, Any, Optional
from backend.app.services.website_scraper import extract_website_content, process_raw_content
from backend.app.services.dev_file_cache import load_processed_from_cache, save_processed_to_cache
import time

class WebContentService:
    """Service for extracting and caching website content."""
    
    @staticmethod
    def get_content_for_llm(url: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get processed website content optimized for LLM consumption.
        
        Args:
            url (str): Website URL to scrape
            force_refresh (bool): Skip cache and force fresh scrape
            
        Returns:
            Dict containing:
            - processed_content: Clean text for LLM
            - metadata: Scraping metadata
            - cache_status: "processed_hit" | "raw_hit" | "fresh_scrape"
        """
        
        # Check processed cache first (unless force refresh)
        if not force_refresh:
            cached_processed = load_processed_from_cache(url)
            if cached_processed:
                return {
                    "processed_content": cached_processed,
                    "cache_status": "processed_hit",
                    "metadata": {"source": "processed_cache"}
                }
        
        # Get raw content (may hit raw cache or call Firecrawl)
        raw_result = extract_website_content(url)
        
        # Process the content
        processed_content = process_raw_content(
            content=raw_result.get("content", ""),
            html=raw_result.get("html", "")
        )
        
        # Cache processed content
        save_processed_to_cache(url, processed_content)
        
        cache_status = "raw_hit" if raw_result.get("from_cache") else "fresh_scrape"
        
        return {
            "processed_content": processed_content,
            "cache_status": cache_status,
            "metadata": raw_result.get("metadata", {}),
            "raw_content_length": len(raw_result.get("content", "")),
            "processed_content_length": len(processed_content)
        }
```

### Task 3: Update Context Orchestrator Integration
**File**: `backend/app/services/context_orchestrator_service.py`

#### 3.1: Import New Service
```python
from backend.app.services.web_content_service import WebContentService
```

#### 3.2: Modify `_build_prompt_vars()` Method
**Current Issue**: Line 102 sets `website_content = None` but never populates it.

**Enhancement**: 
```python
def _build_prompt_vars(
    self, analysis_type: str, request_data: Any, website_url: Optional[str]
) -> Dict[str, Any]:
    """Helper to construct prompt variables based on analysis type."""
    prompt_vars_kwargs = {"input_website_url": website_url}
    
    # NEW: Get website content for LLM if URL provided
    website_content = None
    if website_url:
        try:
            content_result = WebContentService.get_content_for_llm(website_url)
            website_content = content_result["processed_content"]
            
            # Log cache performance
            cache_status = content_result["cache_status"]
            content_length = content_result["processed_content_length"]
            print(f"[WEB_CONTENT] Cache status: {cache_status}, Content length: {content_length} chars")
            
        except Exception as e:
            logger.warning(f"Failed to fetch website content for {website_url}: {e}")
            website_content = None
    
    if analysis_type == "product_overview":
        prompt_vars_kwargs.update({
            "user_inputted_context": getattr(request_data, "user_inputted_context", None),
            "website_content": website_content,  # NEW: Pass to template
        })
    # ... rest of the method unchanged
```

### Task 4: Update Product Overview Template
**File**: `backend/app/prompts/templates/product_overview.jinja2`

#### 4.1: Add Website Content Section
**Location**: After line 186 (after the user context section)

```jinja2
{% if website_content %}
**Website Content:** 
{{ website_content }}
{% endif %}
```

#### 4.2: Update Analysis Instructions
**Modify**: The analysis instructions to reference website content when available

**After line 36** (in Analysis Instructions):
```jinja2
- **Website Content Analysis**: When website content is provided, prioritize specific information over general assumptions
- **Content Quality**: If website content is insufficient or unclear, mark assumptions clearly with [ASSUMPTION]
```

### Task 5: Add Monitoring and Diagnostics
**File**: `backend/app/services/web_content_service.py`

#### 5.1: Add Content Quality Metrics
```python
@staticmethod
def analyze_content_quality(processed_content: str) -> Dict[str, Any]:
    """
    Analyze the quality of processed content for LLM consumption.
    
    Returns metrics about content richness, structure, and suitability.
    """
    import re
    
    # Basic metrics
    word_count = len(processed_content.split())
    char_count = len(processed_content)
    
    # Structure detection
    headers = len(re.findall(r'^#+\s', processed_content, re.MULTILINE))
    lists = len(re.findall(r'^\s*[-*+]\s', processed_content, re.MULTILINE))
    paragraphs = len(re.findall(r'\n\s*\n', processed_content))
    
    # Content type detection
    has_product_info = bool(re.search(r'(features?|benefits?|pricing|solutions?)', processed_content, re.IGNORECASE))
    has_company_info = bool(re.search(r'(about|company|team|mission|founded)', processed_content, re.IGNORECASE))
    has_contact_info = bool(re.search(r'(contact|email|phone|address)', processed_content, re.IGNORECASE))
    
    # Quality assessment
    quality_score = min(100, (word_count / 10) + (headers * 5) + (lists * 2))
    
    return {
        "word_count": word_count,
        "char_count": char_count,
        "structure": {
            "headers": headers,
            "lists": lists,
            "paragraphs": paragraphs
        },
        "content_types": {
            "has_product_info": has_product_info,
            "has_company_info": has_company_info,
            "has_contact_info": has_contact_info
        },
        "quality_score": quality_score,
        "is_sufficient": quality_score > 20 and word_count > 100
    }
```

#### 5.2: Add Debug Logging
```python
@staticmethod
def debug_content_pipeline(url: str) -> Dict[str, Any]:
    """
    Debug the content processing pipeline for a URL.
    Shows cache status, processing steps, and content quality.
    """
    import time
    
    debug_info = {
        "url": url,
        "timestamp": time.time(),
        "steps": []
    }
    
    # Step 1: Check processed cache
    start_time = time.monotonic()
    cached_processed = load_processed_from_cache(url)
    cache_check_time = time.monotonic() - start_time
    
    debug_info["steps"].append({
        "step": "processed_cache_check",
        "duration_ms": cache_check_time * 1000,
        "result": "hit" if cached_processed else "miss",
        "content_length": len(cached_processed) if cached_processed else 0
    })
    
    if cached_processed:
        debug_info["content_quality"] = WebContentService.analyze_content_quality(cached_processed)
        return debug_info
    
    # Step 2: Get raw content
    start_time = time.monotonic()
    raw_result = extract_website_content(url)
    raw_fetch_time = time.monotonic() - start_time
    
    debug_info["steps"].append({
        "step": "raw_content_fetch",
        "duration_ms": raw_fetch_time * 1000,
        "cache_status": "hit" if raw_result.get("from_cache") else "fresh",
        "raw_content_length": len(raw_result.get("content", "")),
        "html_length": len(raw_result.get("html", ""))
    })
    
    # Step 3: Process content
    start_time = time.monotonic()
    processed = process_raw_content(
        content=raw_result.get("content", ""),
        html=raw_result.get("html", "")
    )
    process_time = time.monotonic() - start_time
    
    debug_info["steps"].append({
        "step": "content_processing",
        "duration_ms": process_time * 1000,
        "processed_length": len(processed),
        "compression_ratio": len(processed) / max(len(raw_result.get("content", "")), 1)
    })
    
    debug_info["content_quality"] = WebContentService.analyze_content_quality(processed)
    
    return debug_info
```

### Task 6: Update Context Orchestrator Agent
**File**: `backend/app/services/context_orchestrator_agent.py`

#### 6.1: Replace Direct Scraping Calls
**Lines to Update**: 178, 216, 241, 299 (all calls to `extract_website_content()`)

**Current Pattern**:
```python
scrape_result = extract_website_content(website_url)
content = scrape_result.get("content", "")
```

**New Pattern**:
```python
from backend.app.services.web_content_service import WebContentService

content_result = WebContentService.get_content_for_llm(website_url)
content = content_result["processed_content"]
cache_status = content_result["cache_status"]
```

#### 6.2: Update Return Structures
**Enhance return dictionaries to include processed content**:
```python
return {
    "source": "website",
    "context": content,  # Now processed content instead of raw
    "content": content,
    "processed_content": content,  # Explicit field
    "cache_status": cache_status,
    "is_ready": True,
    "from_cache": cache_status != "fresh_scrape",
}
```

### Task 7: Add Configuration and Environment Support
**File**: `backend/app/services/web_content_service.py`

#### 7.1: Add Configuration Class
```python
from dataclasses import dataclass
import os

@dataclass
class WebContentConfig:
    """Configuration for web content processing."""
    
    # Cache settings
    enable_caching: bool = os.getenv("ENV") != "production"
    cache_ttl_hours: int = int(os.getenv("WEB_CACHE_TTL_HOURS", "24"))
    
    # Processing settings
    min_content_length: int = int(os.getenv("MIN_CONTENT_LENGTH", "50"))
    max_content_length: int = int(os.getenv("MAX_CONTENT_LENGTH", "5000"))
    
    # Firecrawl settings
    enable_crawling: bool = os.getenv("ENABLE_SITE_CRAWLING", "false").lower() == "true"
    max_crawl_pages: int = int(os.getenv("MAX_CRAWL_PAGES", "5"))
    
    # Quality thresholds
    min_quality_score: int = int(os.getenv("MIN_QUALITY_SCORE", "20"))
    min_word_count: int = int(os.getenv("MIN_WORD_COUNT", "100"))
```

#### 7.2: Update Service to Use Config
```python
class WebContentService:
    def __init__(self, config: Optional[WebContentConfig] = None):
        self.config = config or WebContentConfig()
    
    def get_content_for_llm(self, url: str, force_refresh: bool = False) -> Dict[str, Any]:
        # Use self.config throughout the method
        if not self.config.enable_caching:
            force_refresh = True
        
        # ... rest of implementation
```

### Task 8: Add Error Handling and Fallbacks
**File**: `backend/app/services/web_content_service.py`

#### 8.1: Comprehensive Error Handling
```python
from typing import Union, Tuple

@staticmethod
def safe_get_content_for_llm(url: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Safely get website content with comprehensive error handling.
    
    Returns:
        Tuple[Optional[str], Optional[str]]: (content, error_message)
    """
    try:
        result = WebContentService.get_content_for_llm(url)
        content = result["processed_content"]
        
        # Validate content quality
        if not content or len(content.strip()) < 50:
            return None, "Website content is too short or empty"
        
        # Check for common error patterns
        error_indicators = [
            "403 Forbidden",
            "404 Not Found", 
            "Access Denied",
            "robots.txt",
            "Cloudflare"
        ]
        
        for indicator in error_indicators:
            if indicator.lower() in content.lower():
                return None, f"Website access blocked: {indicator}"
        
        return content, None
        
    except Exception as e:
        logger.exception(f"Failed to get content for {url}")
        return None, f"Scraping failed: {str(e)}"
```

### Task 9: Testing and Validation
**New File**: `backend/app/services/test_web_content_integration.py`

```python
"""
Test script for web content integration.
Validates the dual cache system and content processing pipeline.
"""

async def test_complete_integration():
    """Test the complete web content integration flow."""
    
    test_urls = [
        "https://plandex.ai/",
        "https://anthropic.com/",
        "https://openai.com/"
    ]
    
    for url in test_urls:
        print(f"\n=== Testing {url} ===")
        
        # Test 1: Fresh scrape
        result1 = WebContentService.get_content_for_llm(url, force_refresh=True)
        print(f"Fresh scrape: {result1['cache_status']}, Length: {len(result1['processed_content'])}")
        
        # Test 2: Cache hit
        result2 = WebContentService.get_content_for_llm(url)
        print(f"Cache check: {result2['cache_status']}, Length: {len(result2['processed_content'])}")
        
        # Test 3: Content quality
        quality = WebContentService.analyze_content_quality(result2['processed_content'])
        print(f"Quality score: {quality['quality_score']}, Sufficient: {quality['is_sufficient']}")
        
        # Test 4: Template integration
        from backend.app.services.context_orchestrator_service import ContextOrchestratorService
        # Mock request and test prompt generation
        
        print("✅ Integration test passed" if quality['is_sufficient'] else "❌ Content quality insufficient")
```

## Implementation Order

1. **Task 1**: Enhance website scraper with dual cache support
2. **Task 2**: Create web content service wrapper  
3. **Task 3**: Update context orchestrator to pass website content
4. **Task 4**: Update product overview template to use website content
5. **Task 5**: Add monitoring and diagnostics
6. **Task 6**: Update context orchestrator agent calls
7. **Task 7**: Add configuration support
8. **Task 8**: Add error handling and fallbacks
9. **Task 9**: Create comprehensive test suite

## Expected Outcomes

### Performance Improvements
- **Cache Hit Rate**: >80% for repeated URLs during development
- **Processing Time**: <100ms for cached processed content
- **Firecrawl API Calls**: Reduced by 80%+ in development

### Content Quality Improvements  
- **LLM Context**: Rich, cleaned website content instead of just URL
- **Analysis Accuracy**: Better product overview generation with actual content
- **Error Reduction**: Fewer "insufficient content" errors

### Developer Experience
- **Debug Tools**: Content quality analysis and pipeline debugging
- **Cache Transparency**: Clear cache status reporting
- **Fallback Handling**: Graceful degradation when scraping fails

## Risk Mitigation

### Cache Invalidation
- **TTL Support**: Configurable cache expiration
- **Force Refresh**: Manual cache bypass option
- **Cache Validation**: Automatic cache structure validation

### Content Quality
- **Quality Metrics**: Automated content sufficiency checking
- **Fallback Content**: Use URL if content processing fails
- **Error Boundaries**: Isolate scraping failures from core functionality

### API Rate Limits
- **Smart Caching**: Aggressive caching to minimize API calls
- **Error Handling**: Graceful handling of Firecrawl API limits
- **Development Mode**: File-based caching in non-production environments