const BASE_URL = process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4';

async function searchPatient({ family, given, birthdate }) {
  const params = new URLSearchParams();
  if (family)    params.append('family', family);
  if (given)     params.append('given', given);
  if (birthdate) params.append('birthdate', birthdate);

  const res = await fetch(`${BASE_URL}/Patient?${params.toString()}`, {
    headers: { Accept: 'application/fhir+json' }
  });
  const bundle = await res.json();
  return bundle.entry?.map(e => e.resource) ?? [];
}

async function createPatientFHIR({ familyName, givenName, birthDate, kvid, gender }) {
  const body = {
    resourceType: 'Patient',
    identifier: kvid ? [{ system: 'http://fhir.de/sid/gkv/kvid-10', value: kvid }] : [],
    name: [{ family: familyName, given: [givenName] }],
    birthDate,
    gender: gender ?? 'unknown'
  };

  const res = await fetch(`${BASE_URL}/Patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

module.exports = { searchPatient, createPatientFHIR };