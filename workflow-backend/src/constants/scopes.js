const Scopes = Object.freeze({
    PATIENT_SEARCH: 'patient:search',
  
    INTAKE_CREATE: 'intake:create',
  
    WORKFLOW_READ: 'workflow:read',
    CONTEXT_READ: 'context:read',
  
    RADIOLOGY_ORDER_CREATE: 'radiology-order:create',
    IMAGING_STUDY_CREATE: 'imaging-study:create',
    DIAGNOSTIC_REPORT_CREATE: 'diagnostic-report:create',
  
    RADIOLOGY_WORKLIST_READ: 'radiology-worklist:read',
    EMERGENCY_WORKLIST_READ: 'emergency-worklist:read',
  
    REPORT_READ: 'report:read',
  
    AUDIT_READ: 'audit:read',
    FHIR_REFERENCES_READ: 'fhir-references:read'
  });
  
  const scopeLabels = Object.freeze({
    [Scopes.PATIENT_SEARCH]: 'Patient suchen',
  
    [Scopes.INTAKE_CREATE]: 'Aufnahme und Anamnese erstellen',
  
    [Scopes.WORKFLOW_READ]: 'Workflow lesen',
    [Scopes.CONTEXT_READ]: 'Workflow-Kontext lesen',
  
    [Scopes.RADIOLOGY_ORDER_CREATE]: 'Röntgenauftrag erstellen',
    [Scopes.IMAGING_STUDY_CREATE]: 'ImagingStudy registrieren',
    [Scopes.DIAGNOSTIC_REPORT_CREATE]: 'Radiologischen Befund erstellen',
  
    [Scopes.RADIOLOGY_WORKLIST_READ]: 'Radiologie-Worklist lesen',
    [Scopes.EMERGENCY_WORKLIST_READ]: 'Notaufnahme-Worklist lesen',
  
    [Scopes.REPORT_READ]: 'Befund lesen',
  
    [Scopes.AUDIT_READ]: 'Audit-Events lesen',
    [Scopes.FHIR_REFERENCES_READ]: 'FHIR-Referenzen lesen'
  });
  
  module.exports = {
    Scopes,
    scopeLabels,
  };