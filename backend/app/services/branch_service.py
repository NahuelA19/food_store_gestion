"""Branch business logic service."""

from fastapi import HTTPException, status
from sqlalchemy import select

from app.core.uow import UnitOfWork

from app.models.branch import Branch
from app.schemas.branch import BranchCreate, BranchResponse, BranchUpdate


async def list_branches(uow: UnitOfWork) -> list[BranchResponse]:
    """List all branches ordered by name.

    Args:
        db: Database session

    Returns:
        list[BranchResponse]: List of all branches
    """
    result = await uow.session.execute(select(Branch).order_by(Branch.name))
    branches = result.scalars().all()
    return [
        BranchResponse(
            id=b.id,
            name=b.name,
            address=b.address,
            phone=b.phone,
            email=b.email,
            is_active=b.is_active,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )
        for b in branches
    ]


async def get_branch(branch_id: int, uow: UnitOfWork) -> BranchResponse:
    """Get a single branch by ID.

    Args:
        branch_id: Branch ID
        db: Database session

    Returns:
        BranchResponse: The branch

    Raises:
        HTTPException 404: If branch not found
    """
    result = await uow.session.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with id {branch_id} not found",
        )

    return BranchResponse(
        id=branch.id,
        name=branch.name,
        address=branch.address,
        phone=branch.phone,
        email=branch.email,
        is_active=branch.is_active,
        created_at=branch.created_at,
        updated_at=branch.updated_at,
    )


async def create_branch(data: BranchCreate, uow: UnitOfWork) -> BranchResponse:
    """Create a new branch.

    Args:
        data: Branch creation data
        db: Database session

    Returns:
        BranchResponse: The created branch

    Raises:
        HTTPException 409: If branch name already exists
    """
    existing = await uow.session.execute(select(Branch).where(Branch.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Branch with name '{data.name}' already exists",
        )

    branch = Branch(
        name=data.name,
        address=data.address,
        phone=data.phone,
        email=data.email,
    )
    uow.session.add(branch)
    await uow.flush()
    await uow.refresh(branch)

    return BranchResponse(
        id=branch.id,
        name=branch.name,
        address=branch.address,
        phone=branch.phone,
        email=branch.email,
        is_active=branch.is_active,
        created_at=branch.created_at,
        updated_at=branch.updated_at,
    )


async def update_branch(branch_id: int, data: BranchUpdate, uow: UnitOfWork) -> BranchResponse:
    """Update an existing branch.

    Args:
        branch_id: Branch ID
        data: Branch update data (partial)
        db: Database session

    Returns:
        BranchResponse: The updated branch

    Raises:
        HTTPException 404: If branch not found
        HTTPException 409: If new name conflicts with existing branch
    """
    result = await uow.session.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with id {branch_id} not found",
        )

    if data.name is not None and data.name != branch.name:
        existing = await uow.session.execute(select(Branch).where(Branch.name == data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Branch with name '{data.name}' already exists",
            )
        branch.name = data.name

    if data.address is not None:
        branch.address = data.address
    if data.phone is not None:
        branch.phone = data.phone
    if data.email is not None:
        branch.email = data.email
    if data.is_active is not None:
        branch.is_active = data.is_active

    uow.session.add(branch)
    await uow.flush()
    await uow.refresh(branch)

    return BranchResponse(
        id=branch.id,
        name=branch.name,
        address=branch.address,
        phone=branch.phone,
        email=branch.email,
        is_active=branch.is_active,
        created_at=branch.created_at,
        updated_at=branch.updated_at,
    )


async def delete_branch(branch_id: int, uow: UnitOfWork) -> None:
    """Delete a branch.

    Args:
        branch_id: Branch ID
        db: Database session

    Raises:
        HTTPException 404: If branch not found
    """
    result = await uow.session.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with id {branch_id} not found",
        )

    await uow.session.delete(branch)


async def toggle_branch_status(branch_id: int, uow: UnitOfWork) -> BranchResponse:
    """Toggle a branch's active status.

    Args:
        branch_id: Branch ID
        db: Database session

    Returns:
        BranchResponse: The updated branch

    Raises:
        HTTPException 404: If branch not found
    """
    result = await uow.session.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with id {branch_id} not found",
        )

    branch.is_active = not branch.is_active
    uow.session.add(branch)
    await uow.flush()
    await uow.refresh(branch)

    return BranchResponse(
        id=branch.id,
        name=branch.name,
        address=branch.address,
        phone=branch.phone,
        email=branch.email,
        is_active=branch.is_active,
        created_at=branch.created_at,
        updated_at=branch.updated_at,
    )
