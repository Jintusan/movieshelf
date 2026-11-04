function requireAuth(req, res, next) { // Wächter: nur eingeloggte User
  if (!req.session.user) { // niemand eingeloggt?
    return res.status(401).json({ error: "You must be logged in to do this." }); // 401 = nicht eingeloggt, Ende
  }
  next(); // eingeloggt -> weiter zur Route
}

function requireAdmin(req, res, next) { // Wächter: nur Admins
  if (!req.session.user) { // niemand eingeloggt?
    return res.status(401).json({ error: "You must be logged in to do this." }); // 401 = nicht eingeloggt, Ende
  }
  if (req.session.user.role !== "admin") { // eingeloggt, aber kein Admin?
    return res.status(403).json({ error: "Admin access required." }); // 403 = keine Berechtigung, Ende
  }
  next(); // Admin -> weiter zur Route
}

module.exports = { requireAuth, requireAdmin }; // beide Wächter exportieren