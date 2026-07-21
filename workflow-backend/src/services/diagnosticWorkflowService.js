const crypto = require("node:crypto");

const WorkflowStatus = require("../constants/workflowStatus");
const ErrorCodes = require("../constants/errorCodes");
const createAppError = require("../utils/createAppError");
const hashKvnr = require("../utils/hashKvnr");

const { getHttpStatusForErrorCode } = require("../constants/errorHttpStatus");
const { getMessageForErrorCode } = require("../constants/errorMessages");

const {
  Actions,
  ensureActionIsAllowed,
  buildWorkflowResponse,
  getNextStepForProcess,
} = require("./nextStepService");

const { executePatientAdmission } = require("./admissionService");
const { searchPatientByKvnr } = require("./patientService");

const fhirClient = require("../fhir/fhirClient");

const {
  buildServiceRequestResource,
} = require("../fhir/builders/serviceRequestBuilder");
const {
  buildImagingStudyResource,
} = require("../fhir/builders/imagingStudyBuilder");
const {
  buildDiagnosticReportResource,
} = require("../fhir/builders/diagnosticReportBuilder");
const {
  buildObservationResource,
} = require("../fhir/builders/observationBuilder");
const {
  buildProvenanceResource,
} = require("../fhir/builders/provenanceBuilder");

const { createAuditEventFHIR } = require("../audit/audit.service");

const {
  createProcess,
  findProcessById,
  updateProcessStatus,
  addFhirReferences,
} = require("../stores/process.store");

const { saveEventLog } = require("../stores/eventLog.store");

const { saveTechnicalError: saveError } = require("../stores/error.store");

const saveTechnicalError = async ({
  processId,
  transactionId,
  organizationId,
  user,
  error,
}) => {
  try {
    const errorCode = error.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR;

    await saveError({
      processId,
      transactionId,
      organizationId,
      actorSub: user?.sub || "unknown-user",
      actorRole: user?.role || "UNKNOWN",
      errorCode,
      httpStatus: error.statusCode || getHttpStatusForErrorCode(errorCode),
      message: error.message || getMessageForErrorCode(errorCode),
    });
  } catch (logError) {
    console.error(
      "Technischer Fehler konnte nicht gespeichert werden:",
      logError
    );
  }
};

const shouldSetWorkflowToError = (error) => {
  const severeErrorCodes = [
    ErrorCodes.CONSENT_REJECTED,
    ErrorCodes.FHIR_SERVER_UNAVAILABLE,
    ErrorCodes.FHIR_REQUEST_FAILED,
    ErrorCodes.FHIR_TRANSACTION_FAILED,
    ErrorCodes.FHIR_RESPONSE_INVALID,
    ErrorCodes.DATABASE_OPERATION_FAILED,
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
    console.error(
      "Workflow konnte nicht auf ERROR gesetzt werden:",
      updateError
    );
  }
};

const ensureConsentAccepted = (consent) => {
  if (!consent || consent.accepted !== true) {
    throw createAppError({
      errorCode: ErrorCodes.CONSENT_REJECTED,
    });
  }
};

const getProcessOrThrow = async (processId) => {
  if (!processId) {
    throw createAppError({
      errorCode: ErrorCodes.PROCESS_ID_MISSING,
    });
  }

  const process = await findProcessById(processId);

  if (!process) {
    throw createAppError({
      errorCode: ErrorCodes.PROCESS_NOT_FOUND,
    });
  }

  return process;
};

const ensureSameOrganization = (process, user) => {
  if (!user?.organizationId) {
    return;
  }

  if (process.organizationId !== user.organizationId) {
    throw createAppError({
      errorCode: ErrorCodes.FORBIDDEN,
    });
  }
};

const ensureRequiredFhirRefs = (process, requiredKeys) => {
  for (const key of requiredKeys) {
    if (!process.fhirRefs?.[key]) {
      throw createAppError({
        errorCode: ErrorCodes.FHIR_REFERENCE_MISSING,
        message: `FHIR-Referenz fehlt im Prozess: ${key}`,
        details: {
          processId: process.processId,
          missingReference: key,
        },
      });
    }
  }
};

