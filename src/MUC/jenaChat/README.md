# jenaChatMap
![alt text](image.png)

Interaktive Unterrichtskarte fuer Jena mit klickbaren POIs (Pins) und Markdown-Inhalten.

## Aktuelle POIs

1. **Gerbergasse: Leder und Geruch**
   Thema: Arbeitsweise der Gerber im Mittelalter / in der Fruehen Neuzeit und Umweltfolgen (Wasser, Abfall, Geruch, Tier- und Pflanzennutzung).
2. **Bauern rund um Jena**
   Thema: Landwirtschaftliche Arbeit und ihre Wirkung auf Landschaft, Boden, Tiere und Gewaesser.

## POIs bearbeiten

- Datei: `data/pois.json`
- Koordinaten: `x` / `y` in Prozent (0-100)
- Inhalte: `markdown` verweist auf Dateien in `md/`

Beispiel:

```json
{
  "id": "poi-1",
  "title": "Gerbergasse: Leder und Geruch",
  "x": 57.1,
  "y": 42.0,
  "label": "Gerbergasse",
  "markdown": "md/poi-1.md",
  "badge": "Handwerk"
}
```

## Server lokal starten

```bash
python server.py
```

Danach im Browser oeffnen: `http://localhost:8000`

## Bildquellen

- Wikimedia Commons (historische Darstellungen und Fotografie)
- Die Bilder sind direkt in den Markdown-Dateien verlinkt.
