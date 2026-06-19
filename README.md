# AlltagsLabor

Statische Besucheransicht und Einreichstrecke fuer AlltagsLabor-Experimente.

## Besucheransicht

`src/modules/AlltagsLabor/index.html` laedt Experimente ohne Buildsystem direkt aus dem GitHub-Datenrepo:

`https://raw.githubusercontent.com/Datenflix007/alltagslabordata/main/`

Die Sprachdateien bleiben kompatibel zum bestehenden Format:

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

Die Seite bietet Suche, Filter, Detailansicht, Drucken und PDF-Export. Medienpfade in Experimenten werden relativ zur Raw-Basis des Datenrepos aufgeloest.

## Experimente einreichen

`src/modules/AlltagsLabor/einpflegen.html` erzeugt ein Experimentobjekt im bestehenden Format und kann je nach Account neue Experimente einreichen, bestehende Experimente bearbeiten oder Loeschungen beantragen:

- `devTeam`: erstellen, bearbeiten, loeschen
- `academicTest`: erstellen, bearbeiten
- `schoolAccount`: nur erstellen

Die Rechte werden im Cloudflare Worker geprueft. Die Buttons in der Maske sind nur Komfort und ersetzen keine serverseitige Pruefung.

Das Experimentobjekt enthaelt:

- `title`
- `shortDescription`
- `subject`
- `gradeLevel`
- `schoolType`
- `steps`

Schritte koennen `text`, `aufgabe`, `merksatz`, `image` oder `audio` sein. Die Maske validiert clientseitig und entfernt einfache gefaehrliche HTML-Anteile wie `<script>`, `<iframe>`, Eventhandler-Attribute und `javascript:`-URLs.

Die Anfrage wird per `fetch` an `SUBMISSION_ENDPOINT` gesendet. In `einpflegen.html` muss dafuer die veroeffentlichte Worker-URL eingetragen werden:

```js
const SUBMISSION_ENDPOINT = "https://example-worker.example.workers.dev";
```

Clientseitige Validierung ist nur Komfort. Die echte Sicherheitspruefung passiert serverseitig.

## Warum ein Serverless-Backend noetig ist

Ein Browser darf kein GitHub-Token enthalten. Deshalb schreibt die Einpflegemaske nicht direkt in das Repo. Stattdessen:

1. Die Maske sendet Aktion, Experiment, Sprache, Account und Passwort an einen Cloudflare Worker.
2. Der Worker prueft den Account gegen Secrets und prueft die Rechte.
3. Der Worker startet per GitHub API einen `workflow_dispatch`.
4. Der Workflow validiert den Eintrag, erstellt/bearbeitet/loescht in der passenden JSON-Datei und erstellt einen Pull Request.
5. Erst nach Review und Merge wird der Eintrag produktiv.

Externe Nutzer koennen dadurch keine direkten Commits nach `main` erzeugen.

## Secrets und Variablen

Im Cloudflare Worker muessen gesetzt werden:

- `DEVTEAM_PASSWORD`: Passwort fuer den Account `devTeam`
- `ACADEMICTEST_PASSWORD`: Passwort fuer den Account `academicTest`
- `SCHOOLACCOUNT_PASSWORD`: Passwort fuer den Account `schoolAccount`
- `GITHUB_TOKEN`: GitHub Token mit Berechtigung, den Workflow im Datenrepo zu starten
- `GITHUB_OWNER`: z. B. `Datenflix007`
- `GITHUB_REPO`: z. B. `alltagslabordata`
- `GITHUB_WORKFLOW_FILE`: z. B. `submit-experiment.yml`

Optional:

- `GITHUB_REF`: Branch oder Ref, standardmaessig `main`
- `ALLOWED_ORIGIN`: konkrete GitHub-Pages-Origin statt `*`

Fuer die aktuelle Maske werden die drei Account-Secrets genutzt. Ein einzelner gemeinsamer Zugangscode ist nicht mehr vorgesehen.

## Cloudflare Worker veroeffentlichen

Die Beispielimplementierung liegt in `serverless/cloudflare-worker.js`.

Typischer Ablauf:

1. Worker-Projekt bei Cloudflare anlegen.
2. Code aus `serverless/cloudflare-worker.js` deployen.
3. Secrets/Variablen setzen.
4. Die Worker-URL in `SUBMISSION_ENDPOINT` in `src/modules/AlltagsLabor/einpflegen.html` eintragen.
5. Einen Testeintrag ueber die Maske senden.

## GitHub Workflow

Der Workflow liegt in `.github/workflows/submit-experiment.yml` und erwartet:

- `language`
- `action`
- `experiment_json`
- `target_experiment_id`
- `target_experiment_title`
- `submitter`

Wichtig: Workflow und `scripts/append-experiment.mjs` muessen in dem Repository liegen, in dem auch die Sprachdateien liegen. Wenn `GITHUB_REPO=alltagslabordata` ist, muessen diese Dateien ins Datenrepo uebernommen werden.

Der Workflow:

1. prueft Aktion und Sprache,
2. validiert das Experiment mit Node.js,
3. bestimmt die passende Sprachdatei,
4. haengt ein neues Experiment an, ersetzt ein bestehendes Experiment oder entfernt ein bestehendes Experiment,
5. erstellt einen Branch `submission/<aktion>/<datum>-<slug>`,
6. oeffnet einen Pull Request gegen `main`.

## Serverseitige Validierung

`scripts/append-experiment.mjs` validiert:

- Pflichtfelder sind nicht leere Strings,
- `steps` ist ein Array mit mindestens einem Eintrag,
- jeder Schritt hat `type` und `content`,
- nur bekannte Schritt-Typen sind erlaubt.

Unbekannte Zusatzfelder werden nicht automatisch geloescht, damit das bestehende Datenformat erweiterbar bleibt.

## Sicherheitshinweis

Die eingebaute HTML-Bereinigung blockiert offensichtliche gefaehrliche Tags und Attribute. Bei breiter oeffentlicher Nutzung sollte zusaetzlich ein etabliertes Sanitizing im Worker oder Workflow eingesetzt werden, bevor HTML dauerhaft ins Datenrepo geschrieben wird.
