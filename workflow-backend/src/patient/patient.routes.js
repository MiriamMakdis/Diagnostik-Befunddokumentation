const express = require('express');
const router = express.Router();
const PatientModel = require('./patient.schema');
const { searchPatient, createPatientFHIR } = require('./patient.service');
const { createAuditEventFHIR } = require('../audit/audit.service');
const AuditEventModel = require('../audit/auditEvent.schema');

// POST /patient/aufnahme
router.post('/aufnahme', async (req, res) => {
  try {
    const { familyName, givenName, birthDate, kvid, gender } = req.body;

    // 1. Suchen
    let gefunden = await searchPatient({ family: familyName, given: givenName, birthdate: birthDate });
    let fhirPatient;

    if (gefunden.length > 0) {
      fhirPatient = gefunden[0];
    } else {
      // 2. Anlegen
      fhirPatient = await createPatientFHIR({ familyName, givenName, birthDate, kvid, gender });
    }

    // 3. MongoDB speichern
    await PatientModel.findOneAndUpdate(
      { fhirId: fhirPatient.id },
      {
        fhirId:     fhirPatient.id,
        familyName: fhirPatient.name?.[0]?.family,
        givenName:  fhirPatient.name?.[0]?.given?.[0],
        birthDate:  fhirPatient.birthDate,
        gender:     fhirPatient.gender,
        kvid:       fhirPatient.identifier?.[0]?.value
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 4. AuditEvent
    const fhirAudit = await createAuditEventFHIR({
      patientFhirId: fhirPatient.id,
      action: 'C',
      description: 'Patient-Aufnahme durchgeführt',
      outcome: '0'
    });

    await AuditEventModel.findOneAndUpdate(
      { fhirId: fhirAudit.id },
      {
        fhirId:        fhirAudit.id,
        action:        'C',
        recorded:      fhirAudit.recorded,
        outcome:       '0',
        description:   'Patient-Aufnahme durchgeführt',
        patientFhirId: fhirPatient.id
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      message: 'Patient erfolgreich aufgenommen',
      patientFhirId: fhirPatient.id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler bei der Patient-Aufnahme' });
  }
});

module.exports = router;