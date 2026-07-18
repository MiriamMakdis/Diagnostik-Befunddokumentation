const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({

  eventId:        { type: String, required: true, unique: true },
  processId:      { type: String, required: true },
  transactionId:  { type: String },
  organizationId: { type: String },
  actorSub:  { type: String },
  actorRole: { type: String },
  eventType:   { type: String },
  eventStatus: { type: String },
  httpStatus: { type: Number },
  fhirResourceType: { type: String },
  fhirResourceRef:  { type: String },
  errorCode: { type: String },
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('EventLog', EventLogSchema);