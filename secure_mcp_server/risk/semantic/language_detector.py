"""
Semantic Risk Layer — Language / Script Detector.

Fast, local (no API call) detection of non-Latin script and common
Hinglish/transliterated tokens.  This is the **cost gate** — if content
is unambiguously plain English, the expensive Sarvam API call is skipped
entirely and the semantic layer returns a neutral/no-op signal.

Detection strategy:
1. Unicode range check for Devanagari (U+0900–U+097F) and other Indic scripts.
2. Curated wordlist of common Hinglish/transliterated tokens that appear in
   adversarial prompts (e.g. "karo", "ignore", "chupke", transliterated
   Hindi instructions).
3. ASCII-only heuristic: if every character is in the basic Latin + common
   punctuation range, and no Hinglish tokens are found, classify as Latin-only.
"""

from __future__ import annotations

import re
import unicodedata
from typing import List, Set

from .interfaces import LanguageDetectorProtocol
from .models import LanguageProfile, ScriptType


# ---------------------------------------------------------------------------
# Hinglish / transliterated token wordlist
# ---------------------------------------------------------------------------
# These are common transliterated Hindi words found in adversarial prompt
# injection attempts.  The list is intentionally conservative — it catches
# common attack phrases while minimising false positives on English text.

_HINGLISH_TOKENS: Set[str] = {
    # Instruction / command words
    "karo", "kro", "kar", "karna", "karke",
    "batao", "bata", "batana",
    "bhejo", "bhej", "bhejna",
    "dikhao", "dikha", "dikhana",
    "hatao", "hata", "hatana",
    "dalo", "dal", "daalna",
    "chala", "chalao", "chalana",
    "ruko", "rok", "rokna",
    # Negation / evasion
    "ignore", "nazar", "andaz", "andaaz",
    "bhool", "bhul", "bhulna",
    "chupke", "chupao", "chupa", "chhupa",
    "tod", "todo", "todna",
    # Policy / rule words
    "niyam", "policy", "niti",
    "purani", "pehle", "pahle",
    "sabhi", "sab", "saare", "saari",
    # Common sentence connectors
    "aur", "phir", "fir", "lekin", "magar",
    "kyunki", "kyuki", "isliye",
    "yeh", "ye", "woh", "wo",
    "kya", "kaise", "kab", "kahan",
    # Deceptive intent markers
    "chhod", "chhodo", "chod", "chodo",
    "maan", "maano", "samjho",
    "command", "run", "execute",
    # Data exfiltration related
    "password", "paasword",
    "data", "jaankari", "jankari",
    "nikalo", "nikal", "nikalna",
}

# Compile a regex that matches any Hinglish token as a whole word
_HINGLISH_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in sorted(_HINGLISH_TOKENS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

# Unicode ranges for Indic scripts
_DEVANAGARI_RANGE = range(0x0900, 0x0980)  # U+0900–U+097F
_BENGALI_RANGE = range(0x0980, 0x0A00)
_GURMUKHI_RANGE = range(0x0A00, 0x0A80)
_GUJARATI_RANGE = range(0x0A80, 0x0B00)
_TAMIL_RANGE = range(0x0B80, 0x0C00)
_TELUGU_RANGE = range(0x0C00, 0x0C80)
_KANNADA_RANGE = range(0x0C80, 0x0D00)
_MALAYALAM_RANGE = range(0x0D00, 0x0D80)

_INDIC_RANGES = [
    _DEVANAGARI_RANGE, _BENGALI_RANGE, _GURMUKHI_RANGE,
    _GUJARATI_RANGE, _TAMIL_RANGE, _TELUGU_RANGE,
    _KANNADA_RANGE, _MALAYALAM_RANGE,
]


def _has_indic_chars(text: str) -> bool:
    """Check if text contains any characters from Indic Unicode blocks."""
    for char in text:
        code_point = ord(char)
        for indic_range in _INDIC_RANGES:
            if code_point in indic_range:
                return True
    return False


def _find_hinglish_tokens(text: str) -> List[str]:
    """Find all Hinglish/transliterated tokens in the text."""
    matches = _HINGLISH_PATTERN.findall(text)
    # Deduplicate while preserving order
    seen: set = set()
    result: List[str] = []
    for m in matches:
        lower = m.lower()
        if lower not in seen:
            seen.add(lower)
            result.append(lower)
    return result


class LanguageDetector(LanguageDetectorProtocol):
    """Fast, local language/script detector.

    No network calls, no external dependencies.  Designed to be the cost
    gate for the Sarvam API — if this returns ``is_latin_only=True``, the
    API call is skipped entirely.
    """

    def detect(self, content: str) -> LanguageProfile:
        """Detect script and language characteristics of the content.

        Logic:
        1. If content contains Devanagari/Indic Unicode chars → not Latin-only.
        2. If content contains Hinglish transliterated tokens → not Latin-only.
        3. Otherwise → Latin-only (skip Sarvam call).

        The confidence reflects how certain the detector is:
        - Devanagari chars present → confidence 0.95 (very certain)
        - Hinglish tokens found → confidence scales with token count
        - Latin-only → confidence 0.90 (could miss novel transliterations)
        """
        if not content or not content.strip():
            return LanguageProfile(
                script=ScriptType.LATIN,
                is_latin_only=True,
                confidence=1.0,
                detected_tokens=[],
            )

        has_indic = _has_indic_chars(content)
        hinglish_tokens = _find_hinglish_tokens(content)

        if has_indic and hinglish_tokens:
            return LanguageProfile(
                script=ScriptType.MIXED,
                is_latin_only=False,
                confidence=0.95,
                detected_tokens=hinglish_tokens,
            )
        elif has_indic:
            return LanguageProfile(
                script=ScriptType.DEVANAGARI,
                is_latin_only=False,
                confidence=0.95,
                detected_tokens=[],
            )
        elif hinglish_tokens:
            # Confidence scales: more tokens → more confident it's Hinglish
            token_confidence = min(0.50 + 0.10 * len(hinglish_tokens), 0.90)
            return LanguageProfile(
                script=ScriptType.LATIN,  # Script is Latin (transliterated)
                is_latin_only=False,
                confidence=token_confidence,
                detected_tokens=hinglish_tokens,
            )
        else:
            return LanguageProfile(
                script=ScriptType.LATIN,
                is_latin_only=True,
                confidence=0.90,
                detected_tokens=[],
            )
