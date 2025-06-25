"""
registry.py - Template registry and selector logic for prompt templates.
"""

from .models import ICPPromptVars, ProductOverviewPromptVars, ContextAssessmentVars
from .base import render_template
from pydantic import BaseModel


TEMPLATE_REGISTRY = {
    "icp": {"model": ICPPromptVars, "template": "icp"},
    "product_overview": {
        "model": ProductOverviewPromptVars,
        "template": "product_overview",
    },
    "context_assessment": {
        "model": ContextAssessmentVars,
        "template": "context_assessment",
    },
    # Add more templates here
}


def render_prompt(template_name: str, variables: BaseModel) -> str:
    entry = TEMPLATE_REGISTRY[template_name]
    validated = entry["model"].parse_obj(variables)
    return render_template(entry["template"], validated.dict())
