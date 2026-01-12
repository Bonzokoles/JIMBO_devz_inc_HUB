from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .metrics import setup_metrics
from .otel import setup_otel
from .logging_setup import setup_logging
from .routes import projects, commands, audit, publishing, analytics

# 1. Setup Logging (JSON + OTEL trace_id) - Global setup before app creation
setup_logging("jimbo77-ops-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 API Starting...")
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
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://jimbo77.com",
    "https://hub.jimbo77.com",
    "https://jimbo-devz-inc-hub.pages.dev"
]

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
app.include_router(projects.router)
app.include_router(commands.router)
app.include_router(audit.router)
app.include_router(publishing.router)
app.include_router(analytics.router)

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
