import re
from typing import List, Dict, Any, Optional

class VietnameseVoiceParser:
    """
    Parser chuyên dụng cho tiếng nói người Việt (Ported & Enhanced from CNPM-1).
    Chuyển đổi văn bản thô từ Voice/STT thành cấu trúc Draft Order JSON.
    """
    
    NUMBER_MAPPING = {
        'không': '0', 'một': '1', 'hai': '2', 'ba': '3', 'bốn': '4', 
        'năm': '5', 'sáu': '6', 'bảy': '7', 'tám': '8', 'chín': '9', 'mười': '10'
    }

    SEPARATORS = [r'\+', r'cộng', r'và', r'với', r'plus', r',']

    def __init__(self):
        pass

    def normalize_text(self, text: str) -> str:
        """Chuẩn hóa văn bản, xóa dấu phụ (options) và lowercase."""
        text = text.lower().strip()
        # Thay thế từ chỉ số thành chữ số
        for word, digit in self.NUMBER_MAPPING.items():
            text = re.sub(rf'\b{word}\b', digit, text)
        return text

    def parse(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse text thô thành Draft Order.
        
        Hỗ trợ nhiều pattern:
        - "Anh Đăng 10 bao xi măng Long An"
        - "Bán 2 bánh mì cộng 3 nước lọc cho anh Nam"
        - "Chị Lan cần 15 thùng Coca, ghi nợ"
        """
        result = {
            "customer_name": "Khách lẻ",
            "items": [],
            "raw_text": raw_text,
            "notes": ""
        }

        normalized = self.normalize_text(raw_text)
        
        # 1. Tách tên khách hàng
        # Pattern 1: "cho/của/khách + tên"
        customer_match = re.search(r'(?:cho|của|khách)\s+([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+?)(?:\s+\d+|\s*$|,|\.)', normalized, re.I)
        if customer_match:
            result["customer_name"] = customer_match.group(1).strip().title()
            # Xóa phần tên khách để parse sản phẩm dễ hơn
            normalized = normalized.replace(customer_match.group(0), " ")
        else:
            # Pattern 2: "Anh/Chị/Ông/Bà + tên" ở đầu câu
            customer_match2 = re.match(r'^((?:anh|chị|ông|bà)\s+[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)', normalized, re.I)
            if customer_match2:
                result["customer_name"] = customer_match2.group(1).strip().title()
                # Xóa tên khách khỏi text
                normalized = normalized[len(customer_match2.group(0)):].strip()

        # 2. Chuẩn hóa separator thành '+' để dễ split
        for sep in self.SEPARATORS:
            normalized = re.sub(rf'\s+{sep}\s+', ' + ', normalized)

        # 3. Tách các item
        # Loại bỏ các từ không cần thiết
        normalized = re.sub(r'\b(đặt|cần|mua|bán|gọi|order|cho)\b', '', normalized, flags=re.I).strip()
        
        segments = [s.strip() for s in normalized.split('+') if s.strip()]
        
        # Danh sách đơn vị mở rộng
        unit_list = r'bao|thùng|kg|tấn|cái|hộp|chai|lon|gói|túi|khối|m3|xe|tấm|mét|m|viên|thanh|bó|cây|cuộn|lít|ml|hũ|can|phuy|vỉ|tờ'
        
        for seg in segments:
            # Pattern 1: [Số] [Đơn vị] [Tên sản phẩm]
            # Ví dụ: "10 bao xi măng"
            item_match = re.match(rf'^(\d+(?:\.\d+)?)\s+(?:({unit_list})\s+)?(.+)$', seg, re.I)
            if item_match:
                quantity = float(item_match.group(1))
                unit = item_match.group(2) if item_match.group(2) else ""
                product_name = item_match.group(3).strip().title()
                
                result["items"].append({
                    "product_name": product_name,
                    "quantity": quantity,
                    "unit_name": unit
                })
            else:
                # Pattern 2: [Tên sản phẩm] [Số] [Đơn vị]
                # Ví dụ: "xi măng 10 bao"
                item_match_rev = re.search(rf'(.+?)\s+(\d+(?:\.\d+)?)\s*({unit_list})?$', seg, re.I)
                if item_match_rev:
                    product_name = item_match_rev.group(1).strip().title()
                    quantity = float(item_match_rev.group(2))
                    unit = item_match_rev.group(3) if item_match_rev.group(3) else ""
                    result["items"].append({
                        "product_name": product_name,
                        "quantity": quantity,
                        "unit_name": unit
                    })
                else:
                    # Trường hợp không có số lượng rõ ràng, hoặc số ở giữa
                    # Thử tìm số
                    number_match = re.search(r'(\d+(?:\.\d+)?)', seg)
                    if number_match:
                        quantity = float(number_match.group(1))
                        # Tách phần còn lại
                        remaining = re.sub(r'\d+(?:\.\d+)?', '', seg).strip()
                        # Thử xem có đơn vị ở đầu phần còn lại không
                        unit_prefix_match = re.match(rf'^({unit_list})\s+(.+)$', remaining, re.I)
                        if unit_prefix_match:
                            result["items"].append({
                                "product_name": unit_prefix_match.group(2).strip().title(),
                                "quantity": quantity,
                                "unit_name": unit_prefix_match.group(1).strip()
                            })
                        else:
                            result["items"].append({
                                "product_name": remaining.title(),
                                "quantity": quantity,
                                "unit_name": ""
                            })
                    else:
                        # Mặc định quantity = 1, check đơn vị ở đầu
                        unit_prefix_match = re.match(rf'^({unit_list})\s+(.+)$', seg, re.I)
                        if unit_prefix_match:
                            result["items"].append({
                                "product_name": unit_prefix_match.group(2).strip().title(),
                                "quantity": 1.0,
                                "unit_name": unit_prefix_match.group(1).strip()
                            })
                        else:
                            result["items"].append({
                                "product_name": seg.strip().title(),
                                "quantity": 1.0,
                                "unit_name": ""
                            })


        return result
