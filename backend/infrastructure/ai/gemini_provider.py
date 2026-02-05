"""
Gemini LLM Provider - Implementation using Google Generative AI
"""
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import json
import logging
from decimal import Decimal

from infrastructure.ai.llm_provider import LLMProvider
from config.settings import settings

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    """
    Implementation of LLMProvider using Google Gemini.
    """
    
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        else:
            logger.warning("GEMINI_API_KEY not set. GeminiProvider will not work.")
            self.model = None

    async def parse_order_from_text(
        self,
        user_input: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse order using Gemini.
        """
        if not self.model:
            return {"error": "AI provider not configured"}

        prompt = f"""
        Bạn là một trợ lý bán hàng chuyên nghiệp cho phần mềm BizFlow (Việt Nam).
        Nhiệm vụ của bạn là trích xuất thông tin đơn hàng từ tin nhắn của khách hàng.
        
        Nội dung tin nhắn: "{user_input}"
        
        Ngữ cảnh cửa hàng:
        - Danh sách sản phẩm: {context.get('products', [])}
        - Danh sách khách hàng: {context.get('customers', [])}
        
        Yêu cầu trả về định dạng JSON duy nhất như sau:
        {{
            "customer": {{"name": "...", "phone": "..."}},
            "items": [
                {{"product": "tên sản phẩm", "quantity": số lượng, "unit": "đơn vị"}}
            ],
            "payment": {{"method": "CASH/BANK_TRANSFER", "paid_amount": số tiền}},
            "confidence": 0.0 đến 1.0,
            "missing_fields": ["danh sách trường thiếu"],
            "questions": ["câu hỏi để lấy thêm thông tin"]
        }}
        
        Lưu ý: 
        1. Nếu không tìm thấy tên sản phẩm trong ngữ cảnh, hãy dùng tên người dùng nhập.
        2. Nếu không có số lượng, mặc định là 1.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Find JSON block in response
            text = response.text
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            return {"error": "Failed to parse AI response"}
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return {"error": str(e)}

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Gemini doesn't support embedding directly via GenerativeModel standard call usually,
        but we can use genai.embed_content.
        """
        if not settings.GEMINI_API_KEY:
            return [0.0] * 768
            
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            return [0.0] * 768

    async def generate_business_summary(
        self,
        data: Dict[str, Any]
    ) -> str:
        """
        Generate business summary using Gemini.
        """
        if not self.model:
            return "AI chưa được cấu hình."

        prompt = f"""
        Dựa trên dữ liệu kinh doanh sau của BizFlow, hãy viết một bản tóm tắt ngắn gọn, chuyên nghiệp bằng tiếng Việt:
        - Doanh thu: {data.get('revenue'):,.0f} VNĐ
        - Số đơn hàng: {data.get('orders')}
        - Tổng nợ chưa thu: {data.get('debt'):,.0f} VNĐ
        - Số mặt hàng sắp hết kho: {data.get('low_stock')}
        
        Hãy đưa ra lời khuyên hành động cụ thể cho chủ cửa hàng.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Lỗi AI: {e}"

    async def forecast_inventory(
        self,
        history_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Forecast inventory using Gemini.
        """
        if not self.model:
            return []

        prompt = f"""
        Dựa trên lịch sử xuất nhập kho sau, hãy dự báo ngày cần nhập hàng tiếp theo và số lượng đề xuất cho mỗi sản phẩm.
        Dữ liệu: {json.dumps(history_data)}
        
        Trả về JSON list:
        [{{
            "product_id": int,
            "days_left": float,
            "restock_date": "YYYY-MM-DD",
            "recommended_quantity": float,
            "confidence": float
        }}]
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            json_start = text.find('[')
            json_end = text.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            return []
        except Exception as e:
            logger.error(f"Gemini forecast error: {e}")
            return []
