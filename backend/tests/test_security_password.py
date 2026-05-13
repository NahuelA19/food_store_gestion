"""Tests for password hashing and validation."""

import pytest

from app.security.password import (
    get_password_hash,
    validate_password_strength,
    verify_password,
)


class TestGetPasswordHash:
    def test_returns_non_empty_string(self):
        result = get_password_hash("TestPass1")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_differs_from_input(self):
        password = "TestPass1"
        result = get_password_hash(password)
        assert result != password

    def test_same_password_produces_different_hashes(self):
        password = "TestPass1"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2  # bcrypt salt ensures uniqueness


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        password = "SecurePass123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_wrong_password_returns_false(self):
        password = "SecurePass123"
        hashed = get_password_hash(password)
        assert verify_password("WrongPass456", hashed) is False

    def test_empty_password_fails(self):
        hashed = get_password_hash("RealPass1")
        assert verify_password("", hashed) is False


class TestValidatePasswordStrength:
    def test_too_short_returns_false(self):
        valid, msg = validate_password_strength("Ab1")
        assert valid is False
        assert "at least 8 characters" in msg

    def test_empty_string_returns_false(self):
        valid, msg = validate_password_strength("")
        assert valid is False
        assert "at least 8 characters" in msg

    def test_no_uppercase_returns_false(self):
        valid, msg = validate_password_strength("abcdefgh1")
        assert valid is False
        assert "uppercase" in msg

    def test_no_digit_returns_false(self):
        valid, msg = validate_password_strength("Abcdefgh")
        assert valid is False
        assert "digit" in msg

    def test_valid_password_returns_true(self):
        valid, msg = validate_password_strength("TestPass1")
        assert valid is True
        assert msg == ""

    def test_valid_password_with_multiple_requirements(self):
        valid, msg = validate_password_strength("ComplexPass99")
        assert valid is True
        assert msg == ""