const mergeFhirRefs = (oldRefs = {}, newRefs = {}) => {
  return {
    ...oldRefs,
    ...newRefs,

    conditionRefs: [
      ...(oldRefs.conditionRefs || []),
      ...(newRefs.conditionRefs || []),
    ],

    medicationStatementRefs: [
      ...(oldRefs.medicationStatementRefs || []),
      ...(newRefs.medicationStatementRefs || []),
    ],

    observationRefs: [
      ...(oldRefs.observationRefs || []),
      ...(newRefs.observationRefs || []),
    ],

    auditEventRefs: [
      ...(oldRefs.auditEventRefs || []),
      ...(newRefs.auditEventRefs || []),
    ],

    provenanceRefs: [
      ...(oldRefs.provenanceRefs || []),
      ...(newRefs.provenanceRefs || []),
    ],
  };
};

const addMergedFhirReferences = async (process, newRefs) => {
  const mergedRefs = mergeFhirRefs(process.fhirRefs || {}, newRefs);

  return addFhirReferences(process.processId, mergedRefs);
};

const createFhirResourceAndRef = async (resourceType, resource) => {
  try {
    const createdResource = await fhirClient.createFhirResource(
      resourceType,
      resource
    );

    if (!createdResource?.id) {
      throw createAppError({
        errorCode: ErrorCodes.FHIR_RESPONSE_INVALID,
        message: `${resourceType} wurde erstellt, aber die FHIR-ID fehlt.`,
      });
    }

    return {
      resource: createdResource,
      reference: `${resourceType}/${createdResource.id}`,
    };
  } catch (error) {
    if (error.errorCode) {
      throw error;
    }

    throw createAppError({
      errorCode: ErrorCodes.FHIR_REQUEST_FAILED,
      message: `FHIR-Ressource ${resourceType} konnte nicht erstellt werden.`,
      details: {
        resourceType,
      },
    });
  }
};

const normalizeAdmissionRefs = (admissionResult) => {
  const toRef = (resourceType, idOrRef) => {
    if (!idOrRef) {
      return null;
    }

    if (idOrRef.includes("/")) {
      return idOrRef;
    }

    return `${resourceType}/${idOrRef}`;
  };

  return {
    patientRef:
      admissionResult.patientRef ||
      toRef("Patient", admissionResult.fhirPatientId),

    encounterRef:
      admissionResult.encounterRef ||
      toRef("Encounter", admissionResult.fhirEncounterId),

    consentRef:
      admissionResult.consentRef ||
      toRef("Consent", admissionResult.fhirConsentId),

    conditionRefs:
      admissionResult.conditionRefs ||
      admissionResult.fhirConditionIds?.map((id) => toRef("Condition", id)) ||
      (admissionResult.fhirConditionId
        ? [toRef("Condition", admissionResult.fhirConditionId)]
        : []),

    medicationStatementRefs:
      admissionResult.medicationStatementRefs ||
      admissionResult.fhirMedicationStatementIds?.map((id) =>
        toRef("MedicationStatement", id)
      ) ||
      [],

    provenanceRefs:
      admissionResult.provenanceRefs ||
      admissionResult.fhirProvenanceIds?.map((id) => toRef("Provenance", id)) ||
      (admissionResult.fhirProvenanceId
        ? [toRef("Provenance", admissionResult.fhirProvenanceId)]
        : []),
  };
};

const buildAdmissionInput = (input) => {
  const patient = input.patient || {};
  const firstCondition = input.conditions?.[0] || {};

  return {
    ...input,

    kvnr: patient.kvnr || input.kvnr,
    firstName: patient.firstName || input.firstName,
    lastName: patient.lastName || input.lastName,
    birthDate: patient.birthDate || input.birthDate,
    gender: patient.gender || input.gender,

    icdCode: firstCondition.icdCode || input.icdCode,
    icdDisplay: firstCondition.icdDisplay || input.icdDisplay,

    consent: input.consent,
    conditions: input.conditions || [],
    medications: input.medications || [],
  };
};

const findExistingPatientRef = async (admissionInput) => {
  if (!admissionInput.kvnr) {
    return null;
  }

  const patients = await searchPatientByKvnr({
    kvnr: admissionInput.kvnr,
  });

  const existingPatient = patients?.[0];

  if (!existingPatient) {
    return null;
  }

  if (existingPatient.reference) {
    return existingPatient.reference;
  }

  if (existingPatient.id) {
    return `Patient/${existingPatient.id}`;
  }

  return null;
};

