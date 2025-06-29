# Prompt Templating System

See the 'Prompt Templating System Architecture' section in backend_architecture.md for a high-level overview and rationale.

---

## Purpose

The prompt templating system centralizes, manages, and renders all prompt templates for LLM providers, ensuring consistency, extensibility, and provider-agnostic design. It supports dynamic variable insertion, type-checked validation, and robust testing.

## Directory & Module Structure

```
backend/app/
  prompts/
    __init__.py
    base.py                # Core template engine logic (rendering, validation)
    templates/
      __init__.py
      email_campaign.jinja2
      positioning_canvas.jinja2
      enrichment_blueprint.jinja2
    models.py              # Pydantic models for template variables
    registry.py            # Template registry/selector logic
```

from backend.app.prompts.registry import render_prompt