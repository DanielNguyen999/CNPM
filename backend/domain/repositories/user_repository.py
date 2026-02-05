"""
User Repository Interface
"""
from abc import ABC, abstractmethod
from typing import Optional
from domain.entities.user import User


class UserRepository(ABC):
    """Abstract repository for User entity"""
    
    @abstractmethod
    async def create(self, user: User) -> User:
        """Create a new user"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        """Update user"""
        pass
    
    @abstractmethod
    async def update_last_login(self, user_id: int) -> bool:
        """Update last login timestamp"""
        pass
    
    @abstractmethod
    async def get_owner_id(self, user_id: int) -> Optional[int]:
        """Get owner_id for user (from OWNER or EMPLOYEE table)"""
        pass
