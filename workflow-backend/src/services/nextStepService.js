const WorkflowStatus = require('../constants/workflowStatus');
const ErrorCodes = require('../constants/errorCodes');
const createAppError = require('../utils/createAppError');
const { 
    Actions, 
    requiredStatusByAction, 
    targetStatusByAction 
} = require('../constants/actions');

const nextStepByStatus = Object.freeze({
  [WorkflowStatus.INTAKE_COMPLETED]: {
    action: Actions.CREATE_RADIOLOGY_ORDER,
    label: 'Röntgenauftrag erstellen',
    description: 'Nach der Aufnahme kann ein Arzt eine Röntgenuntersuchung anfordern.',
    requiredScope: 'radiology-order:create',
    recommendedRole: 'ER_DOCTOR',
    method: 'POST',
    path: '/api/v1/diagnostic-workflows/{processId}/radiology-orders'
  },

  [WorkflowStatus.RADIOLOGY_ORDER_CREATED]: {
    action: Actions.REGISTER_IMAGING_STUDY,
    label: 'ImagingStudy registrieren',
    description: 'Nach dem Röntgenauftrag kann die Radiologie die Bildgebung als ImagingStudy registrieren.',
    requiredScope: 'imaging-study:create',
    recommendedRole: 'RAD_TECH',
    method: 'POST',
    path: '/api/v1/diagnostic-workflows/{processId}/imaging-studies'
  },

  [WorkflowStatus.IMAGING_STUDY_REGISTERED]: {
    action: Actions.CREATE_DIAGNOSTIC_REPORT,
    label: 'Befund dokumentieren',
    description: 'Nach der registrierten Bildgebung kann der radiologische Befund erstellt werden.',
    requiredScope: 'diagnostic-report:create',
    recommendedRole: 'RADIOLOGIST',
    method: 'POST',
    path: '/api/v1/diagnostic-workflows/{processId}/diagnostic-reports'
  },

  [WorkflowStatus.SUCCESS]: {
    action: Actions.NONE,
    label: 'Workflow abgeschlossen',
    description: 'Der Workflow wurde erfolgreich abgeschlossen.',
    requiredScope: null,
    recommendedRole: null,
    method: null,
    path: null
  },

  [WorkflowStatus.ERROR]: {
    action: Actions.NONE,
    label: 'Workflow fehlerhaft beendet',
    description: 'Der Workflow befindet sich im Fehlerstatus und kann nicht normal fortgesetzt werden.',
    requiredScope: null,
    recommendedRole: null,
    method: null,
    path: null
  }
});


const replaceProcessIdInPath = (path, processId) => {
  if (!path || !processId) {
    return path;
  }

  return path.replace('{processId}', processId);
};

const getNextStep = (status, options = {}) => {
  const { processId } = options;

  const nextStep = nextStepByStatus[status];

  if (!nextStep) {
    return {
      action: Actions.NONE,
      label: 'Unbekannter Workflow-Status',
      description: `Für den Status ${status} ist kein nächster Schritt definiert.`,
      requiredScope: null,
      recommendedRole: null,
      method: null,
      path: null
    };
  }

  return {
    ...nextStep,
    path: replaceProcessIdInPath(nextStep.path, processId)
  };
};

const getNextStepForProcess = (process) => {
  return getNextStep(process.status, {
    processId: process.processId
  });
};

const isLastStatus = (status) => {
  return status === WorkflowStatus.SUCCESS || status === WorkflowStatus.ERROR;
};

const getRequiredStatusForAction = (action) => {
  return requiredStatusByAction[action] || null;
};

const getTargetStatusForAction = (action) => {
  return targetStatusByAction[action] || null;
};

const ensureActionIsAllowed = ({ currentStatus, action }) => {
  const requiredStatus = getRequiredStatusForAction(action);

  if (!requiredStatus) {
    throw createAppError({
      errorCode: ErrorCodes.UNKNOWN_WORKFLOW_ACTION,
      details: {
        action
      }
    });
  }

  if (currentStatus === WorkflowStatus.SUCCESS) {
    throw createAppError({
      errorCode: ErrorCodes.WORKFLOW_ALREADY_COMPLETED,
      details: {
        currentStatus,
        action
      }
    });
  }

  if (currentStatus === WorkflowStatus.ERROR) {
    throw createAppError({
      errorCode: ErrorCodes.WORKFLOW_IN_ERROR_STATE,
      details: {
        currentStatus,
        action
      }
    });
  }

  if (currentStatus !== requiredStatus) {
    throw createAppError({
      errorCode: ErrorCodes.INVALID_WORKFLOW_STATE,
      details: {
        currentStatus,
        requiredStatus,
        action
      }
    });
  }
};

const buildWorkflowResponse = ({ processId, status, message, additionalData = {} }) => {
  return {
    status,
    processId,
    message,
    nextStep: getNextStep(status, { processId }),
    ...additionalData
  };
};

module.exports = {
  Actions,
  getNextStep,
  getNextStepForProcess,
  isLastStatus,
  getRequiredStatusForAction,
  getTargetStatusForAction,
  ensureActionIsAllowed,
  buildWorkflowResponse
};