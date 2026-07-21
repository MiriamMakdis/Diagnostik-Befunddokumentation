const buildMedicationStatementResource = ({ id, patientRef, medicationText, dosageText, status = 'active' }) => ({
  resourceType: 'MedicationStatement',
  ...(id ? { id } : {}),
  status,
  subject: { reference: patientRef },
  medicationCodeableConcept: { text: medicationText || 'Dauermedikation nicht näher bezeichnet' },
  ...(dosageText ? { dosage: [{ text: dosageText }] } : {})
});

module.exports = { buildMedicationStatementResource };