const getPatientIdFromRef = (patientRef) => {
  if (!patientRef) {
    return null;
  }

  return patientRef.split("/")[1] || null;
};

const createAuditEventIfPossible = async ({
  process,
  action,
  description,
  outcome = "0",
}) => {
  try {
    const patientId = getPatientIdFromRef(process.fhirRefs?.patientRef);

    if (!patientId) {
      return null;
    }

    const auditEvent = await createAuditEventFHIR({
      patientFhirId: patientId,
      action,
      description,
      outcome,
    });

    if (!auditEvent?.id) {
      return null;
    }

    return `AuditEvent/${auditEvent.id}`;
  } catch (error) {
    console.error("FHIR AuditEvent konnte nicht erstellt werden:", error);
    return null;
  }
};

const createProvenanceRef = async ({ targetRefs, user, activityDisplay }) => {
  const provenanceResource = buildProvenanceResource({
    targetRefs,
    agentDisplay: user?.displayName || user?.sub || "Workflow Backend",
    activityDisplay,
  });

  const created = await createFhirResourceAndRef(
    "Provenance",
    provenanceResource
  );

  return created.reference;
};

const saveWorkflowEvent = async ({
  process,
  user,
  eventType,
  eventStatus = WorkflowStatus.SUCCESS,
  httpStatus = 200,
  fhirResourceType = null,
  fhirResourceRef = null,
  errorCode = null,
}) => {
  await saveEventLog({
    processId: process.processId,
    transactionId: process.transactionId,
    organizationId: process.organizationId,
    actorSub: user?.sub || "unknown-user",
    actorRole: user?.role || "UNKNOWN",
    eventType,
    eventStatus,
    httpStatus,
    fhirResourceType,
    fhirResourceRef,
    errorCode,
  });
};

const buildObservationFromFinding = ({ finding, patientRef, encounterRef }) => {
  const observation = buildObservationResource({
    patientRef,
    encounterRef,
    loincCode: finding.code || finding.loincCode || "59776-5",
    loincDisplay:
      finding.display || finding.loincDisplay || "Procedure findings",
    value: typeof finding.value === "number" ? finding.value : 0,
    unit: finding.unit || "1",
  });

  if (finding.valueString) {
    delete observation.valueQuantity;
    observation.valueString = finding.valueString;
  }

  if (finding.valueCode || finding.valueDisplay) {
    delete observation.valueQuantity;
    observation.valueCodeableConcept = {
      coding: [
        {
          system: finding.valueSystem || "http://snomed.info/sct",
          code: finding.valueCode,
          display: finding.valueDisplay,
        },
      ],
      text: finding.valueDisplay,
    };
  }

  if (finding.interpretationCode || finding.interpretationDisplay) {
    observation.interpretation = [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: finding.interpretationCode,
            display: finding.interpretationDisplay,
          },
        ],
        text: finding.interpretationDisplay,
      },
    ];
  }

  return observation;
};

