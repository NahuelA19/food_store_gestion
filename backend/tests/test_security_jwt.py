"""Tests for JWT token generation and validation."""

import hashlib
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from jose import JWTError, jwt

from app.security.jwt import (
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_token,

)


@pytest.fixture
def mock_settings():
    with patch("app.security.jwt.settings") as mock:
        mock.secret_key = "test-secret-key-for-testing-only"
        mock.algorithm = "HS256"
        mock.access_token_expire_minutes = 15
        yield mock


class TestCreateAccessToken:
    def test_returns_string(self, mock_settings):
        token = create_access_token({"user_id": 1})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_can_be_decoded(self, mock_settings):
        data = {"user_id": 42, "email": "test@example.com"}
        token = create_access_token(data)

        payload = jwt.decode(
            token,
            mock_settings.secret_key,
            algorithms=[mock_settings.algorithm],
        )
        assert payload["user_id"] == 42
        assert payload["email"] == "test@example.com"
        assert "exp" in payload

    def test_custom_expiry(self, mock_settings):
        token = create_access_token(
            {"user_id": 1},
            expires_delta=timedelta(minutes=5),
        )
        payload = jwt.decode(
            token,
            mock_settings.secret_key,
            algorithms=[mock_settings.algorithm],
        )
        assert payload["user_id"] == 1

    def test_different_data_produces_different_tokens(self, mock_settings):
        token_a = create_access_token({"user_id": 1})
        token_b = create_access_token({"user_id": 2})
        assert token_a != token_b


class TestVerifyToken:
    def test_returns_payload_for_valid_token(self, mock_settings):
        data = {"user_id": 7, "role": "admin"}
        token = create_access_token(data)

        payload = verify_token(token)

        assert payload is not None
        assert payload["user_id"] == 7
        assert payload["role"] == "admin"
        assert "exp" in payload

    def test_returns_none_for_expired_token(self, mock_settings):
        with patch("jose.jwt.decode", side_effect=JWTError("Signature has expired.")):
            result = verify_token("expired-token")
            assert result is None

    def test_returns_none_for_malformed_token(self):
        with patch("app.security.jwt.settings") as mock:
            mock.secret_key = "test-key"
            mock.algorithm = "HS256"
            result = verify_token("not-a-valid-jwt")
            assert result is None

    def test_returns_none_when_jwt_decode_raises_jwterror(self, mock_settings):
        with patch("jose.jwt.decode", side_effect=JWTError("Invalid signature")):
            result = verify_token("some-token")
            assert result is None


class TestHashToken:
    def test_returns_sha256_hexdigest(self):
        raw = "test-refresh-abc"
        expected = hashlib.sha256(raw.encode()).hexdigest()
        result = hash_token(raw)
        assert result == expected

    def test_output_length_is_64_chars(self):
        raw = "any-input"
        result = hash_token(raw)
        assert len(result) == 64

    def test_different_inputs_produce_different_hashes(self):
        assert hash_token("token-a") != hash_token("token-b")


class TestCreateRefreshToken:
    @pytest.mark.asyncio
    async def test_creates_token_and_adds_to_session(self):
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()

        with patch("app.security.jwt.secrets.token_urlsafe", return_value="mocked-token-123"):
            result = await create_refresh_token(1, mock_session)

        assert result == "mocked-token-123"
        mock_session.add.assert_called_once()
        mock_session.flush.assert_awaited_once()

        added_token = mock_session.add.call_args[0][0]
        assert added_token.user_id == 1
        assert added_token.token_hash == hashlib.sha256("mocked-token-123".encode()).hexdigest()

    @pytest.mark.asyncio
    async def test_different_user_id_stored_correctly(self):
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()

        with patch("app.security.jwt.secrets.token_urlsafe", return_value="another-token"):
            result = await create_refresh_token(99, mock_session)

        assert result == "another-token"
        added_token = mock_session.add.call_args[0][0]
        assert added_token.user_id == 99
