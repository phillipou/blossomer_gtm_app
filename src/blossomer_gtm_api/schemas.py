"""
schemas.py - Centralized LLM output schemas for Blossomer GTM API

This module defines JSON schemas for LLM structured outputs, enabling reuse and validation.
"""

ICP_SCHEMA = {
    "type": "object",
    "properties": {
        "target_company": {"type": "string"},
        "company_attributes": {
            "type": "array",
            "items": {"type": "string"},
        },
        "buying_signals": {
            "type": "array",
            "items": {"type": "string"},
        },
        "persona": {"type": "string"},
        "persona_attributes": {
            "type": "array",
            "items": {"type": "string"},
        },
        "persona_buying_signals": {
            "type": "array",
            "items": {"type": "string"},
        },
        "rationale": {"type": "string"},
    },
    "required": [
        "target_company",
        "company_attributes",
        "buying_signals",
        "persona",
        "persona_attributes",
        "persona_buying_signals",
        "rationale",
    ],
}
