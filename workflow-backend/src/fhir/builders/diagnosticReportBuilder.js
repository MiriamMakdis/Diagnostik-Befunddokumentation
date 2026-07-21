/**
 * Baut eine FHIR R4 DiagnosticReport-Ressource (Radiologischer Befundbericht).
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {string} data.patientRef - Temporäre ID des Patienten
 * @param {string} data.encounterRef - Temporäre ID des Encounters
 * @param {string} data.imagingStudyRef - Temporäre ID der dazugehörigen ImagingStudy
 * @param {Array<string>} [data.observationRefs] - Array von temporären IDs zugehöriger Observations
 * @param {string} data.conclusion - Der Freitext-Befundberichts-Text
 * @returns {Object} FHIR DiagnosticReport Resource
 */
export const buildDiagnosticReportResource = (data) => {
  const { id, patientRef, encounterRef, imagingStudyRef, observationRefs = [], conclusion } = data;

  const resultReferences = observationRefs.map(obsRef => ({ reference: obsRef }));

  return {
    resourceType: 'DiagnosticReport',
    id: id,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'RAD',
            display: 'Radiology'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '18748-4',
          display: 'Diagnostic imaging report'
        }
      ]
    },
    subject: {
      reference: patientRef
    },
    encounter: {
      reference: encounterRef
    },
    issued: new Date().toISOString(),
    imagingStudy: [
      {
        reference: imagingStudyRef
      }
    ],
    result: resultReferences,
    conclusion: conclusion
  };
};