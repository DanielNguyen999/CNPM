from enum import Enum

class DraftStatus(Enum):
    DRAFT_AI = "DRAFT_AI"
    EDITED = "EDITED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class AIDraft:
    def __init__(self, draft_id, content):
        self.id = draft_id
        self.content = content
        self.status = DraftStatus.DRAFT_AI
        self.reject_reason = None

class AIDraftService:
    def create_draft_by_ai(self, input_data):
        content = f"AI generated draft from input: {input_data}"
        return AIDraft(draft_id=1, content=content)

    def edit_draft(self, draft, new_content):
        draft.content = new_content
        draft.status = DraftStatus.EDITED

    def approve_draft(self, draft):
        draft.status = DraftStatus.APPROVED

    def reject_draft(self, draft, reason):
        draft.status = DraftStatus.REJECTED
        draft.reject_reason = reason

def main():
    service = AIDraftService()

    draft = service.create_draft_by_ai("Đơn xin nghỉ phép")
    service.edit_draft(draft, "Đơn xin nghỉ phép từ ngày 10/01 đến 12/01")
    service.approve_draft(draft)

    print("Draft ID:", draft.id)
    print("Content:", draft.content)
    print("Status:", draft.status.value)

if __name__ == "__main__":
    main()
from enum import Enum

class DraftStatus(Enum):
    DRAFT_AI = "DRAFT_AI"
    EDITED = "EDITED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class AIDraft:
    def __init__(self, draft_id, content):
        self.id = draft_id
        self.content = content
        self.status = DraftStatus.DRAFT_AI
        self.reject_reason = None

class AIDraftService:
    def create_draft_by_ai(self, input_data):
        content = f"AI generated draft from input: {input_data}"
        return AIDraft(draft_id=1, content=content)

    def edit_draft(self, draft, new_content):
        draft.content = new_content
        draft.status = DraftStatus.EDITED

    def approve_draft(self, draft):
        draft.status = DraftStatus.APPROVED

    def reject_draft(self, draft, reason):
        draft.status = DraftStatus.REJECTED
        draft.reject_reason = reason

def main():
    service = AIDraftService()

    draft = service.create_draft_by_ai("Đơn xin nghỉ phép")
    service.edit_draft(draft, "Đơn xin nghỉ phép từ ngày 10/01 đến 12/01")
    service.approve_draft(draft)

    print("Draft ID:", draft.id)
    print("Content:", draft.content)
    print("Status:", draft.status.value)

if __name__ == "__main__":
    main()
