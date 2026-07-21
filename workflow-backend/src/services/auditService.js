const fhirClient = require('../fhir/fhirClient');
const { buildAuditEventResource } = require('../fhir/builders/auditEventBuilder');
const { saveEventLog } = require('../stores/eventLog.store');
const { saveTechnicalError } = require('../stores/error.store');
const { addFhirReferences } = require('../stores/process.store');
const ErrorCodes = require('../constants/errorCodes');

const createAuditEventFHIR = async ({ patientFhirId, action = 'C', description, outcome = '0' }) => {
  const body = {
    resourceType: 'AuditEvent',
    type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest', display: 'RESTful Operation' },
    action,
    recorded: new Date().toISOString(),
    outcome,
    outcomeDesc: description,
    agent: [{ who: { display: 'Workflow Backend' }, requestor: true }],
    source: { observer: { display: 'Diagnostik-Befunddokumentation' } },
    entity: patientFhirId ? [{ what: { reference: `Patient/${patientFhirId}` } }] : []
  };

  return fhirClient.createFhirResource('AuditEvent', body);
};

const recordWorkflowEvent = async ({ process, user, eventType, eventStatus = 'SUCCESS', httpStatus = 200, fhirResourceType = null, fhirResourceRef = null, targetRefs = [] }) => {
  await saveEventLog({
    processId: process.processId,
    transactionId: process.transactionId,
    organizationId: process.organizationId,
    actorSub: user?.sub || 'unknown',
    actorRole: user?.role || 'unknown',
    eventType,
    eventStatus,
    httpStatus,
    fhirResourceType,
    fhirResourceRef
  });

  try {
    const auditEvent = buildAuditEventResource({
      eventType,
      eventStatus,
      actorSub: user?.sub,
      actorRole: user?.role,
      actorDisplay: user?.displayName,
      processId: process.processId,
      targetRefs
    });

    const created = await fhirClient.createFhirResource('AuditEvent', auditEvent);
    if (created?.id) {
      await addFhirReferences(process.processId, { auditEventRefs: [`AuditEvent/${created.id}`] });
    }
  } catch (error) {
    await saveTechnicalError({
      processId: process.processId,
      transactionId: process.transactionId,
      organizationId: process.organizationId,
      actorSub: user?.sub || 'unknown',
      actorRole: user?.role || 'unknown',
      errorCode: ErrorCodes.FHIR_REQUEST_FAILED,
      httpStatus: 502,
      message: 'FHIR AuditEvent konnte nicht erstellt werden.'
    });
  }
};

module.exports = { createAuditEventFHIR, recordWorkflowEvent };
