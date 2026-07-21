# Diagnostik-Befunddokumentation

## Gruppe
- Myriam Makdis
- Malte
- Amna Al-Sorani
- Witalik

## GitHub Repository
https://github.com/MiriamMakdis/Diagnostik-Befunddokumentation

---

## Projekt starten

### Voraussetzungen
- Docker Desktop installiert

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
- Auth-Service: http://localhost:4000/api/auth/login
- Swagger: http://localhost:4000/docs

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
│       └── patient/
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
| Amna Al-Sorani | MongoDB Schemas, Stores, database.js |
| Myriam Makdis | FHIR-Client, Resource Builder, Hilfsservices |
| Malte | API-Router, Validierung, OpenAPI |
| Witalik | Auth-Service, Docker, Middleware, Workflow-Orchestrierung |
