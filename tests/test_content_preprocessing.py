from backend.app.services.content_preprocessing import (
    ParagraphChunker,
    LangChainSummarizer,
    DuplicateFilter,
    ContentPreprocessingPipeline,
    IFilter,
)


def test_paragraph_chunker_chunk_markdown():
    """
    Test ParagraphChunker.chunk splits markdown content by headings.
    """
    text = """
# Title
## Section 1
Content 1
## Section 2
Content 2
"""
    chunker = ParagraphChunker(min_paragraph_length=100)
    chunks = chunker.chunk(text)
    assert len(chunks) == 3
    assert "# Title" in chunks[0]
    assert "Section 1" in chunks[1]
    assert "Section 2" in chunks[2]


def test_paragraph_chunker_chunk_empty():
    """
    Test ParagraphChunker.chunk returns empty list for empty input.
    """
    chunker = ParagraphChunker(min_paragraph_length=100)
    assert chunker.chunk("") == []


def test_langchain_summarizer_summarize():
    """
    Test LangChainSummarizer.summarize returns the input unchanged (stub).
    """
    summarizer = LangChainSummarizer()
    chunk = "Some content."
    assert summarizer.summarize(chunk) == chunk


def test_content_preprocessing_pipeline_end_to_end():
    """
    Test ContentPreprocessingPipeline end-to-end with all default stubs.
    Should return processed chunks matching ParagraphChunker output.
    """
    text = """
# Welcome
## About
About us.
## Features
- Feature 1
- Feature 2
"""
    chunker = ParagraphChunker(min_paragraph_length=100)
    summarizer = LangChainSummarizer()
    filter_: list[IFilter] = [DuplicateFilter()]
    pipeline = ContentPreprocessingPipeline(chunker, summarizer, filter_)
    processed = pipeline.process(text)
    # Should match ParagraphChunker output since summarizer/filter are stubs
    assert processed == chunker.chunk(text)
