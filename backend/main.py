"""
FastAPI Main Application
"""
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from middleware.idempotency import IdempotencyMiddleware

# Import routers
from api.v1.routes import (
    inventory, reports, ai, units, debts, users, portal, admin, events,
    auth, orders, products, customers, draft_orders, ai_reports, notifications
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="BizFlow API - Digital transformation platform for Vietnamese household businesses",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Helper to add CORS headers to responses (Forced for robustness)
def add_cors_headers_to_response(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response

@app.middleware("http")
async def cors_handler(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        return add_cors_headers_to_response(response)
    
    try:
        response = await call_next(request)
        return add_cors_headers_to_response(response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        resp = JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "success": False}
        )
        return add_cors_headers_to_response(resp)

# Standard Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Explicitly false when using *
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(IdempotencyMiddleware, redis_url=settings.redis_url)

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    resp = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "success": False},
    )
    return add_cors_headers_to_response(resp)

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    detail = str(exc)
    if "Insufficient stock" in detail:
        detail = "Không đủ tồn kho để thực hiện giao dịch này"
    elif "not found" in detail.lower():
        detail = "Dữ liệu không tồn tại"
        
    resp = JSONResponse(
        status_code=400,
        content={"detail": detail, "success": False},
    )
    return add_cors_headers_to_response(resp)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    resp = JSONResponse(
        status_code=500,
        content={"detail": "Lỗi hệ thống nghiêm trọng. Vui lòng thử lại sau.", "success": False},
    )
    return add_cors_headers_to_response(resp)


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
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.DEBUG
    )

