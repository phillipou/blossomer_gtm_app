# Prompt Templating System

See the 'Prompt Templating System Architecture' section in backend_architecture.md for a high-level overview and rationale.

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

## Integration with LLM Abstraction Layer

The prompt templating system is a foundational component of the Blossomer LLM provider abstraction architecture. It is designed to be fully provider-agnostic and decoupled from any specific LLM implementation. The system outputs validated prompt strings, which are then consumed by the LLM abstraction layer (see `llm_service.py`).

### Architectural Rationale
- **Separation of Concerns:** Prompt construction, variable validation, and template management are handled entirely within the prompt system. LLM provider adapters are only responsible for sending plain prompt strings and receiving outputs.
- **Provider Agnosticism:** The prompt system does not contain any provider-specific logic. This allows new LLM providers to be added or swapped in the abstraction layer without changing prompt construction logic.
- **Type Safety and Validation:** All variables for prompt templates are validated using Pydantic models before rendering. This ensures that only well-formed, type-safe prompts are sent to LLMs, reducing runtime errors and improving reliability.
- **Testability:** Prompt rendering and validation can be unit tested independently of LLM provider integrations.

### Extension Workflow
- **Adding a New Campaign Asset or Use Case:**
  1. Create a new Jinja2 template file in `prompts/templates/`.
  2. Define a new Pydantic model for the template variables in `prompts/models.py`.
  3. Register the template and model in `prompts/registry.py`.
  4. The LLM abstraction layer will consume the rendered prompt string as input, regardless of provider.
- **Adding a New LLM Provider:**
  1. Implement a new provider adapter in the LLM abstraction layer (see `llm_service.py`), following the `BaseLLMProvider` interface.
  2. No changes are needed to the prompt system; it continues to output provider-agnostic prompt strings.

### Usage in the LLM Abstraction Layer
- The LLM abstraction layer (see `llm_service.py`) expects all prompts to be rendered and validated by the prompt system before being sent to any provider.
- This ensures that all LLM requests are consistent, type-safe, and maintainable across the entire system.

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

For high-level rationale and architecture, see the relevant section in [backend_architecture.md](backend_architecture.md). 