# BizFlow Backend

Python backend with Clean Architecture, FastAPI, and multi-database support.

## Architecture

```
backend/
├── domain/              # Enterprise Business Rules
│   ├── entities/       # Business objects
│   └── repositories/   # Repository interfaces (abstractions)
├── usecases/           # Application Business Rules
├── infrastructure/     # Frameworks & Drivers
│   ├── database/      # Database implementations
│   ├── cache/         # Redis cache
│   └── ai/            # AI/RAG services
├── api/               # Interface Adapters
│   ├── routes/        # API endpoints
│   ├── middleware/    # RBAC, auth, etc.
│   └── schemas/       # Pydantic models
├── config/            # Configuration
└── tests/             # Tests
```

## Tech Stack

- **Framework:** FastAPI
- **Databases:** MySQL (transactional), PostgreSQL (reporting)
- **Cache:** Redis
- **Vector DB:** ChromaDB
- **ORM:** SQLAlchemy
- **Validation:** Pydantic
- **Auth:** JWT (python-jose)
- **Password:** bcrypt

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Running

```bash
# Development
uvicorn api.main:app --reload --host 0.0.0.0 --port 8080

# Production
uvicorn api.main:app --host 0.0.0.0 --port 8080 --workers 4
```

## Environment Variables

See `.env.example` in project root.

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc
