"""
AI infrastructure package
"""
from typing import Optional
from config.settings import settings
from infrastructure.ai.llm_provider import LLMProvider
from infrastructure.ai.mock_provider import MockLLMProvider

def get_llm_provider() -> LLMProvider:
    """
    Factory to get the configured LLM provider.
    """
    provider_type = settings.AI_PROVIDER.lower()
    
    if provider_type == "gemini":
        from infrastructure.ai.gemini_provider import GeminiProvider
        return GeminiProvider()
    elif provider_type == "openai":
        # from infrastructure.ai.openai_provider import OpenAIProvider
        # return OpenAIProvider()
        return MockLLMProvider() # Fallback for now
    else:
        return MockLLMProvider()
