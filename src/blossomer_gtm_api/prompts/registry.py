"""
registry.py - Template registry and selector logic for prompt templates.
"""

from .models import ICPPromptVars
from .base import render_template
from pydantic import BaseModel


TEMPLATE_REGISTRY = {
    "icp": {"model": ICPPromptVars, "template": "icp"},
    # Add more templates here
}


def render_prompt(template_name: str, variables: BaseModel) -> str:
    entry = TEMPLATE_REGISTRY[template_name]
    validated = entry["model"].parse_obj(variables)
    return render_template(entry["template"], validated.dict())
