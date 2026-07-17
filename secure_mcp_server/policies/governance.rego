package secure_mcp.governance

default decision = "ALLOW"
default explanation = "Execution permitted by default policies"

# ---------------------------------------------------------------------------
# DENY RULES
# ---------------------------------------------------------------------------

# Deny highly destructive intents without exception
deny[msg] {
    input.intent.intent_category == "delete"
    input.risk.score >= 0.9
    msg := "High risk destructive actions are strictly prohibited"
}

# Deny execution if session is tainted and intent is mutating
deny[msg] {
    input.intent.intent_category == "write"
    count(input.taints) > 0
    msg := "Mutating actions are not allowed when session is tainted"
}

# Deny shell injection in string parameters
deny[msg] {
    some key
    val := input.arguments[key]
    is_string(val)
    regex.match("[;&|`$]", val)
    msg := sprintf("Injection detected in parameter '%v': contains dangerous characters", [key])
}

# Deny direct device or sensitive system file access in arguments
deny[msg] {
    some key
    val := input.arguments[key]
    is_string(val)
    regex.match("(/dev/|/proc/|/etc/passwd|/etc/shadow|/etc/sudoers)", val)
    msg := sprintf("Access to sensitive system file or device prohibited in parameter '%v'", [key])
}

# Deny execution if session is tainted and category is sensitive
deny[msg] {
    taint_blocking_categories := {"write", "execute", "delete", "configure", "admin"}
    taint_blocking_categories[input.intent.intent_category]
    count(input.taints) > 0
    msg := sprintf("Tainted session cannot execute sensitive action: category '%v'", [input.intent.intent_category])
}

# Deny access if user context does not have required permissions
deny[msg] {
    req_perms := input.tool_metadata.permissions_required
    count(req_perms) > 0
    not has_all_permissions(input.user_context.permissions, req_perms)
    msg := sprintf("Missing required permissions. Need: %v", [req_perms])
}

has_all_permissions(user_perms, req_perms) {
    user_perms[_] == "*"
}

has_all_permissions(user_perms, req_perms) {
    count({p | p := req_perms[_]; p == user_perms[_]}) == count(req_perms)
}

# ---------------------------------------------------------------------------
# REQUIRE_APPROVAL RULES
# ---------------------------------------------------------------------------

# Require approval for any write action that is not highly destructive but has medium-high risk
require_approval[msg] {
    input.intent.intent_category == "write"
    input.risk.score >= 0.7
    input.risk.score < 0.9
    count(input.taints) == 0
    msg := "Medium-high risk writes require manual approval"
}

# Require approval for cross-environment execution
require_approval[msg] {
    input.tool_metadata.sensitivity_level == "restricted"
    input.user_context.role != "admin"
    msg := "Restricted sensitivity tools require admin approval for non-admins"
}

# Require approval for any delete action that has risk >= 0.7
require_approval[msg] {
    input.intent.intent_category == "delete"
    input.risk.score >= 0.7
    msg := "Destructive delete actions require manual approval"
}

# ---------------------------------------------------------------------------
# DECISION LOGIC
# ---------------------------------------------------------------------------

decision = "DENY" {
    count(deny) > 0
} else = "REQUIRE_APPROVAL" {
    count(require_approval) > 0
}

explanation = concat("; ", deny) {
    count(deny) > 0
} else = concat("; ", require_approval) {
    count(require_approval) > 0
}
