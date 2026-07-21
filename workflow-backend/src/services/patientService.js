const fhirClient = require('../fhir/fhirClient');
const { buildPatientResource } = require('../fhir/builders/patientBuilder');

const KVNR_IDENTIFIER_SYSTEM = process.env.KVNR_IDENTIFIER_SYSTEM || 'http://fhir.de/sid/gkv/kvid-10';

const bundleToResources = (bundle) => bundle?.entry?.map((entry) => entry.resource).filter(Boolean) || [];

const searchPatient = async ({ family, given, birthdate, identifier }) => {
  const searchParams = {};
  if (family) searchParams.family = family;
  if (given) searchParams.given = given;
  if (birthdate) searchParams.birthdate = birthdate;
  if (identifier) searchParams.identifier = identifier;

  const bundle = await fhirClient.searchFhirResources('Patient', searchParams);
  return bundleToResources(bundle);
};

const searchPatientByKvnr = async ({ kvnr }) => {
  const withSystem = await searchPatient({ identifier: `${KVNR_IDENTIFIER_SYSTEM}|${kvnr}` });
  if (withSystem.length > 0) return withSystem;
  return searchPatient({ identifier: kvnr });
};

const createPatientFHIR = async ({ familyName, givenName, lastName, firstName, birthDate, kvid, kvnr, gender }) => {
  const body = buildPatientResource({
    familyName,
    givenName,
    lastName,
    firstName,
    birthDate,
    kvid,
    kvnr,
    gender
  });

  return fhirClient.createFhirResource('Patient', body);
};

module.exports = {
  searchPatient,
  searchPatientByKvnr,
  createPatientFHIR
};