const startDiagnosticWorkflow = async ({ user, input }) => {
  let process = null;

  const admissionInput = buildAdmissionInput(input);
  const consent = admissionInput.consent;

  try {
    ensureConsentAccepted(consent);

    const existingPatientRef = await findExistingPatientRef(admissionInput);

    const rawAdmissionResult = await executePatientAdmission({
      ...admissionInput,
      existingPatientRef,
      user,
    });

    const admissionRefs = normalizeAdmissionRefs(rawAdmissionResult);

    if (!admissionRefs.patientRef || !admissionRefs.encounterRef) {
      throw createAppError({
        errorCode: ErrorCodes.FHIR_RESPONSE_INVALID,
        message:
          "Admission-Service hat keine Patient- oder Encounter-Referenz zurückgegeben.",
      });
    }

    const patientKvnr = admissionInput.kvnr;
    const kvnrHash = patientKvnr ? hashKvnr(patientKvnr) : null;

    process = await createProcess({
      workflowType: "DIAGNOSTIC_WORKFLOW",
      organizationId: user?.organizationId || "demo-organization",
      kvnrHash,
    });

    const fullFhirRefs = {
      patientRef: admissionRefs.patientRef,
      encounterRef: admissionRefs.encounterRef,
      consentRef: admissionRefs.consentRef,
      conditionRefs: admissionRefs.conditionRefs || [],
      medicationStatementRefs: admissionRefs.medicationStatementRefs || [],
      serviceRequestRef: null,
      imagingStudyRef: null,
      observationRefs: [],
      diagnosticReportRef: null,
      auditEventRefs: [],
      provenanceRefs: admissionRefs.provenanceRefs || [],
    };

    process = await addFhirReferences(process.processId, fullFhirRefs);

    const auditEventRef = await createAuditEventIfPossible({
      process,
      action: "C",
      description: "Aufnahme und Anamnese wurden erstellt.",
      outcome: "0",
    });

    if (auditEventRef) {
      process = await addMergedFhirReferences(process, {
        auditEventRefs: [auditEventRef],
      });
    }

    await saveWorkflowEvent({
      process,
      user,
      eventType: WorkflowStatus.INTAKE_COMPLETED,
      eventStatus: WorkflowStatus.SUCCESS,
      httpStatus: 201,
      fhirResourceType: "Encounter",
      fhirResourceRef: process.fhirRefs.encounterRef,
    });

    return buildWorkflowResponse({
      processId: process.processId,
      status: WorkflowStatus.INTAKE_COMPLETED,
      message: "Aufnahme und Anamnese wurden erfolgreich gespeichert.",
      additionalData: {
        patientRef: process.fhirRefs.patientRef,
        encounterRef: process.fhirRefs.encounterRef,
      },
    });
  } catch (error) {
    await saveTechnicalError({
      processId: process?.processId || null,
      transactionId: process?.transactionId || null,
      organizationId: process?.organizationId || user?.organizationId || null,
      user,
      error,
    });

    await markWorkflowAsErrorIfNeeded({
      processId: process?.processId,
      error,
    });

    throw error;
  }
};

const getDiagnosticWorkflowById = async (args) => {
  const processId = typeof args === "string" ? args : args.processId;
  const user = typeof args === "string" ? null : args.user;

  const process = await getProcessOrThrow(processId);

  if (user) {
    ensureSameOrganization(process, user);
  }

  return {
    processId: process.processId,
    transactionId: process.transactionId,
    workflowType: process.workflowType,
    organizationId: process.organizationId,
    status: process.status,
    nextStep: getNextStepForProcess(process),
    createdAt: process.createdAt,
    updatedAt: process.updatedAt,
  };
};

const createRadiologyOrder = async ({ user, process, processId, input }) => {
  let currentProcess = process;

  try {
    if (!currentProcess) {
      currentProcess = await getProcessOrThrow(processId);
    }

    ensureSameOrganization(currentProcess, user);

    ensureActionIsAllowed({
      currentStatus: currentProcess.status,
      action: Actions.CREATE_RADIOLOGY_ORDER,
    });

    ensureRequiredFhirRefs(currentProcess, ["patientRef", "encounterRef"]);

    const serviceRequestResource = buildServiceRequestResource({
      patientRef: currentProcess.fhirRefs.patientRef,
      encounterRef: currentProcess.fhirRefs.encounterRef,
      orderCode: input.procedureCode || input.orderCode || "36643-5",
      orderDisplay:
        input.procedureDisplay || input.orderDisplay || "X-ray wrist",
    });

    if (input.bodySiteCode || input.bodySiteDisplay) {
      serviceRequestResource.bodySite = [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: input.bodySiteCode,
              display: input.bodySiteDisplay,
            },
          ],
          text: input.bodySiteDisplay,
        },
      ];
    }

    if (input.reason) {
      serviceRequestResource.reasonCode = [
        {
          text: input.reason,
        },
      ];
    }

    const createdServiceRequest = await createFhirResourceAndRef(
      "ServiceRequest",
      serviceRequestResource
    );

    const provenanceRef = await createProvenanceRef({
      targetRefs: [createdServiceRequest.reference],
      user,
      activityDisplay: "Röntgenauftrag erstellt",
    });

    currentProcess = await addMergedFhirReferences(currentProcess, {
      serviceRequestRef: createdServiceRequest.reference,
      provenanceRefs: [provenanceRef],
    });

    currentProcess = await updateProcessStatus(
      currentProcess.processId,
      WorkflowStatus.RADIOLOGY_ORDER_CREATED
    );

    const auditEventRef = await createAuditEventIfPossible({
      process: currentProcess,
      action: "C",
      description: "Röntgenauftrag wurde erstellt.",
      outcome: "0",
    });

    if (auditEventRef) {
      currentProcess = await addMergedFhirReferences(currentProcess, {
        auditEventRefs: [auditEventRef],
      });
    }

    await saveWorkflowEvent({
      process: currentProcess,
      user,
      eventType: WorkflowStatus.RADIOLOGY_ORDER_CREATED,
      eventStatus: WorkflowStatus.SUCCESS,
      httpStatus: 201,
      fhirResourceType: "ServiceRequest",
      fhirResourceRef: createdServiceRequest.reference,
    });

    return buildWorkflowResponse({
      processId: currentProcess.processId,
      status: WorkflowStatus.RADIOLOGY_ORDER_CREATED,
      message: "Röntgenauftrag wurde erfolgreich erstellt.",
      additionalData: {
        serviceRequestRef: createdServiceRequest.reference,
      },
    });
  } catch (error) {
    await saveTechnicalError({
      processId: currentProcess?.processId || processId,
      transactionId: currentProcess?.transactionId,
      organizationId: currentProcess?.organizationId || user?.organizationId,
      user,
      error,
    });

    await markWorkflowAsErrorIfNeeded({
      processId: currentProcess?.processId || processId,
      error,
    });

    throw error;
  }
};

