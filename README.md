# datenflix007.github.io

Zentrales Webportal von Datenflix007.

Live: <https://datenflix007.github.io/>

Das Portal enthält die Startseite, Projektübersicht, Navigation, gemeinsame
Gestaltungs- und Medienressourcen sowie die Infrastruktur für AlltagsLabor.
Die eigenständigen Anwendungen und Inhalte werden in den folgenden
GitHub-Pages-Repositories gepflegt.

## Tools

Live: <https://datenflix007.github.io/tools/>

Repository: <https://github.com/Datenflix007/tools>

Browserbasierte Tools und Lernanwendungen, darunter AlltagsLabor,
DatastructureLab und AutomataLab. Direkte Tool-Links werden im Portal auf die
tatsächlichen Unterseiten dieses Repositories geführt.

### AlltagsLabor und Cloudflare

AlltagsLabor selbst wird unter
<https://datenflix007.github.io/tools/AlltagsLabor/> ausgeliefert. Die
Einpflegemaske verwendet weiterhin den Worker
`https://alltagslabor-submission.datenflix.workers.dev`.

Dieser Worker bleibt absichtlich in diesem Portal-Repository:

- `wrangler.toml` beschreibt das Worker-Deployment;
- `serverless/cloudflare-worker.js` verarbeitet Einreichungen;
- `.github/workflows/submit-experiment.yml` und
  `scripts/append-experiment.mjs` unterstützen den Daten-Workflow.

Die Cloudflare-Konfiguration und die Nutzererfahrung von AlltagsLabor sind
somit von der Auslagerung der statischen Tool-Dateien nicht betroffen.

## Guides

Live: <https://datenflix007.github.io/guides/>

Repository: <https://github.com/Datenflix007/guides>

Technische Anleitungen, Tutorials und vertiefende Projektseiten.

## Digitale Arbeitsblätter

Live: <https://datenflix007.github.io/digital-worksheets/>

Repository: <https://github.com/Datenflix007/digital-worksheets>

Interaktive Materialien für Unterricht und Workshops, einschließlich der
Jenaer historischen Arbeitsblätter.

## Lokale Entwicklung

Die Portaldateien sind statisch und können beispielsweise mit einem lokalen
HTTP-Server gestartet werden:

```powershell
python -m http.server 8000
```

Danach ist das Portal unter <http://localhost:8000/> erreichbar. Für die
AlltagsLabor-Einreichstrecke stehen die Cloudflare-Befehle aus `package.json`
bereit; für eine echte Deployment- oder Secret-Änderung sind die jeweiligen
Cloudflare-Zugangsdaten erforderlich.

## Struktur

```text
index.html, src/       Portal-Startseite und Portal-Unterseiten
styles.css, fonts/, media/
                       gemeinsame Darstellung und Medien
serverless/, wrangler.toml
                       AlltagsLabor Cloudflare Worker
.github/workflows/     Pages- und Einreichungs-Workflows
```

Tools, Guides und Arbeitsblätter werden nicht mehr als vollständige Kopien in
diesem Repository gepflegt. Änderungen an ihnen gehören in ihr jeweiliges
Schwester-Repository.
