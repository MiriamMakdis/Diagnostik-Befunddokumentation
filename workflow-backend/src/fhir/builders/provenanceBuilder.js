/**
 * Baut eine FHIR R4 Provenance-Ressource zur rechtssicheren Protokollierung.
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {Array<string>} data.targetRefs - Liste von temporären IDs der Ressourcen, die in diesem Schritt erzeugt wurden
 * @param {string} data.agentDisplay - Name des Systems oder des Behandlers
 * @returns {Object} FHIR Provenance Resource
 */

// Audit Trail
const buildProvenanceResource = (data) => {
  const { id, targetRefs, agentDisplay } = data;

  return {
    resourceType: 'Provenance',
    id: id,
    target: targetRefs.map(ref => ({ reference: ref })),
    recorded: new Date().toISOString(),
    activity: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-DocumentCompletion',
          code: 'AU',
          display: 'authenticated'
        }
      ]
    },
    agent: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
              code: 'author',
              display: 'Author'
            }
          ]
        },
        who: {
          display: agentDisplay
        }
      }
    ]
  };
};

module.exports = {
  buildProvenanceResource
};