from enum import Enum
from datetime import datetime

class Account(Enum):
    CASH = "111"
    RECEIVABLE = "131"
    REVENUE = "511"

class JournalEntry:
    def __init__(self, debit_account, credit_account, amount, description):
        self.debit_account = debit_account
        self.credit_account = credit_account
        self.amount = amount
        self.description = description
        self.created_at = datetime.now()

class AccountingService:

    @staticmethod
    def record_revenue(transaction_amount, is_paid):
        entries = []

        if is_paid:
            entries.append(
                JournalEntry(
                    debit_account=Account.CASH,
                    credit_account=Account.REVENUE,
                    amount=transaction_amount,
                    description="Ghi nhận doanh thu theo TT88"
                )
            )
        else:
            entries.append(
                JournalEntry(
                    debit_account=Account.RECEIVABLE,
                    credit_account=Account.REVENUE,
                    amount=transaction_amount,
                    description="Ghi nhận doanh thu và công nợ theo TT88"
                )
            )
