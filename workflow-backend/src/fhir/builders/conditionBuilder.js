/**
 * Baut eine FHIR R4 Condition-Ressource (Diagnose/Befund).
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {string} data.patientRef - Temporäre ID des Patienten 
 * @param {string} data.encounterRef - Temporäre ID des Encounters
 * @param {string} data.icdCode - Der ICD-10 Code
 * @param {string} data.icdDisplay - Der Klartext zur Diagnose 
 * @param {string} [data.clinicalStatus] - 'active', 'recurrence', 'remission', 'resolved'
 * @returns {Object} FHIR Condition Resource
 */

const buildConditionResource = (data) => {
  const { id, patientRef, encounterRef, icdCode, icdDisplay, clinicalStatus = 'active' } = data;

  return {
    resourceType: 'Condition',
    id: id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: clinicalStatus
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'unconfirmed', 
          display: 'Unconfirmed'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10-cm',
          code: icdCode,
          display: icdDisplay
        }
      ],
      text: icdDisplay
    },
    subject: {
      reference: patientRef
    },
    encounter: {
      reference: encounterRef
    }
  };
};

module.exports = {
  buildConditionResource
};