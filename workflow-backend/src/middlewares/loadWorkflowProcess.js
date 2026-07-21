const ErrorCodes = require('../constants/errorCodes');
const { getMessageForErrorCode } = require('../constants/errorMessages');
const { getHttpStatusForErrorCode } = require('../constants/errorHttpStatus');
const WorkflowStatus = require('../constants/workflowStatus');
const { findProcessById } = require('../dataAccess/processStore');

const loadWorkflowProcess = async (req, res, next) => {
  try {
    const { processId } = req.params;

    if (!processId) {
      const httpStatus = getHttpStatusForErrorCode(ErrorCodes.PROCESS_ID_MISSING);
      return res.status(httpStatus).json({
        status: WorkflowStatus.ERROR,
        errorCode: ErrorCodes.PROCESS_ID_MISSING,
        message: getMessageForErrorCode(ErrorCodes.PROCESS_ID_MISSING),
      });
    }

    const process = await findProcessById(processId);

    if (!process) {
      const httpStatus = getHttpStatusForErrorCode(ErrorCodes.PROCESS_NOT_FOUND);
      return res.status(httpStatus).json({
        status: WorkflowStatus.ERROR,
        errorCode: ErrorCodes.PROCESS_NOT_FOUND,
        message: getMessageForErrorCode(ErrorCodes.PROCESS_NOT_FOUND),
      });
    }

    if (
      req.user?.organizationId &&
      process.organizationId &&
      req.user.organizationId !== process.organizationId
    ) {
      const httpStatus = getHttpStatusForErrorCode(ErrorCodes.FORBIDDEN);
      return res.status(httpStatus).json({
        status: WorkflowStatus.ERROR,
        errorCode: ErrorCodes.FORBIDDEN,
        message: 'Der Prozess gehört nicht zur Organisation des Benutzers.'
      });
    }

    req.process = process;

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = loadWorkflowProcess;