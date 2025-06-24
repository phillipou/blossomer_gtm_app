import os
import time
import json
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from blossomer_gtm_api.prompts.registry import render_prompt
from blossomer_gtm_api.prompts.models import ICPPromptVars
from blossomer_gtm_api.services.website_scraper import extract_website_content
from blossomer_gtm_api.services.llm_service import LLMClient, LLMRequest, OpenAIProvider

load_dotenv()
logging.basicConfig(level=logging.INFO)

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
    tags=["Campaigns", "ICP", "AI"],
    response_description="A structured ICP definition for the given company context.",
)
async def generate_icp(data: ICPRequest):
    """
    Generate a structured Ideal Customer Profile (ICP) for a B2B SaaS company.
    """
    # 1. Context resolution with retry logic for website scraping
    website_content = None
    if not (data.user_inputted_context or data.llm_inferred_context):
        max_retries = 3
        delay = 2  # seconds
        for attempt in range(max_retries):
            try:
                website_content = extract_website_content(data.website_url).get(
                    "content", ""
                )
                if isinstance(website_content, list):
                    # Join list of content chunks into a single string for prompt compatibility
                    website_content = "\n\n".join(website_content)
                break  # Success, exit retry loop
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(delay)
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Website scrape failed after {max_retries} attempts: {e}"
                        ),
                    )

    # Ensure website_content is a string for ICPPromptVars
    if isinstance(website_content, list):
        website_content = "\n\n".join(website_content)

    # 2. Render the prompt using your template system
    prompt_vars = ICPPromptVars(
        user_inputted_context=data.user_inputted_context,
        llm_inferred_context=data.llm_inferred_context,
        website_content=website_content,
    )
    prompt = render_prompt("icp", prompt_vars)

    # Logging prompt and API key presence
    print("=== FULL LLM PROMPT ===")
    print(prompt)
    logging.info(f"Prompt sent to LLM (first 500 chars): {prompt[:500]}...")
    logging.info(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}")

    # 3. Call the LLM via the abstraction layer
    try:
        llm_request = LLMRequest(prompt=prompt)
        llm_response = await llm_client.generate(llm_request)
    except Exception as e:
        logging.exception("LLM provider error")
        raise HTTPException(status_code=502, detail=f"LLM provider error: {e}")

    # 4. Parse the LLM output as JSON
    try:
        icp_json = json.loads(llm_response.text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM output was not valid JSON: {e}\nRaw output: {llm_response.text}",
        )

    # 5. Return the parsed JSON
    return icp_json


@app.get("/health")
def health_check():
    return {"status": "ok"}
