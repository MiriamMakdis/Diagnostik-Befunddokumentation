const requireScopes = (...requiredScopes) => {
    return (req, res, next) => {
      const userScopes = req.user?.scopes || [];
  
      const hasAllRequiredScopes = requiredScopes.every((scope) =>
        userScopes.includes(scope)
      );
  
      if (!hasAllRequiredScopes) {
        return res.status(403).json({
          status: 'ERROR',
          errorCode: 'FORBIDDEN',
          message: 'Für diese Aktion fehlen die erforderlichen Berechtigungen.',
          requiredScopes
        });
      }
  
      return next();
    };
  };
  
  module.exports = requireScopes;