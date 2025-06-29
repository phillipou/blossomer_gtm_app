"""
base.py - Core template engine logic for prompt rendering and validation.
"""

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

TEMPLATE_DIR = Path(__file__).parent / "templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=select_autoescape(["jinja2"])
)


def render_template(template_name: str, variables: dict) -> str:
    """
    Render a Jinja2 template with the given variables.
    """
    template = env.get_template(f"{template_name}.jinja2")
    return template.render(**variables)
