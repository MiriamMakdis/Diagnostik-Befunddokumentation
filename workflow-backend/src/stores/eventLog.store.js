const EventLogModel = require('../models/eventLog.model');
const { v4: uuidv4 } = require('uuid');

async function saveEventLog({ processId, transactionId, organizationId, actorSub, actorRole, eventType, eventStatus, httpStatus, fhirResourceType, fhirResourceRef }) {
  const event = new EventLogModel({
    eventId: uuidv4(),
    processId,
    transactionId,
    organizationId,
    actorSub,
    actorRole,
    eventType,
    eventStatus,
    httpStatus,
    fhirResourceType,
    fhirResourceRef
  });
  return await event.save();
}

async function listEventLogsByProcessId(processId) {
  return await EventLogModel.find({ processId }).sort({ createdAt: 1 });
}

module.exports = { saveEventLog, listEventLogsByProcessId };