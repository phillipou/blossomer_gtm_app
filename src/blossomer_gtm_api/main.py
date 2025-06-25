import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from blossomer_gtm_api.services.website_scraper import extract_website_content
from blossomer_gtm_api.services.llm_service import LLMClient, LLMRequest, OpenAIProvider
from blossomer_gtm_api.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
)
from blossomer_gtm_api.schemas import (
    ICP_SCHEMA,
    ProductOverviewRequest,
    ProductOverviewResponse,
)
from blossomer_gtm_api.prompts.registry import render_prompt
from blossomer_gtm_api.prompts.models import (
    ICPPromptVars,
    ProductOverviewPromptVars,
)
from blossomer_gtm_api.services.context_orchestrator import ContextOrchestrator

load_dotenv()

app = FastAPI()

llm_client = LLMClient([OpenAIProvider()])  # Instantiate once for reuse


class PositioningRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    description: str = Field(..., description="Company overview or product description")
    icp: Optional[str] = Field(
        None, description="Ideal Customer Profile or customer hypotheses (optional)"
    )

    class Config:
        schema_extra = {
            "example": {
                "website_url": "https://example.com",
                "description": "AI-powered marketing automation for SMBs",
                "icp": "B2B SaaS startups",
            }
        }


class UniqueSellingPoint(BaseModel):
    theme: str = Field(..., description="USP name or theme")
    description: str = Field(..., description="Brief benefit or outcome")
    evidence: List[str] = Field(..., description="Supporting details or explanations")

    class Config:
        schema_extra = {
            "example": {
                "theme": "Buyer-Centric Messaging",
                "description": (
                    "Delivers messaging tailored to the emotional and practical needs of your ICP."
                ),
                "evidence": [
                    "Analyzes ICP pain points and language",
                    "Adapts messaging based on real buyer feedback",
                ],
            }
        }


class PositioningResponse(BaseModel):
    unique_insight: str = Field(
        ...,
        description=("Core reframe of the problem (unique insight)"),
    )
    unique_selling_points: List[UniqueSellingPoint] = Field(
        ...,
        description=("List of unique selling points (USPs)"),
    )

    class Config:
        schema_extra = {
            "example": {
                "unique_insight": (
                    "Most B2B marketing tools focus on automation, but the real bottleneck is "
                    "understanding what actually resonates with buyers. Blossomer reframes the "
                    "problem: it's not about sending more messages, but about crafting the right "
                    "message for the right ICP at the right time."
                ),
                "unique_selling_points": [
                    {
                        "theme": "Buyer-Centric Messaging",
                        "description": (
                            "Delivers messaging tailored to the emotional and practical needs of "
                            "your ICP."
                        ),
                        "evidence": [
                            "Analyzes ICP pain points and language",
                            "Adapts messaging based on real buyer feedback",
                        ],
                    },
                    {
                        "theme": "Rapid Time to Value",
                        "description": (
                            "Get actionable campaign assets in minutes, not weeks."
                        ),
                        "evidence": [
                            "Automated campaign generation",
                            "No manual copywriting required",
                        ],
                    },
                ],
            }
        }


class ICPRequest(BaseModel):
    website_url: str
    user_inputted_context: Optional[str] = None
    llm_inferred_context: Optional[str] = None


@app.post(
    "/campaigns/positioning",
    response_model=PositioningResponse,
    summary="Generate Unique Insight and Unique Selling Points",
    tags=["Campaigns", "Positioning", "AI"],
    response_description=(
        "A unique insight and a list of unique selling points for the given company context."
    ),
)
async def generate_positioning(data: PositioningRequest):
    """
    Generate a Unique Insight (core reframe) and Unique Selling Points (USPs) for a B2B startup.

    - **Purpose:** Generate a Unique Insight and USPs based on company description, website, and
      (optionally) ICP.
    - **Follows:** API design best practices and the unique insight/USP methodology described in the
      project documentation.
    - **Request Example:**
        {
            "website_url": "https://example.com",
            "description": "AI-powered marketing automation for SMBs",
            "icp": "B2B SaaS startups"
        }
    - **Response Example:**
        {
            "unique_insight": (
                "Most B2B marketing tools focus on automation, but the real bottleneck is "
                "understanding what actually resonates with buyers. "
                "It's not about volume, but about crafting the right message for the "
                "right ICP at the right time."
            ),
            "unique_selling_points": [
                {
                    "theme": "Buyer-Centric Messaging",
                    "description": (
                        "Delivers messaging tailored to the emotional and practical needs of "
                        "your ICP."
                    ),
                    "evidence": [
                        "Analyzes ICP pain points and language",
                        "Adapts messaging based on real buyer feedback"
                    ]
                },
                {
                    "theme": "Rapid Time to Value",
                    "description": (
                        "Get actionable campaign assets in minutes, not weeks."
                    ),
                    "evidence": [
                        "Automated campaign generation",
                        "No manual copywriting required"
                    ]
                }
            ]
        }
    """
    return PositioningResponse(
        unique_insight=(
            "Most B2B marketing tools focus on automation, but the real bottleneck is "
            "understanding what actually resonates with buyers. Blossomer reframes the "
            "problem: it's not about sending more messages, but about crafting the right "
            "message for the right ICP at the right time."
        ),
        unique_selling_points=[
            UniqueSellingPoint(
                theme="Buyer-Centric Messaging",
                description=(
                    "Delivers messaging tailored to the emotional and practical needs of "
                    "your ICP."
                ),
                evidence=[
                    "Analyzes ICP pain points and language",
                    "Adapts messaging based on real buyer feedback",
                ],
            ),
            UniqueSellingPoint(
                theme="Rapid Time to Value",
                description=("Get actionable campaign assets in minutes, not weeks."),
                evidence=[
                    "Automated campaign generation",
                    "No manual copywriting required",
                ],
            ),
        ],
    )


