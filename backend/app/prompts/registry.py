"""
registry.py - Template registry and selector logic for prompt templates.
"""

from backend.app.prompts.models import (
    ProductOverviewPromptVars,
    ContextAssessmentVars,
    TargetCompanyPromptVars,
    TargetPersonaPromptVars,
)
from .base import render_template
from pydantic import BaseModel
from typing import Dict, Type
from typing_extensions import TypedDict


class TemplateEntry(TypedDict):
    model: Type[BaseModel]
    template: str


TEMPLATE_REGISTRY: Dict[str, TemplateEntry] = {
    "product_overview": {
        "model": ProductOverviewPromptVars,
        "template": "product_overview",
    },
    "context_assessment": {
        "model": ContextAssessmentVars,
        "template": "context_assessment",
    },
    "target_company": {"model": TargetCompanyPromptVars, "template": "target_company"},
    "target_persona": {"model": TargetPersonaPromptVars, "template": "target_persona"},
    # Add more templates here
}


def render_prompt(template_name: str, variables: BaseModel) -> str:
    entry = TEMPLATE_REGISTRY[template_name]
    if not isinstance(variables, BaseModel):
        raise TypeError(
            f"variables must be a Pydantic BaseModel instance, got {type(variables)}"
        )
    return render_template(entry["template"], variables.model_dump())
