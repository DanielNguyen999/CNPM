"""
SQLAlchemy implementation of CustomerRepository
"""
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from domain.entities.customer import Customer as CustomerEntity, CustomerType
from domain.repositories.customer_repository import CustomerRepository
from infrastructure.database.models import Customer as CustomerModel, Debt as DebtModel, Order as OrderModel


class SQLAlchemyCustomerRepository(CustomerRepository):
    """SQLAlchemy implementation of CustomerRepository"""
    
    def __init__(self, session: Session):
        self.session = session

    async def list_customers_with_summary(
        self,
        owner_id: int,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
        is_active: bool = True
    ) -> tuple[List[dict], int]:
        """List customers with summary stats (debt, order count) without N+1"""
        
        # Subquery for total debt per customer
        debt_sub = self.session.query(
            DebtModel.customer_id,
            func.sum(DebtModel.remaining_amount).label("total_debt")
        ).filter(DebtModel.owner_id == owner_id).group_by(DebtModel.customer_id).subquery()

        # Subquery for order count per customer
        order_sub = self.session.query(
            OrderModel.customer_id,
            func.count(OrderModel.id).label("order_count"),
            func.max(OrderModel.order_date).label("last_order_date")
        ).filter(OrderModel.owner_id == owner_id).group_by(OrderModel.customer_id).subquery()

        # Main query
        query = self.session.query(
            CustomerModel,
            debt_sub.c.total_debt,
            order_sub.c.order_count,
            order_sub.c.last_order_date
        ).outerjoin(
            debt_sub, debt_sub.c.customer_id == CustomerModel.id
        ).outerjoin(
            order_sub, order_sub.c.customer_id == CustomerModel.id
        ).filter(
            and_(
                CustomerModel.owner_id == owner_id,
                CustomerModel.is_active == is_active
            )
        )

        if search:
            query = query.filter(
                or_(
                    CustomerModel.full_name.ilike(f"%{search}%"),
                    CustomerModel.phone.ilike(f"%{search}%"),
                    CustomerModel.customer_code.ilike(f"%{search}%")
                )
            )

        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        results = query.order_by(CustomerModel.created_at.desc()).offset(offset).limit(page_size).all()
        
        items = []
        for customer, total_debt, order_count, last_order_date in results:
            data = {
                "id": customer.id,
                "owner_id": customer.owner_id,
                "customer_code": customer.customer_code,
                "full_name": customer.full_name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address,
                "customer_type": customer.customer_type.value,
                "tax_code": customer.tax_code,
                "credit_limit": customer.credit_limit,
                "is_active": customer.is_active,
                "created_at": customer.created_at,
                "total_debt": total_debt or Decimal("0"),
                "order_count": order_count or 0,
                "last_order_date": last_order_date
            }
            items.append(data)
            
        return items, total

    async def get_customer_summary(self, customer_id: int, owner_id: int) -> dict:
        """Get summary stats for a single customer"""
        total_debt = self.session.query(func.sum(DebtModel.remaining_amount)).filter(
            and_(DebtModel.customer_id == customer_id, DebtModel.owner_id == owner_id)
        ).scalar() or Decimal("0")
        
        order_count = self.session.query(func.count(OrderModel.id)).filter(
            and_(OrderModel.customer_id == customer_id, OrderModel.owner_id == owner_id)
        ).scalar() or 0
        
        return {
            "total_debt": total_debt,
            "order_count": order_count
        }

    async def create(self, customer: CustomerEntity) -> CustomerEntity:
        """Create a new customer"""
        # Cap credit_limit to avoid database overflow (Decimal 15,2)
        credit_limit = customer.credit_limit
        if credit_limit and credit_limit > Decimal("9999999999999"):
            credit_limit = Decimal("9999999999999")

        customer_model = CustomerModel(
            owner_id=customer.owner_id,
            customer_code=customer.customer_code,
            full_name=customer.full_name,
            phone=customer.phone,
            email=customer.email,
            address=customer.address,
            customer_type=customer.customer_type.value,
            tax_code=customer.tax_code,
            credit_limit=credit_limit,
            is_active=customer.is_active
        )
        
        self.session.add(customer_model)
        self.session.commit()
        self.session.refresh(customer_model)
        
        return self._to_entity(customer_model)
    
    async def get_by_id(self, customer_id: int, owner_id: int) -> Optional[CustomerEntity]:
        """Get customer by ID with tenant isolation"""
        customer_model = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.id == customer_id,
                CustomerModel.owner_id == owner_id
            )
        ).first()
        
        if not customer_model:
            return None
        
        return self._to_entity(customer_model)
    
    async def get_by_code(self, customer_code: str, owner_id: int) -> Optional[CustomerEntity]:
        """Get customer by code with tenant isolation"""
        customer_model = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.customer_code == customer_code,
                CustomerModel.owner_id == owner_id
            )
        ).first()
        
        if not customer_model:
            return None
        
        return self._to_entity(customer_model)
    
    async def search_by_name_or_phone(self, query: str, owner_id: int, limit: int = 20) -> List[CustomerEntity]:
        """Search customers by name or phone"""
        customer_models = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.owner_id == owner_id,
                CustomerModel.is_active == True,
                or_(
                    CustomerModel.full_name.ilike(f"%{query}%"),
                    CustomerModel.phone.ilike(f"%{query}%")
                )
            )
        ).limit(limit).all()
        
        return [self._to_entity(cm) for cm in customer_models]
    
    async def list_by_owner(
        self, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        is_active: bool = True
    ) -> List[CustomerEntity]:
        """List customers for owner with pagination"""
        customer_models = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.owner_id == owner_id,
                CustomerModel.is_active == is_active
            )
        ).order_by(CustomerModel.full_name).offset(skip).limit(limit).all()
        
        return [self._to_entity(cm) for cm in customer_models]
    
    async def update(self, customer: CustomerEntity) -> CustomerEntity:
        """Update customer"""
        customer_model = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.id == customer.id,
                CustomerModel.owner_id == customer.owner_id
            )
        ).first()
        
        if not customer_model:
            raise ValueError(f"Customer {customer.id} not found")
        
        customer_model.full_name = customer.full_name
        customer_model.phone = customer.phone
        customer_model.email = customer.email
        customer_model.address = customer.address
        customer_model.customer_type = customer.customer_type.value
        customer_model.tax_code = customer.tax_code
        customer_model.credit_limit = customer.credit_limit
        customer_model.is_active = customer.is_active
        
        self.session.commit()
        return customer
    
    async def delete(self, customer_id: int, owner_id: int) -> bool:
        """Delete customer (soft delete)"""
        customer_model = self.session.query(CustomerModel).filter(
            and_(
                CustomerModel.id == customer_id,
                CustomerModel.owner_id == owner_id
            )
        ).first()
        
        if not customer_model:
            return False
        
        customer_model.is_active = False
        self.session.commit()
        return True
    
    async def get_total_debt(self, customer_id: int, owner_id: int) -> Decimal:
        """Get customer's total outstanding debt"""
        result = self.session.query(func.sum(DebtModel.remaining_amount)).filter(
            and_(
                DebtModel.customer_id == customer_id,
                DebtModel.owner_id == owner_id,
                DebtModel.remaining_amount > 0
            )
        ).scalar()
        
        return result or Decimal("0")
    
    async def generate_customer_code(self, owner_id: int) -> str:
        """Generate unique customer code"""
        count = self.session.query(func.count(CustomerModel.id)).filter(
            CustomerModel.owner_id == owner_id
        ).scalar()
        
        # CUS-0001
        return f"CUS-{count + 1:04d}"
    
    def _to_entity(self, model: CustomerModel) -> CustomerEntity:
        """Convert model to entity"""
        return CustomerEntity(
            id=model.id,
            owner_id=model.owner_id,
            customer_code=model.customer_code,
            full_name=model.full_name,
            phone=model.phone,
            email=model.email,
            address=model.address,
            customer_type=CustomerType(model.customer_type),
            tax_code=model.tax_code,
            credit_limit=model.credit_limit,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
