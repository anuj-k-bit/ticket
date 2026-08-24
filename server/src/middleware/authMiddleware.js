import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL ERROR: JWT_SECRET environment variable is missing. Server refusing to start with insecure secret defaults.'
  );
}

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      return next();
    } catch (error) {
      console.error('[AuthMiddleware] JWT Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
