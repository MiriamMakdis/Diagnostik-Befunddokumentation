const fhirClient = require('../fhir/fhirClient');
const { buildProvenanceResource } = require('../fhir/builders/provenanceBuilder');
const { addFhirReferences } = require('../stores/process.store');
const ErrorCodes = require('../constants/errorCodes');
const createAppError = require('../utils/createAppError');

const createProvenanceForTargets = async ({ process, user, targetRefs, activity = 'workflow-step' }) => {
  if (!targetRefs || targetRefs.length === 0) {
    throw createAppError({
      errorCode: ErrorCodes.FHIR_REFERENCE_MISSING,
      message: 'Für Provenance fehlen targetRefs.'
    });
  }

  const provenanceResource = buildProvenanceResource({
    targetRefs,
    activity,
    agentDisplay: user?.displayName || user?.sub || 'Workflow Backend'
  });

  const createdProvenance = await fhirClient.createFhirResource('Provenance', provenanceResource);

  if (!createdProvenance?.id) {
    throw createAppError({
      errorCode: ErrorCodes.FHIR_RESPONSE_INVALID,
      message: 'Provenance wurde erstellt, aber die ID fehlt.'
    });
  }

  const provenanceRef = `Provenance/${createdProvenance.id}`;

  await addFhirReferences(process.processId, {
    provenanceRefs: [provenanceRef]
  });

  return {
    provenanceRef
  };
};

module.exports = {
  createProvenanceForTargets
};
