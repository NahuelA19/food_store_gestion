"""Password hashing and validation utilities."""

import bcrypt


def get_password_hash(password: str) -> str:
    """Hash a plain password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string suitable for storage
    """
    # Use bcrypt with cost factor 12 for security
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored hash.

    Args:
        plain_password: Plain text password submitted by user
        hashed_password: Stored hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


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
