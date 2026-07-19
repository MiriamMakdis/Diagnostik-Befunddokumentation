const ErrorCodes = require("../../constants/errorCodes");
const { getHttpStatusForErrorCode } = require("../../constants/errorHttpStatus");
const WorkflowStatus = require("../../constants/workflowStatus");

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
        const httpStatus = getHttpStatusForErrorCode(ErrorCodes.VALIDATION_ERROR);
        return res.status(httpStatus).json({
          status: WorkflowStatus.ERROR,
          errorCode: ErrorCodes.VALIDATION_ERROR,
          message: getMessageForErrorCode(ErrorCodes.VALIDATION_ERROR),
          details: error.errors?.map((validationError) => ({
            path: validationError.path.join('.'),
            message: validationError.message
          }))
        });
      }
    };
  };
  
  module.exports = validateRequest;