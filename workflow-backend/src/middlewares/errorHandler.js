const ErrorCodes = require('../constants/errorCodes');
const { getHttpStatusForErrorCode } = require('../constants/errorHttpStatus');
const { getMessageForErrorCode } = require('../constants/errorMessages');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const errorCode = err.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR;
  const statusCode = err.statusCode || getHttpStatusForErrorCode(errorCode);
  const message = err.message || getMessageForErrorCode(errorCode);

  const responseBody = {
    status: 'ERROR',
    errorCode,
    message
  };

  if (err.details) {
    responseBody.details = err.details;
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;