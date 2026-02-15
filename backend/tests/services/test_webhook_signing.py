"""Tests for webhook request signing utility."""

from app.services.webhook_signing import sign_webhook_request


class TestSignWebhookRequest:
    def test_returns_timestamp_and_signature(self):
        """sign_webhook_request returns a (timestamp, signature) tuple."""
        secret = "test-secret-key"
        body = '{"message":"hello"}'

        timestamp, signature = sign_webhook_request(secret, body)

        assert isinstance(timestamp, int)
        assert isinstance(signature, str)
        assert signature.startswith("sha256=")

    def test_signature_is_hex(self):
        """Signature after 'sha256=' prefix is lowercase hex."""
        secret = "my-secret"
        body = '{"test":true}'

        _, signature = sign_webhook_request(secret, body)

        hex_part = signature.removeprefix("sha256=")
        assert len(hex_part) == 64  # SHA256 hex is 64 chars
        assert hex_part == hex_part.lower()
        # Verify it's valid hex
        int(hex_part, 16)

    def test_same_input_same_signature(self):
        """Same secret + body produces same signature (timestamp aside)."""
        secret = "deterministic"
        body = '{"key":"value"}'

        _, sig1 = sign_webhook_request(secret, body, timestamp=1000)
        _, sig2 = sign_webhook_request(secret, body, timestamp=1000)

        assert sig1 == sig2

    def test_different_body_different_signature(self):
        """Different body produces different signature."""
        secret = "same-secret"

        _, sig1 = sign_webhook_request(secret, '{"a":1}', timestamp=1000)
        _, sig2 = sign_webhook_request(secret, '{"a":2}', timestamp=1000)

        assert sig1 != sig2

    def test_different_secret_different_signature(self):
        """Different secret produces different signature."""
        body = '{"same":"body"}'

        _, sig1 = sign_webhook_request("secret-1", body, timestamp=1000)
        _, sig2 = sign_webhook_request("secret-2", body, timestamp=1000)

        assert sig1 != sig2

    def test_different_timestamp_different_signature(self):
        """Different timestamp produces different signature."""
        secret = "same-secret"
        body = '{"same":"body"}'

        _, sig1 = sign_webhook_request(secret, body, timestamp=1000)
        _, sig2 = sign_webhook_request(secret, body, timestamp=2000)

        assert sig1 != sig2

    def test_known_vector(self):
        """Verify against a known HMAC-SHA256 computation."""
        import hmac
        import hashlib

        secret = "test-key"
        body = '{"hello":"world"}'
        ts = 1707960000

        expected_payload = f"{ts}.{body}"
        expected_sig = (
            "sha256="
            + hmac.new(
                secret.encode(), expected_payload.encode(), hashlib.sha256
            ).hexdigest()
        )

        timestamp, signature = sign_webhook_request(secret, body, timestamp=ts)

        assert timestamp == ts
        assert signature == expected_sig

    def test_accepts_custom_timestamp(self):
        """Can override timestamp for deterministic testing."""
        _, _ = sign_webhook_request("s", "b", timestamp=42)
        # No error means it accepted the parameter

    def test_auto_generates_timestamp(self):
        """Without explicit timestamp, generates a reasonable unix time."""
        import time

        timestamp, _ = sign_webhook_request("s", "b")

        # Should be within 5 seconds of now
        assert abs(timestamp - int(time.time())) < 5
