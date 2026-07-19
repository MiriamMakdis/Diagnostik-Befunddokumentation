const { getHttpStatusForErrorCode } = require('../constants/errorHttpStatus');
const { getMessageForErrorCode } = require('../constants/errorMessages');

const createAppError = ({ errorCode, message, details }) => {
  const resolvedMessage = message || getMessageForErrorCode(errorCode);

  const error = new Error(resolvedMessage);

  error.errorCode = errorCode;
  error.statusCode = getHttpStatusForErrorCode(errorCode);

  if (details) {
    error.details = details;
  }

  return error;
};

module.exports = createAppError;