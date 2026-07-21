const crypto = require('node:crypto');

const fhirClient = require('../fhir/fhirClient');

const { buildPatientResource } = require('../fhir/builders/patientBuilder');
const { buildEncounterResource } = require('../fhir/builders/encounterBuilder');
const { buildConditionResource } = require('../fhir/builders/conditionBuilder');
const { buildMedicationStatementResource } = require('../fhir/builders/medicationStatementBuilder');
const { buildConsentResource } = require('../fhir/builders/consentBuilder');
const { buildTransactionBundle } = require('../fhir/builders/bundleBuilder');
const { buildProvenanceResource } = require('../fhir/builders/provenanceBuilder');

const createAppError = require('../utils/createAppError');
const ErrorCodes = require('../constants/errorCodes');

const createTempId = () => `urn:uuid:${crypto.randomUUID()}`;

const getPatientData = (admissionData) => {
  return admissionData.patient || admissionData;
};

const getConsent = (admissionData) => {
  return admissionData.consent || {
    accepted: admissionData.consentAccepted
  };
};

const getConditions = (admissionData) => {
  if (Array.isArray(admissionData.conditions) && admissionData.conditions.length > 0) {
    return admissionData.conditions;
  }

  return [
    {
      icdCode: admissionData.icdCode || 'R52.9',
      icdDisplay: admissionData.icdDisplay || 'Schmerz, nicht näher bezeichnet'
    }
  ];
};

const getMedications = (admissionData) => {
  return admissionData.medications || admissionData.medicationStatements || [];
};

const getExistingPatientRef = (admissionData) => {
  return admissionData.existingPatientRef || null;
};

const addRefAndId = ({ resultIds, resourceType, realId }) => {
  const ref = `${resourceType}/${realId}`;

  if (resourceType === 'Patient') {
    resultIds.fhirPatientId = realId;
    resultIds.patientRef = ref;
  }

  if (resourceType === 'Encounter') {
    resultIds.fhirEncounterId = realId;
    resultIds.encounterRef = ref;
  }

  if (resourceType === 'Condition') {
    resultIds.fhirConditionId = resultIds.fhirConditionId || realId;
    resultIds.fhirConditionIds.push(realId);
    resultIds.conditionRefs.push(ref);
  }

  if (resourceType === 'MedicationStatement') {
    resultIds.fhirMedicationStatementId = resultIds.fhirMedicationStatementId || realId;
    resultIds.fhirMedicationStatementIds.push(realId);
    resultIds.medicationStatementRefs.push(ref);
  }

  if (resourceType === 'Consent') {
    resultIds.fhirConsentId = realId;
    resultIds.consentRef = ref;
  }

  if (resourceType === 'Provenance') {
    resultIds.fhirProvenanceId = resultIds.fhirProvenanceId || realId;
    resultIds.fhirProvenanceIds.push(realId);
    resultIds.provenanceRefs.push(ref);
  }
};

/**
 * Hilfsfunktion, die die echten Server-IDs aus der HAPI-Bundle-Response extrahiert.
 *
 * @param {Object} responseBundle - Das vom Server zurückgegebene Response-Bundle
 * @param {Object} tempIdMap - Ein Mapping von {'urn:uuid:...': 'Patient'} zur Zuordnung
 * @returns {Object} Ein Mapping von internen Namen zu echten IDs { patientId: '...', encounterId: '...' }
 */