@app.post(
    "/campaigns/icp",
    summary="Generate Ideal Customer Profile (ICP)",
    response_description="A structured ICP definition for the given company context.",
)
async def generate_icp(data: ICPRequest):
    """
    Generate an Ideal Customer Profile (ICP) for a B2B startup using website content and user context.
    """
    # 1. Scrape website content
    try:
        website_data = extract_website_content(data.website_url)
        raw_content = website_data.get("markdown") or website_data.get("content") or ""
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Website scraping failed: {e}")

    # 2. Preprocess content (chunk, summarize, filter)
    pipeline = ContentPreprocessingPipeline(
        SectionChunker(), LangChainSummarizer(), BoilerplateFilter()
    )
    processed_chunks = pipeline.process(raw_content)
    processed_content = "\n".join(processed_chunks)

    # 3. Build prompt using Jinja2 template
    context = ICPPromptVars(
        user_inputted_context=data.user_inputted_context,
        llm_inferred_context=data.llm_inferred_context,
        website_content=processed_content,
    )
    prompt = render_prompt("icp", context)

    # 4. Call LLM with structured output
    llm_request = LLMRequest(
        prompt=prompt,
        response_schema=ICP_SCHEMA,
    )
    try:
        llm_response = await llm_client.generate(llm_request)
        icp_json = json.loads(llm_response.text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM output was not valid JSON or LLM call failed: {e}",
        )

    return icp_json


@app.post(
    "/campaigns/product_overview",
    response_model=ProductOverviewResponse,
    summary="Generate Product Overview (features, company & persona profiles, pricing)",
    tags=["Campaigns", "Product Overview", "AI"],
    response_description="A structured product overview for the given company context.",
)
async def generate_product_overview(data: ProductOverviewRequest):
    """
    Generate a comprehensive product overview for a B2B company using website content
    and user context.
    - Scrapes and assesses website content quality
    - Calls LLM to generate structured overview
    """
    import logging

    logger = logging.getLogger(__name__)
    orchestrator = ContextOrchestrator(llm_client)
    logger.debug(
        f"[API] Orchestrating context for product_overview: {data.website_url}"
    )
    orchestration_result = await orchestrator.orchestrate_context(
        website_url=data.website_url,
        target_endpoint="product_overview",
        user_context=None,
        auto_enrich=True,
    )
    assessment = orchestration_result["assessment"]
    readiness = orchestrator.check_endpoint_readiness(assessment, "product_overview")
    logger.debug(f"[API] Readiness for product_overview: {readiness}")
    if not readiness["is_ready"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Insufficient content quality for product overview",
                "quality_assessment": assessment.overall_quality.value,
                "confidence": readiness["confidence"],
                "missing_requirements": readiness["missing_requirements"],
                "recommendations": readiness["recommendations"],
            },
        )
    # Use enriched content if needed (for now, use processed_content as before)
    # 2. Preprocess content (chunk, summarize, filter)
    website_data = orchestration_result["enriched_content"].get("initial")
    # If assessment contains website content, use it; else fallback to scraping
    if hasattr(website_data, "website_content") and website_data.website_content:
        processed_content = website_data.website_content
    else:
        try:
            website_data_raw = extract_website_content(data.website_url)
            raw_content = (
                website_data_raw.get("markdown")
                or website_data_raw.get("content")
                or ""
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Website scraping failed: {e}")
        pipeline = ContentPreprocessingPipeline(
            SectionChunker(), LangChainSummarizer(), BoilerplateFilter()
        )
        processed_chunks = pipeline.process(raw_content)
        processed_content = "\n".join(processed_chunks)
    # 4. Build prompt variables
    prompt_vars = ProductOverviewPromptVars(
        website_content=processed_content,
        user_inputted_context=data.user_inputted_context,
        llm_inferred_context=data.llm_inferred_context,
        context_quality=assessment.overall_quality.value,
        assessment_summary=assessment.summary,
    )
    prompt = render_prompt("product_overview", prompt_vars)
    # 5. Call LLM and parse output
    try:
        llm_request = LLMRequest(prompt=prompt)
        llm_response = await llm_client.generate(llm_request)
        response_json = llm_response.text
        # Parse as ProductOverviewResponse (Pydantic will validate fields)
        return ProductOverviewResponse.parse_raw(response_json)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=("LLM output was not valid JSON or LLM call failed: " f"{e}"),
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}
