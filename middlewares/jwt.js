const jwt = require("jsonwebtoken");
const SECRET = "aniss_daghyoul"; // Your secret key

// Token verification middleware
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({ error: "No token provided" });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: "Unauthorized. Invalid token." });
    }

    // Attach the user info (including the role) to the request object
    req.user = decoded;
    next();
  });
}

function verifyRole(requiredRole) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).send({ error: "Unauthorized. User not found." });
      }
  
      const { role } = req.user;
      if (role !== requiredRole) {
        return res.status(403).send({ error: "Forbidden. Insufficient permissions." });
      }
  
      next();
    };
  }

module.exports = { verifyToken, verifyRole };

