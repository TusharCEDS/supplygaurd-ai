from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
from app.config import settings

# Async engine (for FastAPI endpoints)
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=True,
    pool_size=10,
    max_overflow=20
)

# Sync engine (for Alembic migrations)
sync_engine = create_engine(settings.DATABASE_URL)

# Session factory
AsyncSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for all models
class Base(DeclarativeBase):
    pass

# Dependency - used in every API endpoint
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()