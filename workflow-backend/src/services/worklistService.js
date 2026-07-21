const { Roles } = require("../constants/roles");
const WorkflowStatus = require("../constants/workflowStatus");
const ErrorCodes = require("../constants/errorCodes");
const createAppError = require("../utils/createAppError");
const { getNextStep } = require("./nextStepService");
const { listProcessesByStatuses } = require("../stores/process.store");

const toWorklistItem = (process) => ({
  processId: process.processId,
  workflowType: process.workflowType,
  status: process.status,
  nextStep: getNextStep(process.status, { processId: process.processId }),
  patientRef: process.fhirRefs?.patientRef || null,
  encounterRef: process.fhirRefs?.encounterRef || null,
  serviceRequestRef: process.fhirRefs?.serviceRequestRef || null,
  imagingStudyRef: process.fhirRefs?.imagingStudyRef || null,
  diagnosticReportRef: process.fhirRefs?.diagnosticReportRef || null,
  createdAt: process.createdAt,
  updatedAt: process.updatedAt,
});

const filterByOrganization = (processes, user) => {
  return processes.filter((process) => {
    return (
      !user?.organizationId || process.organizationId === user.organizationId
    );
  });
};

const listRadiologyWorklist = async ({ user }) => {
  let statuses;

  if (user.role === Roles.RAD_TECH) {
    statuses = [WorkflowStatus.RADIOLOGY_ORDER_CREATED];
  } else if (user.role === Roles.RADIOLOGIST) {
    statuses = [WorkflowStatus.IMAGING_STUDY_REGISTERED];
  } else {
    throw createAppError({ errorCode: ErrorCodes.FORBIDDEN });
  }

  const processes = await listProcessesByStatuses(statuses);
  const visibleProcesses = filterByOrganization(processes, user);

  return {
    items: visibleProcesses.map(toWorklistItem),
  };
};

const listEmergencyWorklist = async ({ user }) => {
  if (user.role !== Roles.ER_NURSE && user.role !== Roles.ER_DOCTOR) {
    throw createAppError({ errorCode: ErrorCodes.FORBIDDEN });
  }

  const processes = await listProcessesByStatuses([
    WorkflowStatus.INTAKE_COMPLETED,
    WorkflowStatus.RADIOLOGY_ORDER_CREATED,
    WorkflowStatus.IMAGING_STUDY_REGISTERED,
    WorkflowStatus.SUCCESS,
  ]);

  const visibleProcesses = filterByOrganization(processes, user);

  return {
    items: visibleProcesses.map(toWorklistItem),
  };
};

module.exports = {
  listRadiologyWorklist,
  listEmergencyWorklist,
};
