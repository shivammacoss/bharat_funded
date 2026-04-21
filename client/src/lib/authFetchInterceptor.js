/**
 * Global fetch interceptor (stop-gap for Phase 2 chokepoint rollout).
 *
 * After we added `app.use('/api/admin', enforceAdminPermissionByRoute)` on the
 * server, every admin endpoint now requires a bearer token. Most of the existing
 * admin pages were written before that and call `fetch('/api/admin/...')` with no
 * headers, so they 401 now.
 *
 * Rather than edit every call site, we monkey-patch `window.fetch` once so any
 * request to `/api/admin/*` automatically picks up the token from localStorage.
 * Regular user-facing requests (`/api/auth/*`, `/api/users/*`, etc.) are
 * untouched, so user sessions still work normally.
 *
 * Safe to call multiple times — we stash a one-shot guard on window.
 */

const ADMIN_URL_PATTERN = /\/api\/admin(\/|\?|$)/;

export function installAuthFetchInterceptor() {
  if (typeof window === 'undefined') return;
  if (window.__authFetchPatched) return;
  window.__authFetchPatched = true;

  const original = window.fetch.bind(window);

  window.fetch = function patchedFetch(input, init = {}) {
    try {
      // Only target admin URLs. The `input` can be a Request, string, or URL object.
      const url =
        typeof input === 'string' ? input
        : input instanceof URL ? input.toString()
        : input?.url || '';

      if (!ADMIN_URL_PATTERN.test(url)) {
        return original(input, init);
      }

      const token = localStorage.getItem('bharatfunded-admin-token') || '';
      if (!token) return original(input, init);

      // Don't overwrite a caller-provided Authorization header.
      const existingHeaders = init?.headers;
      const alreadyHasAuth =
        existingHeaders &&
        (
          (typeof existingHeaders.get === 'function' && existingHeaders.get('Authorization')) ||
          (typeof existingHeaders === 'object' && (existingHeaders.Authorization || existingHeaders.authorization))
        );

      if (alreadyHasAuth) return original(input, init);

      // Merge headers — preserve existing ones (including Content-Type / Accept).
      let mergedHeaders;
      if (existingHeaders instanceof Headers) {
        mergedHeaders = new Headers(existingHeaders);
        mergedHeaders.set('Authorization', `Bearer ${token}`);
      } else {
        mergedHeaders = { ...(existingHeaders || {}), Authorization: `Bearer ${token}` };
      }

      return original(input, { ...init, headers: mergedHeaders });
    } catch (err) {
      // Never let interceptor bugs break the request.
      console.warn('[authFetchInterceptor] failed, falling back:', err);
      return original(input, init);
    }
  };
}

export default installAuthFetchInterceptor;
