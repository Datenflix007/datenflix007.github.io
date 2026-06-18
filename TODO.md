# TODO AlltagsLabor Einreichstrecke

## Datenrepo vorbereiten

- [ ] Entscheiden, welches Repository der Worker triggert. Wahrscheinlich: `Datenflix007/alltagslabordata`.
- [ ] `.github/workflows/submit-experiment.yml` in dieses Datenrepo uebernehmen.
- [ ] `scripts/append-experiment.mjs` in dieses Datenrepo uebernehmen.
- [ ] Sicherstellen, dass im Datenrepo diese Dateien im Repo-Root liegen:
  - `_experiments_de.json`
  - `_experiments_eng.json`
  - `_experiments_fr.json`
  - `_experiments_ru.json`
  - `_experiments_uk.json`
- [ ] Pruefen, ob der Workflow mit `GITHUB_TOKEN` Pull Requests erstellen darf:
  - Repository Settings -> Actions -> General -> Workflow permissions
  - `Read and write permissions`
  - `Allow GitHub Actions to create and approve pull requests`

## GitHub Token

- [ ] GitHub Token fuer den Worker erstellen.
- [ ] Token-Berechtigungen so eng wie moeglich setzen:
  - Actions Workflow dispatch fuer das Datenrepo
  - Zugriff nur auf das benoetigte Repo
- [ ] Token nicht im Frontend speichern.

## Cloudflare Worker

- [ ] Worker-Projekt bei Cloudflare anlegen.
- [ ] Code aus `serverless/cloudflare-worker.js` deployen.
- [ ] Secrets/Variablen setzen:
  - `SUBMISSION_PASSWORD`
  - `GITHUB_TOKEN`
  - `GITHUB_OWNER`
  - `GITHUB_REPO`
  - `GITHUB_WORKFLOW_FILE`
- [ ] Empfohlene Werte pruefen:
  - `GITHUB_OWNER=Datenflix007`
  - `GITHUB_REPO=alltagslabordata`
  - `GITHUB_WORKFLOW_FILE=submit-experiment.yml`
  - `GITHUB_REF=main`
- [ ] `ALLOWED_ORIGIN` auf die echte GitHub-Pages-Origin setzen.
- [ ] Worker mit einer kleinen POST-Anfrage testen.

## Frontend konfigurieren

- [ ] In `src/modules/AlltagsLabor/einpflegen.html` den Platzhalter ersetzen:
  - `SUBMISSION_ENDPOINT = "https://example-worker.example.workers.dev"`
  - durch die echte Cloudflare-Worker-URL.
- [ ] `src/modules/AlltagsLabor/index.html` im Browser testen:
  - Sprachwechsel
  - Suche
  - Filter
  - Detailansicht
  - Drucken
  - PDF
- [ ] `src/modules/AlltagsLabor/einpflegen.html` im Browser testen:
  - Validierungsfehler
  - JSON-Vorschau
  - dynamische Schritte
  - erfolgreiche Einreichung

## Erster End-to-End-Test

- [ ] Testexperiment ueber `einpflegen.html` einreichen.
- [ ] Pruefen, ob der Worker `202 Accepted` zurueckgibt.
- [ ] Pruefen, ob der GitHub Workflow im Datenrepo gestartet wurde.
- [ ] Pruefen, ob ein Branch `submission/<datum>-<slug>` erstellt wurde.
- [ ] Pruefen, ob ein Pull Request gegen `main` erstellt wurde.
- [ ] PR-Inhalt pruefen:
  - richtige Sprache
  - richtiges Fach
  - richtige Klassenstufe
  - richtige Schulform
  - sinnvolle PR-Beschreibung
- [ ] PR mergen.
- [ ] Besucheransicht neu laden und pruefen, ob der Eintrag erscheint.

## Sicherheit und Qualitaet

- [ ] Entscheiden, ob das einfache Sanitizing reicht oder ein strengeres Sanitizing im Worker/Workflow ergaenzt wird.
- [ ] Gemeinsamen Zugangscode regelmaessig rotieren.
- [ ] Optional: Rate-Limiting im Worker ergaenzen.
- [ ] Optional: groessere Payloads begrenzen.
- [ ] Optional: Medienpfade serverseitig strenger validieren.
- [ ] Optional: Submitter-Erkennung klarer definieren.

## Aufraeumen

- [ ] `src/modules/AlltagsLabor/prompt.txt` entfernen, falls es nur Arbeitsnotiz war.
- [ ] Pruefen, ob `src/modules/AlltagsLabor/icon2.png` versioniert werden soll.
- [ ] Links in `README.md` nach finaler Repo-/Worker-Entscheidung nachziehen.
