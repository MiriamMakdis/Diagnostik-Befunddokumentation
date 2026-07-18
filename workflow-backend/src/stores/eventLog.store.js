const EventLogModel = require('../models/eventLog.model');

const { v4: uuidv4 } = require('uuid');

async function saveEvent({ processId, transactionId, organizationId, actorSub, actorRole, eventType, eventStatus, httpStatus, fhirResourceType, fhirResourceRef }) {

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

async function findEventsByProcessId(processId) {

  return await EventLogModel.find({ processId }).sort({ createdAt: 1 });

}

module.exports = { saveEvent, findEventsByProcessId };