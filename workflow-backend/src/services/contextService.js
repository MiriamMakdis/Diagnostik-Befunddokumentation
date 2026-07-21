const fhirClient = require("../fhir/fhirClient");
const { Roles } = require("../constants/roles");
const ErrorCodes = require("../constants/errorCodes");
const createAppError = require("../utils/createAppError");
const { findProcessById } = require("../stores/process.store");

const readFhirResource = async (reference) => {
  if (!reference) {
    return null;
  }

  return fhirClient.readFhirResource(reference);
};

const removeEmptyValues = (items) => {
  return items.filter((item) => {
    return item !== null && item !== undefined;
  });
};

const readManyFhirResources = async (references = []) => {
  const resources = await Promise.all(
    references.map((reference) => readFhirResource(reference))
  );
  return removeEmptyValues(resources);
};

const getCodeDisplay = (codeableConcept) => {
  return codeableConcept?.coding?.[0]?.display || codeableConcept?.text || null;
};

const getPatientName = (patient) => {
  const name = patient?.name?.[0];

  if (!name) {
    return null;
  }

  return {
    firstName: name.given?.[0] || null,
    lastName: name.family || null,
  };
};

const ensureSameOrganization = (process, user) => {
  if (user?.organizationId && process.organizationId !== user.organizationId) {
    throw createAppError({ errorCode: ErrorCodes.FORBIDDEN });
  }
};

const getWorkflowContext = async ({ processId, user, process }) => {
  const workflowProcess = process || (await findProcessById(processId));

  if (!workflowProcess) {
    throw createAppError({ errorCode: ErrorCodes.PROCESS_NOT_FOUND });
  }

  ensureSameOrganization(workflowProcess, user);

  if (user.role === Roles.AUDITOR) {
    throw createAppError({
      errorCode: ErrorCodes.FORBIDDEN,
      message: "Kein medizinischer Kontext für die Rolle Auditor.",
    });
  }

  const refs = workflowProcess.fhirRefs || {};

  const [patient, encounter, serviceRequest, imagingStudy, diagnosticReport] =
    await Promise.all([
      readFhirResource(refs.patientRef),
      readFhirResource(refs.encounterRef),
      readFhirResource(refs.serviceRequestRef),
      readFhirResource(refs.imagingStudyRef),
      readFhirResource(refs.diagnosticReportRef),
    ]);

  const baseContext = {
    processId: workflowProcess.processId,
    status: workflowProcess.status,
    patient: patient
      ? {
          reference: refs.patientRef,
          name: getPatientName(patient),
          birthDate: patient.birthDate || null,
          gender: patient.gender || null,
        }
      : null,
    encounter: encounter
      ? {
          reference: refs.encounterRef,
          status: encounter.status || null,
          class: encounter.class?.display || encounter.class?.code || null,
          period: encounter.period || null,
        }
      : null,
  };

  if (user.role === Roles.RAD_TECH) {
    return {
      ...baseContext,
      radiologyOrder: serviceRequest
        ? {
            reference: refs.serviceRequestRef,
            status: serviceRequest.status || null,
            procedure: getCodeDisplay(serviceRequest.code),
            reason:
              serviceRequest.reasonCode?.map(getCodeDisplay).filter(Boolean) ||
              [],
          }
        : null,
    };
  }

  const [conditions, medications] = await Promise.all([
    readManyFhirResources(refs.conditionRefs || []),
    readManyFhirResources(refs.medicationStatementRefs || []),
  ]);

  return {
    ...baseContext,
    conditions: conditions.map((condition, index) => ({
      reference: refs.conditionRefs?.[index],
      clinicalStatus: getCodeDisplay(condition.clinicalStatus),
      code: getCodeDisplay(condition.code),
    })),
    medications: medications.map((medication, index) => ({
      reference: refs.medicationStatementRefs?.[index],
      status: medication.status || null,
      medication: getCodeDisplay(medication.medicationCodeableConcept),
    })),
    radiologyOrder: serviceRequest
      ? {
          reference: refs.serviceRequestRef,
          status: serviceRequest.status || null,
          procedure: getCodeDisplay(serviceRequest.code),
          reason:
            serviceRequest.reasonCode?.map(getCodeDisplay).filter(Boolean) ||
            [],
        }
      : null,
    imagingStudy: imagingStudy
      ? {
          reference: refs.imagingStudyRef,
          status: imagingStudy.status || null,
          description: imagingStudy.description || null,
          started: imagingStudy.started || null,
        }
      : null,
    diagnosticReport: diagnosticReport
      ? {
          reference: refs.diagnosticReportRef,
          status: diagnosticReport.status || null,
          conclusion: diagnosticReport.conclusion || null,
          issued: diagnosticReport.issued || null,
        }
      : null,
  };
};

module.exports = {
  getWorkflowContext,
};
