# Responsive-Audit

Stand: 5. Oktober 2026

## Prüfumfang

Die gemeinsame Site-Shell ist auf allen Portalseiten sowie auf den verfügbaren
Unterseiten der Repositories `tools`, `guides` und `digital-worksheets`
eingebunden. Das umfasst die zentralen Inhaltsseiten, die drei Katalog-Landing-
Pages und die eigenständigen Browser-Labs.

## Bestehende Bausteine

| Bereich | Vorhandene Reaktion | Ergänzung |
| --- | --- | --- |
| Zentralportal | Inhaltsgrids und Startseiten-Graph besitzen 1024/680px-Regeln | Gemeinsame Medien-, Tabellen- und Umbruch-Sicherung |
| Katalog-Landing-Pages | Katalog 3 → 2 → 1 Spalte | Gemeinsame kleine-Viewport-Sicherung |
| Gemeinsamer Header | Desktop-Navigation und Drawer unter 900px | Touch-Ziele, kompakte Gutter und sprachwahlfähiger Drawer bleiben erhalten |
| Fachseiten / Guides | Mehrere eigene 1024/720px- oder 1060/620px-Regeln | Code, Tabellen und lange Links brechen nicht mehr die Seite auf |
| Interaktive Labs | Eigene Canvas-, Panel- und Breakpoint-Layouts | Keine globale Canvas-Skalierung; gezielte App-Anpassungen nur dort, wo die Shell Einfluss auf die verfügbare Höhe hat |

## Einheitliche Breakpoints

- **Desktop:** ab 992px – bestehende mehrspaltige Arbeitsflächen bleiben erhalten.
- **Tablet:** bis 991px – allgemeine Dreierspalten werden zweispaltig; bekannte
  Sidebars können unter den Inhalt wechseln.
- **Smartphone:** bis 767px – Kartenraster werden einspaltig, Tabellen und
  Codebereiche scrollen innerhalb ihres Containers, nicht über die ganze Seite.
- **Kleine Smartphones:** bis 479px – reduzierte Seitenränder und sicherer
  Titelumbruch.
- **Header:** bis 900px – vorhandener Drawer samt Sprachwahl statt kollidierender
  Desktop-Navigation.

## Bewusste Grenzen

Canvas- und SVG-Arbeitsflächen der Labs werden nicht pauschal mit
`max-width: 100%` überschrieben. Diese Anwendungen besitzen eigene
Interaktions- und Zoomlogik; eine globale Skalierung würde Dragging, Koordinaten
oder Lesbarkeit beschädigen. Stattdessen erhalten text- und dokumentorientierte
Flächen sichere Medien-, Tabellen-, Formular- und Code-Regeln.

## Manuell zu prüfen

Die statischen Prüfungen decken den Einbau der Shared-CSS, die Breakpoints und
die Quellen ab. Eine visuelle Browserprüfung der sechs Ziel-Viewports bleibt
nach jedem Deployment sinnvoll, besonders für Inhalte, die erst zur Laufzeit
von externen Daten erzeugt werden.
