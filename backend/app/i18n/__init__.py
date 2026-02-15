"""Centralised i18n string constants.

Every user-facing string lives here so there is a single place to review,
translate, or change wording.  Call ``t(key)`` from application code.
"""

from .keys import t

__all__ = ["t"]
