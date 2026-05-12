"""Generic repository helpers (SQLAlchemy v2 + async)."""

from __future__ import annotations

from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Small generic repository wrapper.

    Note: This is intentionally minimal; domain-specific queries should live in
    dedicated services or specialized repositories.
    """

    def __init__(self, model: type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: int) -> T | None:
        return await self.session.get(self.model, id)

    async def get_by_id(self, id: int) -> T | None:
        """Alias for get() — retrieve by primary key."""
        return await self.get(id)

    async def get_all(self, include_deleted: bool = False) -> list[T]:
        stmt = select(self.model)
        if hasattr(self.model, "deleted_at") and not include_deleted:
            stmt = stmt.where(getattr(self.model, "deleted_at").is_(None))  # type: ignore[attr-defined]
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)

    async def update(self, entity: T, **fields: object) -> T:
        # Keep update generic for common patch-like use cases.
        for key, value in fields.items():
            setattr(entity, key, value)
        self.session.add(entity)
        return entity
