const fhirClient = require('../fhir/fhirClient');
const ErrorCodes = require('../constants/errorCodes');
const createAppError = require('../utils/createAppError');
const { findProcessById } = require('../stores/process.store');

const getCodeDisplay = (codeableConcept) => {
  return codeableConcept?.coding?.[0]?.display || codeableConcept?.text || null;
};

const getObservationValue = (observation) => {
  if (observation.valueString) {
    return observation.valueString;
  }

  if (observation.valueCodeableConcept) {
    return getCodeDisplay(observation.valueCodeableConcept);
  }

  if (observation.valueQuantity) {
    return `${observation.valueQuantity.value} ${observation.valueQuantity.unit || ''}`.trim();
  }

  if (observation.valueBoolean !== undefined) {
    return observation.valueBoolean;
  }

  return null;
};

const ensureSameOrganization = (process, user) => {
  if (user?.organizationId && process.organizationId !== user.organizationId) {
    throw createAppError({ errorCode: ErrorCodes.FORBIDDEN });
  }
};

const getReportSummary = async ({ processId, user, process }) => {
  const workflowProcess = process || await findProcessById(processId);

  if (!workflowProcess) {
    throw createAppError({ errorCode: ErrorCodes.PROCESS_NOT_FOUND });
  }

  ensureSameOrganization(workflowProcess, user);

  const diagnosticReportRef = workflowProcess.fhirRefs?.diagnosticReportRef;

  if (!diagnosticReportRef) {
    throw createAppError({
      errorCode: ErrorCodes.FHIR_REFERENCE_MISSING,
      message: 'Für diesen Prozess existiert noch kein DiagnosticReport.'
    });
  }

  const diagnosticReport = await fhirClient.readFhirResource(diagnosticReportRef);

  const observationRefsFromReport = diagnosticReport.result
    ?.map((result) => result.reference)
    .filter(Boolean) || [];

  const observationRefs = observationRefsFromReport.length > 0
    ? observationRefsFromReport
    : workflowProcess.fhirRefs?.observationRefs || [];

  const observations = await Promise.all(
    observationRefs.map((reference) => fhirClient.readFhirResource(reference))
  );

  return {
    processId: workflowProcess.processId,
    status: workflowProcess.status,
    diagnosticReport: {
      reference: diagnosticReportRef,
      fhirStatus: diagnosticReport.status || null,
      issued: diagnosticReport.issued || null,
      conclusion: diagnosticReport.conclusion || null,
      code: getCodeDisplay(diagnosticReport.code)
    },
    findings: observations.filter(Boolean).map((observation, index) => ({
      reference: observationRefs[index],
      status: observation.status || null,
      code: getCodeDisplay(observation.code),
      value: getObservationValue(observation),
      interpretation: observation.interpretation?.map(getCodeDisplay).filter(Boolean) || []
    }))
  };
};

module.exports = {
  getReportSummary
};
