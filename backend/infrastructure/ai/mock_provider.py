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
        Parse Vietnamese order using simple pattern matching.
        
        Supports patterns like:
        - "Anh Minh gọi đặt 5 bao xi măng"
        - "Chị Lan cần 10 thùng Coca, giao chiều nay"
        - "Khách hàng ABC đặt 20 viên gạch Đồng Tâm"
        """
        
        result = {
            "customer": {},
            "items": [],
            "payment": {"method": "CASH", "paid_amount": 0},
            "confidence": 0.0,
            "missing_fields": [],
            "questions": []
        }
        
        # Extract customer name
        customer_patterns = [
            r"(Anh|Chị|Ông|Bà|Cô|Chú)\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)",
            r"Khách hàng\s+([A-Z0-9]+)",
            r"Quán\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)",
            r"([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)\s+gọi"  # "Minh gọi đặt..."
        ]
        
        for pattern in customer_patterns:
            match = re.search(pattern, user_input)
            if match:
                if len(match.groups()) == 2:
                    result["customer"]["name"] = f"{match.group(1)} {match.group(2)}"
                else:
                    result["customer"]["name"] = match.group(1)
                break
        
        # Extract phone number - improved patterns
        phone_patterns = [
            r"(?:sđt|số|phone|dt|điện thoại)[\s:]*([0-9]{9,11})",  # "sđt 0912345678"
            r"([0-9]{10,11})(?=\s|$|,|\.|;)",  # standalone phone number
            r"0[0-9]{9,10}"  # Vietnamese phone format
        ]
        
        for pattern in phone_patterns:
            phone_match = re.search(pattern, user_input, re.IGNORECASE)
            if phone_match:
                phone = phone_match.group(1) if phone_match.lastindex else phone_match.group(0)
                # Clean phone number
                phone = re.sub(r'\D', '', phone)
                if len(phone) >= 9 and phone.startswith('0'):
                    result["customer"]["phone"] = phone
                    break
        
        # Extract items (quantity + unit + product) - improved patterns
        item_patterns = [
            # Pattern 1: "5 bao xi măng"
            r"(\d+)\s+(bao|thùng|cái|viên|kg|tấn|lít|mét|m²|gói|chai|hộp|lon|túi)\s+([a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+?)(?=\,|\.|$|và|giao|nhận|sđt|số|phone)",
            # Pattern 2: "xi măng 5 bao" (reversed)
            r"([a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+?)\s+(\d+)\s+(bao|thùng|cái|viên|kg|tấn|lít|mét|m²|gói|chai|hộp|lon|túi)(?=\,|\.|$|và|giao)",
        ]
        
        for pattern in item_patterns:
            matches = re.finditer(pattern, user_input, re.IGNORECASE)
            for match in matches:
                if len(match.groups()) == 3:
                    # Check if first group is number or product name
                    if match.group(1).isdigit():
                        # Pattern 1: quantity unit product
                        quantity = int(match.group(1))
                        unit = match.group(2)
                        product_name = match.group(3).strip()
                    else:
                        # Pattern 2: product quantity unit
                        product_name = match.group(1).strip()
                        quantity = int(match.group(2))
                        unit = match.group(3)
                    
                    result["items"].append({
                        "product": product_name,
                        "quantity": quantity,
                        "unit": unit
                    })
        
        # Calculate confidence
        confidence = 0.0
        if result["customer"].get("name"):
            confidence += 0.4
        if result["items"]:
            confidence += 0.4
        if result["customer"].get("phone"):
            confidence += 0.2
        
        result["confidence"] = round(confidence, 2)
        
        # Identify missing fields
        if not result["customer"].get("name"):
            result["missing_fields"].append("customer_name")
            result["questions"].append("Tên khách hàng là gì?")
        
        if not result["customer"].get("phone"):
            result["missing_fields"].append("customer_phone")
            result["questions"].append("Số điện thoại khách hàng?")
        
        if not result["items"]:
            result["missing_fields"].append("items")
            result["questions"].append("Khách đặt sản phẩm gì?")
        
        # Extract delivery notes
        delivery_patterns = [
            r"giao\s+(.*?)(?=\.|$)",
            r"nhận\s+(.*?)(?=\.|$)"
        ]
        
        for pattern in delivery_patterns:
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                result["delivery_note"] = match.group(1).strip()
                break
        
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
