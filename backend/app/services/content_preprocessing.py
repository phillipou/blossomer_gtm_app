from abc import ABC, abstractmethod
from typing import List, Optional
import re

try:
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    BeautifulSoup = None
    NavigableString = None

class IChunker(ABC):
    """Interface for content chunking strategies."""
    @abstractmethod
    def chunk(self, text: str, html: Optional[str] = None) -> List[str]:
        pass

class ISummarizer(ABC):
    """Interface for content summarization strategies."""
    @abstractmethod
    def summarize(self, chunk: str) -> str:
        pass

class IFilter(ABC):
    """Interface for content filtering strategies."""
    @abstractmethod
    def filter(self, chunks: List[str]) -> List[str]:
        pass

class HTMLSectionChunker(IChunker):
    """Chunks HTML content by semantic sections, falling back to divs or paragraphs."""
    def chunk(self, text: str, html: Optional[str] = None) -> List[str]:
        if not html or BeautifulSoup is None:
            return text.split('\n\n')

        soup = BeautifulSoup(html, 'html.parser')
        for tag in soup(["script", "style", "nav", "footer", "aside"]):
            tag.decompose()

        chunks = []
        # Prioritize semantic tags, but fall back to divs
        for section in soup.find_all(['main', 'article', 'section', 'div']):
            text = section.get_text(separator=' ', strip=True)
            if len(text.split()) > 10: # Only consider chunks with more than 10 words
                chunks.append(text)
        
        if not chunks:
            chunks = [p.get_text(separator=' ', strip=True) for p in soup.find_all('p') if len(p.get_text().split()) > 5]

        return chunks if chunks else [text]

class LangChainSummarizer(ISummarizer):
    """Stub for a summarizer using LangChain."""
    def summarize(self, chunk: str) -> str:
        return chunk

class DuplicateFilter(IFilter):
    """Filters out duplicate chunks."""
    def filter(self, chunks: List[str]) -> List[str]:
        seen = set()
        result = []
        for chunk in chunks:
            if chunk not in seen:
                seen.add(chunk)
                result.append(chunk)
        return result

class BoilerplateFilter(IFilter):
    """Filters out common boilerplate text from a list of chunks."""
    def filter(self, chunks: List[str]) -> List[str]:
        filtered_chunks = []
        for chunk in chunks:
            # Example boilerplate patterns (customize as needed)
            if not re.search(r'(Copyright ©|All rights reserved|Privacy Policy|Terms of Service)', chunk, re.IGNORECASE):
                filtered_chunks.append(chunk)
        return filtered_chunks

class LengthFilter(IFilter):
    """Filters out chunks that are too short or too long."""
    def __init__(self, min_len: int = 20, max_len: int = 2000):
        self.min_len = min_len
        self.max_len = max_len

    def filter(self, chunks: List[str]) -> List[str]:
        return [chunk for chunk in chunks if self.min_len <= len(chunk) <= self.max_len]

class CompositeFilter(IFilter):
    """Combines multiple filters into a single pipeline."""
    def __init__(self, filters: List[IFilter]):
        self.filters = filters

    def filter(self, chunks: List[str]) -> List[str]:
        for f in self.filters:
            chunks = f.filter(chunks)
        return chunks

class ContentPreprocessingPipeline:
    """Pipeline that composes chunking, summarization, and filtering for website content."""
    def __init__(self, chunker: IChunker, summarizer: ISummarizer, filter_: IFilter):
        self.chunker = chunker
        self.summarizer = summarizer
        self.filter = filter_

    def process(self, text: str, html: Optional[str] = None) -> List[str]:
        chunks = self.chunker.chunk(text, html)
        summarized = [self.summarizer.summarize(chunk) for chunk in chunks]
        filtered = self.filter.filter(summarized)
        return filtered
