# UI-Audit: Datenflix007 Site-Shell

Stand: 05.10.2026

## Bestand

| Repository | HTML | CSS | JS | Einordnung |
| --- | ---: | ---: | ---: | --- |
| `datenflix007.github.io` | 4 | 1 | 2 | PORTAL / CONTENT |
| `guides` | 27 | 8 | 8 | LANDING / KATALOG, CONTENT, SONDERSEITEN |
| `tools` | 28 | 6 | 6 | LANDING / KATALOG, APP / TOOL |
| `digital-worksheets` | 3 | 2 | 2 | LANDING / KATALOG, DIGITALES ARBEITSBLATT |

## Seitentypen

- **PORTAL / CONTENT:** Hauptseite sowie `src/Referenzen.html`, `src/projekte.html` und `src/kontakt.html`.
- **LANDING / KATALOG:** die drei ausgelagerten Startseiten `tools/index.html`, `guides/index.html` und `digital-worksheets/index.html`.
- **APP / TOOL:** eigenständige Tools wie AutomataLab, AlgorithmPlanner, AlgoDat, PaperMaker, SchoolNotebook, QR-Generator, TI-Trainer und weitere. Diese behalten ihre App-Toolbars und erhalten nur die äußere Site-Shell.
- **DIGITALES ARBEITSBLATT:** Jena Historical Jobs und Jena Historical Map. Die Lern- und Interaktionsoberflächen bleiben unverändert; der globale Header wird davor ergänzt.
- **SONDERSEITE:** Zeitstrahlen, Emulatoren, GitHubCourse, Poster-Viewer und ähnliche Seiten mit eigenem Layout.

## Festgestellte Abweichungen

- Die drei Landingpages hatten jeweils eigene Inline-Designsysteme für Header, Navigation, Farben und Karten.
- Das Hauptportal nutzt bereits die gewünschte dunkle Grundpalette, während Guides, Tools und Arbeitsblätter abweichende großflächige Akzentverläufe nutzen.
- In `guides` und `tools` gibt es zahlreiche eigene oder ältere Header. Viele davon gehören zu funktionsreichen Anwendungen und dürfen nicht entfernt werden.
- Die drei `src/`-Unterseiten im Hauptportal verwendeten einen verkürzten Header.
- In den vier Repositories wurden 657 Inline-Style-Attribute und 28 eingebettete Style-Blöcke gefunden. Der überwiegende Teil liegt in Apps und Vorschaukarten und bleibt bewusst lokal.
- Landing-Kataloge und die frühere Projektübersicht enthalten wiederkehrende Card-/Tag-Varianten.
- Die globale Navigation muss absolute Ziele verwenden, da die Pages als getrennte Repositories unter einem Host veröffentlicht werden.
- Der Wissensgraph liest bisher hauptsächlich das Hauptrepository und einzelne manuelle Knoten. Inhalte aus ausgelagerten Repositories werden nicht vollständig als eigene Datenquelle erfasst.
- Der aktuelle Graph-Reset verwendet eine feste Skalierung und berücksichtigt weder Viewport noch Menge und Ausdehnung der Knoten.

## Umsetzungsentscheidung

Eine gemeinsame, namespacete Site-Shell im Hauptrepository liefert Header, responsive Navigation, visuelle Grundtokens und die vorbereitete Sprachwahl. Sie wird von allen vier Repositories absolut geladen. Bestehende App-CSS bleibt lokal; die Shell verwendet ausschließlich `.site-*`-Klassen, damit sie keine App-Selektoren wie `.header`, `.nav` oder `.btn` überschreibt.

## Bewusste Ausnahmen

- App-spezifische Kopfzeilen, Toolbars, Canvas-Flächen, Editoren und Lerninteraktionen werden nicht ersetzt.
- Alte Duplikatseiten im Guides-Repository werden zunächst als Redirects erhalten, solange sie potenziell verlinkt sein können.
- Inline-CSS in konkreten Tool-/Guide-Karten bleibt erhalten, wenn es eine visuelle Vorschau oder App-Funktion darstellt.
