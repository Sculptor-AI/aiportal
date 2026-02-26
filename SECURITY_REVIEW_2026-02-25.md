# Security Review Report

## Project

`aiportal` (Cloudflare Worker backend + React frontend)

## Review Date

2026-02-25

## Review Type

Read-only, static security assessment with dependency auditing.  
No application source files were modified during this review.

---

## Executive Summary

This codebase has multiple high-risk issues across authentication, credential handling, and server-side request controls.

- **Critical findings:** 2
- **High findings:** 3
- **Medium findings:** 8
- **Low findings:** 3

Top priorities:

1. Remove and rotate the hardcoded frontend fallback API key immediately.
2. Fix admin suspension/ban bypass logic (admin login + admin middleware status checks).
3. Restrict/validate URL-fetching proxy endpoints to close SSRF/open-proxy abuse.
4. Stop accepting auth tokens via generic query parameters.

---

## Scope & Methodology

### Scope

- `backend/` (routes, middleware, services, auth, worker entrypoint)
- `frontend/` (auth/session handling, link handling, service worker, UI execution surfaces)
- Deployment/workflow and setup documentation
- Dependency vulnerability scan results

### Methods

- Manual code review of trust boundaries and authz/authn flows
- Pattern-based search for risky constructs (`fetch(url)`, token handling, dynamic execution, unsafe URL opening)
- Dependency checks using `npm audit --json` in:
  - repository root
  - `frontend`
  - `backend`
  - `documentation`

---

## Findings

## C-01: Hardcoded API Key in Frontend (Authentication Bypass / Abuse)

**Severity:** Critical  
**Category:** Secrets management / authentication bypass  
**Affected files:**

- `frontend/src/services/aiService.js`
- `frontend/src/services/deepResearchService.js`

### Evidence

- `frontend/src/services/aiService.js` contains a hardcoded `ak_...` fallback key in multiple places:
  - fallback assignment when no user auth is present
  - fallback assignment during model fetching
  - fallback assignment during title generation
- `frontend/src/services/deepResearchService.js` also assigns the same hardcoded fallback key.

### Impact

- Enables unauthenticated or weakly authenticated use of backend-protected functionality.
- Exposes a reusable credential to anyone with frontend code access.
- Allows resource abuse/cost burn (chat/image/video endpoints), especially combined with permissive CORS.

### Recommendation

- Remove all fallback API key logic from frontend immediately.
- Rotate/revoke exposed key now.
- Enforce strict server-side auth on every sensitive endpoint.
- Fail closed in client code when no user token exists.

---

## C-02: Admin Suspension/Ban Can Be Bypassed

**Severity:** Critical  
**Category:** Authorization / account-state enforcement  
**Affected files:**

- `backend/src/routes/admin.js`
- `backend/src/middleware/auth.js`

### Evidence

- `backend/src/routes/admin.js` admin login checks only admin role/status and does **not** block suspended/banned admins.
- `backend/src/middleware/auth.js`:
  - `requireAuth` does not enforce account status.
  - API-key lookup returns user object without status filtering.
- `backend/src/routes/admin.js` admin endpoints use `requireAuth` + `requireAdmin` (not approved/suspension enforcement).
- On suspension/ban, code invalidates sessions but does not revoke API keys.

### Exploit scenario

1. Admin user creates an API key.
2. Another admin suspends that account.
3. Suspended admin still authenticates via API key and can access admin routes (role check still passes).

### Impact

- Suspended/banned admin can retain administrative control.
- Account revocation is unreliable for high-privilege users.

### Recommendation

- Enforce account status checks in a single canonical auth path used by **all** middleware.
- Update admin login to explicitly deny suspended/banned/pending statuses.
- Revoke API keys on suspension/ban.
- Require both: valid admin role **and** approved/active status for admin routes.

---

## H-01: SSRF / Open Proxy Behavior in URL Fetch Endpoints

**Severity:** High  
**Category:** SSRF / outbound request abuse  
**Affected files:**

- `backend/src/routes/video.js`
- `backend/src/routes/rss.js`
- `backend/src/services/rss.js`

### Evidence

- `GET /api/video/download` accepts `url` query param and directly executes `fetch(videoUrl)`.
- `GET /api/rss/article-content` accepts URL query param and fetches article content from arbitrary URL.
- RSS content service fetches supplied URL without host allowlist/protocol restrictions.

### Impact

- Open-proxy style abuse, bandwidth/cost abuse, and outbound request pivoting.
- Internal metadata/service probing risk depending on runtime network access.

### Recommendation

- Restrict to strict allowlisted hostnames and `https` only.
- Block private, loopback, link-local, and internal-reserved address ranges.
- Add URL normalization and DNS/IP re-resolution defenses.
- Enforce response size/content-type/time limits.

---

## H-02: Token Accepted via Query Parameter for General API Auth

**Severity:** High  
**Category:** Credential handling  
**Affected files:**

- `backend/src/middleware/auth.js`
- `frontend/src/services/geminiLiveService.js`

### Evidence

