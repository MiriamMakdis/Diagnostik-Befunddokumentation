/**
 * Baut eine FHIR R4 Observation-Ressource (Messwert / Strukturierter Befund).
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {string} data.patientRef - Temporäre ID des Patienten
 * @param {string} data.encounterRef - Temporäre ID des Encounters
 * @param {string} data.loincCode - LOINC-Code für die Untersuchungsart
 * @param {string} data.loincDisplay - Klartext der Untersuchung
 * @param {number} data.value - Der numerische Messwert
 * @param {string} data.unit - Die Maßeinheit
 * @returns {Object} FHIR Observation Resource
 */
const buildObservationResource = (data) => {
  const { id, patientRef, encounterRef, loincCode, loincDisplay, value, unit } = data;

  return {
    resourceType: 'Observation',
    id: id,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'imaging',
            display: 'Imaging'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
          display: loincDisplay
        }
      ],
      text: loincDisplay
    },
    subject: {
      reference: patientRef
    },
    encounter: {
      reference: encounterRef
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: value,
      unit: unit,
      system: 'http://unitsofmeasure.org',
      code: unit
    }
  };
};

module.exports = {
  buildObservationResource
};