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
Bạn là trợ lý AI chuyên phân tích đơn hàng bằng tiếng Việt cho phần mềm quản lý bán hàng BizFlow.

NHIỆM VỤ: Trích xuất thông tin đơn hàng từ tin nhắn của khách hàng.

TIN NHẮN KHÁCH HÀNG:
"{user_input}"

HƯỚNG DẪN PHÂN TÍCH:
1. Tên khách hàng: Tìm tên người (Anh/Chị/Ông/Bà + tên).
2. Thông tin liên hệ: Trích xuất số điện thoại (10-11 số), địa chỉ nếu có.
3. Sản phẩm: 
   - Trích xuất TÊN SẢN PHẨM CHÍNH XÁC. KHÔNG bao gồm số lượng và đơn vị vào tên sản phẩm.
   - Ví dụ: "10 bao xi măng" → product_name: "Xi măng", quantity: 10, unit_name: "bao"
4. Số lượng: Nếu không có số, mặc định là 1.
5. Đơn vị: (bao, thùng, khối, xe, kg, tấn, cái, viên, mét, thanh, cuộn, lít...).
6. Thanh toán & Ghi nợ: 
   - Nếu có từ "nợ", "ghi nợ", "chưa trả tiền" → set "is_debt": true, "method": "CREDIT"
   - Ngược lại → set "is_debt": false, "method": "CASH"

VÍ DỤ PHÂN TÍCH:
Input: "Anh Đăng sđt 0909111222 lấy 10 bao xi măng, ghi nợ nhé"
Output: {{
    "customer": {{"name": "Anh Đăng", "phone": "0909111222", "address": "", "email": ""}},
    "items": [
        {{"product_name": "Xi măng", "quantity": 10, "unit_name": "bao", "unit_price": 0}}
    ],
    "payment": {{"method": "CREDIT", "is_debt": true, "paid_amount": 0}},
    "confidence": 0.98,
    "missing_fields": ["price"],
    "questions": []
}}

YÊU CẦU OUTPUT:
- Chỉ trả về JSON duy nhất, không có text khác.
- Tên sản phẩm sạch sẽ.
- Bắt buộc trả về flag is_debt (true/false).

BẮT ĐẦU PHÂN TÍCH:

        """
        
        try:
            response = self.model.generate_content(prompt)
            # Find JSON block in response
            text = response.text
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                parsed = json.loads(text[json_start:json_end])
                logger.info(f"Gemini parsed: {parsed}")
                return parsed
            logger.error(f"No JSON found in response: {text}")
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

    async def transcribe_audio(self, audio_file: bytes) -> str:
        """
        Transcribe audio using Gemini 1.5 Flash (multimodal).
        """
        if not self.model:
            return ""
            
        try:
            # Gemini 1.5 Flash supports audio directly
            # We need to pass the bytes with mime_type
            
            prompt = "Hãy nghe đoạn ghi âm này và viết lại chính xác nội dung bằng tiếng Việt."
            
            response = self.model.generate_content([
                prompt,
                {
                    "mime_type": "audio/mp3",
                    "data": audio_file
                }
            ])
            
            logger.info(f"Gemini transcription: {response.text}")
            return response.text
        except Exception as e:
            logger.error(f"Gemini transcription error: {e}")
            # Fallback or re-raise? For now return empty string or error message
            return ""