- Backend auth middleware accepts token from `Authorization`, `X-API-Key`, **or query parameter** globally.
- Frontend WebSocket client passes token in URL query (sometimes necessary for WS), but backend query-token acceptance is broader than WS-only scope.

### Impact

- Increases risk of credential leakage through logs, analytics, proxies, browser history, and referer propagation.

### Recommendation

- Restrict query token support to explicit WebSocket endpoint path only.
- For standard HTTP APIs, accept auth only via headers.
- Add sanitization/redaction for token-like query params in logs.

---

## H-03: Known High CVE in Routing Stack (react-router-dom chain)

**Severity:** High  
**Category:** Dependency vulnerability  
**Affected packages:**

- `react-router-dom` (direct)
- `react-router` (transitive)
- `@remix-run/router` (transitive)

### Evidence

- `npm audit --json` reports `GHSA-2w69-qvjg-hvjx` (XSS via open redirects) affecting installed ranges.

### Recommendation

- Upgrade to patched `react-router-dom`/router versions beyond vulnerable range.
- Re-run audit and add dependency policy checks in CI.

---

## M-01: Service Worker Caches Authenticated API GET Responses

**Severity:** Medium  
**Category:** Sensitive data persistence / cache leakage  
**Affected files:**

- `frontend/public/sw.js`

### Evidence

- SW marks `/api/` routes as network-first and caches successful responses.
- On failure, returns cached response (`caches.match`) without explicit auth-sensitive cache segregation.

### Impact

- Sensitive data from authenticated responses may persist and be replayed across sessions on shared devices.
- Elevated risk for admin GET endpoints.

### Recommendation

- Do not cache authenticated API responses (or require explicit safe allowlist).
- Add `Cache-Control: no-store` for sensitive routes.
- If caching is required, partition cache key by auth context and endpoint class.

---

## M-02: Frontend Logout Does Not Revoke Server Session

**Severity:** Medium  
**Category:** Session management  
**Affected files:**

- `frontend/src/services/authService.js`
- `backend/src/routes/auth.js`

### Evidence

- Frontend user logout removes local session storage only.
- Backend has logout endpoint that deletes session token, but user logout flow does not call it.

### Impact

- Stolen token remains valid until TTL expiry.
- Weakens revocation guarantees during incident response.

### Recommendation

- Always call backend logout/revoke endpoint before local token deletion.
- Prefer short-lived access tokens + refresh rotation.

---

## M-03: Missing Rate Limiting / Abuse Controls

**Severity:** Medium  
**Category:** Abuse prevention  
**Affected areas:**

- Auth login endpoints
- High-cost generation endpoints (chat/image/video)

### Evidence

- No code-level rate limit, lockout, or request throttling controls were found in backend auth/routes.

### Impact

- Brute-force risk for login/admin login.
- Cost and availability risk via automated high-volume model calls.

### Recommendation

- Add per-IP and per-account throttling (edge + app-level).
- Add admin-login stricter controls.
- Add per-token quotas for expensive operations.

---

## M-04: Missing Production Security Headers; Overly Permissive API CORS

**Severity:** Medium  
**Category:** Hardening / browser security controls  
**Affected files:**

- `backend/src/middleware/cors.js`
- `backend/src/routes/static.js`

### Evidence

- API CORS origin set to `*`.
- No production response headers found for CSP, HSTS, X-Content-Type-Options, Referrer-Policy, etc.

### Impact

- Weaker browser-side mitigation against injection/clickjacking/data leakage patterns.
- Combined with token-in-storage model, XSS blast radius increases.

### Recommendation

- Tighten allowed origins for production API usage.
- Add strict security headers at edge/backend.
- Align CSP with actual runtime needs and remove unsafe directives where possible.

---

## M-05: Unsafe External URL Opening in UI

**Severity:** Medium  
**Category:** Client-side URL handling  
**Affected files:**

- `frontend/src/components/ChatMessage.jsx`
- `frontend/src/pages/MediaPage.jsx`
- `frontend/src/utils/sourceExtractor.js`

### Evidence

- `window.open(source.url, '_blank')` used on untrusted source URLs.
- URL scheme/domain is not allowlisted prior to open.

### Impact

- Potential javascript/data URI abuse depending on browser behavior.
- Reverse tabnabbing risk when opener protections are not enforced.

### Recommendation

- Validate URL protocol (`https:` only, or strict allowlist).
- Use `window.open(url, '_blank', 'noopener,noreferrer')`.
- Reject or neutralize dangerous schemes.

---

## M-06: Sensitive Prompt/Response Data Logged Server-Side

**Severity:** Medium  
**Category:** Data exposure via logs  
**Affected files:**

- `backend/src/services/gemini.js`
- `backend/src/services/anthropic.js`
- `backend/src/services/openai.js`
- `backend/src/services/openrouter.js`
- `backend/src/routes/*` (multiple)

### Evidence

- Extensive `console.log`/`console.error` of request models, prompts, request bodies, and operation payloads.

### Impact

- Increases risk of PII/confidential prompt leakage in log sinks.

### Recommendation

