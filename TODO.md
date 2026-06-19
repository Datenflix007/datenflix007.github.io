# TODO AlltagsLabor Einreichstrecke

## Datenrepo vorbereiten

- [x] Entscheiden, welches Repository der Worker triggert: `Datenflix007/alltagslabordata`.
- [ ] `.github/workflows/submit-experiment.yml` in dieses Datenrepo uebernehmen.
- [ ] `scripts/append-experiment.mjs` in dieses Datenrepo uebernehmen.
- [ ] Sicherstellen, dass im Datenrepo diese Dateien im Repo-Root liegen:
  - `_experiments_de.json`
  - `_experiments_eng.json`
  - `_experiments_es.json`
  - `_experiments_fa.json`
  - `_experiments_fr.json`
  - `_experiments_pol.json`
  - `_experiments_ru.json`
  - `_experiments_rum.json`
  - `_experiments_turk.json`
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
- [x] Token nicht im Frontend speichern.

## Cloudflare Worker

- [ ] Worker-Projekt bei Cloudflare anlegen.
- [x] Wrangler-Konfiguration lokal angelegt: `wrangler.toml`.
- [ ] Code aus `serverless/cloudflare-worker.js` deployen.
- [ ] Secrets/Variablen setzen:
  - `DEVTEAM_PASSWORD`
  - `ACADEMICTEST_PASSWORD`
  - `SCHOOLACCOUNT_PASSWORD`
  - `GITHUB_TOKEN`
  - `GITHUB_OWNER`
  - `GITHUB_REPO`
  - `GITHUB_WORKFLOW_FILE`
- [x] Empfohlene Werte lokal in `wrangler.toml` gesetzt:
  - `GITHUB_OWNER=Datenflix007`
  - `GITHUB_REPO=alltagslabordata`
  - `GITHUB_WORKFLOW_FILE=submit-experiment.yml`
  - `GITHUB_REF=main`
- [x] `ALLOWED_ORIGIN` lokal in `wrangler.toml` auf `https://datenflix007.github.io` gesetzt.
- [ ] Worker mit einer kleinen POST-Anfrage testen.

## Frontend konfigurieren

- [ ] In `src/modules/AlltagsLabor/einpflegen.html` den Platzhalter ersetzen:
  - `SUBMISSION_ENDPOINT = "https://example-worker.example.workers.dev"`
  - durch die echte Cloudflare-Worker-URL.
- [x] `src/modules/AlltagsLabor/einpflegen.html` fuer Accountrollen erweitert:
  - `devTeam`: erstellen, bearbeiten, loeschen
  - `academicTest`: erstellen, bearbeiten
  - `schoolAccount`: nur erstellen
- [x] Bestehende Experimente in der Einpflegemaske aus dem Datenrepo laden und zum Bearbeiten/Loeschen auswaehlen.
- [x] Sprachwechsel in `src/modules/AlltagsLabor/index.html` auf die statische UI anwenden:
  - Filterbereich
  - Statusmeldungen
  - Trefferzaehlung
  - Kartenaktionen
  - Detaildialog
  - Projekt-/Mitmachen-Texte
  - Datenstandszeile
- [x] Sprachlabels in der Auswahl fuer Deutsch, Englisch, Franzoesisch, Russisch und Ukrainisch korrekt setzen.
- [x] JavaScript-Syntax der Besucheransicht statisch mit Node geprueft.
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
  - erfolgreiche Einreichung mit `schoolAccount`
  - erfolgreiche Bearbeitung mit `academicTest`
  - erfolgreiche Loeschung mit `devTeam`

## Erster End-to-End-Test

- [ ] Testexperiment ueber `einpflegen.html` mit `schoolAccount` einreichen.
- [ ] Testexperiment mit `academicTest` bearbeiten.
- [ ] Testexperiment mit `devTeam` loeschen.
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

- [x] Worker prueft Accountrechte serverseitig, nicht nur in der UI.
- [ ] Entscheiden, ob das einfache Sanitizing reicht oder ein strengeres Sanitizing im Worker/Workflow ergaenzt wird.
- [ ] Passwoerter fuer `devTeam`, `academicTest` und `schoolAccount` regelmaessig rotieren.
- [ ] Optional: Rate-Limiting im Worker ergaenzen.
- [ ] Optional: groessere Payloads begrenzen.
- [ ] Optional: Medienpfade serverseitig strenger validieren.
- [ ] Optional: Submitter-Erkennung klarer definieren.

## Aufraeumen

