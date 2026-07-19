const validateRequest = (schemas) => {
    return (req, res, next) => {
      try {
        if (schemas.params) {
          req.params = schemas.params.parse(req.params);
        }
  
        if (schemas.query) {
          req.query = schemas.query.parse(req.query);
        }
  
        if (schemas.body) {
          req.body = schemas.body.parse(req.body);
        }
  
        return next();
      } catch (error) {
        return res.status(400).json({
          status: 'ERROR',
          errorCode: 'VALIDATION_ERROR',
          message: 'Der Request enthält ungültige oder unvollständige Daten.',
          details: error.errors?.map((validationError) => ({
            path: validationError.path.join('.'),
            message: validationError.message
          }))
        });
      }
    };
  };
  
  module.exports = validateRequest;