const extractRealIds = (responseBundle, tempIdMap) => {
  const resultIds = {
    fhirConditionIds: [],
    fhirMedicationStatementIds: [],
    fhirProvenanceIds: [],
    conditionRefs: [],
    medicationStatementRefs: [],
    provenanceRefs: []
  };

  if (!responseBundle || !responseBundle.entry) {
    throw createAppError({
      errorCode: ErrorCodes.FHIR_RESPONSE_INVALID,
      message: 'Ungültige oder leere Server-Response beim Parsen der IDs.'
    });
  }

  responseBundle.entry.forEach((entry) => {
    const status = entry.response?.status;
    const location = entry.response?.location;

    //Ressource erfolgreich angelegt (201) / aktualisiert (200)
    if ((status?.startsWith('201') || status?.startsWith('200')) && location) {
      const parts = location.split('/');
      const resourceType = parts[0];
      const realId = parts[1];

      addRefAndId({
        resultIds,
        resourceType,
        realId
      });
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
const executePatientAdmission = async (admissionData) => {
  const patientData = getPatientData(admissionData);
  const consent = getConsent(admissionData);
  const conditions = getConditions(admissionData);
  const medications = getMedications(admissionData);
  const existingPatientRef = getExistingPatientRef(admissionData);

  if (!consent || consent.accepted !== true) {
    throw createAppError({
      errorCode: ErrorCodes.CONSENT_REJECTED
    });
  }

  // Generierung der temporären IDs für die Bundle-Verknüpfung
  const patientTempId = createTempId();
  const encounterTempId = createTempId();
  const conditionTempId = createTempId();
  const consentTempId = createTempId();
  const provenanceTempId = createTempId();

  const medicationTempIds = medications.map(() => createTempId());

  const patientRef = existingPatientRef || patientTempId;

  const resources = [];

  //Aufbau der einzelnen FHIR-Ressourcen über die Builder
  if (!existingPatientRef) {
    const patientResource = buildPatientResource({
      id: patientTempId,
      kvnr: patientData.kvnr || patientData.kvid,
      lastName: patientData.lastName || patientData.familyName,
      firstName: patientData.firstName || patientData.givenName,
      birthDate: patientData.birthDate,
      gender: patientData.gender
    });

    resources.push(patientResource);
  }

  const encounterResource = buildEncounterResource({
    id: encounterTempId,
    patientRef,
    startTime: new Date().toISOString(),
    status: 'in-progress'
  });

  const firstCondition = conditions[0] || {};

  const conditionResource = buildConditionResource({
    id: conditionTempId,
    patientRef,
    encounterRef: encounterTempId,
    icdCode: firstCondition.icdCode || firstCondition.code || admissionData.icdCode || 'R52.9',
    icdDisplay:
      firstCondition.icdDisplay ||
      firstCondition.display ||
      admissionData.icdDisplay ||
      'Schmerz, nicht näher bezeichnet'
  });

  const medicationResources = medications.map((medication, index) => {
    return buildMedicationStatementResource({
      id: medicationTempIds[index],
      patientRef,
      medicationText: medication.medicationText || medication.name,
      dosageText: medication.dosageText || medication.dosage,
      status: medication.status || 'active'
    });
  });

  const consentResource = buildConsentResource({
    id: consentTempId,
    patientRef,
    status: 'active',
    dateTime: new Date().toISOString()
  });

  // Digitaler Herkunftsnachweis für diese 3 Ressourcen
  const provenanceResource = buildProvenanceResource({
    id: provenanceTempId,
    targetRefs: [
      patientRef,
      encounterTempId,
      conditionTempId,
      ...medicationTempIds,
      consentTempId
    ],
    agentDisplay:
      admissionData.user?.displayName ||
      admissionData.user?.sub ||
      'Klinik-Informationssystem (KIS) - Aufnahme-Modul'
  });

  resources.push(
    encounterResource,
    conditionResource,
    ...medicationResources,
    consentResource,
    provenanceResource
  );

  // Bundling zu einer atomaren Transaktion
  const transactionBundle = buildTransactionBundle(resources);

  // Senden an den HAPI FHIR Server
  console.log('[AdmissionService] Sende Aufnahme-Bundle an FHIR-Server...');
  const responseBundle = await fhirClient.sendTransactionBundle(transactionBundle);

  // Echte IDs extrahieren und an den Controller/MongoDB-Service zurückgeben
  const realIds = extractRealIds(responseBundle);

  if (existingPatientRef) {
    realIds.fhirPatientId = existingPatientRef.split('/')[1];
    realIds.patientRef = existingPatientRef;
  }

  console.log('[AdmissionService] Aufnahme erfolgreich verarbeitet. Extrahierte IDs:', realIds);

  return realIds;
};

module.exports = {
  executePatientAdmission
};