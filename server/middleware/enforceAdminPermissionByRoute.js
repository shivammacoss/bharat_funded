/**
 * Single chokepoint applied with `app.use('/api/admin', ...)` (and optionally
 * '/api/auth/admin' for login routes). Looks up the incoming route in
 * `adminRouteMap.js` and delegates to `requirePermission(key)` — or bypasses
 * when the route is `public: true` or not mapped at all.
 *
 * Why "not mapped = allow through": Phase 2 enforces permissions on the ~80
 * routes we've catalogued. The remaining ~100 routes stay on the legacy
 * behavior (any valid admin token works) until Phase 3 gets to them. This
 * prevents accidentally 403'ing a forgotten endpoint while we iterate.
 */

const { requirePermission, resolveAdminFromRequest } = require('./adminPermission');
const { lookupRoute } = require('./adminRouteMap');

function enforceAdminPermissionByRoute(req, res, next) {
  // Express strips the mount prefix — req.path is already relative to it.
  const subpath = req.path || '/';
  const entry = lookupRoute(req.method, subpath);

  if (entry?.public) {
    return next();
  }

  if (entry?.permission) {
    return requirePermission(entry.permission)(req, res, next);
  }

  // Unmapped route — keep legacy behavior: must have a valid admin token,
  // but no specific permission required. Prevents random users with a user
  // token from hitting admin endpoints; Phase 3 can narrow these further.
  return resolveAdminFromRequest(req)
    .then((admin) => {
      if (!admin) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      req.admin = admin;
      return next();
    })
    .catch((err) => {
      console.error('[enforceAdminPermissionByRoute] resolve error:', err);
      return res.status(500).json({ success: false, error: 'Auth check failed' });
    });
}

module.exports = enforceAdminPermissionByRoute;
