# DatastructureLab – Offene Aufgaben

## Feature: Op-Log (Schritt-für-Schritt-Erklärung unterhalb der Visualisierung)

### Infrastruktur
- [x] CSS `.log-header`, `.log-step`, `.log-hint`, `#opLog` Panel
- [x] HTML `<div id="opLog">` zwischen `</main>` und `<footer>`
- [x] JS `_startLog(header)`, `_log(msg)`, `_endLog()` Hilfsfunktionen

### RBTree
- [x] `insert` – Einfügeposition (linkes/rechtes Kind, neue Wurzel, bereits vorhanden)
- [x] `_fixIns` – Fälle: Roter Onkelfall / Schwarzer Onkel LL / Schwarzer Onkel RL (Knick)
- [x] `delete` – Löschtyp (kein Kind / ein Kind / zwei Kinder + Inorder-Nachfolger)
- [x] `_fixDel` – Fälle 1–4 (Geschwister rot / beide Kinder schwarz / nahes Kind rot / fernes Kind rot)

### MinHeap / MaxHeap
- [x] `insert` – Blatt einfügen + Heap-Up
- [x] `_up` – Tausch-Schritte nach oben
- [x] `_down` – Tausch-Schritte nach unten
- [x] `extractTop` – Wurzel entfernen, letztes Element hochschieben
- [x] `delete` – Löschen per Index + Heap-Up/Down

### BinomialHeap
- [x] `insert` – B0-Baum erstellen + Union-Schritte
- [x] `_union` – Verschmelzen gleicher Bäume (Bk + Bk → Bk+1)
- [x] `extractMin` – Minimum entfernen + Kinder als neue Wurzeln
- [x] `merge` – Wurzellisten zusammenführen

### FibHeap
- [x] `insert` – Lazy Insert in Wurzelliste
- [x] `extractMin` – Minimum entfernen, Kinder in Wurzelliste, Konsolidierung ankündigen
- [x] `_consolidate` – Grad-Merges beschriften
- [x] `decreaseKey` – Heap-Eigenschaft prüfen, Schnitt-Entscheidung
- [x] `_cascadingCut` – Markierung / weiterer Schnitt
- [x] `merge` – Lazy Zusammenführung der Wurzellisten

### Command-Funktionen (mit `_startLog` / `_endLog` wrappen)
- [x] `cmdInsert`
- [x] `cmdDelete`
- [x] `cmdExtract`
- [x] `cmdDecreaseKey`
- [x] `cmdMerge`

---

## Feature: Wurzellisten-Pfeile (BinomialHeap & FibHeap)
- [x] Pfeile zwischen Wurzelknoten in der Wurzelliste
- [x] Start-Pfeil auf den ersten Wurzelknoten

---

## Feature: Experimentelle Datensätze (in "Neue Struktur"-Dialog)
- [x] Light-Mode als Standard (darkMode: false)
- [x] 🗓 Historische Daten – Schlüssel = YYYYMMDD (zeigt Jahr im Knoten), Wert = JSON {title, date DD.MM.YYYY, desc Markdown}
- [x] 🔑 Git-Commits – Schlüssel = kleine Dezimalzahl, Wert = JSON {msg, diff} mit Code-Änderungen
- [x] _dataMode (default/hist/git), _nodeLabel, _fmtHistKey, _shortVal, _md2html
- [x] Tooltip parst JSON-Werte für hist/git und zeigt Titel + Vorschau
- [x] Value-Editor: hist → Titel + Markdown-Textarea mit Live-Preview; git → Message + Diff-Textarea
- [x] 📐 Primzahlen – Schlüssel = Primzahl, Wert = "Primzahl" (11 Einträge)

## Feature: Pseudocode-Fenster (ANZEIGE-Menü)
- [x] Schwebendes Panel – ziehbar, resizable, schließbar
- [x] Speed-Steuerung: 🐢 Langsam (820 ms) / ⚡ Schnell (220 ms) / 🖐 Manuell (Schritt-Button)
- [x] Pseudocode-Definitionen für RBTree (insert, delete)
- [x] Pseudocode-Definitionen für MinHeap/MaxHeap (insert, extractTop, delete)
- [x] Pseudocode-Definitionen für BinomialHeap (insert, extractMin, merge, delete)
- [x] Pseudocode-Definitionen für FibHeap (insert, extractMin, decreaseKey, merge, delete)
- [x] Zeilenhighlighting per Regex-Mapping aus Op-Log-Einträgen
- [x] _startLog erhält op-Parameter → _currentOp gesetzt
- [x] _endLog ruft startPseudoAnim() → Animation startet automatisch

## Weitere Ideen / Backlog
- [ ] Bidirektionale Pfeile für Fibonacci-Heap-Kindlisten (doppelt verkettet)
- [ ] "Wurzelliste"-Label oberhalb der Wurzelknoten-Reihe
- [ ] Animierte Übergänge bei Rotationen/Schnitten
