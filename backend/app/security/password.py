"""Password hashing and validation utilities."""

from passlib.context import CryptContext

# Configure bcrypt context with cost factor 12
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a plain password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string suitable for storage
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored hash.

    Args:
        plain_password: Plain text password submitted by user
        hashed_password: Stored hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets minimum security requirements.

    Requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 digit

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message). error_message is empty if valid.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not any(c.isupper() for c in password):
        return False, "Password must contain at least 1 uppercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least 1 digit"

    return True, ""
