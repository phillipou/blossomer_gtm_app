from backend.app.services.llm_service import (
    LLMClient,
    OpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
)

# Initialize LLMClient with all available providers
# The LLMService will automatically handle failover and provider selection
llm_client = LLMClient([OpenAIProvider(), AnthropicProvider(), GeminiProvider()])
