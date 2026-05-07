"""User validation utilities."""

import re
from typing import Optional


def validate_profile_name(name: Optional[str]) -> bool:
    """Validate profile name (first_name or last_name).
    
    Args:
        name: Name to validate
        
    Returns:
        True if valid, False otherwise
    """
    if name is None:
        return False
    if len(name) < 1 or len(name) > 50:
        return False
    return True


def validate_phone(phone: Optional[str]) -> bool:
    """Validate phone format.
    
    Args:
        phone: Phone number to validate
        
    Returns:
        True if valid or None (optional), False otherwise
    """
    if phone is None:
        return True
    if len(phone) < 7 or len(phone) > 20:
        return False
    # Allow +, -, (), space, and digits
    if not re.match(r"^\+?[0-9\-\(\)\s]{7,20}$", phone):
        return False
    return True


def validate_preference_key(key: str) -> bool:
    """Validate preference key is in allowed list.
    
    Args:
        key: Preference key to validate
        
    Returns:
        True if valid, False otherwise
    """
    allowed_keys = ["language", "theme", "notifications"]
    return key in allowed_keys


def validate_preference_value(key: str, value: str) -> bool:
    """Validate preference value is in allowed list for the key.
    
    Args:
        key: Preference key
        value: Preference value to validate
        
    Returns:
        True if valid, False otherwise
    """
    allowed_values = {
        "language": ["en", "es", "fr", "de"],
        "theme": ["light", "dark", "auto"],
        "notifications": ["email", "push", "off"],
    }
    
    if key not in allowed_values:
        return False
    
    return value in allowed_values[key]


# Default preferences for new users
DEFAULT_PREFERENCES = {
    "language": "en",
    "theme": "light",
    "notifications": "email",
}
