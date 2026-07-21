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

### Public & Private Keys erzeugen
```bash
yarn keys:generate
```
oder 
```bash
node scripts/generateJwtKeys.js
```

### Start
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
| `mfa` | `demo` | Pflege (ER_NURSE) |
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
