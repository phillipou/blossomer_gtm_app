"""
registry.py - Template registry and selector logic for prompt templates.
"""

from backend.app.prompts.models import (
    ProductOverviewPromptVars,
    TargetAccountPromptVars,
    TargetPersonaPromptVars,
    EmailGenerationPromptVars,
)
from .base import render_template
from pydantic import BaseModel
from typing import Dict, Type, Tuple, Optional
from typing_extensions import TypedDict


class TemplateEntry(TypedDict):
    model: Type[BaseModel]
    template: str


TEMPLATE_REGISTRY: Dict[str, TemplateEntry] = {
    "product_overview": {
        "model": ProductOverviewPromptVars,
        "template": "product_overview",
    },
    "target_account": {"model": TargetAccountPromptVars, "template": "target_account"},
    "target_persona": {"model": TargetPersonaPromptVars, "template": "target_persona"},
    "email_generation": {
        "model": EmailGenerationPromptVars,
        "template": "email_generation",
    },
    "email_generation_blossomer": {
        "model": EmailGenerationPromptVars,
        "template": "email_generation_blossomer",
    },
    "email_generation_custom": {
        "model": EmailGenerationPromptVars,
        "template": "email_generation_custom",
    },
    # Add more templates here
}


def render_prompt(
    template_name: str, variables: BaseModel
) -> Tuple[Optional[str], str]:
    """
    Render a prompt template with the given variables.
    Returns a tuple of (system_prompt, user_prompt).
    """
    entry = TEMPLATE_REGISTRY[template_name]
    if not isinstance(variables, BaseModel):
        raise TypeError(
            f"variables must be a Pydantic BaseModel instance, got {type(variables)}"
        )
    # Ensure all fields, including target_company_name, are included
    context = variables.model_dump()
    return render_template(entry["template"], context)
