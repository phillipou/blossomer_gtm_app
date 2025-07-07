from abc import ABC, abstractmethod
from typing import List, Optional

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None  # Will raise if used without install


class IChunker(ABC):
    """Interface for content chunking strategies."""

    @abstractmethod
    def chunk(self, text: str) -> List[str]:
        """
        Split input text into a list of chunks.
        Args:
            text (str): The raw website content.
        Returns:
            List[str]: List of content chunks.
        """
        pass


class ISummarizer(ABC):
    """Interface for content summarization strategies."""

    @abstractmethod
    def summarize(self, chunk: str) -> str:
        """
        Summarize a single chunk of text.
        Args:
            chunk (str): A chunk of website content.
        Returns:
            str: The summarized chunk.
        """
        pass


class IFilter(ABC):
    """Interface for content filtering strategies."""

    @abstractmethod
    def filter(self, chunks: List[str]) -> List[str]:
        """
        Filter out irrelevant or redundant chunks.
        Args:
            chunks (List[str]): List of content chunks.
        Returns:
            List[str]: Filtered list of content chunks.
        """
        pass


class SectionChunker(IChunker):
    """
    Simple chunker that splits markdown content by headings (e.g., '##', '###').
    This is a placeholder; in production, use HTML parsing or LangChain chunkers.
    """

    def chunk(self, text: str) -> List[str]:
        if not text:
            return []
        # Split by markdown headings as a simple example
        import re

        chunks = re.split(r"(^##+ .*$)", text, flags=re.MULTILINE)
        # Recombine headings with their content
        result = []
        buffer = ""
        for part in chunks:
            if part.strip().startswith("##"):
                if buffer:
                    result.append(buffer.strip())
                buffer = part
            else:
                buffer += part
        if buffer:
            result.append(buffer.strip())
        return [c for c in result if c]


class LangChainSummarizer(ISummarizer):
    """
    Stub for a summarizer using LangChain. Replace with actual LangChain summarization logic.
    """

    def summarize(self, chunk: str) -> str:
        # TODO: Integrate LangChain summarization chain here
        # For now, just return the chunk unchanged
        return chunk


class BoilerplateFilter(IFilter):
    """
    Stub for a filter that removes boilerplate (e.g., navigation, footers).
    Replace with actual logic as needed.
    """

    def filter(self, chunks: List[str]) -> List[str]:
        # TODO: Implement boilerplate and redundancy filtering
        # For now, return all chunks unchanged
        return chunks


def extract_main_text_from_html(html: str) -> str:
    """
    Extracts the main readable text from HTML using BeautifulSoup.
    Removes scripts, styles, nav, footer, and aside elements.
    Prefers <main> or <article> if present, else uses <body>.
    """
    if BeautifulSoup is None:
        raise ImportError(
            "BeautifulSoup4 is required for HTML extraction. Please install it."
        )
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "aside"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.body
    if main:
        text = main.get_text(separator="\n", strip=True)
    else:
        text = soup.get_text(separator="\n", strip=True)
    import re

    text = re.sub(r"\n{2,}", "\n\n", text)
    return text


class ContentPreprocessingPipeline:
    """
    Pipeline that composes chunking, summarization, and filtering for website content.
    """

    def __init__(self, chunker: IChunker, summarizer: ISummarizer, filter_: IFilter):
        self.chunker = chunker
        self.summarizer = summarizer
        self.filter = filter_

    def process(self, text: str, html: Optional[str] = None) -> List[str]:
        """
        Process website content through HTML extraction (if available), chunking, summarization,
        and filtering.
        Args:
            text (str): Raw website content (markdown or plain text).
            html (Optional[str]): Raw HTML content, if available.
        Returns:
            List[str]: List of processed content chunks.
        """
        import time

        # Always prefer html if available
        if html:
            t_html0 = time.monotonic()
            text = extract_main_text_from_html(html)
            t_html1 = time.monotonic()
            print(f"[TIMING] HTML extraction took {t_html1 - t_html0:.3f}s")

        t_chunk0 = time.monotonic()
        chunks = self.chunker.chunk(text)
        t_chunk1 = time.monotonic()
        print(
            f"[TIMING] Chunking took {t_chunk1 - t_chunk0:.3f}s (produced {len(chunks)} chunks)"
        )

        t_summarize0 = time.monotonic()
        summarized = [self.summarizer.summarize(chunk) for chunk in chunks]
        t_summarize1 = time.monotonic()
        print(f"[TIMING] Summarization took {t_summarize1 - t_summarize0:.3f}s")

        t_filter0 = time.monotonic()
        filtered = self.filter.filter(summarized)
        t_filter1 = time.monotonic()
        print(
            f"[TIMING] Filtering took {t_filter1 - t_filter0:.3f}s (kept {len(filtered)} chunks)"
        )

        return filtered

    def find_and_replace(self, text: str) -> str:
        # ... (implementation remains the same)
        return text


if __name__ == "__main__":
    pass
