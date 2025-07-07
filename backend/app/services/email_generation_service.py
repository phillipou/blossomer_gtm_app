import logging
import time
import uuid
from typing import Dict, Any
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.context_orchestrator_service import ContextOrchestratorService
from backend.app.prompts.models import EmailGenerationPromptVars
from backend.app.schemas import (
    EmailGenerationRequest, 
    EmailGenerationResponse,
    get_default_email_breakdown
)

logger = logging.getLogger(__name__)


async def generate_email_campaign_service(
    data: EmailGenerationRequest,
    orchestrator: ContextOrchestrator,
) -> EmailGenerationResponse:
    """
    Orchestrates the generation of a personalized email campaign using the shared
    analysis service. Synthesizes company context, target account/persona data,
    and user preferences into compelling email content.
    """
    start_time = time.time()
    generation_id = str(uuid.uuid4())
    
    try:
        logger.info(f"Starting email generation {generation_id}")
        
        # Use the context orchestrator service for LLM generation
        service = ContextOrchestratorService(
            orchestrator=orchestrator,
            preprocessing_pipeline=None,  # No preprocessing needed for email generation
        )
        
        # Generate the email using the LLM
        result = await service.analyze(
            request_data=data,
            analysis_type="email_generation",
            prompt_template="email_generation",
            prompt_vars_class=EmailGenerationPromptVars,
            response_model=EmailGenerationResponse,
            use_preprocessing=False  # No web scraping needed
        )
        result = EmailGenerationResponse.parse_obj(result)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        # Update metadata with actual processing time and generation ID
        if hasattr(result, 'metadata'):
            result.metadata.processing_time_ms = processing_time
            result.metadata.generation_id = generation_id
        
        logger.info(f"Email generation {generation_id} completed in {processing_time}ms")
        print(f"[EmailGenerationService] Email generation {generation_id} response: {result}")
        return result
        
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        logger.error(f"Email generation {generation_id} failed after {processing_time}ms: {str(e)}")
        
        # Return a fallback response on error
        from backend.app.schemas import EmailSubjects, EmailSegment, EmailGenerationMetadata
        
        fallback_response = EmailGenerationResponse(
            subjects=EmailSubjects(
                primary="Quick question about scaling your go-to-market",
                alternatives=[
                    "Thoughts on your current sales process?",
                    "5 minutes to discuss growth challenges?"
                ]
            ),
            email_body=[
                EmailSegment(text="Hi [First Name],", type="greeting"),
                EmailSegment(
                    text=(
                        "I noticed your company is in an interesting space. As someone who works with similar "
                        "companies, I'm curious about your current approach."
                    ),
                    type="opening"
                ),
                EmailSegment(
                    text=(
                        "Many companies in your situation struggle with scaling their go-to-market efforts "
                        "efficiently."
                    ),
                    type="pain-point"
                ),
                EmailSegment(
                    text=(
                        "That's exactly why we built our solution - to help companies streamline their sales "
                        "and marketing processes."
                    ),
                    type="solution"
                ),
                EmailSegment(
                    text=(
                        "We've helped similar companies achieve significant improvements in their conversion rates."
                    ),
                    type="evidence"
                ),
                EmailSegment(
                    text="Would you be open to a brief conversation about your current challenges?",
                    type="cta"
                ),
                EmailSegment(text="Best regards,\n[Your Name]", type="signature")
            ],
            breakdown=get_default_email_breakdown(),
            metadata=EmailGenerationMetadata(
                generation_id=generation_id,
                confidence=0.6,  # Lower confidence for fallback
                personalization_level="low",
                processing_time_ms=processing_time
            )
        )
        
        return fallback_response


def determine_personalization_level(
    opening_line_strategy: str,
    account_data: Dict[str, Any],
    persona_data: Dict[str, Any]
) -> str:
    """
    Determine the personalization level based on available data and strategy.
    
    Args:
        opening_line_strategy: buying-signal, company-research, or not-personalized
        account_data: Target account information
        persona_data: Target persona information
        
    Returns:
        Personalization level: high, medium, or low
    """
    if opening_line_strategy == "not-personalized":
        return "low"
    
    # Check for high-quality personalization data
    has_buying_signals = bool(account_data.get("buying_signals"))
    has_specific_company_info = bool(account_data.get("target_account_description"))
    has_persona_use_cases = bool(persona_data.get("use_cases"))
    
    if opening_line_strategy == "buying-signal" and has_buying_signals:
        return "high"
    elif opening_line_strategy == "company-research" and has_specific_company_info:
        return "high"
    elif has_persona_use_cases and has_specific_company_info:
        return "medium"
    else:
        return "low"


def validate_email_generation_context(data: EmailGenerationRequest) -> Dict[str, str]:
    """
    Validate that required context is available for email generation.
    
    Returns:
        Dictionary of validation warnings or empty dict if all good.
    """
    warnings = {}
    
    # Check company context completeness
    if not data.company_context.company_name:
        warnings["company_name"] = "Missing company name"
    
    if not data.company_context.capabilities:
        warnings["capabilities"] = "No capabilities listed"
        
    # Check target account context
    if not data.target_account.target_account_description:
        warnings["account_description"] = "Missing account description"
        
    # Check target persona context
    if not data.target_persona.use_cases:
        warnings["use_cases"] = "No use cases available for persona"
        
    if not data.target_persona.demographics.job_titles:
        warnings["job_titles"] = "No job titles specified for persona"
    
    return warnings