from fastapi import FastAPI
from pydantic import BaseModel

# =====================
# App init
# =====================
app = FastAPI(
    title="AI Service Skeleton",
    description="Independent AI service for backend integration",
    version="1.0.0"
)

# =====================
# Schema
# =====================
class AIRequest(BaseModel):
    text: str

# =====================
# AI Services (mock)
# =====================
def process_nlp(text: str):
    return {
        "module": "NLP",
        "input": text,
        "output": f"NLP processed text: {text}"
    }

def create_draft_order(text: str):
    return {
        "module": "Draft Order",
        "input": text,
        "output": "Draft order created successfully (mock)"
    }

# =====================
# Routes
# =====================
@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.post("/api/v1/ai/nlp")
def nlp_endpoint(request: AIRequest):
    return process_nlp(request.text)

@app.post("/api/v1/ai/draft-order")
def draft_order_endpoint(request: AIRequest):
    return create_draft_order(request.text)from fastapi import FastAPI
from pydantic import BaseModel

# =====================
# App init
# =====================
app = FastAPI(
    title="AI Service Skeleton",
    description="Independent AI service for backend integration",
    version="1.0.0"
)

# =====================
# Schema
# =====================
class AIRequest(BaseModel):
    text: str

# =====================
# AI Services (mock)
# =====================
def process_nlp(text: str):
    return {
        "module": "NLP",
        "input": text,
        "output": f"NLP processed text: {text}"
    }

def create_draft_order(text: str):
    return {
        "module": "Draft Order",
        "input": text,
        "output": "Draft order created successfully (mock)"
    }

# =====================
# Routes
# =====================
@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.post("/api/v1/ai/nlp")
def nlp_endpoint(request: AIRequest):
    return process_nlp(request.text)

@app.post("/api/v1/ai/draft-order")
def draft_order_endpoint(request: AIRequest):
    return create_draft_order(request.text)
