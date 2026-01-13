from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .metrics import setup_metrics
from .otel import setup_otel
from .logging_setup import setup_logging
from .routes import projects, commands, audit, publishing, analytics, logs, shop_sync
from .security.rbac import current_actor

# Mock current_actor for testing
def get_current_actor():
    return {"email": "dev@jimbo77.com", "role": "admin"}

# 1. Setup Logging (JSON + OTEL trace_id) - Global setup before app creation
setup_logging("jimbo77-ops-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 API Starting...")
    for route in app.routes:
        print(f"DEBUG ROUTE: {route.path} [{route.name}]")
    yield
    # Shutdown
    print("🛑 API Shutting down...")

app = FastAPI(
    title="JIMBO77 Ops API",
    version="1.0.0",
    description="Central Control API for JIMBO77 Systems",
    lifespan=lifespan
)

# 2. CORS Configuration
# Allow Cloudflare Pages and local development
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use explicit list for credentials support
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Observability Setup
setup_metrics(app)
setup_otel(app)

# 4. Register Routers
app.include_router(projects.router, prefix="/v1")
app.include_router(commands.router, prefix="/v1")
app.include_router(audit.router, prefix="/v1")
app.include_router(publishing.router, prefix="/v1")
app.include_router(analytics.router, prefix="/v1")
app.include_router(logs.router, prefix="/v1")
app.include_router(shop_sync.router)  # Already has /v1/shop-sync prefix

# Agent compatibility routes (no /v1 prefix)
app.include_router(commands.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "JIMBO77 Ops API",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
