# AI tao don nhap tu van ban
# Tac gia: Doan Quoc Thang

import re

def tao_don_nhap(van_ban):
    don_nhap = {
        "tieu_de": "",
        "nguoi_gui": "",
        "noi_dung": "",
        "ngay": ""
    }

    # Tim tieu de (dong dau tien)
    dong = van_ban.strip().split("\n")
    if len(dong) > 0:
        don_nhap["tieu_de"] = dong[0]

    # Tim ten nguoi gui
    ten = re.search(r"(Tôi là|Em là|Tên tôi là)\s+([A-Za-zÀ-ỹ\s]+)", van_ban)
    if ten:
        don_nhap["nguoi_gui"] = ten.group(2).strip()

    # Tim ngay
    ngay = re.search(r"\d{1,2}/\d{1,2}/\d{4}", van_ban)
    if ngay:
        don_nhap["ngay"] = ngay.group()

    # Noi dung
    don_nhap["noi_dung"] = van_ban

    return don_nhap



