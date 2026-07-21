/**
 * Baut eine FHIR R4 ServiceRequest-Ressource (Untersuchungsauftrag).
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {string} data.patientRef - Temporäre ID des Patienten
 * @param {string} data.encounterRef - Temporäre ID des Encounters
 * @param {string} data.orderCode - LOINC Code für die Anforderung
 * @param {string} data.orderDisplay - Klartext
 * @returns {Object} FHIR ServiceRequest Resource
 */

export const buildServiceRequestResource = (data) => {
  const { id, patientRef, encounterRef, orderCode, orderDisplay } = data;

  return {
    resourceType: 'ServiceRequest',
    id: id,
    status: 'active',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '363679005',
            display: 'Imaging procedure'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: orderCode,
          display: orderDisplay
        }
      ],
      text: orderDisplay
    },
    subject: {
      reference: patientRef
    },
    encounter: {
      reference: encounterRef
    },
    authoredOn: new Date().toISOString()
  };
};