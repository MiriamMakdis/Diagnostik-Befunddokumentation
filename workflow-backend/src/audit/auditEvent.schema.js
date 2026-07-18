const mongoose = require('mongoose');

const AuditEventSchema = new mongoose.Schema({
  fhirId:        { type: String, required: true, unique: true },
  action:        { type: String },
  recorded:      { type: String },
  outcome:       { type: String },
  description:   { type: String },
  patientFhirId: { type: String },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditEvent', AuditEventSchema);