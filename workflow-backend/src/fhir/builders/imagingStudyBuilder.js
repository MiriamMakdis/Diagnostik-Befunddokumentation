/**
 * Baut eine FHIR R4 ImagingStudy-Ressource (Metadaten der Bildgebung).
 * @param {Object} data
 * @param {string} data.id - Temporäre UUID
 * @param {string} data.patientRef - Temporäre ID des Patienten
 * @param {string} data.encounterRef - Temporäre ID des Encounters
 * @param {string} data.studyInstanceUid - Die eindeutige DICOM Study Instance UID
 * @param {string} data.modalityCode - ('MR', 'CT', 'XR')
 * @param {string} [data.modalityDisplay] - Klartext
 * @returns {Object} FHIR ImagingStudy Resource
 */

export const buildImagingStudyResource = (data) => {
  const { id, patientRef, encounterRef, studyInstanceUid, modalityCode, modalityDisplay = 'Imaging Study' } = data;

  return {
    resourceType: 'ImagingStudy',
    id: id,
    status: 'available',
    subject: {
      reference: patientRef
    },
    encounter: {
      reference: encounterRef
    },
    started: new Date().toISOString(),
    identifier: [
      {
        use: 'official',
        system: 'urn:dicom:uid',
        value: studyInstanceUid
      }
    ],
    modality: [
      {
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: modalityCode,
        display: modalityDisplay
      }
    ],
    series: [
      {
        uid: `${studyInstanceUid}.1`,
        number: 1,
        modality: {
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: modalityCode
        },
        description: 'Standard Series (Metadata only)'
      }
    ]
  };
};