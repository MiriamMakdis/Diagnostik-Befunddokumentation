const buildConsentResource = ({ id, patientRef, status = 'active', dateTime }) => ({
  resourceType: 'Consent',
  ...(id ? { id } : {}),
  status,
  scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }] },
  category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }] }],
  patient: { reference: patientRef },
  dateTime: dateTime || new Date().toISOString(),
  policyRule: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentpolicycodes', code: 'cric', display: 'Common Rule Informed Consent' }] }
});

module.exports = { buildConsentResource };
