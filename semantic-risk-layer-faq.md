# Semantic Risk Layer — FAQ & Trust Model

This doc exists to answer the hard questions a skeptical engineer, investor, or customer security team will ask about the Indic-aware semantic risk layer, before they ask them. Read this alongside `runwall-indic-risk-layer-plan.md`.

---

### 1. "The connected agent already has an LLM that understands Hindi. Why does Runwall need its own?"

Because Runwall's entire premise is zero-trust toward the agent it's governing. The agent's LLM is the thing that might already be compromised — that's literally what a prompt injection is. Asking the same LLM "was this risky?" is circular: you're asking a possibly-compromised system to self-report. Runwall has to form an independent judgment that doesn't depend on the agent's own reasoning being intact.

### 2. "Isn't that a contradiction — 'don't trust the agent's LLM' but 'trust Sarvam's LLM'?"

No, because the *kind* of trust is different. The agent's LLM has agency — it can call tools, move data, take real actions. That's why it's dangerous when compromised. Sarvam, in this design, has zero agency: it receives a text string and returns an opinion score. It never executes anything, never touches infrastructure, never gets write access. You're not trusting Sarvam to *do* anything — only to *comment* on something. That's a categorically smaller trust grant.

### 3. "What if Sarvam's judgment is just wrong, or Sarvam itself gets fooled by clever phrasing?"

Two failure directions, and they're not symmetric:
- Sarvam flags something safe as risky (false positive) → you block/annoy a legitimate action. Safe-direction failure.
- Sarvam misses a real attack (false negative) → you're exactly back to where you'd be with *no* semantic layer at all — not worse than baseline, just not improved.

Sarvam being wrong can never let an attacker *execute* something, because Sarvam's output is never the sole authority — see #4.

### 4. "So what actually stops Sarvam's opinion from being the deciding factor?"

The deterministic rule-based layer (regex/pattern matching for known PII formats, known injection phrases) always runs first and has veto power. Sarvam's score is fused with the rule-based score, weighted — it can add suspicion on top of a rule-flagged case, but it cannot override a hard rule match. If a regex catches an Aadhaar number in the payload, that block happens regardless of what Sarvam says about the surrounding text.

### 5. "What happens if Sarvam's API is down, times out, or returns garbage?"

That's a configured, explicit failure mode, not an accident:
- **Fail-open:** ignore the degraded semantic result, fall back to rules-only scoring. Prioritizes availability.
- **Fail-closed:** treat a degraded/unavailable semantic result as elevated risk. Prioritizes security.

Which mode is active is a config decision per deployment, documented in code, not a silent default. A broken or unreachable Sarvam call never gets silently treated as "safe."

### 6. "Doesn't calling an LLM on every single tool call slow everything down?"

It shouldn't, and the design deliberately avoids it. The LLM call is not on the default hot path. Deterministic rules run on every call — fast, free, no network round-trip. The Sarvam call only fires when rules flag something as *ambiguous* (non-Latin script detected + a borderline signal, but no exact rule match). That's expected to be a small minority of traffic, not the default.

### 7. "Isn't sending tool-call content to an external LLM exactly what a DLP/taint-tracking product is supposed to prevent?"

Yes — that tension is real, not hand-waved away. That's why the semantic layer is opt-in and configurable per tenant, not a mandatory default. A customer has to explicitly consent to their (already rule-screened, already flagged-as-ambiguous) content being sent to Sarvam for deeper classification. This is also framed as a compliance-relevant toggle for regulated customers (BFSI, etc.) rather than something baked in silently.

### 8. "Why not just make the LLM mandatory since it's more accurate?"

Because "more accurate" doesn't outweigh: (a) it breaks Runwall's own "zero-code-change, doesn't slow you down" positioning if it's on every call, (b) it creates a new privacy exposure by default, (c) it hard-couples Runwall's core path to a single external vendor, which conflicts with Runwall being a provider-agnostic proxy. The rule engine is the mandatory, always-on floor. The LLM is a configurable enhancement layered on top of that floor.

### 9. "How do you know the semantic layer is actually reliable before it affects real users?"

It ships in shadow mode first: it computes and logs its risk score for a period (proposed 1–2 weeks) but does not influence real enforcement decisions. Only after reviewing real false-positive/false-negative behavior against production traffic does it get switched to actually affect approvals/blocks.

### 10. "What stops the ₹50,000 in credits from just getting burned instantly?"

Three things, all in the design: (1) the rule-based layer filters out the majority of traffic before any LLM call happens, (2) a cache keyed by content hash avoids re-classifying identical/repeated tool-call arguments (common in agent loops), (3) a budget guard tracks cumulative spend and disables the semantic layer (falling back to rules-only) once a configured threshold is hit, rather than failing silently or overspending.

### 11. "Is Runwall now dependent on Sarvam specifically?"

No, by design. The Sarvam client sits behind a `RiskClassifier` interface. Sarvam is the reference/default implementation because of the credit grant, but any other provider (or no provider, rules-only) can be substituted per-tenant without touching the rest of the pipeline. This preserves Runwall's positioning as a protocol-level, provider-agnostic proxy.

### 12. "Bottom line — why is this safe to add?"

Because no single component has unilateral authority. The rule engine is the hard floor and always wins on structural matches. Sarvam only ever adds a soft suspicion signal on top, its failure modes are explicit and configured (not silent), it never gains execution ability, and it only sees content that's already passed through cheaper, local screening. The worst case if it fails is "no better than before," never "worse than before."
