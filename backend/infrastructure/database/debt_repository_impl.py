"""
SQLAlchemy implementation of DebtRepository
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from domain.entities.debt import Debt as DebtEntity, DebtPayment as DebtPaymentEntity, DebtStatus, DebtPaymentMethod
from domain.repositories.debt_repository import DebtRepository
from infrastructure.database.models import Debt as DebtModel, DebtPayment as DebtPaymentModel, Customer as CustomerModel, Order as OrderModel


class SQLAlchemyDebtRepository(DebtRepository):
    """SQLAlchemy implementation of DebtRepository"""
    
    def __init__(self, session: Session):
        self.session = session

    async def list_debts(
        self,
        owner_id: int,
        status: Optional[str] = None,
        customer_id: Optional[int] = None,
        sort: str = "latest",
        page: int = 1,
        page_size: int = 10
    ) -> tuple[List[dict], int]:
        """List debts with advanced filtering and sorting (No N+1)"""
        
        query = self.session.query(
            DebtModel,
            CustomerModel.full_name.label("customer_name"),
            CustomerModel.phone.label("customer_phone"),
            OrderModel.order_code.label("order_code")
        ).join(
            CustomerModel, CustomerModel.id == DebtModel.customer_id
        ).join(
            OrderModel, OrderModel.id == DebtModel.order_id
        ).filter(
            DebtModel.owner_id == owner_id
        )

        if status:
            query = query.filter(DebtModel.status == status)
        
        if customer_id:
            query = query.filter(DebtModel.customer_id == customer_id)

        # Apply sorting
        if sort == "largest_remaining":
            query = query.order_by(DebtModel.remaining_amount.desc())
        elif sort == "nearest_due":
            query = query.order_by(DebtModel.due_date.asc().nulls_last())
        else: # latest
            query = query.order_by(DebtModel.created_at.desc())

        total = query.count()
        
        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()
        
        items = []
        for debt, customer_name, customer_phone, order_code in results:
            data = {
                "id": debt.id,
                "customer_id": debt.customer_id,
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "order_code": order_code,
                "debt_amount": debt.debt_amount,
                "paid_amount": debt.paid_amount,
                "remaining_amount": debt.remaining_amount,
                "status": debt.status,
                "due_date": debt.due_date,
                "created_at": debt.created_at
            }
            items.append(data)
            
        return items, total

    async def get_debt_detail(self, debt_id: int, owner_id: int) -> Optional[dict]:
        """Get full debt detail including payments and related info"""
        result = self.session.query(
            DebtModel,
            CustomerModel.full_name.label("customer_name"),
            CustomerModel.phone.label("customer_phone"),
            OrderModel.order_code.label("order_code")
        ).join(
            CustomerModel, CustomerModel.id == DebtModel.customer_id
        ).join(
            OrderModel, OrderModel.id == DebtModel.order_id
        ).filter(
            and_(
                DebtModel.id == debt_id,
                DebtModel.owner_id == owner_id
            )
        ).first()

        if not result:
            return None
            
        debt, customer_name, customer_phone, order_code = result
        
        payments = await self.get_payments(debt_id, owner_id)
        
        data = {
            "id": debt.id,
            "customer_id": debt.customer_id,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "order_code": order_code,
            "debt_amount": debt.debt_amount,
            "paid_amount": debt.paid_amount,
            "remaining_amount": debt.remaining_amount,
            "status": debt.status,
            "due_date": debt.due_date,
            "created_at": debt.created_at,
            "notes": debt.notes,
            "payments": [
                {
                    "id": p.id,
                    "debt_id": p.debt_id,
                    "payment_amount": p.payment_amount,
                    "payment_method": p.payment_method.value,
                    "payment_date": p.payment_date,
                    "reference_number": p.reference_number,
                    "notes": p.notes,
                    "created_by": p.created_by,
                    "created_at": p.created_at
                } 
                for p in payments
            ]
        }
        
        return data

    async def create(self, debt: DebtEntity) -> DebtEntity:
        """Create a new debt record"""
        debt_model = DebtModel(
            owner_id=debt.owner_id,
            customer_id=debt.customer_id,
            order_id=debt.order_id,
            debt_amount=debt.debt_amount,
            paid_amount=debt.paid_amount,
            due_date=debt.due_date,
            status=debt.status.value,
            notes=debt.notes
        )
        
        self.session.add(debt_model)
        self.session.flush()
        
        debt.id = debt_model.id
        return debt
    
    async def get_by_id(self, debt_id: int, owner_id: int) -> Optional[DebtEntity]:
        """Get debt by ID"""
        debt_model = self.session.query(DebtModel).filter(
            and_(
                DebtModel.id == debt_id,
                DebtModel.owner_id == owner_id
            )
        ).first()
        
        if not debt_model:
            return None
        
        return self._to_entity(debt_model)
    
    async def get_by_order(self, order_id: int, owner_id: int) -> Optional[DebtEntity]:
        """Get debt for specific order"""
        debt_model = self.session.query(DebtModel).filter(
            and_(
                DebtModel.order_id == order_id,
                DebtModel.owner_id == owner_id
            )
        ).first()
        
        if not debt_model:
            return None
        
        return self._to_entity(debt_model)
    
    async def list_by_customer(
        self, 
        customer_id: int, 
        owner_id: int,
        include_paid: bool = False
    ) -> List[DebtEntity]:
        """List debts for customer"""
        query = self.session.query(DebtModel).filter(
            and_(
                DebtModel.customer_id == customer_id,
                DebtModel.owner_id == owner_id
            )
        )
        
        if not include_paid:
            query = query.filter(DebtModel.remaining_amount > 0)
            
        debt_models = query.order_by(DebtModel.created_at.desc()).all()
        return [self._to_entity(dm) for dm in debt_models]
    
    async def list_by_owner(
        self, 
        owner_id: int,
        skip: int = 0,
        limit: int = 100,
        include_paid: bool = False
    ) -> List[DebtEntity]:
        """List debts for owner"""
        query = self.session.query(DebtModel).filter(
            DebtModel.owner_id == owner_id
        )
        
        if not include_paid:
            query = query.filter(DebtModel.remaining_amount > 0)
            
        debt_models = query.order_by(DebtModel.created_at.desc()).offset(skip).limit(limit).all()
        return [self._to_entity(dm) for dm in debt_models]
    
    async def update(self, debt: DebtEntity) -> DebtEntity:
        """Update debt"""
        debt_model = self.session.query(DebtModel).filter(
            and_(
                DebtModel.id == debt.id,
                DebtModel.owner_id == debt.owner_id
            )
        ).first()
        
        if not debt_model:
            raise ValueError(f"Debt {debt.id} not found")
        
        debt_model.paid_amount = debt.paid_amount
        debt_model.status = debt.status.value
        debt_model.due_date = debt.due_date
        
        self.session.flush()
        return debt
    
    async def record_payment(self, payment: DebtPaymentEntity) -> DebtPaymentEntity:
        """Record debt payment and update debt"""
        # Create payment
        payment_model = DebtPaymentModel(
            debt_id=payment.debt_id,
            payment_amount=payment.payment_amount,
            payment_method=payment.payment_method.value,
            payment_date=payment.payment_date,
            reference_number=payment.reference_number,
            notes=payment.notes,
            created_by=payment.created_by
        )
        self.session.add(payment_model)
        
        # Update debt logic is usually handled by usecase -> entity -> repo.update
        # But if we need atomic update here:
        debt_model = self.session.query(DebtModel).filter(
            DebtModel.id == payment.debt_id
        ).with_for_update().first()
        
        if debt_model:
            debt_model.paid_amount += payment.payment_amount
            # remaining_amount is generated column, updated automatically
            # Check status based on new paid_amount vs debt_amount
            if (debt_model.debt_amount - debt_model.paid_amount) <= 0:
                debt_model.status = DebtStatus.PAID.value
            elif debt_model.paid_amount > 0:
                debt_model.status = DebtStatus.PARTIAL.value
        
        self.session.flush()
        
        payment.id = payment_model.id
        return payment
    
    async def get_payments(self, debt_id: int, owner_id: int) -> List[DebtPaymentEntity]:
        """Get payment history for debt"""
        payments = self.session.query(DebtPaymentModel).join(DebtModel).filter(
            and_(
                DebtPaymentModel.debt_id == debt_id,
                DebtModel.owner_id == owner_id
            )
        ).order_by(DebtPaymentModel.payment_date.desc()).all()
        
        return [
            DebtPaymentEntity(
                id=p.id,
                debt_id=p.debt_id,
                payment_amount=p.payment_amount,
                payment_method=DebtPaymentMethod(p.payment_method),
                payment_date=p.payment_date,
                reference_number=p.reference_number,
                notes=p.notes,
                created_by=p.created_by,
                created_at=p.created_at
            )
            for p in payments
        ]
    
    async def list_overdue(self, owner_id: int) -> List[DebtEntity]:
        """List overdue debts"""
        from datetime import date
        today = date.today()
        
        debt_models = self.session.query(DebtModel).filter(
            and_(
                DebtModel.owner_id == owner_id,
                DebtModel.status != DebtStatus.PAID.value,
                DebtModel.due_date < today
            )
        ).all()
        
        return [self._to_entity(dm) for dm in debt_models]

    def _to_entity(self, model: DebtModel) -> DebtEntity:
        return DebtEntity(
            id=model.id,
            owner_id=model.owner_id,
            customer_id=model.customer_id,
            order_id=model.order_id,
            debt_amount=model.debt_amount,
            paid_amount=model.paid_amount,
            due_date=model.due_date,
            status=DebtStatus(model.status),
            notes=model.notes,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
