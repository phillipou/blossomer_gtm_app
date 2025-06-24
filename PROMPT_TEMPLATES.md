# Prompt Templating System

See the 'Prompt Templating System Architecture' section in ARCHITECTURE.md for a high-level overview and rationale.

---

## Purpose

The prompt templating system centralizes, manages, and renders all prompt templates for LLM providers, ensuring consistency, extensibility, and provider-agnostic design. It supports dynamic variable insertion, type-checked validation, and robust testing.

## Directory & Module Structure

```
src/blossomer_gtm_api/
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

## Key Components

- **Template Files:** Jinja2 templates for each campaign asset/use case
- **Template Engine:** Loads, renders, and validates templates
- **Pydantic Models:** Define expected variables for each template
- **Template Registry:** Maps use cases to templates and models

## Extensibility

- Add new templates by creating a new .jinja2 file, a Pydantic model, and registering in the registry
- Provider-agnostic: output is a plain string, ready for any LLM

## Security & Validation

- All variables are type-checked by Pydantic models
- Use Jinja2's autoescaping and/or sanitize variables as needed
- Clear errors for missing/invalid variables

## Testing

- Unit tests for template rendering, registry logic, and edge cases

## Usage Example

```python
from blossomer_gtm_api.prompts.registry import render_prompt

prompt = render_prompt(
    template_name="email_campaign",
    variables=EmailCampaignPromptVars(
        company_name="Acme Corp",
        icp_description="mid-size SaaS companies",
        value_props=["Fast integration", "24/7 support"],
        tone="professional"
    )
)
```

## Best Practices

- Centralize all templates in one place
- Use Pydantic for type safety
- Document each template and its variables
- Write unit tests for all templates and registry logic

---

For high-level rationale and architecture, see the relevant section in [ARCHITECTURE.md](ARCHITECTURE.md). 