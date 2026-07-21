import { v4 as uuidv4 } from 'uuid';
import fhirClient from '../fhir/fhirClient.js';
import { buildPatientResource } from '../fhir/builders/patientBuilder.js';
import { buildEncounterResource } from '../fhir/builders/encounterBuilder.js';
import { buildConditionResource } from '../fhir/builders/conditionBuilder.js';
import { buildTransactionBundle } from '../fhir/builders/bundleBuilder.js';
import { buildProvenanceResource } from '../fhir/builders/provenanceBuilder.js';

/**
 * Hilfsfunktion, die die echten Server-IDs aus der HAPI-Bundle-Response extrahiert.
 * 
 * @param {Object} responseBundle - Das vom Server zurückgegebene Response-Bundle
 * @param {Object} tempIdMap - Ein Mapping von {'urn:uuid:...': 'Patient'} zur Zuordnung
 * @returns {Object} Ein Mapping von internen Namen zu echten IDs { patientId: '...', encounterId: '...' }
 */
const extractRealIds = (responseBundle, tempIdMap) => {
  const resultIds = {};

  if (!responseBundle || !responseBundle.entry) {
    throw new Error('Ungültige oder leere Server-Response beim Parsen der IDs.');
  }

  responseBundle.entry.forEach((entry) => {
    const status = entry.response?.status;
    const location = entry.response?.location;

    //Ressource erfolgreich angelegt (201) / aktualisiert (200) 
    if ((status?.startsWith('201') || status?.startsWith('200')) && location) {
      const parts = location.split('/');
      const resourceType = parts[0]; 
      const realId = parts[1]; 

      if (resourceType === 'Patient') resultIds.fhirPatientId = realId;
      if (resourceType === 'Encounter') resultIds.fhirEncounterId = realId;
      if (resourceType === 'Condition') resultIds.fhirConditionId = realId;
    }
  });

  return resultIds;
};

/**
 * Ordnet den gesamten Aufnahme-Prozess (Admission) eines Patienten.
 * Erstellt Patient, Encounter, Verdachtsdiagnose und einen Audit Trail (Provenance) in einer Transaktion.
 * 
 * @param {Object} admissionData - Die fachlichen Daten aus dem Frontend 
 * @returns {Promise<Object>} Die echten FHIR-Server-IDs für die MongoDB
 */
export const executePatientAdmission = async (admissionData) => {
  // Generierung der temporären IDs für die Bundle-Verknüpfung
  const patientTempId = `urn:uuid:${uuidv4()}`;
  const encounterTempId = `urn:uuid:${uuidv4()}`;
  const conditionTempId = `urn:uuid:${uuidv4()}`;
  const provenanceTempId = `urn:uuid:${uuidv4()}`;

  //Aufbau der einzelnen FHIR-Ressourcen über die Builder
  const patientResource = buildPatientResource({
    id: patientTempId,
    kvnr: admissionData.kvnr,
    lastName: admissionData.lastName,
    firstName: admissionData.firstName,
    birthDate: admissionData.birthDate,
    gender: admissionData.gender
  });

  const encounterResource = buildEncounterResource({
    id: encounterTempId,
    patientRef: patientTempId,
    startTime: new Date().toISOString(),
    status: 'in-progress'
  });

  const conditionResource = buildConditionResource({
    id: conditionTempId,
    patientRef: patientTempId,
    encounterRef: encounterTempId,
    icdCode: admissionData.icdCode || 'R52.9',
    icdDisplay: admissionData.icdDisplay || 'Schmerz, nicht näher bezeichnet'
  });

  // Digitaler Herkunftsnachweis für diese 3 Ressourcen
  const provenanceResource = buildProvenanceResource({
    id: provenanceTempId,
    targetRefs: [patientTempId, encounterTempId, conditionTempId],
    agentDisplay: 'Klinik-Informationssystem (KIS) - Aufnahme-Modul'
  });

  // Bundling zu einer atomaren Transaktion
  const transactionBundle = buildTransactionBundle([
    patientResource,
    encounterResource,
    conditionResource,
    provenanceResource
  ]);

  // Senden an den HAPI FHIR Server
  console.log('[AdmissionService] Sende Aufnahme-Bundle an FHIR-Server...');
  const responseBundle = await fhirClient.sendTransactionBundle(transactionBundle);

  // Echte IDs extrahieren und an den Controller/MongoDB-Service zurückgeben
  const realIds = extractRealIds(responseBundle);
  console.log('[AdmissionService] Aufnahme erfolgreich verarbeitet. Extrahierte IDs:', realIds);

  return realIds;
};

export default {
  executePatientAdmission
};