import re

with open(".jules/sentinel.md", "a") as f:
    f.write("\n## 2025-02-27 - Regex Path Boundaries for Security (Python updates)\n")
    f.write("**Vulnerability:** Path blocking regexes that lack strict bounds (like `r\"/dev/sda\"` or `r\"/etc/shadow\"`) in Python files like `secure_mcp_server/governance/risk_scorer.py` and `intent_classifier.py` failed to block sensitive device file access when specified via relative paths (e.g. `etc/shadow`), while simultaneously risking false positives on legitimate directories if matched anywhere.\n")
    f.write("**Learning:** Loose substring matches or requiring a leading slash allows trivial bypasses via relative paths and causes false positives on safe paths containing those strings as substrings. `(^|/)` is a better boundary.\n")
    f.write("**Prevention:** Always use strict path boundary anchors `(^|/)` to explicitly match directories either at the root or directly inside a subfolder, instead of loose substring patterns. Apply this to all sensitive paths evaluated in python regexes for security checks.\n")
