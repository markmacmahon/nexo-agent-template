"""Single source of truth for backend-internal translated strings.

Client-facing error keys (ERROR_*, ACTION_*) are returned as raw key
strings to the frontend, which owns the English text and any future
translations.  Only strings that the backend itself must render
(simulator replies, email subjects, webhook-client exceptions) live here.

Naming convention (SCREAMING_SNAKE, category prefix):
  WEBHOOK_*  – webhook-client exception messages (internal / logged)
  SIM_*      – simulator response text
  EMAIL_*    – email subjects and body text
"""

_MESSAGES: dict[str, str] = {
    # ── Webhook validation errors (ValueError, internal) ────────────
    "WEBHOOK_URL_EMPTY": "Webhook URL must not be empty",
    "WEBHOOK_URL_BAD_SCHEME": "Webhook URL must use http or https scheme, got '{scheme}'",
    "WEBHOOK_URL_NO_HOST": "Webhook URL must have a host",
    "WEBHOOK_URL_BLOCKED": "Webhook URL host '{host}' is blocked",
    "WEBHOOK_URL_BLOCKED_PRIVATE": "Webhook URL host '{host}' is blocked (private network)",
    # ── Webhook runtime errors (WebhookError, internal / logged) ────
    "WEBHOOK_TIMEOUT": "Webhook timed out: {detail}",
    "WEBHOOK_REQUEST_FAILED": "Webhook request failed: {detail}",
    "WEBHOOK_BAD_STATUS": "Webhook returned HTTP {status}: {body}",
    "WEBHOOK_INVALID_JSON": "Invalid JSON response from webhook: {detail}",
    "WEBHOOK_MISSING_REPLY": "Webhook response missing required 'reply' field",
    "WEBHOOK_BAD_CONTENT_TYPE": "Expected SSE (text/event-stream) but got '{content_type}'",
    # ── Simulator responses ─────────────────────────────────────────
    "SIM_GENERIC_EMPTY": "I'm here to help. What can I do for you?",
    "SIM_GENERIC_ECHO": "Echo: {message}",
    "SIM_DISCLAIMER_PREFIX": "[Simulated] {reply}",
    "SIM_ECOMMERCE_1": "Thank you for reaching out! I'd be happy to help you with your order. Could you provide your order number?",
    "SIM_ECOMMERCE_2": "I understand your concern. Let me look into that for you right away.",
    "SIM_ECOMMERCE_3": "Your order is currently being processed and should ship within 1-2 business days.",
    "SIM_ECOMMERCE_4": "I've checked our system and your refund has been initiated. Please allow 5-7 business days for it to appear.",
    "SIM_ECOMMERCE_5": "Is there anything else I can help you with today?",
    # ── Email ───────────────────────────────────────────────────────
    "EMAIL_PASSWORD_RESET_SUBJECT": "Password recovery",
}


def t(key: str, **kwargs: object) -> str:
    """Return the message for *key*, formatted with any keyword arguments.

    >>> t("WEBHOOK_URL_BAD_SCHEME", scheme="ftp")
    "Webhook URL must use http or https scheme, got 'ftp'"

    Raises ``KeyError`` if the key is unknown (a programming bug, not a
    user error).
    """
    template = _MESSAGES[key]
    return template.format(**kwargs) if kwargs else template