- Introduce structured logging with redaction.
- Avoid logging full prompts, tool arguments, and model outputs by default.

---

## M-07: Documentation Encourages Frontend API Key Exposure

**Severity:** Medium  
**Category:** Insecure configuration guidance  
**Affected files:**

- `README.md`
- `documentation/src/docs/SETUP_GUIDE.md`
- `documentation/src/docs/setup/3_environment_configuration.md`

### Evidence

- Setup docs instruct use of `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, etc., which would expose provider keys in client bundles.

### Impact

- High probability of insecure deployments if followed.

### Recommendation

- Update docs to backend-only secret model.
- Remove frontend provider secret instructions entirely.

---

## M-08: Additional Moderate Dependency Risks

**Severity:** Medium  
**Category:** Dependency hygiene  
**Affected packages (varies by workspace):**

- `wrangler` / `miniflare` / `undici`
- `vite` / `esbuild` (documentation workspace)
- `react-syntax-highlighter` / `refractor` / `prismjs` (documentation workspace)

### Evidence

- Reported by `npm audit --json` with available fixes (some semver-major).

### Recommendation

- Patch runtime-critical dependencies first.
- Maintain separate risk policy for docs-only toolchain but keep patched to reduce supply-chain exposure.

---

## L-01: Dynamic Expression Execution via `new Function`

**Severity:** Low  
**Category:** Client-side code execution surface  
**Affected files:**

- `frontend/src/components/GraphingModal.jsx`

### Evidence

- Graph evaluator compiles user expression with `new Function`.

### Impact

- Self-XSS/code execution if untrusted expression is injected into this surface.

### Recommendation

- Replace with math expression parser/evaluator library (no JS execution).
- Strictly tokenize and parse allowed math grammar.

---

## L-02: Provider Configuration Disclosure Endpoint

**Severity:** Low  
**Category:** Information disclosure  
**Affected files:**

- `backend/src/routes/health.js`

### Evidence

- Public status endpoint reveals which provider API keys are configured.

### Impact

- Assists attacker reconnaissance/fingerprinting.

### Recommendation

- Restrict status endpoint visibility or return reduced/non-sensitive metadata.

---

## L-03: Insecure Feed Source URLs in Frontend RSS Service

**Severity:** Low  
**Category:** Data integrity (if path is used)  
**Affected files:**

- `frontend/src/services/rssService.js`

### Evidence

- Some feed URLs are `http://` in frontend RSS configuration.

### Impact

- Potential feed content tampering in transit (if those paths are active in production).

### Recommendation

- Enforce HTTPS-only feed ingestion.

---

## Positive Security Controls Observed

- Password hashing with per-user salt and PBKDF2 is implemented (`backend/src/utils/crypto.js`).
- Session/API keys are hashed before storage.
- `react-markdown` is used without `rehype-raw` in streaming renderer.
- HTML artifact preview is sandboxed in iframe (`sandbox="allow-scripts"`), reducing parent access.
- Admin self-delete/self-status-change protections exist.

---

## Prioritized Remediation Plan

### Immediate (0-24h)

1. Revoke/rotate exposed fallback API key and remove all fallback key code paths.
2. Patch admin authz logic:
   - deny suspended/banned on admin login;
   - enforce active/approved status in admin middleware path;
   - revoke API keys on suspension/ban.
3. Disable/lock down URL proxy endpoints until allowlist validation is in place.

### Short Term (1-7 days)

1. Remove generic query-token auth acceptance; keep WS exception narrowly scoped.
2. Stop caching authenticated API responses in service worker.
3. Fix logout to revoke backend sessions.
4. Add rate limiting for auth and expensive generation routes.
5. Upgrade `react-router-dom` chain to patched versions.

### Medium Term (1-3 weeks)

1. Add production security headers and tighten CORS origin policy.
2. Add URL protocol/domain validation before any `window.open`.
3. Reduce/redact sensitive logs.
4. Update setup docs to backend-only secret model.
5. Address moderate dependency findings in backend/docs toolchains.

---

## Verification Checklist (Post-Fix)

- [ ] Hardcoded key removed from all tracked files; rotated server-side.
- [ ] Suspended/banned admin cannot log in or call admin endpoints by any token type.
- [ ] API keys revoked on suspension/ban.
- [ ] `/api/video/download` and `/api/rss/article-content` reject non-allowlisted URLs.
- [ ] Non-WS API auth rejects query `token`.
- [ ] Service worker no longer caches authenticated API responses.
- [ ] Logout revokes session token server-side.
- [ ] `react-router-dom` advisory no longer appears in audit.
- [ ] Production headers validated via response inspection.

---

## Dependency Audit Snapshot

Commands run:

- `npm audit --json` (repo root)
- `npm audit --json` (`frontend`)
- `npm audit --json` (`backend`)
- `npm audit --json` (`documentation`)

Notable results:

- **High:** `react-router-dom` chain (`GHSA-2w69-qvjg-hvjx`)
- **Moderate:** `wrangler/miniflare/undici`, and docs toolchain (`vite/esbuild`, `prismjs/refractor`)

