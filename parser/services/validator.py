from __future__ import annotations

from typing import Dict, Tuple


def _norm_opt(v: object) -> str | None:
    if v is None:
        return None
    s = str(v).strip().upper()
    if s in {"A", "B", "C", "D"}:
        return s
    return None


def validate_responses(responses: Dict[str, object]) -> Tuple[Dict[str, str], int]:
    """
    Validate and normalize parsed responses.
    Returns (cleaned_responses, valid_count).
    """
    cleaned: Dict[str, str] = {}
    if not responses:
        return cleaned, 0

    for k, v in responses.items():
        key = str(k).strip().upper()
        if not key.startswith("Q"):
            continue
        opt = _norm_opt(v)
        if not opt:
            continue
        cleaned[key] = opt

    return cleaned, len(cleaned)

