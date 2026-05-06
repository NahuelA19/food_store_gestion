"""Tests for password hashing and validation utilities."""

import pytest

from app.security.password import (
    get_password_hash,
    validate_password_strength,
    verify_password,
)


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_password_hashing_creates_different_hashes(self):
        """Same password produces different hashes (due to salt)."""
        password = "TestPassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different (different salts)
        assert hash1 != hash2
        # But both should verify against the same password
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_verify_password_with_correct_password(self):
        """Correct password verifies against hash."""
        password = "MySecurePassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed)

    def test_verify_password_with_incorrect_password(self):
        """Incorrect password fails verification."""
        password = "MySecurePassword123"
        wrong_password = "WrongPassword123"
        hashed = get_password_hash(password)

        assert not verify_password(wrong_password, hashed)

    def test_verify_password_with_empty_password(self):
        """Empty password fails verification."""
        hashed = get_password_hash("MyPassword123")

        assert not verify_password("", hashed)

    def test_password_hash_format(self):
        """Password hash is in bcrypt format."""
        password = "TestPassword123"
        hashed = get_password_hash(password)

        # Bcrypt hashes start with $2a$, $2b$, $2y$
        assert hashed.startswith(("$2a$", "$2b$", "$2y$"))


class TestPasswordValidation:
    """Test password strength validation."""

    def test_valid_password(self):
        """Valid password passes validation."""
        password = "ValidPass123"
        is_valid, error = validate_password_strength(password)

        assert is_valid
        assert error == ""

    def test_password_too_short(self):
        """Password with less than 8 characters fails."""
        password = "Short1A"
        is_valid, error = validate_password_strength(password)

        assert not is_valid
        assert "8 characters" in error

    def test_password_missing_uppercase(self):
        """Password without uppercase letter fails."""
        password = "lowercase123"
        is_valid, error = validate_password_strength(password)

        assert not is_valid
        assert "uppercase" in error.lower()

    def test_password_missing_digit(self):
        """Password without digit fails."""
        password = "NoDigitHere"
        is_valid, error = validate_password_strength(password)

        assert not is_valid
        assert "digit" in error.lower()

    @pytest.mark.parametrize("valid_password", [
        "ValidPass123",
        "AnotherGood2Pass",
        "Secure9Pass",
        "ComplexPassw0rd",
    ])
    def test_various_valid_passwords(self, valid_password):
        """Various valid passwords pass validation."""
        is_valid, error = validate_password_strength(valid_password)

        assert is_valid, f"Password '{valid_password}' should be valid: {error}"
        assert error == ""

    @pytest.mark.parametrize("invalid_password,reason", [
        ("short1", "too short"),
        ("nouppercase123", "no uppercase"),
        ("NODIGITS", "no digit"),
        ("NoD", "multiple issues"),
    ])
    def test_various_invalid_passwords(self, invalid_password, reason):
        """Various invalid passwords fail validation."""
        is_valid, error = validate_password_strength(invalid_password)

        assert not is_valid, f"Password '{invalid_password}' should be invalid ({reason})"
        assert error != ""
