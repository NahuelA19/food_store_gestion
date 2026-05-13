"""Tests for category service functions."""

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uow import UnitOfWork
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.category_service import (
    list_categories_with_counts,
    get_category,
    create_category,
    update_category,
    delete_category,
)


@pytest.mark.asyncio
class TestCategoryService:
    async def test_list_categories_empty(self, db_session: AsyncSession) -> None:
        async with UnitOfWork(db_session) as uow:
            categories = await list_categories_with_counts(uow)
            assert categories == []

    async def test_list_categories_with_data(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            categories = await list_categories_with_counts(uow)
            assert len(categories) == 1
            assert categories[0].name == "Vegetables"
            assert categories[0].product_count == 0

    async def test_get_category_success(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            category = await get_category(uow, test_category.id)
            assert category.name == "Vegetables"

    async def test_get_category_not_found(self, db_session: AsyncSession) -> None:
        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc:
                await get_category(uow, 99999)
            assert exc.value.status_code == 404

    async def test_create_category_success(self, db_session: AsyncSession) -> None:
        async with UnitOfWork(db_session) as uow:
            category = await create_category(uow, CategoryCreate(name="Fruits"))
            assert category.id is not None
            assert category.name == "Fruits"

    async def test_create_category_duplicate(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc:
                await create_category(uow, CategoryCreate(name="Vegetables"))
            assert exc.value.status_code == 409
            assert "already exists" in exc.value.detail

    async def test_update_category_name(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            updated = await update_category(
                uow, test_category.id, CategoryUpdate(name="Legumes")
            )
            assert updated.name == "Legumes"

    async def test_update_category_duplicate_name(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            other = await create_category(uow, CategoryCreate(name="Fruits"))

        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc:
                await update_category(
                    uow, other.id, CategoryUpdate(name="Vegetables")
                )
            assert exc.value.status_code == 409
            assert "already exists" in exc.value.detail

    async def test_delete_category_success(self, db_session: AsyncSession, test_category) -> None:
        async with UnitOfWork(db_session) as uow:
            await delete_category(uow, test_category.id)

        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc:
                await get_category(uow, test_category.id)
            assert exc.value.status_code == 404

    async def test_delete_category_with_products(self, db_session: AsyncSession, test_product) -> None:
        async with UnitOfWork(db_session) as uow:
            with pytest.raises(HTTPException) as exc:
                await delete_category(uow, test_product.category_id)
            assert exc.value.status_code == 409
            assert "Cannot delete category" in exc.value.detail
