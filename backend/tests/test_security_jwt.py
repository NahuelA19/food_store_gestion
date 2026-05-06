"""Tests for JWT token generation and validation."""

from datetime import timedelta

from jose import jwt

from app.config import settings
from app.security.jwt import create_access_token, verify_token


class TestJWTTokenGeneration:
    """Test JWT token generation."""

    def test_create_access_token(self):
        """Token is created successfully with correct format."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0
        # JWT has 3 parts separated by dots
        assert token.count(".") == 2

    def test_create_access_token_with_custom_expiry(self):
        """Token with custom expiration delta."""
        data = {"user_id": 1, "email": "test@example.com"}
        expires = timedelta(minutes=30)
        token = create_access_token(data, expires_delta=expires)

        assert isinstance(token, str)
        # Token should be decodable
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["user_id"] == 1
        assert payload["email"] == "test@example.com"
        assert "exp" in payload

    def test_token_contains_user_claims(self):
        """Token payload contains all provided claims."""
        data = {"user_id": 42, "email": "user@example.com", "role": "admin"}
        token = create_access_token(data)

        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["user_id"] == 42
        assert payload["email"] == "user@example.com"
        assert payload["role"] == "admin"


class TestJWTTokenVerification:
    """Test JWT token verification."""

    def test_verify_valid_token(self):
        """Valid token verifies successfully."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = create_access_token(data)

        payload = verify_token(token)
        assert payload is not None
        assert payload["user_id"] == 1
        assert payload["email"] == "test@example.com"

    def test_verify_expired_token_returns_none(self):
        """Expired token returns None."""
        data = {"user_id": 1, "email": "test@example.com"}
        # Create token that expires immediately
        expires = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta=expires)

        payload = verify_token(token)
        assert payload is None

    def test_verify_tampered_token_returns_none(self):
        """Tampered token (invalid signature) returns None."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = create_access_token(data)

        # Modify the token to tamper with it
        tampered_token = token[:-10] + "0000000000"

        payload = verify_token(tampered_token)
        assert payload is None

    def test_verify_malformed_token_returns_none(self):
        """Malformed token returns None."""
        malformed_tokens = [
            "not.a.token",
            "just_a_string",
            "",
            "token",
        ]

        for malformed in malformed_tokens:
            payload = verify_token(malformed)
            assert payload is None, f"Malformed token '{malformed}' should return None"

    def test_verify_token_missing_required_field(self):
        """Token without required claims still decodes but might be invalid for auth."""
        # Create token with minimal claims
        data = {"custom": "value"}
        token = create_access_token(data)

        payload = verify_token(token)
        # Token verifies but doesn't have expected user_id/email
        assert payload is not None
        assert payload.get("custom") == "value"
