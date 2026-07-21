const express = require('express');

const requireAuth = require('../middlewares/requireAuth');
const requireScopes = require('../middlewares/requireScopes');
const validateRequest = require('../middlewares/validateRequests');

const { Scopes } = require('../constants/scopes');
const { patientSearchSchema } = require('../validation/patientValidation');

const {
  searchPatient,
  searchPatientByKvnr
} = require('../services/patientService');

const router = express.Router();

const toPatientSummary = (patient) => {
  const name = patient.name?.[0];

  return {
    id: patient.id || null,
    reference: patient.id ? `Patient/${patient.id}` : null,
    familyName: name?.family || null,
    givenName: name?.given?.[0] || null,
    birthDate: patient.birthDate || null,
    gender: patient.gender || null,
    identifier: patient.identifier || []
  };
};

router.post(
  '/search',
  requireAuth,
  requireScopes(Scopes.PATIENT_SEARCH),
  validateRequest(patientSearchSchema),
  async (req, res, next) => {
    try {
      const {
        kvnr,
        kvid,
        familyName,
        givenName,
        birthDate
      } = req.body;

      const insuranceNumber = kvnr || kvid;

      const patients = insuranceNumber
        ? await searchPatientByKvnr({ kvnr: insuranceNumber })
        : await searchPatient({
            family: familyName,
            given: givenName,
            birthdate: birthDate
          });

      res.status(200).json({
        status: 'SUCCESS',
        count: patients.length,
        patients: patients.map(toPatientSummary)
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
