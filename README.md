# Diagnostik-Befunddokumentation

## Gruppe
- Myriam Makdis Antoun
- Malte Maier
- Amna Al-Sorani
- Witali Klein

## GitHub Repository
https://github.com/MiriamMakdis/Diagnostik-Befunddokumentation

---

## Projekt starten

### Voraussetzungen
- Docker Desktop installiert

### 1. Public & Private Keys erzeugen
```bash
yarn keys:generate
```
oder 
```bash
node scripts/generateJwtKeys.js
```

### 2. Start
```bash
docker compose up --build
```

Das startet automatisch:
- **MongoDB** auf Port 27017
- **Auth-Service** auf Port 4000
- **Workflow-Backend** auf Port 3000

### Testen
- Backend: http://localhost:3000
- Backend Swagger: http://localhost:3000/docs

- Auth-Service: http://localhost:4000/api/auth/login
- Auth-Service Swagger: http://localhost:4000/docs

---

## Projektstruktur
```
Diagnostik-Befunddokumentation/
├── auth/                          # Auth-Service (JWT, Rollen)
│   └── src/
│       ├── api/authApi.js
│       ├── services/authService.js
│       └── users/demoUsers.js
├── workflow-backend/              # Haupt-Backend
│   └── src/
│       ├── config/database.js
│       ├── constants/
│       ├── middlewares/
│       ├── models/
│       ├── stores/
│       ├── services/
│       └── routes/
├── docker-compose.yml
├── Planungsdokument.md
└── README.md
```

----

## Demo-Benutzer

| Benutzername | Passwort | Rolle |
|-------------|----------|-------|
| `pflege` | `demo` | Pflege (ER_NURSE) |
| `arzt` | `demo` | Arzt (ER_DOCTOR) |
| `radiologie` | `demo` | Radiologie-Tech (RAD_TECH) |
| `radiologe` | `demo` | Radiologe (RADIOLOGIST) |

---

## Aufgabenverteilung

| Person | Aufgabe |
|--------|---------|
| Amna | MongoDB Schemas, Stores, database.js |
| Myriam | FHIR-Client, Resource Builder, Hilfsservices |
| Malte | API-Router, Validierung, OpenAPI |
| Witalik | Auth-Service, Docker, Middleware, Workflow-Orchestrierung |

---

## Demo-Ablauf

### 1. Projekt starten

Falls die JWT-Keys noch fehlen:

```bash
node scripts/generateJwtKeys.js
```

Danach alle Container starten:

```bash
docker compose up --build
```

Wichtige URLs:

```text
Auth-Service:      http://localhost:4000
Workflow-Backend:  http://localhost:3000
Swagger:           http://localhost:3000/docs
HAPI FHIR:         https://hapi.fhir.org/baseR4
```

Health Checks:

```http
GET http://localhost:4000/health
GET http://localhost:3000/health
```

### 2. Auth und Bearer Token

