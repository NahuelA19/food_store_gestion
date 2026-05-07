"""Database session management and dependency injection."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

# Lazy-loaded session factory
_async_session_local: async_sessionmaker[AsyncSession] | None = None


def get_async_session_local() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session factory."""
    global _async_session_local
    if _async_session_local is None:
        from database.client import get_engine

        _async_session_local = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _async_session_local


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI to provide database session.

    Yields:
        AsyncSession: Database session for the request.

    Example:
        @router.get("/products")
        async def list_products(session: AsyncSession = Depends(get_db_session)):
            result = await session.execute(select(Product))
            return result.scalars().all()
    """
    session_factory = get_async_session_local()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
