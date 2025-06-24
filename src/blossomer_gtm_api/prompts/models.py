"""
models.py - Pydantic models for prompt template variables.
"""

from pydantic import BaseModel
from typing import Optional


class ICPPromptVars(BaseModel):
    user_inputted_context: Optional[str] = None
    llm_inferred_context: Optional[str] = None
    website_content: Optional[str] = None
