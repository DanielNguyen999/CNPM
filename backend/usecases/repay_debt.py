"""
Repay Debt Use Case - Record debt payment
"""
from decimal import Decimal
from datetime import datetime

from domain.entities.debt import DebtPayment, DebtPaymentMethod
from domain.repositories.debt_repository import DebtRepository
from domain.repositories.order_repository import OrderRepository


class RepayDebtUseCase:
    """
    Use case for recording debt payments.
    
    Business Flow:
    1. Validate debt exists and is not fully paid
    2. Validate payment amount
    3. Create debt payment record
    4. Update debt paid_amount and status
    5. Update order paid_amount if applicable
    6. Return payment record
    """
    
    def __init__(
        self,
        debt_repo: DebtRepository,
        order_repo: OrderRepository
    ):
        self.debt_repo = debt_repo
        self.order_repo = order_repo
    
    async def execute(
        self,
        debt_id: int,
        owner_id: int,
        payment_amount: Decimal,
        created_by: int,
        payment_method: str = "CASH",
        payment_date: datetime = None,
        reference_number: str = None,
        notes: str = None
    ) -> DebtPayment:
        """
        Execute debt payment.
        
        Args:
            debt_id: Debt ID
            owner_id: Owner ID (tenant)
            payment_amount: Payment amount
            created_by: User ID recording payment
            payment_method: Payment method
            reference_number: Bank transfer reference
            notes: Payment notes
        
        Returns:
            Created DebtPayment
        
        Raises:
            ValueError: If validation fails
        """
        
        # 1. Get debt
        debt = await self.debt_repo.get_by_id(debt_id, owner_id)
        if not debt:
            raise ValueError(f"Debt {debt_id} not found")
        
        if debt.is_fully_paid():
            raise ValueError(f"Debt {debt_id} is already fully paid")
        
        # 2. Validate payment amount
        remaining = debt.get_remaining_amount()
        if payment_amount > remaining:
            raise ValueError(
                f"Payment amount {payment_amount} exceeds remaining debt {remaining}"
            )
        
        if payment_amount <= 0:
            raise ValueError("Payment amount must be greater than 0")
        
        # 3. Create payment record
        payment = DebtPayment(
            id=None,
            debt_id=debt_id,
            payment_amount=payment_amount,
            payment_method=DebtPaymentMethod(payment_method),
            payment_date=payment_date or datetime.utcnow(),
            reference_number=reference_number,
            notes=notes,
            created_by=created_by
        )
        
        # 4. Record payment (updates debt)
        created_payment = await self.debt_repo.record_payment(payment)
        
        # 5. Update order paid_amount
        order = await self.order_repo.get_by_id(debt.order_id, owner_id)
        if order:
            order.record_payment(payment_amount)
            await self.order_repo.update(order)
        
        return created_payment
