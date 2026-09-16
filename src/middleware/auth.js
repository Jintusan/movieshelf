// Small role-based access control (RBAC) middleware.
//
// How the login state gets here: routes/auth.js stores { id, username, role }
// in req.session.user after a successful login (see express-session in
// server.js). Every request after that carries the session cookie
// automatically, so req.session.user is available (or undefined) on every
// route without the client having to resend credentials each time.

// Guest = no valid session at all -> block, 401 Unauthorized.
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "You must be logged in to do this." });
  }
  next();
}

// User is logged in AND their role is "admin" -> otherwise 403 Forbidden.
// (401 vs 403: 401 means "we don't know who you are", 403 means
// "we know who you are, but you're not allowed to do this".)
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "You must be logged in to do this." });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
