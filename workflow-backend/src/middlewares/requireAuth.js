const fs = require("fs");
const jwt = require("jsonwebtoken");
const { PROTECT_ROUTES } = require("../../constants/flags");

// public key schon beim module load laden statt bei jedem request

const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

if (!publicKeyPath) {
  const error = new Error("JWT_PUBLIC_KEY_PATH ist nicht gesetzt.");
  error.statusCode = 500;
  error.errorCode = "JWT_PUBLIC_KEY_MISSING";
  throw error;
}

const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [type, token] = authorizationHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const requireAuth = (req, res, next) => {
  if (!PROTECT_ROUTES) return next();
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        status: "ERROR",
        errorCode: "UNAUTHORIZED",
        message: "Bearer Token fehlt.",
      });
    }

    const decoded = jwt.verify(token, publicKey, {
      algorithms: [process.env.JWT_ALGORITHM || "RS256"],
      issuer: "auth-service",
      audience: "workflow-backend",
    });

    req.user = {
      sub: decoded.sub,
      username: decoded.username,
      displayName: decoded.displayName,
      role: decoded.role,
      scopes: decoded.scopes || [],
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      status: "ERROR",
      errorCode: "INVALID_TOKEN",
      message: "Token ist ungültig oder abgelaufen.",
    });
  }
};

module.exports = requireAuth;