- [ ] `src/modules/AlltagsLabor/prompt.txt` entfernen, falls es nur Arbeitsnotiz war.
- [x] Pruefen, ob `src/modules/AlltagsLabor/icon2.png` versioniert werden soll.
- [ ] Links in `README.md` nach finaler Repo-/Worker-Entscheidung nachziehen.

## Schlussbericht Prompt 2026-06-19

- [x] Datenrepo `Datenflix007/alltagslabordata` aktualisiert: Workflow und Script wurden nach `main` gepusht.
- [x] Lokale Cloudflare/Wrangler-Konfiguration angelegt.
- [x] In `wrangler.toml` gesetzt:
  - `name=alltagslabor-submission`
  - `main=serverless/cloudflare-worker.js`
  - `compatibility_date=2026-06-19`
  - `GITHUB_OWNER=Datenflix007`
  - `GITHUB_REPO=alltagslabordata`
  - `GITHUB_WORKFLOW_FILE=submit-experiment.yml`
  - `GITHUB_REF=main`
  - `ALLOWED_ORIGIN=https://datenflix007.github.io`
- [x] Beispiel fuer lokale Secret-Datei angelegt: `.dev.vars.example`.
- [ ] Cloudflare-Secrets konnten nicht gesetzt werden, weil lokal kein bestaetigter Wrangler/Cloudflare-Login vorhanden ist und keine Secret-Werte vorliegen.
- [x] Einreichstrecke auf Rollenbetrieb vorbereitet: `devTeam`, `academicTest`, `schoolAccount`.
- [x] Worker validiert Account/Passwort ueber Cloudflare-Secrets und erzwingt Rechte serverseitig.
- [x] Workflow und `scripts/append-experiment.mjs` koennen jetzt `create`, `edit` und `delete`.
- [x] Lokaler Test von `scripts/append-experiment.mjs`: create, edit und delete erfolgreich gegen temporaere JSON-Datei ausgefuehrt.
- [x] Besucheransicht `src/modules/AlltagsLabor/index.html` so erweitert, dass die Sprachwahl nicht nur die Experimentdaten, sondern auch die statische UI uebersetzt.
- [x] Uebersetzungsobjekt fuer `de`, `eng`, `fr`, `ru` und `uk` angelegt.
- [x] Sprachwahl und UI um Farsi/Persisch (`fa`), Polnisch (`pol`), Rumaenisch (`rum`) und Spanisch (`es`) erweitert.
- [x] Hinweis an der Sprachauswahl ergaenzt, dass die Experimente urspruenglich deutsch verfasst und per KI uebersetzt wurden, sodass Uebersetzungsfehler moeglich sind.
- [x] Dynamische Texte wie Laden/Fehler, Trefferanzahl, leere Suche, Kartenbuttons, Klassenstufe, Dialogtitel und Bild-Alt-Fallback an die aktuelle Sprache gekoppelt.
- [x] Sichtbare Kodierungsreste bei deutschen UI-Texten, Sprachlabels und Footer bereinigt.
- [x] JavaScript in `index.html` per Node-Syntaxcheck geprueft: alle eingebetteten Scripts lassen sich parsen.
- [x] JavaScript in `einpflegen.html`, Worker und Script statisch geprueft.
- [ ] Browser-Smoke-Test mit echten Daten steht noch aus, weil kein lokaler Browserlauf in diesem Prompt durchgefuehrt wurde.
- [ ] End-to-End-Test der Einreichstrecke bleibt offen, bis Worker-URL, Secrets und Datenrepo-Workflow produktiv konfiguriert sind.

## Manuell noch zu tun, kurz und klar

1. Cloudflare/Wrangler anmelden:
   - im Terminal: `npx wrangler login`
2. Worker deployen:
   - im Terminal: `npx wrangler deploy`
3. In Cloudflare beim Worker diese Secrets setzen:
   - `DEVTEAM_PASSWORD`: Passwort fuer `devTeam`
   - `ACADEMICTEST_PASSWORD`: Passwort fuer `academicTest`
   - `SCHOOLACCOUNT_PASSWORD`: Passwort fuer `schoolAccount`
   - `GITHUB_TOKEN`: GitHub Token fuer das Datenrepo
4. Die Worker-URL in `src/modules/AlltagsLabor/einpflegen.html` eintragen:
   - `SUBMISSION_ENDPOINT = "https://dein-worker.workers.dev"`
5. Danach im Browser testen:
   - mit `schoolAccount` ein neues Testexperiment einreichen
   - mit `academicTest` dieses Testexperiment bearbeiten
   - mit `devTeam` dieses Testexperiment loeschen
6. Jeden erzeugten Pull Request im Datenrepo pruefen und mergen.
