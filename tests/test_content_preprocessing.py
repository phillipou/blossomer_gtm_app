from backend.app.services.content_preprocessing import (
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
    ContentPreprocessingPipeline,
)


def test_section_chunker_chunk_markdown():
    """
    Test SectionChunker.chunk splits markdown content by headings.
    """
    text = """
# Title
## Section 1
Content 1
## Section 2
Content 2
"""
    chunker = SectionChunker()
    chunks = chunker.chunk(text)
    assert len(chunks) == 3
    assert "# Title" in chunks[0]
    assert "Section 1" in chunks[1]
    assert "Section 2" in chunks[2]


def test_section_chunker_chunk_empty():
    """
    Test SectionChunker.chunk returns empty list for empty input.
    """
    chunker = SectionChunker()
    assert chunker.chunk("") == []


def test_langchain_summarizer_summarize():
    """
    Test LangChainSummarizer.summarize returns the input unchanged (stub).
    """
    summarizer = LangChainSummarizer()
    chunk = "Some content."
    assert summarizer.summarize(chunk) == chunk


def test_boilerplate_filter_filter():
    """
    Test BoilerplateFilter.filter returns the input list unchanged (stub).
    """
    filter_ = BoilerplateFilter()
    chunks = ["A", "B", "C"]
    assert filter_.filter(chunks) == chunks


def test_content_preprocessing_pipeline_end_to_end():
    """
    Test ContentPreprocessingPipeline end-to-end with all default stubs.
    Should return processed chunks matching SectionChunker output.
    """
    text = """
# Welcome
## About
About us.
## Features
- Feature 1
- Feature 2
"""
    chunker = SectionChunker()
    summarizer = LangChainSummarizer()
    filter_ = BoilerplateFilter()
    pipeline = ContentPreprocessingPipeline(chunker, summarizer, filter_)
    processed = pipeline.process(text)
    # Should match SectionChunker output since summarizer/filter are stubs
    assert processed == chunker.chunk(text)
