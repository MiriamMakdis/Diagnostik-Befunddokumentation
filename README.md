# Diagnostik-Befunddokumentation
# Planungsdokument – Slice A: Diagnostik & Befunddokumentation

## Gruppe
- Myriam Makdis
- Malte
- Amna Al-Sorani
- Witalik

## GitHub Repository
https://github.com/MiriamMakdis/Diagnostik-Befunddokumentation

---

## 1. Projektbeschreibung

Dieses Projekt implementiert **Slice A – Diagnostik & Befunddokumentation** im Rahmen der Gruppenarbeit für den Kurs B90G Medizinische Informationssysteme.

**Szenario:** Ein Patient kommt in die Notaufnahme mit einem Verdacht auf Armfraktur. Ein Röntgenbild wird angeordnet, durchgeführt und der Befund wird dokumentiert und dem Behandlungsfall (Encounter) zugeordnet.

**Rolle im System:** Radiologie-Modul / Schnittstelle zum PACS

---

## 2. Systemarchitektur

### Überblick
Client (Postman / Browser)
↓
Express.js REST API (Port 3000)
↓ ↓
HAPI FHIR R4 MongoDB
Testserver (lokal)

### Komponenten

| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| REST API | Node.js + Express | HTTP-Endpunkte für alle Vorgänge |
| FHIR-Client | fetch (Node.js built-in) | Kommunikation mit HAPI FHIR R4 Testserver |
| Datenbank | MongoDB + Mongoose | Lokale Persistenz der Patientendaten |
| FHIR-Server | https://hapi.fhir.org/baseR4 | Öffentlicher FHIR R4 Testserver |

---

## 3. Projektstruktur
Diagnostik-Befunddokumentation/
├── src/
│   ├── patient/
│   │   ├── patient.schema.js      # Mongoose Schema für Patienten
│   │   ├── patient.service.js     # FHIR-Aufrufe für Patient
│   │   └── patient.routes.js      # HTTP-Endpunkte für Patient
│   ├── audit/
│   │   ├── auditEvent.schema.js   # Mongoose Schema für AuditEvents
│   │   └── audit.service.js       # FHIR-Aufrufe für AuditEvent
│   └── db.js                      # MongoDB Verbindung
├── server.js                      # Express Server Einstiegspunkt
├── PLANNING.md                    # Dieses Dokument
└── package.json


---

## 4. FHIR-Ressourcen

Folgende FHIR R4 Ressourcen werden verwendet:

| Ressource | Endpunkt | Zweck |
|-----------|----------|-------|
| Patient | `GET /Patient?family=...` | Patient per Name/KVID suchen |
| Patient | `POST /Patient` | Neuen Patient anlegen |
| ServiceRequest | `POST /ServiceRequest` | Bildgebungsauftrag (Röntgen) erstellen |
| ImagingStudy | `POST /ImagingStudy` | Referenz auf Bilddaten anlegen |
| DiagnosticReport | `POST /DiagnosticReport` | Befund dokumentieren |
| Observation | `POST /Observation` | Strukturierte Befundwerte (SNOMED) |
| AuditEvent | `POST /AuditEvent` | Audit-Trail für jeden Vorgang |

---

## 5. Ablauf (Patient Journey)
1. Patient kommt in die Notaufnahme mit Gesundheitskarte (eGK)
↓
2. Patient wird per KVID/Name im FHIR-Server gesucht
↓ (nicht gefunden)
3. Patient wird neu angelegt (FHIR + MongoDB)
↓
4. DSGVO-Consent wird eingeholt
↓
5. Röntgenauftrag wird erstellt (ServiceRequest)
↓
6. Bildstudie wird angelegt (ImagingStudy - Stub)
↓
7. Befund wird dokumentiert (DiagnosticReport + Observation)
↓
8. AuditEvent wird für jeden Schritt erstellt
↓
9. Erfolgs, oder Fehlermeldung als HTTP Response

---

## 6. API-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | API Status |
| POST | `/patient/aufnahme` | Patient suchen oder neu anlegen |
| POST | `/radiologie/auftrag` | Röntgenauftrag (ServiceRequest) erstellen |
| POST | `/radiologie/studie` | Bildstudie (ImagingStudy) anlegen |
| POST | `/radiologie/befund` | Befund (DiagnosticReport + Observation) |
| GET | `/audit/:patientId` | AuditEvents eines Patienten abrufen |

---

## 7. Datenspeicherung

### Was wird lokal in MongoDB gespeichert?
- Patientenstammdaten (Name, Geburtsdatum, KVID, FHIR-ID)
- AuditEvent-Logs (Transaktionstyp, Zeitstempel, Status)

### Was wird nur auf dem FHIR-Server gespeichert?
- Diagnosen (Condition)
- Röntgenaufträge (ServiceRequest)
- Bildstudien (ImagingStudy)
- Befunde (DiagnosticReport, Observation)

### Begründung
Gemäß DSGVO-Datensparsamkeitsprinzip werden nur die Daten lokal gespeichert, die für den Betrieb des Systems notwendig sind. Medizinische Befunddaten verbleiben auf dem FHIR-Server.

---

## 8. Sicherheitsaspekte

- **Audit-Trail:** Jeder Vorgang hinterlässt einen AuditEvent auf dem FHIR-Server und in der lokalen MongoDB
- **DSGVO:** Nur notwendige Daten werden lokal gespeichert
- **Fehlerbehandlung:** Alle Endpunkte haben try/catch mit aussagekräftigen Fehlermeldungen

---

## 9. Technologieentscheidungen

| Entscheidung | Gewählt | Begründung |
|--------------|---------|------------|
| Laufzeitumgebung | Node.js | Bereits in der Übung verwendet, gute FHIR-Unterstützung |
| Web-Framework | Express.js | Einfach, weit verbreitet, gut dokumentiert |
| Datenbank | MongoDB | Flexibles Schema, gut für JSON-ähnliche FHIR-Daten |
| ODM | Mongoose | Validierung und Schema-Definition für MongoDB |
| FHIR-Server | HAPI FHIR R4 | Öffentlicher Testserver, vom Prof vorgegeben |
| HTTP-Client | fetch (built-in) | Kein extra Package nötig ab Node.js 18+ |

---

## 10. Aufgabenverteilung

| Person | Aufgabe |
|--------|---------|
| Amna Al-Sorani | Infrastruktur: Patient-Aufnahme, MongoDB-Setup, AuditEvents |
| Myriam Makdis | 
| Malte | 
| Witalik | 
