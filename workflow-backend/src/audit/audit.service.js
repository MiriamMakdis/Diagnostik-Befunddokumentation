const BASE_URL = process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4';

async function createAuditEventFHIR({ patientFhirId, action, description, outcome }) {
  const body = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    action,
    recorded: new Date().toISOString(),
    outcome,
    outcomeDesc: description,
    agent: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'AUT'
        }]
      },
      who: {
        display: 'Notaufnahme-System'
      },
      requestor: true
    }],
    source: {
      observer: {
        display: 'Diagnostik-Befunddokumentation'
      }
    },
    entity: patientFhirId
      ? [{
          what: {
            reference: `Patient/${patientFhirId}`
          },
          type: {
            system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
            code: '1',
            display: 'Person'
          }
        }]
      : []
  };

  const res = await fetch(`${BASE_URL}/AuditEvent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const outcomeBody = await res.json().catch(() => null);
    console.error('[FHIR AuditEvent Error]:', outcomeBody || res.statusText);
    throw new Error(`AuditEvent konnte nicht erstellt werden. HTTP ${res.status}`);
  }

  return await res.json();
}

module.exports = {
  createAuditEventFHIR
};