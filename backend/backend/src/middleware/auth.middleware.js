const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "aihalo_secret_key_2026";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

const riderMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === "rider" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Rider privileges required.",
    });
  }
};

module.exports = { authMiddleware, adminMiddleware, riderMiddleware, JWT_SECRET };
