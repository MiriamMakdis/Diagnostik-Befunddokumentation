const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  fhirId:     { type: String, required: true, unique: true },
  familyName: { type: String },
  givenName:  { type: String },
  birthDate:  { type: String },
  kvid:       { type: String },
  gender:     { type: String },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);