const ErrorCodes = require('./errorCodes');

const errorMessages = Object.freeze({
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Interner Serverfehler.',
  [ErrorCodes.ROUTE_NOT_FOUND]: 'Die angefragte Route existiert nicht.',

  [ErrorCodes.UNAUTHORIZED]: 'Bearer Token fehlt.',
  [ErrorCodes.INVALID_TOKEN]: 'Token ist ungültig oder abgelaufen.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Token ist abgelaufen.',
  [ErrorCodes.FORBIDDEN]: 'Für diese Aktion fehlen die erforderlichen Berechtigungen.',
  [ErrorCodes.MISSING_SCOPE]: 'Ein erforderlicher Scope fehlt.',

  [ErrorCodes.VALIDATION_ERROR]: 'Der Request enthält ungültige oder unvollständige Daten.',

  [ErrorCodes.PROCESS_NOT_FOUND]: 'Der Workflow-Prozess wurde nicht gefunden.',
  [ErrorCodes.PROCESS_ID_MISSING]: 'processId fehlt.',
  [ErrorCodes.INVALID_WORKFLOW_STATE]: 'Diese Aktion ist im aktuellen Workflow-Status nicht erlaubt.',
  [ErrorCodes.UNKNOWN_WORKFLOW_ACTION]: 'Die angegebene Workflow-Aktion ist unbekannt.',
  [ErrorCodes.WORKFLOW_ALREADY_COMPLETED]: 'Der Workflow wurde bereits abgeschlossen.',
  [ErrorCodes.WORKFLOW_IN_ERROR_STATE]: 'Der Workflow befindet sich im Fehlerstatus und kann nicht normal fortgesetzt werden.',

  [ErrorCodes.CONSENT_REJECTED]: 'Die Einwilligung wurde abgelehnt. Der Workflow wird nicht fortgesetzt.',
  [ErrorCodes.CONSENT_MISSING]: 'Die Einwilligungsinformation fehlt.',

  [ErrorCodes.FHIR_SERVER_UNAVAILABLE]: 'Der FHIR-Server ist aktuell nicht erreichbar.',
  [ErrorCodes.FHIR_REQUEST_FAILED]: 'Der FHIR-Request ist fehlgeschlagen.',
  [ErrorCodes.FHIR_TRANSACTION_FAILED]: 'Die FHIR-Transaktion ist fehlgeschlagen.',
  [ErrorCodes.FHIR_RESOURCE_NOT_FOUND]: 'Die angeforderte FHIR-Ressource wurde nicht gefunden.',
  [ErrorCodes.FHIR_REFERENCE_MISSING]: 'Eine benötigte FHIR-Referenz fehlt im Prozess.',
  [ErrorCodes.FHIR_RESPONSE_INVALID]: 'Die Antwort des FHIR-Servers hat nicht die erwartete Struktur.',

  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 'Die Verbindung zur Datenbank ist fehlgeschlagen.',
  [ErrorCodes.DATABASE_OPERATION_FAILED]: 'Die Datenbankoperation ist fehlgeschlagen.'
});

const getMessageForErrorCode = (errorCode) => {
  return errorMessages[errorCode] || errorMessages[ErrorCodes.INTERNAL_SERVER_ERROR];
};

module.exports = {
  errorMessages,
  getMessageForErrorCode
};