/**
 * Baut eine FHIR R4 Encounter-Ressource (stationärer/ambulanter Aufenthalt).
 * @param {Object} data - Die internen Falldaten
 * @param {string} data.id - Die temporäre UUID für das Bundle
 * @param {string} data.patientRef - Die temporäre ID des Patienten
 * @param {string} data.startTime - Startzeitpunkt 
 * @param {string} [data.status] - Status des Falls ('planned', 'arrived', 'triaged', 'in-progress', 'finished')
 * @returns {Object} FHIR Encounter Resource
 */
export const buildEncounterResource = (data) => {
  const { id, patientRef, startTime, status = 'in-progress' } = data;

  return {
    resourceType: 'Encounter',
    id: id,
    status: status,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB', 
      display: 'ambulatory'
    },
    subject: {
      reference: patientRef
    },
    period: {
      start: startTime
    }
  };
};