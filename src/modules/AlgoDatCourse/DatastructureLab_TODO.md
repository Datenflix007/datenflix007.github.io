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

## Weitere Ideen / Backlog
- [ ] Bidirektionale Pfeile für Fibonacci-Heap-Kindlisten (doppelt verkettet)
- [ ] "Wurzelliste"-Label oberhalb der Wurzelknoten-Reihe
- [ ] Animierte Übergänge bei Rotationen/Schnitten
