"""Tests for branch service functions."""

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock

from app.models.branch import Branch
from app.schemas.branch import BranchCreate, BranchUpdate
from app.services.branch_service import (
    list_branches,
    get_branch,
    create_branch,
    update_branch,
    delete_branch,
    toggle_branch_status,
)


@pytest.fixture
def sample_branch() -> Branch:
    return Branch(
        id=1,
        name="Main Branch",
        address="123 Main St",
        phone="555-1234",
        email="main@example.com",
        is_active=True,
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def uow_mock() -> AsyncMock:
    uow = AsyncMock()
    uow.session = AsyncMock()
    uow.session.execute = AsyncMock()
    uow.session.add = MagicMock()
    uow.session.delete = MagicMock()
    uow.flush = AsyncMock()
    uow.refresh = AsyncMock()
    return uow


def _mock_execute_result(
    scalar_one_or_none_return=None,
    scalars_all_return=None,
) -> MagicMock:
    result = MagicMock()
    result.scalar_one_or_none.return_value = scalar_one_or_none_return
    if scalars_all_return is not None:
        scalars_mock = MagicMock()
        scalars_mock.all.return_value = scalars_all_return
        result.scalars.return_value = scalars_mock
    return result


@pytest.mark.asyncio
async def test_list_branches_returns_all(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_result = _mock_execute_result(scalars_all_return=[sample_branch])
    uow_mock.session.execute.return_value = mock_result

    result = await list_branches(uow_mock)

    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].name == "Main Branch"
    assert result[0].address == "123 Main St"
    assert result[0].is_active is True
    uow_mock.session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_list_branches_empty(uow_mock: AsyncMock) -> None:
    mock_result = _mock_execute_result(scalars_all_return=[])
    uow_mock.session.execute.return_value = mock_result

    result = await list_branches(uow_mock)

    assert result == []


@pytest.mark.asyncio
async def test_get_branch_returns_branch(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_result = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_result

    result = await get_branch(1, uow_mock)

    assert result.id == 1
    assert result.name == "Main Branch"


@pytest.mark.asyncio
async def test_get_branch_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_result = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.return_value = mock_result

    with pytest.raises(HTTPException) as exc:
        await get_branch(999, uow_mock)

    assert exc.value.status_code == 404
    assert "999" in exc.value.detail


@pytest.mark.asyncio
async def test_create_branch_creates_and_returns(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_check = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.return_value = mock_check

    async def _refresh_branch(*args, **kwargs):
        branch = args[0]
        branch.id = 1
        branch.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
        branch.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    uow_mock.refresh = AsyncMock(side_effect=_refresh_branch)

    data = BranchCreate(name="Main Branch", address="123 Main St", phone="555-1234", email="main@example.com")

    result = await create_branch(data, uow_mock)

    assert result.id == 1
    assert result.name == "Main Branch"
    assert result.address == "123 Main St"
    uow_mock.session.add.assert_called_once()
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_branch_duplicate_name_raises_409(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_check = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_check

    data = BranchCreate(name="Main Branch", address="456 Other St")

    with pytest.raises(HTTPException) as exc:
        await create_branch(data, uow_mock)

    assert exc.value.status_code == 409
    assert "already exists" in exc.value.detail
    uow_mock.session.add.assert_not_called()


@pytest.mark.asyncio
async def test_update_branch_updates_fields(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    mock_check_name = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.side_effect = [mock_get, mock_check_name]

    async def _refresh_branch(*args, **kwargs):
        branch = args[0]
        branch.name = "Updated Branch"

    uow_mock.refresh = AsyncMock(side_effect=_refresh_branch)

    data = BranchUpdate(name="Updated Branch")

    result = await update_branch(1, data, uow_mock)

    assert result.name == "Updated Branch"
    assert sample_branch.name == "Updated Branch"
    uow_mock.flush.assert_awaited_once()
    uow_mock.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_branch_partial_no_name_change(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_branch(*args, **kwargs):
        branch = args[0]
        branch.address = "789 New Address"

    uow_mock.refresh = AsyncMock(side_effect=_refresh_branch)

    data = BranchUpdate(address="789 New Address")

    result = await update_branch(1, data, uow_mock)

    assert result.address == "789 New Address"
    assert result.name == "Main Branch"
    assert uow_mock.session.execute.call_count == 1


@pytest.mark.asyncio
async def test_update_branch_toggle_active(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_branch(*args, **kwargs):
        branch = args[0]
        branch.is_active = False

    uow_mock.refresh = AsyncMock(side_effect=_refresh_branch)

    data = BranchUpdate(is_active=False)

    result = await update_branch(1, data, uow_mock)

    assert result.is_active is False
    assert sample_branch.is_active is False
    assert uow_mock.session.execute.call_count == 1


@pytest.mark.asyncio
async def test_update_branch_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_result = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.return_value = mock_result

    data = BranchUpdate(name="Ghost Branch")

    with pytest.raises(HTTPException) as exc:
        await update_branch(999, data, uow_mock)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_branch_name_conflict_raises_409(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    existing_with_name = Branch(id=2, name="Existing Branch")
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    mock_check_name = _mock_execute_result(scalar_one_or_none_return=existing_with_name)
    uow_mock.session.execute.side_effect = [mock_get, mock_check_name]

    data = BranchUpdate(name="Existing Branch")

    with pytest.raises(HTTPException) as exc:
        await update_branch(1, data, uow_mock)

    assert exc.value.status_code == 409
    assert "already exists" in exc.value.detail


@pytest.mark.asyncio
async def test_delete_branch_deletes(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_get

    result = await delete_branch(1, uow_mock)

    assert result is None
    uow_mock.session.delete.assert_called_once_with(sample_branch)


@pytest.mark.asyncio
async def test_delete_branch_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_result = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.return_value = mock_result

    with pytest.raises(HTTPException) as exc:
        await delete_branch(999, uow_mock)

    assert exc.value.status_code == 404
    uow_mock.session.delete.assert_not_called()


@pytest.mark.asyncio
async def test_toggle_branch_status_toggles(uow_mock: AsyncMock, sample_branch: Branch) -> None:
    assert sample_branch.is_active is True
    mock_get = _mock_execute_result(scalar_one_or_none_return=sample_branch)
    uow_mock.session.execute.return_value = mock_get

    async def _refresh_branch(*args, **kwargs):
        pass

    uow_mock.refresh = AsyncMock(side_effect=_refresh_branch)

    result = await toggle_branch_status(1, uow_mock)

    assert result.is_active is False
    assert sample_branch.is_active is False
    uow_mock.session.add.assert_called_once_with(sample_branch)
    uow_mock.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_toggle_branch_status_not_found_raises_404(uow_mock: AsyncMock) -> None:
    mock_result = _mock_execute_result(scalar_one_or_none_return=None)
    uow_mock.session.execute.return_value = mock_result

    with pytest.raises(HTTPException) as exc:
        await toggle_branch_status(999, uow_mock)

    assert exc.value.status_code == 404
