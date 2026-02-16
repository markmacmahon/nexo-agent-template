"""Tests for webhook helper functions: masking, header building, serialization."""

import json
from unittest.mock import MagicMock


from app.config import settings
from app.schemas import AppRead
from app.services.orchestrator import (
    _build_webhook_headers,
    _serialize_payload,
)


class TestAppReadMaskSecret:
    def test_mask_secret_with_secret_set(self):
        """mask_secret replaces the real secret with a masked placeholder."""
        app = AppRead(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            name="Test App",
            webhook_secret="real-secret-value-abc123",
        )

        masked = AppRead.mask_secret(app)

        assert masked.webhook_secret == "••••••"
        # Original object is not mutated (model_copy returns new instance)
        assert app.webhook_secret == "real-secret-value-abc123"

    def test_mask_secret_with_no_secret(self):
        """mask_secret returns the same app when webhook_secret is None."""
        app = AppRead(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            name="Test App",
            webhook_secret=None,
        )

        masked = AppRead.mask_secret(app)

        assert masked.webhook_secret is None

    def test_mask_secret_with_empty_string(self):
        """mask_secret treats empty string as falsy - no masking needed."""
        app = AppRead(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            name="Test App",
            webhook_secret="",
        )

        masked = AppRead.mask_secret(app)

        assert masked.webhook_secret == ""

    def test_mask_secret_preserves_other_fields(self):
        """mask_secret does not alter any fields other than webhook_secret."""
        app = AppRead(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            name="My App",
            description="Some desc",
            webhook_url="https://example.com/hook",
            webhook_secret="secret123",
            config_json={"integration": {"mode": "webhook"}},
        )

        masked = AppRead.mask_secret(app)

        assert masked.name == "My App"
        assert masked.description == "Some desc"
        assert masked.webhook_url == "https://example.com/hook"
        assert masked.config_json == {"integration": {"mode": "webhook"}}
        assert masked.webhook_secret == "••••••"


class TestBuildWebhookHeaders:
    def _make_app(self, *, webhook_secret=None):
        app = MagicMock()
        app.id = "app-123"
        app.webhook_secret = webhook_secret
        return app

    def _make_thread(self):
        thread = MagicMock()
        thread.id = "thread-456"
        return thread

    def test_headers_without_secret(self):
        """Without webhook_secret, no signature headers are included."""
        app = self._make_app(webhook_secret=None)
        thread = self._make_thread()

        headers = _build_webhook_headers(app, thread, '{"test":true}')

        assert "Content-Type" in headers
        assert settings.WEBHOOK_HEADER_APP_ID in headers
        assert settings.WEBHOOK_HEADER_THREAD_ID in headers
        assert settings.WEBHOOK_HEADER_TIMESTAMP not in headers
        assert settings.WEBHOOK_HEADER_SIGNATURE not in headers

    def test_headers_with_secret(self):
        """With webhook_secret, signature and timestamp headers are included."""
        app = self._make_app(webhook_secret="test-secret")
        thread = self._make_thread()

        headers = _build_webhook_headers(app, thread, '{"test":true}')

        assert settings.WEBHOOK_HEADER_TIMESTAMP in headers
        assert settings.WEBHOOK_HEADER_SIGNATURE in headers
        assert headers[settings.WEBHOOK_HEADER_SIGNATURE].startswith("sha256=")
        # Timestamp should be a string of digits
        assert headers[settings.WEBHOOK_HEADER_TIMESTAMP].isdigit()

    def test_signature_changes_with_different_body(self):
        """Different raw_body produces different signature."""
        app = self._make_app(webhook_secret="test-secret")
        thread = self._make_thread()

        headers1 = _build_webhook_headers(app, thread, '{"body":"one"}')
        headers2 = _build_webhook_headers(app, thread, '{"body":"two"}')

        sig_header = settings.WEBHOOK_HEADER_SIGNATURE
        assert headers1[sig_header] != headers2[sig_header]

    def test_empty_secret_string_does_not_sign(self):
        """Empty string webhook_secret is falsy - no signing."""
        app = self._make_app(webhook_secret="")
        thread = self._make_thread()

        headers = _build_webhook_headers(app, thread, '{"test":true}')

        assert settings.WEBHOOK_HEADER_TIMESTAMP not in headers
        assert settings.WEBHOOK_HEADER_SIGNATURE not in headers


class TestSerializePayload:
    def test_produces_compact_json(self):
        """Serialization uses compact separators (no whitespace)."""
        payload = {"key": "value", "nested": {"a": 1}}

        result = _serialize_payload(payload)

        assert " " not in result  # No whitespace
        assert result == '{"key":"value","nested":{"a":1}}'

    def test_preserves_key_order(self):
        """Serialization preserves insertion order (sort_keys=False)."""
        payload = {"z": 1, "a": 2, "m": 3}

        result = _serialize_payload(payload)

        assert result == '{"z":1,"a":2,"m":3}'

    def test_stable_across_calls(self):
        """Same input always produces the same output."""
        payload = {"message": "hello", "count": 42}

        result1 = _serialize_payload(payload)
        result2 = _serialize_payload(payload)

        assert result1 == result2

    def test_handles_unicode(self):
        """Serialization handles unicode content correctly."""
        payload = {"message": "Hola, ¿cómo estás?"}

        result = _serialize_payload(payload)

        parsed = json.loads(result)
        assert parsed["message"] == "Hola, ¿cómo estás?"