Login erfolgt über den Auth-Service:

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json
```

Beispiel:

```json
{
  "username": "pflege",
  "password": "demo"
}
```

Die Response enthält einen `accessToken`. Dieser Token wird danach im Workflow-Backend verwendet:

```http
Authorization: Bearer <accessToken>
```

Bei jedem Rollenwechsel muss ein neuer Login durchgeführt und der neue Token verwendet werden.

Demo-Benutzer:

```text
pflege      / demo   -> ER_NURSE      -> Aufnahme
arzt        / demo   -> ER_DOCTOR     -> Röntgenauftrag, Befund lesen
radiologie  / demo   -> RAD_TECH      -> ImagingStudy registrieren
radiologe   / demo   -> RADIOLOGIST   -> Befund erstellen
auditor     / demo   -> AUDITOR       -> Events und FHIR-Referenzen prüfen
```

---

## 3. Kompletter Workflow

### Schritt 1: Login als Pflegekraft

```json
{
  "username": "pflege",
  "password": "demo"
}
```

Token als `<pflege-token>` verwenden.

### Schritt 2: Optional Patient suchen

```http
POST http://localhost:3000/api/v1/patients/search
Authorization: Bearer <pflege-token>
Content-Type: application/json
```

```json
{
  "kvnr": "X110411319"
}
```

Dieser Endpunkt sucht nur im FHIR-Server. Er erstellt keinen Patienten und startet keinen Workflow.

### Schritt 3: Workflow starten

```http
POST http://localhost:3000/api/v1/diagnostic-workflows
Authorization: Bearer <pflege-token>
Content-Type: application/json
```

```json
{
  "patient": {
    "kvnr": "X110411319",
    "firstName": "Maria",
    "lastName": "Musterfrau",
    "birthDate": "1985-04-12",
    "gender": "female"
  },
  "consent": {
    "accepted": true
  },
  "conditions": [
    {
      "icdCode": "E11.9",
      "icdDisplay": "Diabetes mellitus Typ 2 ohne Komplikationen"
    }
  ],
  "medications": [
    {
      "medicationText": "Metformin 500 mg",
      "dosageText": "1-0-1",
      "status": "active"
    }
  ]
}
```

Erwartet:

```json
{
  "status": "INTAKE_COMPLETED",
  "processId": "<processId>",
  "nextStep": {
    "action": "CREATE_RADIOLOGY_ORDER"
  }
}
```

Die `processId` für alle weiteren Schritte merken.

### Schritt 4: Login als Arzt

```json
{
  "username": "arzt",
  "password": "demo"
}
```

Token als `<arzt-token>` verwenden.

### Schritt 5: Röntgenauftrag erstellen

```http
POST http://localhost:3000/api/v1/diagnostic-workflows/<processId>/radiology-orders
Authorization: Bearer <arzt-token>
Content-Type: application/json
```

```json
{
  "procedureCode": "36643-5",
  "procedureDisplay": "X-ray wrist",
  "bodySiteCode": "368209003",
  "bodySiteDisplay": "Right wrist",
  "reason": "Sturz auf die rechte Hand, Verdacht auf Fraktur"
}
```

Erwartet:

```json
{
  "status": "RADIOLOGY_ORDER_CREATED",
  "serviceRequestRef": "ServiceRequest/...",
  "nextStep": {
    "action": "REGISTER_IMAGING_STUDY"
  }
}
```

### Schritt 6: Login als Radiologie-Technik

```json
{
  "username": "radiologie",
  "password": "demo"
}
```

Token als `<radiologie-token>` verwenden.

### Schritt 7: Radiologie-Worklist prüfen

```http
GET http://localhost:3000/api/v1/radiology/worklist
Authorization: Bearer <radiologie-token>
```

Der Prozess sollte mit Status `RADIOLOGY_ORDER_CREATED` sichtbar sein.

### Schritt 8: ImagingStudy registrieren

```http
POST http://localhost:3000/api/v1/diagnostic-workflows/<processId>/imaging-studies
Authorization: Bearer <radiologie-token>
Content-Type: application/json
```

```json
{
  "studyInstanceUid": "2.25.123456789012345678901234567890",
  "modalityCode": "DX",
  "modalityDisplay": "Digital Radiography",
  "description": "Röntgen rechtes Handgelenk, Stub ohne echte DICOM-Daten"
}
```

Erwartet:

```json
{
  "status": "IMAGING_STUDY_REGISTERED",
  "imagingStudyRef": "ImagingStudy/...",
  "nextStep": {
    "action": "CREATE_DIAGNOSTIC_REPORT"
  }
}
```

### Schritt 9: Login als Radiologe

```json
{
  "username": "radiologe",
  "password": "demo"
}
```

Token als `<radiologe-token>` verwenden.

### Schritt 10: Befund erstellen

```http
POST http://localhost:3000/api/v1/diagnostic-workflows/<processId>/diagnostic-reports
Authorization: Bearer <radiologe-token>
Content-Type: application/json
```

```json
{
  "conclusion": "Kein sicherer Frakturnachweis. Weichteilschwellung radial.",
  "findings": [
    {
      "code": "59776-5",
      "display": "Procedure findings",
      "valueString": "Keine dislozierte Fraktur sichtbar.",
      "interpretationCode": "N",
      "interpretationDisplay": "Normal"
    }
  ]
}
```

Erwartet:

```json
{
  "status": "SUCCESS",
  "diagnosticReportRef": "DiagnosticReport/...",
  "nextStep": {
    "action": "NONE"
  }
}
```

Der Workflow ist damit abgeschlossen.

---

## 4. Befund und Audit prüfen

Befund als Arzt lesen:

```http
GET http://localhost:3000/api/v1/diagnostic-workflows/<processId>/report-summary
Authorization: Bearer <arzt-token>
```

Notaufnahme-Worklist prüfen:

```http
GET http://localhost:3000/api/v1/emergency/worklist
Authorization: Bearer <arzt-token>
```

Events als Auditor prüfen:

```http
GET http://localhost:3000/api/v1/diagnostic-workflows/<processId>/events
Authorization: Bearer <auditor-token>
```

FHIR-Referenzen als Auditor prüfen:

```http
GET http://localhost:3000/api/v1/diagnostic-workflows/<processId>/fhir-references
Authorization: Bearer <auditor-token>
```

---

## 5. Typische Fehlerfälle

Ohne Token:

```json
{
  "status": "ERROR",
  "errorCode": "UNAUTHORIZED"
}
```

Falsche Rolle oder fehlender Scope:

```json
{
  "status": "ERROR",
  "errorCode": "FORBIDDEN"
}
```

Falscher Workflow-Status:

```json
{
  "status": "ERROR",
  "errorCode": "INVALID_WORKFLOW_STATE"
}
```

Einwilligung abgelehnt:

```json
{
  "status": "ERROR",
  "errorCode": "CONSENT_REJECTED"
}
```
