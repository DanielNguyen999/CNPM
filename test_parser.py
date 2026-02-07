import sys
sys.path.insert(0, 'd:/CODE_BizFLow_100Hrs/backend')

from infrastructure.ai.parser import VietnameseVoiceParser

parser = VietnameseVoiceParser()

test_cases = [
    "Anh Đăng 10 bao xi măng Long An",
    "Chị Lan cần 15 thùng Coca",
    "2 bánh mì + 3 nước cho anh Nam"
]

for test in test_cases:
    print(f"\n{'='*60}")
    print(f"Input: {test}")
    result = parser.parse(test)
    print(f"Customer: {result['customer_name']}")
    print(f"Items: {result['items']}")