const registerImagingStudy = async ({ user, process, processId, input }) => {
  let currentProcess = process;

  try {
    if (!currentProcess) {
      currentProcess = await getProcessOrThrow(processId);
    }

    ensureSameOrganization(currentProcess, user);

    ensureActionIsAllowed({
      currentStatus: currentProcess.status,
      action: Actions.REGISTER_IMAGING_STUDY,
    });

    ensureRequiredFhirRefs(currentProcess, [
      "patientRef",
      "encounterRef",
      "serviceRequestRef",
    ]);

    const studyInstanceUid =
      input.studyInstanceUid ||
      `2.25.${crypto.randomUUID().replaceAll("-", "")}`;

    const imagingStudyResource = buildImagingStudyResource({
      patientRef: currentProcess.fhirRefs.patientRef,
      encounterRef: currentProcess.fhirRefs.encounterRef,
      studyInstanceUid,
      modalityCode: input.modalityCode || "DX",
      modalityDisplay: input.modalityDisplay || "Digital Radiography",
    });

    if (input.description) {
      imagingStudyResource.description = input.description;
    }

    if (input.started) {
      imagingStudyResource.started = input.started;
    }

    const createdImagingStudy = await createFhirResourceAndRef(
      "ImagingStudy",
      imagingStudyResource
    );

    const provenanceRef = await createProvenanceRef({
      targetRefs: [createdImagingStudy.reference],
      user,
      activityDisplay: "ImagingStudy registriert",
    });

    currentProcess = await addMergedFhirReferences(currentProcess, {
      imagingStudyRef: createdImagingStudy.reference,
      provenanceRefs: [provenanceRef],
    });

    currentProcess = await updateProcessStatus(
      currentProcess.processId,
      WorkflowStatus.IMAGING_STUDY_REGISTERED
    );

    const auditEventRef = await createAuditEventIfPossible({
      process: currentProcess,
      action: "C",
      description: "ImagingStudy wurde registriert.",
      outcome: "0",
    });

    if (auditEventRef) {
      currentProcess = await addMergedFhirReferences(currentProcess, {
        auditEventRefs: [auditEventRef],
      });
    }

    await saveWorkflowEvent({
      process: currentProcess,
      user,
      eventType: WorkflowStatus.IMAGING_STUDY_REGISTERED,
      eventStatus: WorkflowStatus.SUCCESS,
      httpStatus: 201,
      fhirResourceType: "ImagingStudy",
      fhirResourceRef: createdImagingStudy.reference,
    });

    return buildWorkflowResponse({
      processId: currentProcess.processId,
      status: WorkflowStatus.IMAGING_STUDY_REGISTERED,
      message: "ImagingStudy wurde erfolgreich registriert.",
      additionalData: {
        imagingStudyRef: createdImagingStudy.reference,
      },
    });
  } catch (error) {
    await saveTechnicalError({
      processId: currentProcess?.processId || processId,
      transactionId: currentProcess?.transactionId,
      organizationId: currentProcess?.organizationId || user?.organizationId,
      user,
      error,
    });

    await markWorkflowAsErrorIfNeeded({
      processId: currentProcess?.processId || processId,
      error,
    });

    throw error;
  }
};

