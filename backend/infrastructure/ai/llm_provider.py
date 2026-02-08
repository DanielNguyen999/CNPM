"""
LLM Provider Interface - Abstract interface for AI providers
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from decimal import Decimal


class LLMProvider(ABC):
    """
    Abstract interface for LLM providers.
    Allows switching between OpenAI, Gemini, or Mock provider.
    """
    
    @abstractmethod
    async def parse_order_from_text(
        self,
        user_input: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse Vietnamese natural language order into structured data.
        
        Args:
            user_input: Vietnamese text input
            context: Context data (owner_id, available products, customers, etc.)
        
        Returns:
            {
                "customer": {"name": str, "phone": str, ...},
                "items": [{"product": str, "quantity": float, "unit": str}, ...],
                "payment": {"method": str, "paid_amount": float},
                "confidence": float,  # 0.0 to 1.0
                "missing_fields": [str, ...],
                "questions": [str, ...]
            }
        """
        pass
    
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate text embedding for RAG.
        """
        pass

    @abstractmethod
    async def generate_business_summary(
        self,
        data: Dict[str, Any]
    ) -> str:
        """
        Generate a Vietnamese summary of business performance.
        
        Args:
            data: Aggregated business metrics (revenue, orders, debt, etc.)
            
        Returns:
            Vietnamese text summary
        """
        pass

    @abstractmethod
    async def forecast_inventory(
        self,
        history_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Predict restock dates and potential shortages.
        
        Args:
            history_data: Historical inventory and sales movements
            
        Returns:
            Predictions list
        """
        pass

    @abstractmethod
    async def transcribe_audio(self, audio_file: bytes) -> str:
        """
        Transcribe audio file to text.
        """
        pass
