const ErrorCodes = require('../constants/errorCodes');
const createAppError = require('../utils/createAppError');

const notFoundHandler = (req, res, next) => {
  return next(
    createAppError({
      errorCode: ErrorCodes.ROUTE_NOT_FOUND,
      details: {
        method: req.method,
        path: req.originalUrl
      }
    })
  );
};

module.exports = notFoundHandler;