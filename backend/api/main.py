"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from middleware.idempotency import IdempotencyMiddleware

# Import routers
from api.v1.routes import (
    inventory, reports, ai, units, debts, users, portal, admin, events,
    auth, orders, products, customers, draft_orders, ai_reports
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="BizFlow API - Digital transformation platform for Vietnamese household businesses",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middlewares are applied in reverse order of addition (LIFO for request)

# We want CORS to be the OUTERMOST layer to ensure headers are added to ALL responses

# 1. Idempotency Middleware (Inner)
# app.add_middleware(IdempotencyMiddleware, redis_url=settings.redis_url)

# 2. CORS middleware (Outer)
development_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
allowed_origins = ["*"] # list(set(settings.cors_origins_list + development_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Global Exception Handler for Vietnamese JSON responses
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "success": False},
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    # Mapping common English errors to Vietnamese if needed, or just passing detail
    detail = str(exc)
    # Simple mapping for common ones
    if "Insufficient stock" in detail:
        detail = "Không đủ tồn kho để thực hiện giao dịch này"
    elif "not found" in detail.lower():
        detail = "Dữ liệu không tồn tại"
        
    return JSONResponse(
        status_code=400,
        content={"detail": detail, "success": False},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the error here in production
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Lỗi hệ thống nghiêm trọng. Vui lòng thử lại sau.", "success": False},
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to BizFlow API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }


@app.get("/api/v1/info")
async def api_info():
    """API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "features": {
            "ai_provider": settings.AI_PROVIDER,
            "multi_tenant": True,
            "rbac": True,
            "tt88_compliance": True
        }
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(draft_orders.router, prefix="/api/v1/draft-orders", tags=["Draft Orders"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(debts.router, prefix="/api/v1/debts", tags=["Debts"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(units.router, prefix="/api/v1/units", tags=["Units"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(ai_reports.router, prefix="/api/v1/ai-reports", tags=["AI Reports"])
app.include_router(portal.router, prefix="/api/v1/portal", tags=["Portal"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.DEBUG
    )