const createDiagnosticReport = async ({ user, process, processId, input }) => {
  let currentProcess = process;

  try {
    if (!currentProcess) {
      currentProcess = await getProcessOrThrow(processId);
    }

    ensureSameOrganization(currentProcess, user);

    ensureActionIsAllowed({
      currentStatus: currentProcess.status,
      action: Actions.CREATE_DIAGNOSTIC_REPORT,
    });

    ensureRequiredFhirRefs(currentProcess, [
      "patientRef",
      "encounterRef",
      "serviceRequestRef",
      "imagingStudyRef",
    ]);

    const findings = input.findings || [];

    const observationRefs = [];

    for (const finding of findings) {
      const observationResource = buildObservationFromFinding({
        finding,
        patientRef: currentProcess.fhirRefs.patientRef,
        encounterRef: currentProcess.fhirRefs.encounterRef,
      });

      observationResource.basedOn = [
        {
          reference: currentProcess.fhirRefs.serviceRequestRef,
        },
      ];

      const createdObservation = await createFhirResourceAndRef(
        "Observation",
        observationResource
      );

      observationRefs.push(createdObservation.reference);
    }

    const diagnosticReportResource = buildDiagnosticReportResource({
      patientRef: currentProcess.fhirRefs.patientRef,
      encounterRef: currentProcess.fhirRefs.encounterRef,
      imagingStudyRef: currentProcess.fhirRefs.imagingStudyRef,
      observationRefs,
      conclusion:
        input.conclusion || "Radiologischer Befund wurde dokumentiert.",
    });

    diagnosticReportResource.basedOn = [
      {
        reference: currentProcess.fhirRefs.serviceRequestRef,
      },
    ];

    const createdDiagnosticReport = await createFhirResourceAndRef(
      "DiagnosticReport",
      diagnosticReportResource
    );

    const provenanceRef = await createProvenanceRef({
      targetRefs: [...observationRefs, createdDiagnosticReport.reference],
      user,
      activityDisplay: "Radiologischer Befund erstellt",
    });

    currentProcess = await addMergedFhirReferences(currentProcess, {
      observationRefs,
      diagnosticReportRef: createdDiagnosticReport.reference,
      provenanceRefs: [provenanceRef],
    });

    currentProcess = await updateProcessStatus(
      currentProcess.processId,
      WorkflowStatus.SUCCESS
    );

    const auditEventRef = await createAuditEventIfPossible({
      process: currentProcess,
      action: "C",
      description: "Radiologischer Befund wurde erstellt.",
      outcome: "0",
    });

    if (auditEventRef) {
      currentProcess = await addMergedFhirReferences(currentProcess, {
        auditEventRefs: [auditEventRef],
      });
    }

    await saveWorkflowEvent({
      process: currentProcess,
      user,
      eventType: "DIAGNOSTIC_REPORT_CREATED",
      eventStatus: WorkflowStatus.SUCCESS,
      httpStatus: 201,
      fhirResourceType: "DiagnosticReport",
      fhirResourceRef: createdDiagnosticReport.reference,
    });

    return buildWorkflowResponse({
      processId: currentProcess.processId,
      status: WorkflowStatus.SUCCESS,
      message: "Radiologischer Befund wurde erfolgreich erstellt.",
      additionalData: {
        observationRefs,
        diagnosticReportRef: createdDiagnosticReport.reference,
      },
    });
  } catch (error) {
    await saveTechnicalError({
      processId: currentProcess?.processId || processId,
      transactionId: currentProcess?.transactionId,
      organizationId: currentProcess?.organizationId || user?.organizationId,
      user,
      error,
    });

    await markWorkflowAsErrorIfNeeded({
      processId: currentProcess?.processId || processId,
      error,
    });

    throw error;
  }
};

module.exports = {
  startDiagnosticWorkflow,
  getDiagnosticWorkflowById,
  createRadiologyOrder,
  registerImagingStudy,
  createDiagnosticReport,
};
