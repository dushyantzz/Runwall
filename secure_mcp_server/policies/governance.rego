package secure_mcp.governance

import rego.v1

default decision = "ALLOW"
default explanation = "Execution permitted by default policies"

# ─────────────────────────────────────────────────────────────────────────────
# Helper: collect all string leaf values from an arbitrary nested object.
# Uses the built-in walk/2 iterator.
# ─────────────────────────────────────────────────────────────────────────────
all_arg_strings contains s if {
    walk(input.arguments, [_, val])
    is_string(val)
    s := val
}

# ─────────────────────────────────────────────────────────────────────────────
# Helper: normalise a path string
#   - URL-decode %2e → .  (basic, handles %2E/%2e)
#   - collapse .. segments (naive — good enough for policy matching)
#   - lowercase
# ─────────────────────────────────────────────────────────────────────────────
normalize_path(s) := lower(s) {
    not regex.match("%[0-9a-fA-F]{2}", s)
}

normalize_path(s) := lower(decoded) {
    regex.match("%[0-9a-fA-F]{2}", s)
    decoded := regex.replace(s, "%2[eE]", ".")
}

# ─────────────────────────────────────────────────────────────────────────────
# DENY rules
# ─────────────────────────────────────────────────────────────────────────────

# 1. Critical risk threshold — deny for ANY intent category
deny contains msg if {
    input.risk.score >= 0.9
    msg := "Critical risk score — execution denied by safety threshold"
}

# 2. Deny highly destructive delete actions
deny contains msg if {
    input.intent.intent_category == "delete"
    input.risk.score >= 0.9
    msg := "High risk destructive actions are strictly prohibited"
}

# 3. Deny execution if session is tainted and intent is mutating (write)
deny contains msg if {
    input.intent.intent_category == "write"
    count(input.taints) > 0
    msg := "Mutating actions are not allowed when session is tainted"
}

# 4. Deny shell injection — scan ALL string values recursively
deny contains msg if {
    some val in all_arg_strings
    regex.match("[;&|`$]", val)
    msg := "Shell injection pattern detected in arguments: contains dangerous characters"
}

# 5. Deny sensitive system path / file access — recursive + normalised
deny contains msg if {
    some val in all_arg_strings
    norm := normalize_path(val)
    regex.match(
        "(/etc/(passwd|shadow|sudoers|hosts)|/proc/|/dev/|\\.ssh/|\\.env(/|$)|\\.aws/credentials|\\.git-credentials|kubeconfig|/root/)",
        norm,
    )
    msg := "Access to sensitive path or file is prohibited"
}

# 6. Deny path traversal sequences (../ or URL-encoded equivalents)
deny contains msg if {
    some val in all_arg_strings
    regex.match("(\\.\\./|%2e%2e/|%2e%2e%2f)", lower(val))
    msg := "Path traversal sequence detected in arguments"
}

# 7. Deny SSRF — private/metadata IP ranges and dangerous schemes (recursive)
deny contains msg if {
    some val in all_arg_strings
    regex.match(
        "^(file|gopher|dict|ftp|sftp|ldap|tftp)://",
        lower(val),
    )
    msg := "Non-HTTP(S) URL scheme is blocked to prevent SSRF"
}

deny contains msg if {
    some val in all_arg_strings
    regex.match("https?://", lower(val))
    regex.match(
        "(169\\.254\\.169\\.254|metadata\\.google\\.internal|fd00:ec2::254|localhost|127\\.[0-9]+\\.[0-9]+\\.[0-9]+|10\\.[0-9]+\\.[0-9]+\\.[0-9]+|172\\.(1[6-9]|2[0-9]|3[01])\\.[0-9]+\\.[0-9]+|192\\.168\\.[0-9]+\\.[0-9]+|\\[::1\\]|0177\\.|0x7f)",
        lower(val),
    )
    msg := "URL targets a private/metadata IP address — SSRF blocked"
}

# 8. Deny destructive shell commands in any argument (recursive)
deny contains msg if {
    some val in all_arg_strings
    regex.match(
        "(rm\\s+-rf|mkfs(\\.[a-z]+)?\\s|dd\\s+(if|of)=|\\bshred\\b|chmod\\s+-R\\s+777|>\\s*/dev/|format\\s+c:)",
        lower(val),
    )
    msg := "Destructive shell command detected in arguments"
}

# 9. Deny destructive SQL without WHERE (recursive)
deny contains msg if {
    some val in all_arg_strings
    regex.match(
        "(DROP\\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\\s+TABLE|DELETE\\s+FROM\\s+[a-zA-Z0-9_]+\\s*;)",
        val,
    )
    msg := "Destructive SQL statement detected in arguments"
}

# 10. Deny execution if session is tainted and category is sensitive
deny contains msg if {
    taint_blocking_categories := {"write", "execute", "delete", "configure", "admin"}
    taint_blocking_categories[input.intent.intent_category]
    count(input.taints) > 0
    msg := sprintf("Tainted session cannot execute sensitive action: category '%v'", [input.intent.intent_category])
}

# 11. Deny access if user context does not have required permissions
deny contains msg if {
    req_perms := input.tool_metadata.permissions_required
    count(req_perms) > 0
    not has_all_permissions(input.user_context.permissions, req_perms)
    msg := sprintf("Missing required permissions. Need: %v", [req_perms])
}

has_all_permissions(user_perms, req_perms) if {
    user_perms[_] == "*"
}

has_all_permissions(user_perms, req_perms) if {
    count({p | p := req_perms[_]; p == user_perms[_]}) == count(req_perms)
}

# ─────────────────────────────────────────────────────────────────────────────
# REQUIRE_APPROVAL rules
# ─────────────────────────────────────────────────────────────────────────────

# 12. Generic high-risk gate — any intent with risk >= 0.8
require_approval contains msg if {
    input.risk.score >= 0.8
    input.risk.score < 0.9
    msg := "High risk score — requires manual approval regardless of intent"
}

# 13. Require approval for any write action with medium-high risk (no taints)
require_approval contains msg if {
    input.intent.intent_category == "write"
    input.risk.score >= 0.7
    input.risk.score < 0.9
    count(input.taints) == 0
    msg := "Medium-high risk writes require manual approval"
}

# 14. Require approval for cross-environment / restricted tools
require_approval contains msg if {
    input.tool_metadata.sensitivity_level == "restricted"
    input.user_context.role != "admin"
    msg := "Restricted sensitivity tools require admin approval for non-admins"
}

# 15. Require approval for any delete action with risk >= 0.7
require_approval contains msg if {
    input.intent.intent_category == "delete"
    input.risk.score >= 0.7
    msg := "Destructive delete actions require manual approval"
}

# ─────────────────────────────────────────────────────────────────────────────
# Decision logic (DENY wins over REQUIRE_APPROVAL wins over ALLOW)
# ─────────────────────────────────────────────────────────────────────────────
decision = "DENY" if {
    count(deny) > 0
} else = "REQUIRE_APPROVAL" if {
    count(require_approval) > 0
}

explanation = concat("; ", deny) if {
    count(deny) > 0
} else = concat("; ", require_approval) if {
    count(require_approval) > 0
}
