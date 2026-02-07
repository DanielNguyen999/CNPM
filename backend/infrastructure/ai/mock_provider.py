"""
Mock LLM Provider - For demo without API keys
"""
from typing import Dict, Any, List
import re
import random
from decimal import Decimal
from datetime import date, timedelta

from infrastructure.ai.llm_provider import LLMProvider


class MockLLMProvider(LLMProvider):
    """
    Mock LLM provider for demo purposes.
    Parses simple Vietnamese orders using regex patterns.
    """
    
    async def parse_order_from_text(
        self,
        user_input: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse Vietnamese order using VietnameseVoiceParser (enhanced regex logic).
        
        Supports patterns like:
        - "Anh Minh đặt 2 bánh mì cộng 3 nước cho khách Hương"
        - "5 bao xi măng Hà Tiên cho anh Toàn"
        """
        from infrastructure.ai.parser import VietnameseVoiceParser
        parser = VietnameseVoiceParser()
        parsed = parser.parse(user_input)
        
        result = {
            "customer": {"name": parsed["customer_name"]},
            "items": [],
            "payment": {"method": "CASH", "paid_amount": 0},
            "confidence": 0.0,
            "missing_fields": [],
            "questions": [],
            "delivery_note": ""
        }
        
        # Chuyển đổi format items từ parser sang format của BizFlow LLM Provider
        for item in parsed["items"]:
            result["items"].append({
                "product_name": item["product_name"],
                "quantity": item["quantity"],
                "unit_name": item.get("unit_name", ""),
                "unit_price": 0 # Mặc định để người dùng điền hoặc tìm từ DB sau
            })
            
        # Tính toán confidence score
        confidence = 0.0
        if result["customer"].get("name") and result["customer"]["name"] != "Khách Lẻ":
            confidence += 0.5
        if result["items"]:
            confidence += 0.4
            
        result["confidence"] = round(confidence, 2)
        
        # Xác định các trường còn thiếu
        if result["customer"]["name"] == "Khách Lẻ":
            result["missing_fields"].append("customer_name")
            result["questions"].append("Đây có phải đơn cho Khách Lẻ không, hay cho khách hàng cụ thể nào?")
            
        if not result["items"]:
            result["missing_fields"].append("items")
            result["questions"].append("Vui lòng cho biết sản phẩm và số lượng đặt hàng.")
            
        return result
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate mock embedding (random vector).
        In production, this would use OpenAI or similar.
        """
        # Generate consistent random embedding based on text hash
        random.seed(hash(text))
        return [random.random() for _ in range(384)]  # 384-dim vector

    async def generate_business_summary(
        self,
        data: Dict[str, Any]
    ) -> str:
        """
        Generate a mock Vietnamese summary of business performance.
        """
        revenue = data.get("revenue", 0)
        orders = data.get("orders", 0)
        debt = data.get("debt", 0)
        low_stock = data.get("low_stock", 0)
        
        summary = f"Tổng kết kinh doanh: Hôm nay cửa hàng ghi nhận doanh thu {revenue:,.0f} VNĐ từ {orders} đơn hàng. "
        
        if debt > 0:
            summary += f"Hiện còn {debt:,.0f} VNĐ nợ chưa thu hồi. "
        else:
            summary += "Tình hình công nợ ổn định. "
            
        if low_stock > 0:
            summary += f"Cảnh báo: Có {low_stock} mặt hàng sắp hết kho, cần lưu ý nhập hàng sớm."
        else:
            summary += "Kho hàng vẫn đảm bảo số lượng cần thiết."
            
        return summary

    async def forecast_inventory(
        self,
        history_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Mock inventory forecasting.
        """
        predictions = []
        for item in history_data:
            product_id = item.get("product_id")
            current_qty = item.get("current_qty", 0)
            avg_daily_sales = item.get("avg_daily_sales", 1)
            
            # Simple linear forecast
            days_left = current_qty / avg_daily_sales if avg_daily_sales > 0 else 999
            
            predictions.append({
                "product_id": product_id,
                "days_left": round(days_left, 1),
                "restock_date": (date.today() + timedelta(days=int(days_left))).isoformat() if days_left < 365 else "N/A",
                "recommended_quantity": avg_daily_sales * 14, # Restock for 2 weeks
                "confidence": 0.7
            })
            
        return predictions
