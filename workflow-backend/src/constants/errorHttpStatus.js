const ErrorCodes = require('./errorCodes');

const errorHttpStatus = Object.freeze({
  [ErrorCodes.ROUTE_NOT_FOUND]: 404,
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,

  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.MISSING_SCOPE]: 403,

  [ErrorCodes.VALIDATION_ERROR]: 400,

  [ErrorCodes.PROCESS_NOT_FOUND]: 404,
  [ErrorCodes.PROCESS_ID_MISSING]: 400,
  [ErrorCodes.INVALID_WORKFLOW_STATE]: 409,
  [ErrorCodes.UNKNOWN_WORKFLOW_ACTION]: 400,
  [ErrorCodes.WORKFLOW_ALREADY_COMPLETED]: 409,
  [ErrorCodes.WORKFLOW_IN_ERROR_STATE]: 409,

  [ErrorCodes.CONSENT_REJECTED]: 422,
  [ErrorCodes.CONSENT_MISSING]: 400,

  [ErrorCodes.FHIR_SERVER_UNAVAILABLE]: 503,
  [ErrorCodes.FHIR_REQUEST_FAILED]: 502,
  [ErrorCodes.FHIR_TRANSACTION_FAILED]: 502,
  [ErrorCodes.FHIR_RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.FHIR_REFERENCE_MISSING]: 409,
  [ErrorCodes.FHIR_RESPONSE_INVALID]: 502,

  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 500,
  [ErrorCodes.DATABASE_OPERATION_FAILED]: 500
});

const getHttpStatusForErrorCode = (errorCode) => {
  return errorHttpStatus[errorCode] || 500;
};

module.exports = {
  errorHttpStatus,
  getHttpStatusForErrorCode
};