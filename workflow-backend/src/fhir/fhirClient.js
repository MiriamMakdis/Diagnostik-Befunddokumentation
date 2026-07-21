 const axios = require('axios');

const FHIR_BASE_URL = 'https://hapi.fhir.org/baseR4';

const fhirAxios = axios.create({
  baseURL: FHIR_BASE_URL,
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json'
  },
  // timeout: 10000yarn
});

// FHIR Operaton Outcome
const handleFhirError = (error, contextMessage) => {
  console.error(`[FHIR Error] ${contextMessage}:`, error.message);
  if (error.response && error.response.data) {
    console.error('[FHIR Outcome]:', JSON.stringify(error.response.data, null, 2));
  }
  throw error;
};

/** POST (FHIR-Ressource)
* @param {string} resourceType - Z.B. 'Patient', 'Encounter'
* @param {Object} resourceData - Der JSON-Body der Ressource
* @returns {Promise<Object>} Die vom Server zurückgegebene Ressource (inkl. ID)
*/

const createFhirResource = async (resourceType, resourceData) => {
  try {
    const response = await fhirAxios.post(`/${resourceType}`, resourceData);
    return response.data;
  } catch (error) {
    handleFhirError(error, `Fehler beim Erstellen von ${resourceType}`);
  }
};

/** GET (FHIR-Ressource)
* @param {string} resourceType - Z.B. 'Patient'
* @param {string} id - Die logische ID der Ressource auf dem Server
* @returns {Promise<Object>} Die FHIR-Ressource
 */

const readFhirResource = async (resourceTypeOrReference, id) => {
  try {
    const path = id
      ? `/${resourceTypeOrReference}/${id}`
      : `/${resourceTypeOrReference}`;

    const response = await fhirAxios.get(path);
    return response.data;
  } catch (error) {
    const label = id
      ? `${resourceTypeOrReference}/${id}`
      : resourceTypeOrReference;

    handleFhirError(error, `Fehler beim Lesen von ${label}`);
  }
};

/** POST (Bundle)
 * @param {Object} bundleData - Das vollständige FHIR-Bundle-Objekt
 * @returns {Promise<Object>} Das Bundle-Response-Ergebnis vom Server
 */ 

const sendTransactionBundle = async (bundleData) => {
  try {
    const response = await fhirAxios.post('/', bundleData);
    return response.data;
  } catch (error) {
    handleFhirError(error, 'Fehler beim Senden des Transaction-Bundles');
  }
};

const searchFhirResource = async (resourceType, searchParams = {}) => {
  try {
    const response = await fhirAxios.get(`/${resourceType}`, {
      params: searchParams
    });

    return response.data;
  } catch (error) {
    handleFhirError(error, `Fehler beim Suchen von ${resourceType}`);
  }
};

module.exports = { 
  createFhirResource,
  readFhirResource,
  sendTransactionBundle,
  searchFhirResource
 };
