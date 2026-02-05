"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from config.settings import settings

# Create SQLAlchemy engines
mysql_engine = create_engine(
    settings.mysql_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG
)

postgres_engine = create_engine(
    settings.postgres_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.DEBUG
)

# Create session factories
MySQLSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mysql_engine)
PostgresSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=postgres_engine)

# Base class for models
Base = declarative_base()


@contextmanager
def get_mysql_session() -> Generator[Session, None, None]:
    """
    Get MySQL database session.
    
    Usage:
        with get_mysql_session() as session:
            # Use session
            pass
    """
    session = MySQLSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def get_postgres_session() -> Generator[Session, None, None]:
    """
    Get PostgreSQL database session.
    
    Usage:
        with get_postgres_session() as session:
            # Use session
            pass
    """
    session = PostgresSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session.
    
    Usage in FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    session = MySQLSessionLocal()
    try:
        yield session
    finally:
        session.close()
