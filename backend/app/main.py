import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.shipments import router as shipments_router
from app.api.tracking import router as tracking_router
from app.api.suppliers import router as suppliers_router
from app.api.intelligence import router as intelligence_router

async def keep_supabase_alive():
    """Ping database every 4 minutes to prevent sleep"""
    await asyncio.sleep(10)  # wait for app to start
    while True:
        try:
            from app.services.shipment_service import get_connection
            conn = get_connection()
            conn.run("SELECT 1")
            conn.close()
            print("✅ Supabase keep-alive ping")
        except Exception as e:
            print(f"Keep-alive failed: {e}")
        await asyncio.sleep(240)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(keep_supabase_alive())
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered supply chain disruption predictor",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments_router)
app.include_router(tracking_router)
app.include_router(suppliers_router)
app.include_router(intelligence_router)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME
    }