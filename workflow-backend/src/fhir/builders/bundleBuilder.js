/**
 * Verpackt mehrere FHIR-Ressourcen in ein standardisiertes R4 Transaction Bundle.
 * @param {Array<Object>} resources - Ein Array von fertig gebauten FHIR-Ressourcen (z. B. Patient, Encounter)
 * @returns {Object} FHIR Bundle Resource (Type: transaction)
 */

const buildTransactionBundle = (resources) => {
  const entries = resources.map(resource => {
    if (!resource.id) {
      throw new Error(`Ressource vom Typ ${resource.resourceType} besitzt keine (temporäre) ID. Bundling abgebrochen.`);
    }

    const { id:recourceId, ...resourceWithoutTemporaryId } = resource;

    return {
      fullUrl: recourceId,
      resource: resourceWithoutTemporaryId,
      request: {
        method: 'POST',
        url: resource.resourceType
      }
    };
  });

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries
  };
};

module.exports = {
  buildTransactionBundle
};