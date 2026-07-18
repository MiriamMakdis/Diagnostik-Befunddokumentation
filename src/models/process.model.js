const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({

  processId:     { type: String, required: true, unique: true },
  transactionId: { type: String },
  workflowType:  { type: String },
  organizationId:{ type: String },
  status:        { type: String, default: 'INTAKE_COMPLETED' },
  kvnrHash:      { type: String },

  fhirRefs: {
    patientRef:              { type: String },
    encounterRef:            { type: String },
    consentRef:              { type: String },
    conditionRefs:           [String],
    medicationStatementRefs: [String],
    serviceRequestRef:       { type: String },
    imagingStudyRef:         { type: String },
    observationRefs:         [String],
    diagnosticReportRef:     { type: String },
    auditEventRefs:          [String],
    provenanceRefs:          [String]

  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Process', ProcessSchema);