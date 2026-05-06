"""Authentication routes for user registration and login."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.auth import AuthResponse, LoginRequest, RegisterRequest
from app.models.user import User
from app.security.jwt import create_access_token
from app.security.password import get_password_hash, validate_password_strength, verify_password
from database.session import get_db_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Register a new user.

    Args:
        body: Registration request with email and password
        session: Database session

    Returns:
        AuthResponse with user info and JWT token

    Raises:
        HTTPException 409: Email already registered
        HTTPException 422: Weak password or invalid email
    """
    # Validate password strength
    is_valid, error_msg = validate_password_strength(body.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )

    # Check if email already exists
    result = await session.execute(
        select(User).where(User.email == body.email.lower())
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(body.password)
    new_user = User(
        email=body.email.lower(),
        hashed_password=hashed_password,
        is_active=True,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(
        data={"user_id": new_user.id, "email": new_user.email}
    )

    return AuthResponse(
        id=new_user.id,
        email=new_user.email,
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Login with email and password.

    Args:
        body: Login request with email and password
        session: Database session

    Returns:
        AuthResponse with user info and JWT token

    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 403: Account is inactive
    """
    # Find user by email
    result = await session.execute(
        select(User).where(User.email == body.email.lower())
    )
    user = result.scalar_one_or_none()

    # Check if user exists and password is correct
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Generate JWT token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )

    return AuthResponse(
        id=user.id,
        email=user.email,
        access_token=access_token,
        token_type="bearer",
    )
