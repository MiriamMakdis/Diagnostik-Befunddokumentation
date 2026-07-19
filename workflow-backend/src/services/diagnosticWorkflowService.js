const WorkflowStatus = require('../constants/workflowStatus');
const ErrorCodes = require('../constants/errorCodes');
const createAppError = require('../utils/createAppError');

const { updateProcessStatus } = require('../dataAccess/processStore');
const { saveError } = require('../dataAccess/errorStore');
const { getHttpStatusForErrorCode } = require('../constants/errorHttpStatus');
const { getMessageForErrorCode } = require('../constants/errorMessages');


const saveTechnicalError = async ({
  processId,
  transactionId,
  organizationId,
  user,
  error
}) => {
  try {
    await saveError({
      processId,
      transactionId,
      organizationId,
      actorSub: user?.sub || 'unknown-user',
      actorRole: user?.role || 'UNKNOWN',
      errorCode: error.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR,
      httpStatus: error.statusCode || getHttpStatusForErrorCode(ErrorCodes.INTERNAL_SERVER_ERROR),
      message: error.message || getMessageForErrorCode(ErrorCodes.INTERNAL_SERVER_ERROR),
    //   createdAt: new Date()
    });
  } catch (logError) {
    console.error('Technischer Fehler konnte nicht gespeichert werden:', logError);
  }
};

const shouldSetWorkflowToError = (error) => {
  const severeErrorCodes = [
    ErrorCodes.CONSENT_REJECTED,
    ErrorCodes.FHIR_SERVER_UNAVAILABLE,
    ErrorCodes.FHIR_REQUEST_FAILED,
    ErrorCodes.FHIR_TRANSACTION_FAILED,
    ErrorCodes.FHIR_RESPONSE_INVALID,
    ErrorCodes.DATABASE_OPERATION_FAILED
  ];

  return severeErrorCodes.includes(error.errorCode);
};

const markWorkflowAsErrorIfNeeded = async ({ processId, error }) => {
  if (!processId) {
    return;
  }
  if (!shouldSetWorkflowToError(error)) {
    return;
  }

  try {
    await updateProcessStatus(processId, WorkflowStatus.ERROR);
  } catch (updateError) {
    console.error('Workflow konnte nicht auf ERROR gesetzt werden:', updateError);
  }
};

const ensureConsentAccepted = (consent) => {
  if (!consent || consent.accepted !== true) {
    throw createAppError({
      errorCode: ErrorCodes.CONSENT_REJECTED
    });
  }
};

const startDiagnosticWorkflow = async ({ user, input }) => {
    //stub
};

const getDiagnosticWorkflowById = async ({ processId }) => {
    //stub
};

const createRadiologyOrder = async ({ user, process, input }) => {
    //stub
};

const registerImagingStudy = async ({ user, process, input }) => {
    //stub
};

const createDiagnosticReport = async ({ user, process, input }) => {
    //stub
};

module.exports = {
  startDiagnosticWorkflow,
  getDiagnosticWorkflowById,
  createRadiologyOrder,
  registerImagingStudy,
  createDiagnosticReport
};