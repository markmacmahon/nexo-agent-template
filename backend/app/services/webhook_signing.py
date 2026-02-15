"""HMAC-SHA256 webhook request signing.

When a webhook_secret is configured, each outgoing request is signed
so the partner can verify authenticity.

Signing process:
1. Generate unix timestamp (integer seconds)
2. Build signed_payload = "{timestamp}.{raw_body}"
3. Compute HMAC-SHA256(secret, signed_payload)
4. Return (timestamp, "sha256={hex_digest}")
"""

import hashlib
import hmac
import time


def sign_webhook_request(
    secret: str,
    raw_body: str,
    *,
    timestamp: int | None = None,
) -> tuple[int, str]:
    """Sign a webhook request body using HMAC-SHA256.

    Args:
        secret: The shared secret key.
        raw_body: The exact JSON string that will be sent over HTTP.
        timestamp: Unix timestamp in seconds. Auto-generated if not provided.

    Returns:
        A tuple of (timestamp, signature) where signature is "sha256={hex}".
    """
    ts = timestamp if timestamp is not None else int(time.time())
    signed_payload = f"{ts}.{raw_body}"

    digest = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    return ts, f"sha256={digest}"
