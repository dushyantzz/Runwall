# Task: Implement GEO (Generative Engine Optimization) for Runwall Website

## Context
Runwall (https://runwall.vercel.app/) is a zero-trust AI agent governance platform with an MCP backend. This is a **frontend-only, content/markup task**. The goal is to make the site fully readable and citable by AI crawlers and answer engines (ChatGPT, Perplexity, Claude, Gemini, Copilot, Google AI Overviews) so the product can surface when people ask AI tools about "AI agent governance," "MCP security," "zero-trust AI agents," etc.

## Hard constraints — read before starting
- **DO NOT modify any backend logic, API routes, database calls, auth, MCP server code, or business logic.**
- **DO NOT change existing functionality, routing behavior, or component logic/state.**
- This task is scoped to: rendering strategy for content pages, HTML/markup, metadata, structured data, static text content, and new static files (robots.txt, llms.txt, sitemap.xml).
- If a change requires touching backend/API code to achieve, stop and flag it instead of proceeding — don't improvise backend edits.
- Preserve all existing visual design/styling. This is not a redesign — do not change CSS, layout, colors, or components' visual appearance.

## Step 1 — Diagnose rendering (do this first, report findings before proceeding)
1. Identify the framework/router in use (Next.js App Router vs Pages Router, or other).
2. For the homepage and any key marketing/docs pages, determine whether content is server-rendered (visible in raw HTML response) or purely client-rendered (empty shell, hydrated via JS).
   - Test: run `curl -s https://runwall.vercel.app/ | head -100` or equivalent, and compare to what renders in-browser.
3. Report back: which pages are SSR/SSG already, which are client-only, and why (e.g., `"use client"` at the page level, data fetched only in `useEffect`, etc.).

## Step 2 — Fix rendering so content is crawlable
For every page that should be discoverable (home, features, docs, pricing/about, blog if any):
1. Convert page-level components to Server Components where possible (Next.js App Router default), or use `getStaticProps`/`getServerSideProps` (Pages Router) so the core marketing/explanatory text is present in the initial HTML response — not injected client-side only.
2. If a page has interactive elements (animations, dashboards, live demos) that require client-side JS, keep those as isolated `"use client"` child components, but ensure the surrounding textual content (headings, descriptions, feature lists) stays server-rendered.
3. Do not touch any data-fetching logic that talks to backend APIs/MCP servers — only touch how static/marketing content is rendered.
4. Verify: after changes, `curl`/view-source on each page must show real text content (product description, feature names, headings) without executing JS.

## Step 3 — Write LLM-friendly on-page content
On the homepage and relevant subpages, ensure the following exist as real, crawlable text (add if missing, don't fabricate — ask me for the accurate facts if unsure):
1. A clear, self-contained one-paragraph definition near the top of the homepage, e.g. structured as: "Runwall is a [category] that [does what] for [who], using [key mechanism]." Keep it factual and specific, not marketing fluff.
2. A "Features" or "How it works" section using **semantic HTML** — real `<h2>`/`<h3>` headings, `<ul>`/`<ol>` lists, and short direct sentences (not just images/icons with no text alternative).
3. Specific, citable facts and numbers already known about the product (e.g., audit score improvement, architecture components like OPA enforcement, risk scoring, taint tracking, approval workflows, audit trails) written as plain declarative sentences.
4. An FAQ section (even 5–8 Q&As) covering likely questions: "What is Runwall?", "How does Runwall secure MCP servers?", "What is zero-trust AI agent governance?", "How is Runwall different from X?" — formatted as actual `<h3>question</h3><p>answer</p>` pairs, not JS-rendered accordions with hidden text (if using an accordion, ensure text is in DOM even when collapsed, just visually hidden via CSS not `display:none` via JS-only render).
5. Ensure all images (logo, diagrams, screenshots) have descriptive `alt` text.

## Step 4 — Structured data (JSON-LD)
Add JSON-LD schema.org markup to the homepage `<head>` (via Next.js `<script type="application/ld+json">`):
1. `SoftwareApplication` schema with: name, description, applicationCategory, operatingSystem (if applicable), and offers (if pricing exists).
2. `Organization` schema with name, url, logo, and sameAs (links to GitHub, LinkedIn, etc.).
3. If an FAQ section was added in Step 3, also mark it up with `FAQPage` schema matching the visible Q&As exactly (schema content must match visible content — no cloaking).

## Step 5 — Metadata improvements
1. Ensure every key page has a unique, descriptive `<title>` and `<meta name="description">` (Next.js `generateMetadata` or `Head` component) — no duplicate/default titles across pages.
2. Add Open Graph and Twitter Card meta tags (title, description, image, url) for better representation when shared/crawled.
3. Add a canonical URL tag per page.

## Step 6 — New static files (create at project root / public folder)
1. **`robots.txt`** (in `/public`): ensure it does NOT block AI crawlers. Explicitly allow: `GPTBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Bingbot`, `CCBot`. Include a `Sitemap:` line pointing to the sitemap.
2. **`sitemap.xml`** (in `/public` or generated via Next.js `sitemap.ts`): list all public marketing/docs pages.
3. **`llms.txt`** (in `/public`, root-accessible at `/llms.txt`): a plain markdown file summarizing:
   - What Runwall is (1–2 sentences)
   - Key capabilities (bullet list)
   - Links to homepage, docs, GitHub repo, and any other canonical resources
   - Keep it concise, factual, and up to date with Step 3 content — ask me for exact current feature list before writing this if uncertain.

## Step 7 — Verification checklist (report results at the end)
- [ ] `curl` of homepage and each key page shows real text content without JS execution
- [ ] `robots.txt` allows AI crawlers and links to sitemap
- [ ] `sitemap.xml` is valid and lists all key pages
- [ ] `/llms.txt` is accessible and accurate
- [ ] JSON-LD validates with no errors (use Google's Rich Results Test or schema.org validator mentally / via structure check)
- [ ] Every page has unique title + meta description
- [ ] No visual/design regressions — site looks identical to before
- [ ] No backend/API/MCP logic was touched — confirm by listing all files changed and their type (should be: page/layout components, public/ static files, metadata config only)

## Deliverable
At the end, provide:
1. A list of all files created/modified.
2. The diagnosis from Step 1 (what was broken and why).
3. Confirmation that no backend code was touched.
4. Any facts/content you were unsure about and left as placeholders for me to fill in (mark clearly as `TODO: confirm with Dushyant`).