# Mo phong RAG (khong can cai chromadb)
# Tac gia: Doan Quoc Thang

du_lieu = [
    "San pham A co gia 10 trieu dong",
    "San pham B bao hanh 24 thang",
    "Khach hang VIP duoc giam gia 10 phan tram"
]

def tim_du_lieu_lien_quan(cau_hoi):
    for dong in du_lieu:
        if "A" in cau_hoi and "A" in dong:
            return dong
        if "B" in cau_hoi and "B" in dong:
            return dong
    return "Khong tim thay du lieu phu hop"

def rag_query(cau_hoi):
    ngu_canh = tim_du_lieu_lien_quan(cau_hoi)
    tra_loi = f"Theo du lieu he thong: {ngu_canh}"
    return tra_loi

