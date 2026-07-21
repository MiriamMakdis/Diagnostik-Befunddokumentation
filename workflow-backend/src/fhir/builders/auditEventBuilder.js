const buildAuditEventResource = ({ eventType, eventStatus = 'SUCCESS', actorSub, actorRole, actorDisplay, processId, targetRefs = [] }) => ({
  resourceType: 'AuditEvent',
  type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest', display: 'RESTful Operation' },
  action: 'C',
  recorded: new Date().toISOString(),
  outcome: eventStatus === 'SUCCESS' ? '0' : '4',
  outcomeDesc: eventType,
  agent: [{
    who: { display: actorDisplay || actorSub || 'Workflow Backend' },
    role: actorRole ? [{ text: actorRole }] : undefined,
    requestor: true
  }],
  source: { observer: { display: 'Workflow Backend' } },
  entity: [
    { what: { display: `processId=${processId}` } },
    ...targetRefs.map((reference) => ({ what: { reference } }))
  ]
});

module.exports = { buildAuditEventResource };
