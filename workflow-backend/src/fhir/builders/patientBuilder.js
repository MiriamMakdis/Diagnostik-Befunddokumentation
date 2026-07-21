/**
 * Baut eine gesetzeskonforme und standardisierte FHIR R4 Patient-Ressource.
 * @param {Object} data - Die internen Daten aus der Anwendung (MongoDB-Dokument)
 * @param {string} data.id - Die temporäre UUID für das Bundle 
 * @param {string} data.kvnr - Die Krankenversichertennummer
 * @param {string} data.lastName - Nachname
 * @param {string} data.firstName - Vorname
 * @param {string} data.birthDate - Geburtsdatum im Format YYYY-MM-DD
 * @param {string} data.gender - 'male', 'female', 'other', 'unknown'
 * @returns {Object} FHIR Patient Resource
 */


const buildPatientResource = (data) => {
    const { id, kvnr, lastName, firstName, birchDate, gender } = data;

    return {
    resourceType: 'Patient',
    id: id, 
    active: true,
    identifier: [
      {
        system: 'http://fhir.de/sid/gkv/kvid-10',
        value: kvnr,
        assigner: {
          display: 'GKV Spitzenverband'
        }
      }
    ],
    name: [
      {
        use: 'official',
        family: lastName,
        given: [firstName]
      }
    ],
    gender: gender || 'unknown',
    birthDate:data.birthDate
  };
};

module.exports = {
  buildPatientResource,
};