## Auth-Service

Der Auth-Service stellt einfache Login-Funktionen bereit und erzeugt JWTs für die verschiedenen Demo-Rollen wie Pflege, Arzt, Radiologie und Auditor.

Über die API können sich Demo-Benutzer anmelden, ihr Token prüfen und die vorhandenen Demo-Benutzer anzeigen lassen.

Die Swagger UI ist nach dem Start des Services unter folgender Adresse erreichbar:

http://localhost:4000/docs

Lokal kann der Service mit `yarn dev` gestartet werden. Über Docker wird der Service zusammen mit den anderen Containern über das Root-Projekt gestartet.