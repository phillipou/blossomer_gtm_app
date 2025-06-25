# ICP Endpoint Documentation

## Overview
The ICP (Ideal Customer Profile) endpoint generates a structured, actionable ICP definition for B2B SaaS products. It prioritizes user-provided context, then LLM-inferred context, and finally website content (scraped if needed) to produce a comprehensive ICP output.

## Input Parameters
- `website_url` (string, required): The company website to analyze if context is insufficient.
- `user_inputted_context` (string, optional): User-provided context for the ICP. Highest priority.
- `llm_inferred_context` (string, optional): LLM-inferred context, used if user input is not provided.

## Context Resolution Logic
1. If `user_inputted_context` is provided, use it as the main context.
2. Else, if `llm_inferred_context` is provided, use it.
3. Else, scrape the website using `website_url` (via the website scraper).
4. Optionally, combine/merge these for reinforcement or backfilling.

## Example Request
```json
{
  "website_url": "https://acme.dev",
  "user_inputted_context": "We target early-stage SaaS companies with lean engineering teams.",
  "llm_inferred_context": null
}
```

## Example Response
```
### Target Company Hypothesis
Venture-backed B2B SaaS startups using AWS/Kubernetes, typically in Seed to Series A.

### Target Company Attributes
- Employees: 11-200
- Industry: Developer Tools, Infrastructure, Fintech
- Tech: AWS, Kubernetes (EKS)
- Funding: Seed-Series A

### Target Company Buying Signals
- Hiring for DevOps roles
- Tech stack: AWS, Kubernetes, Terraform
- Headcount growth > 10%
- Recent funding round

### Target Company Rationale
These companies are scaling infrastructure, have lean teams, and are investing in automation.

### Primary Persona Hypothesis
Founding Engineer or CTO responsible for infrastructure decisions.

### Primary Persona Attributes
- Title: Founding Engineer, CTO, VP Engineering
- Seniority: Executive/Founder

### Primary Persona Buying Signals
- Recent LinkedIn post about scaling
- Tenure in role: 6-12 months

### Primary Persona Rationale
This persona owns infrastructure and is motivated to improve efficiency and scalability.
```

## Output Schema
- Markdown with clear section headers for each ICP component:
  - Target Company Hypothesis
  - Target Company Attributes
  - Target Company Buying Signals
  - Target Company Rationale
  - Primary Persona Hypothesis
  - Primary Persona Attributes
  - Primary Persona Buying Signals
  - Primary Persona Rationale

## Prompt Template Reference
- See the "ICP Prompt Template Design" section in [PROMPT_TEMPLATES.md](../../PROMPT_TEMPLATES.md) for the full template and variable model.

## Business Context
- See [PRD.md](../../PRD.md) for product requirements and rationale.

## Extensibility & Best Practices
- The endpoint is designed to be extensible for new ICP fields or output formats.
- Always validate and sanitize input.
- Use the prompt template system for all LLM requests to ensure consistency and maintainability. 