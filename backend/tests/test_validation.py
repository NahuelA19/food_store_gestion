"""Tests for user validation utilities."""

from app.validation.user_validation import (
    validate_phone,
    validate_preference_key,
    validate_preference_value,
    validate_profile_name,
)


class TestValidateProfileName:
    """Tests for validate_profile_name function."""

    def test_valid_name(self) -> None:
        """Test valid name passes."""
        assert validate_profile_name("John") is True
        assert validate_profile_name("A") is True
        assert validate_profile_name("John Doe Jr") is True

    def test_empty_name_fails(self) -> None:
        """Test empty name fails."""
        assert validate_profile_name("") is False

    def test_none_name_fails(self) -> None:
        """Test None name fails."""
        assert validate_profile_name(None) is False

    def test_name_too_long_fails(self) -> None:
        """Test name over 50 chars fails."""
        long_name = "A" * 51
        assert validate_profile_name(long_name) is False

    def test_name_at_limit(self) -> None:
        """Test name at 50 char limit passes."""
        name_50 = "A" * 50
        assert validate_profile_name(name_50) is True


class TestValidatePhone:
    """Tests for validate_phone function."""

    def test_valid_phone(self) -> None:
        """Test valid phone numbers pass."""
        assert validate_phone("+1-555-123-4567") is True
        assert validate_phone("5551234567") is True
        assert validate_phone("+1 (555) 123-4567") is True

    def test_none_phone_passes(self) -> None:
        """Test None (optional) passes."""
        assert validate_phone(None) is True

    def test_phone_too_short_fails(self) -> None:
        """Test phone under 7 chars fails."""
        assert validate_phone("123") is False

    def test_phone_too_long_fails(self) -> None:
        """Test phone over 20 chars fails."""
        assert validate_phone("12345678901234567890123") is False

    def test_phone_invalid_chars_fails(self) -> None:
        """Test phone with invalid characters fails."""
        assert validate_phone("555-ABCD-1234") is False

    def test_phone_at_limits(self) -> None:
        """Test phone at 7 and 20 char limits."""
        assert validate_phone("1234567") is True  # 7 chars
        assert validate_phone("12345678901234567890") is True  # 20 chars


class TestValidatePreferenceKey:
    """Tests for validate_preference_key function."""

    def test_valid_keys(self) -> None:
        """Test valid preference keys pass."""
        assert validate_preference_key("language") is True
        assert validate_preference_key("theme") is True
        assert validate_preference_key("notifications") is True

    def test_invalid_key_fails(self) -> None:
        """Test invalid key fails."""
        assert validate_preference_key("color") is False
        assert validate_preference_key("timezone") is False


class TestValidatePreferenceValue:
    """Tests for validate_preference_value function."""

    def test_valid_language_values(self) -> None:
        """Test valid language values pass."""
        assert validate_preference_value("language", "en") is True
        assert validate_preference_value("language", "es") is True
        assert validate_preference_value("language", "fr") is True
        assert validate_preference_value("language", "de") is True

    def test_invalid_language_value_fails(self) -> None:
        """Test invalid language value fails."""
        assert validate_preference_value("language", "xx") is False
        assert validate_preference_value("language", "pt") is False

    def test_valid_theme_values(self) -> None:
        """Test valid theme values pass."""
        assert validate_preference_value("theme", "light") is True
        assert validate_preference_value("theme", "dark") is True
        assert validate_preference_value("theme", "auto") is True

    def test_invalid_theme_value_fails(self) -> None:
        """Test invalid theme value fails."""
        assert validate_preference_value("theme", "blue") is False
        assert validate_preference_value("theme", "high-contrast") is False

    def test_valid_notifications_values(self) -> None:
        """Test valid notifications values pass."""
        assert validate_preference_value("notifications", "email") is True
        assert validate_preference_value("notifications", "push") is True
        assert validate_preference_value("notifications", "off") is True

    def test_invalid_notifications_value_fails(self) -> None:
        """Test invalid notifications value fails."""
        assert validate_preference_value("notifications", "sms") is False
        assert validate_preference_value("notifications", "phone") is False

    def test_invalid_key_fails(self) -> None:
        """Test invalid key fails."""
        assert validate_preference_value("invalid_key", "value") is False
