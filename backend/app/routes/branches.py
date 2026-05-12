"""Branch API routes for the Food Store."""

import logging

from fastapi import APIRouter, Depends, status

from app.core.uow import UnitOfWork
from app.dependencies import get_admin_user, get_uow
from app.models.user import User
from app.schemas.branch import (
    BranchCreate,
    BranchListResponse,
    BranchResponse,
    BranchUpdate,
)
from app.services.branch_service import (
    create_branch,
    delete_branch,
    get_branch,
    list_branches,
    toggle_branch_status,
    update_branch,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("/", response_model=BranchListResponse)
async def list_all_branches(
    uow: UnitOfWork = Depends(get_uow),
) -> BranchListResponse:
    """List all branches (public)."""
    branches = await list_branches(uow)
    return BranchListResponse(items=branches, total=len(branches))


@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch_detail(
    branch_id: int,
    uow: UnitOfWork = Depends(get_uow),
) -> BranchResponse:
    """Get branch detail by ID (public)."""
    return await get_branch(branch_id=branch_id, uow=uow)


@router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_new_branch(
    body: BranchCreate,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> BranchResponse:
    """Create a new branch (admin only)."""
    branch = await create_branch(data=body, uow=uow)
    logger.info(
        "Branch created: id=%s, name=%s, by=%s",
        branch.id, branch.name, current_user.id,
    )
    return branch


@router.put("/{branch_id}", response_model=BranchResponse)
async def update_existing_branch(
    branch_id: int,
    body: BranchUpdate,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> BranchResponse:
    """Update an existing branch (admin only)."""
    branch = await update_branch(branch_id=branch_id, data=body, uow=uow)
    logger.info(
        "Branch updated: id=%s, by=%s",
        branch.id, current_user.id,
    )
    return branch


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_branch(
    branch_id: int,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    """Delete a branch (admin only)."""
    await delete_branch(branch_id=branch_id, uow=uow)
    logger.info(
        "Branch deleted: id=%s, by=%s",
        branch_id, current_user.id,
    )


@router.patch("/{branch_id}/toggle", response_model=BranchResponse)
async def toggle_branch_active_status(
    branch_id: int,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
) -> BranchResponse:
    """Toggle branch is_active status (admin only)."""
    branch = await toggle_branch_status(branch_id=branch_id, uow=uow)
    logger.info(
        "Branch toggled: id=%s, is_active=%s, by=%s",
        branch.id, branch.is_active, current_user.id,
    )
    return branch
