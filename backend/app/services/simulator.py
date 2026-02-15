"""Simulator handler for generating canned assistant responses."""

from typing import Any

from app.schemas import RunResult
from app.i18n import t

_ECOMMERCE_RESPONSE_KEYS = [
    "SIM_ECOMMERCE_1",
    "SIM_ECOMMERCE_2",
    "SIM_ECOMMERCE_3",
    "SIM_ECOMMERCE_4",
    "SIM_ECOMMERCE_5",
]


class SimulatorHandler:
    """Generates deterministic simulated responses based on scenario config."""

    def __init__(self, config: dict[str, Any]) -> None:
        self.scenario: str = config.get("scenario", "generic")
        self.disclaimer: bool = config.get("disclaimer", False)
        self.latency_ms: int = config.get("latency_ms", 0)

    def generate(self, user_message: str) -> RunResult:
        if self.scenario == "ecommerce_support":
            reply = self._ecommerce_reply(user_message)
        else:
            reply = self._generic_reply(user_message)

        if self.disclaimer:
            reply = t("SIM_DISCLAIMER_PREFIX", reply=reply)

        return RunResult(
            reply_text=reply,
            source="simulator",
            metadata={"scenario": self.scenario},
            pending=False,
        )

    def _generic_reply(self, user_message: str) -> str:
        if not user_message:
            return t("SIM_GENERIC_EMPTY")
        return t("SIM_GENERIC_ECHO", message=user_message)

    def _ecommerce_reply(self, user_message: str) -> str:
        # Pick response deterministically based on message length
        idx = len(user_message) % len(_ECOMMERCE_RESPONSE_KEYS)
        return t(_ECOMMERCE_RESPONSE_KEYS[idx])
