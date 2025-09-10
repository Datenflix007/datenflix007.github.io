import json, shutil, sys, tempfile, pathlib
from PySide6 import QtCore, QtWidgets, QtGui, QtWebEngineWidgets, QtWebChannel

# ---------- Pfade & Konstanten ----------
REPO_ROOT   = pathlib.Path(__file__).resolve().parents[1]   # eine Ebene über "Editor/"
EDITOR_DIR  = pathlib.Path(__file__).resolve().parent
SRC         = REPO_ROOT / "src"
ASSETS      = SRC / "assets"
DATA        = ASSETS / "data"
IMAGES      = ASSETS / "images"

DATA.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)

CONFIG_PATH = DATA / "config.json"
POIS_PATH   = DATA / "pois.json"
POLY_PATH   = DATA / "polygons.geojson"

# Naumburg (Saale) – Innenstadt
DEFAULT_CONFIG = {
    "start": {"lat": 51.1530, "lon": 11.8088, "zoom": 14},
    "startEraIndex": 0,
    "eras": [
        "Frühmittelalter", "Hochmittelalter", "Spätmittelalter",
        "Frühe Neuzeit", "Moderne", "Postmoderne"
    ]
}

# ---------- IO-Helpers ----------
def load_json(path: pathlib.Path, fallback):
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

def save_json(path: pathlib.Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

# Basis-Dateien anlegen
if not CONFIG_PATH.exists():
    save_json(CONFIG_PATH, DEFAULT_CONFIG)
if not POIS_PATH.exists():
    save_json(POIS_PATH, {"type": "FeatureCollection", "features": []})
if not POLY_PATH.exists():
    save_json(POLY_PATH, {"type": "FeatureCollection", "features": []})

# ---------- Bridge (Qt <-> JS) ----------
class Bridge(QtCore.QObject):
    @QtCore.Slot(result=str)
    def getInitialData(self) -> str:
        cfg   = load_json(CONFIG_PATH, DEFAULT_CONFIG)
        pois  = load_json(POIS_PATH,   {"type":"FeatureCollection","features":[]})
        polys = load_json(POLY_PATH,   {"type":"FeatureCollection","features":[]})
        return json.dumps({"config": cfg, "pois": pois, "polygons": polys}, ensure_ascii=False)

    @QtCore.Slot(str, result=str)
    def savePois(self, geojson_str: str) -> str:
        try:
            save_json(POIS_PATH, json.loads(geojson_str))
            return "POIs gespeichert."
        except Exception as e:
            return f"Fehler beim Speichern der POIs: {e}"

    @QtCore.Slot(str, result=str)
    def savePolygons(self, geojson_str: str) -> str:
        try:
            save_json(POLY_PATH, json.loads(geojson_str))
            return "Polygone gespeichert."
        except Exception as e:
            return f"Fehler beim Speichern der Polygone: {e}"

    @QtCore.Slot(float, float, int, result=str)
    def saveStartView(self, lat: float, lon: float, zoom: int) -> str:
        cfg = load_json(CONFIG_PATH, DEFAULT_CONFIG)
        cfg["start"] = {"lat": lat, "lon": lon, "zoom": zoom}
        save_json(CONFIG_PATH, cfg)
        return "Startposition gespeichert."

    @QtCore.Slot(result=str)
    def importImage(self) -> str:
        dlg = QtWidgets.QFileDialog(
            None, "Bild auswählen", str(REPO_ROOT),
            "Bilder (*.png *.jpg *.jpeg *.webp *.gif);;Alle Dateien (*)"
        )
        dlg.setFileMode(QtWidgets.QFileDialog.ExistingFile)
        if dlg.exec() != QtWidgets.QDialog.Accepted:
            return ""
        src = pathlib.Path(dlg.selectedFiles()[0])
        target = IMAGES / src.name
        i, stem, suf = 1, src.stem, src.suffix
        while target.exists():
            target = IMAGES / f"{stem}_{i}{suf}"; i += 1
        try:
            shutil.copy2(src, target)
            return f"assets/images/{target.name}"  # relativ zu /src/
        except Exception as e:
            return f"ERROR:{e}"

# ---------- Hauptfenster ----------
class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("4D-Karten-Editor")
        self.resize(1200, 800)

        self.view = QtWebEngineWidgets.QWebEngineView(self)
        self.setCentralWidget(self.view)

        self.channel = QtWebChannel.QWebChannel()
        self.bridge  = Bridge()
        self.channel.registerObject("Bridge", self.bridge)
        self.view.page().setWebChannel(self.channel)

        tb = self.addToolBar("Werkzeuge"); tb.setMovable(False)
        def act(title, cb, icon=None, shortcut=None):
            a = QtGui.QAction(title, self)
            if icon: a.setIcon(self.style().standardIcon(icon))
            if shortcut: a.setShortcut(shortcut)
            a.triggered.connect(cb); tb.addAction(a); return a

        act("POI hinzufügen",      lambda: self.js("startAddMarker();"), QtWidgets.QStyle.SP_DialogYesButton, "M")
        act("Polygon zeichnen",    lambda: self.js("startDrawPolygon();"), QtWidgets.QStyle.SP_DialogOpenButton, "P")
        act("Auswahl löschen",     lambda: self.js("deleteSelection();"), QtWidgets.QStyle.SP_TrashIcon, "Del")
        tb.addSeparator()
        act("Start = aktuelle Ansicht", self.save_view, QtWidgets.QStyle.SP_ArrowUp, "Ctrl+S")
        tb.addSeparator()
        act("POIs speichern",      lambda: self.js("savePois();"), None, "Ctrl+P")
        act("Polygone speichern",  lambda: self.js("savePolys();"), None, "Ctrl+L")
        tb.addSeparator()
        act("Bild importieren",    self.import_image, QtWidgets.QStyle.SP_DirOpenIcon)

        self.html_path = self._write_html()
        self.view.load(QtCore.QUrl.fromLocalFile(self.html_path))

    def js(self, code: str): self.view.page().runJavaScript(code)
    def save_view(self): self.js("pySaveStartView();")
    def import_image(self): self.js("pyImportImage();")

    def _write_html(self) -> str:
        # 1) bevorzugt: Editor\assets\vendor (neben dieser Datei)
        vendor_editor = (EDITOR_DIR / "assets" / "vendor").resolve()
        # 2) fallback: src\assets\vendor
        vendor_src    = (ASSETS / "vendor").resolve()
        vendor_dir = vendor_editor if vendor_editor.exists() else vendor_src
        vendor_url = vendor_dir.as_uri()

        # lokale Tiles optional nutzen, wenn Ordner existiert
        tiles_editor = (EDITOR_DIR / "assets" / "tiles").resolve()
        tiles_src    = (ASSETS / "tiles").resolve()
        tiles_dir = tiles_editor if tiles_editor.exists() else (tiles_src if tiles_src.exists() else None)
        tiles_url = tiles_dir.as_uri() if tiles_dir else ""

        html = EDITOR_HTML.replace("__VENDOR_URL__", vendor_url).replace("__LOCAL_TILES__", tiles_url)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html")
        tmp.write(html.encode("utf-8")); tmp.flush(); tmp.close()
        return tmp.name

# ---------- Eingebettetes HTML (Loader + Tile-Fallbacks) ----------
EDITOR_HTML = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1, width=device-width" />
<title>Editor</title>
<script src="qrc:///qtwebchannel/qwebchannel.js"></script>
<style>
  html, body { height:100%; margin:0; }
  #map { position: fixed; inset: 0; background:#fff; }
  .form { position:absolute; top:10px; right:10px; z-index:1000; background:rgba(255,255,255,.95); border:1px solid #d0d7de; border-radius:10px; padding:10px; font-family:system-ui, sans-serif; box-shadow:0 6px 18px rgba(0,0,0,.15); }
  .form h3 { margin:0 0 6px; font-size:14px;}
  .form label { font-size:12px; display:block; margin:6px 0 2px; }
  .form input[type="text"], .form textarea { width:320px; font-size:13px; padding:6px; border:1px solid #cbd5e1; border-radius:8px; }
  .form .row { display:flex; gap:6px; align-items:center; }
  .form button { margin-top:8px; padding:6px 10px; }
  .toolbar { position:absolute; left:10px; top:10px; z-index:1000; background:rgba(255,255,255,.95); border:1px solid #d0d7de; border-radius:10px; padding:8px; font-family:system-ui, sans-serif; box-shadow:0 6px 18px rgba(0,0,0,.15); }
  .toolbar button { margin:2px 0; width:180px; }
  .fallback { position:absolute; left:12px; bottom:12px; z-index:1000; background:#fff; padding:6px 10px; border-radius:8px; border:1px solid #d0d7de; font:12px system-ui; display:none; }
  .provider { position:absolute; right:12px; bottom:12px; z-index:1000; background:#fff; padding:6px 10px; border-radius:8px; border:1px solid #d0d7de; font:12px system-ui; }
</style>
</head>
<body>
<div id="map"></div>

<div class="toolbar">
  <strong>Editor</strong><br/>
  <button onclick="startAddMarker()">POI hinzufügen (M)</button><br/>
  <button onclick="startDrawPolygon()">Polygon zeichnen (P)</button><br/>
  <button onclick="deleteSelection()">Auswahl löschen (Entf)</button><br/>
  <hr/>
  <button onclick="pySaveStartView()">Start = aktuelle Ansicht (Ctrl+S)</button><br/>
  <hr/>
  <button onclick="savePois()">POIs speichern (Ctrl+P)</button><br/>
  <button onclick="savePolys()">Polygone speichern (Ctrl+L)</button><br/>
  <hr/>
  <button onclick="pyImportImage()">Bild importieren…</button>
</div>

<div id="fallbackMsg" class="fallback">⚠️ Tiles nicht geladen – Internet & lokale Tiles prüfen.</div>
<div id="provider" class="provider" style="display:none;"></div>

<!-- POI-Formular -->
<div id="poiForm" class="form" style="display:none;">
  <h3>POI</h3>
  <label>Titel</label><input type="text" id="poi_title">
  <label>Untertitel</label><input type="text" id="poi_subtitle">
  <label>Beschreibung</label><textarea id="poi_description" rows="4"></textarea>
  <label>Epoche(n) (Komma-getrennt)</label><input type="text" id="poi_era" placeholder="z.B. Hochmittelalter, Moderne">
  <label>Tags (Komma-getrennt)</label><input type="text" id="poi_tags" placeholder="z.B. Rathaus, Bauwerk">
  <label>Bild (URL oder relativer Pfad)</label>
  <div class="row"><input type="text" id="poi_image" placeholder="assets/images/foto.jpg" /><button onclick="pickImage()">…</button></div>
  <label>Link (optional)</label><input type="text" id="poi_link" placeholder="https://…">
  <div class="row"><button onclick="savePoiForm()">Speichern</button><button onclick="cancelPoiForm()">Abbrechen</button></div>
</div>

<script>
/* === Loader für Leaflet lokal/CDN === */
function loadCSS(href){return new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=()=>res(href);l.onerror=e=>rej(e);document.head.appendChild(l);});}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>res(src);s.onerror=e=>rej(e);document.head.appendChild(s);});}
async function loadOneOfCSS(list){let last;for(const u of list){try{return await loadCSS(u)}catch(e){last=e}}throw last||new Error('CSS-Fail')}
async function loadOneOfJS(list){let last;for(const u of list){try{return await loadScript(u)}catch(e){last=e}}throw last||new Error('JS-Fail')}

/* Globals */
let map, poisLayer, polyLayer, drawnItems, currentMarker=null, bridge=null, initial=null;

/* WebChannel + Laden */
new QWebChannel(qt.webChannelTransport, async function(channel){
  bridge = channel.objects.Bridge;

  const VENDOR = "__VENDOR_URL__";
  const L_CSS  = [ VENDOR + "/leaflet/leaflet.css",
                   "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" ];
  const L_JS   = [ VENDOR + "/leaflet/leaflet.js",
                   "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" ];
  const LD_CSS = [ VENDOR + "/leaflet-draw/leaflet.draw.css",
                   "https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.css" ];
  const LD_JS  = [ VENDOR + "/leaflet-draw/leaflet.draw.js",
                   "https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.js" ];

  try { await loadOneOfCSS(L_CSS); await loadOneOfJS(L_JS); await loadOneOfCSS(LD_CSS); await loadOneOfJS(LD_JS); }
  catch(e){ console.error('Leaflet/Draw nicht geladen:', e); document.getElementById('fallbackMsg').style.display='block'; return; }

  /* Marker-Icons lokal */
  if (window.L && L.Icon && L.Icon.Default) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: VENDOR + "/leaflet/images/marker-icon-2x.png",
      iconUrl:       VENDOR + "/leaflet/images/marker-icon.png",
      shadowUrl:     VENDOR + "/leaflet/images/marker-shadow.png"
    });
  }

  try { const payload = await bridge.getInitialData(); initial = JSON.parse(payload); }
  catch(err){ console.error('Bridge/Initialdaten Fehler:', err);
    initial = {config:{start:{lat:51.153,lon:11.8088,zoom:14}},
               pois:{type:'FeatureCollection',features:[]},
               polygons:{type:'FeatureCollection',features:[]}};
  }

  init();
});

/* Tiles: Fallback-Provider + lokal */
async function useFirstWorkingTiles(map){
  const provider = document.getElementById('provider');
  const localBase = "__LOCAL_TILES__"; // file:///.../assets/tiles  (falls vorhanden)
  const candidates = [];

  if (localBase && localBase.length > 0) {
    candidates.push({name:"LOCAL tiles", url: localBase + "/{z}/{x}/{y}.png", attribution:"(lokal)"});
  }
  candidates.push(
    {name:"OSM main",     url:"https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution:'&copy; OpenStreetMap-Mitwirkende'},
    {name:"OSM DE",       url:"https://tile.openstreetmap.de/{z}/{x}/{y}.png", attribution:'&copy; OpenStreetMap-Mitwirkende'},
    {name:"OSM FR",       url:"https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", attribution:'&copy; OpenStreetMap-Mitwirkende & OSM-FR'}
  );

  for (const c of candidates){
    try{
      const layer = L.tileLayer(c.url, {maxZoom: 20, attribution: c.attribution});
      let ok = false;
      const onload  = () => { ok = true; };
      const onerror = () => {};
      layer.on('load', onload);
      layer.on('tileerror', onerror);
      layer.addTo(map);

      // kleine Probezeit
      await new Promise(res => setTimeout(res, 800));
      if (ok){
        provider.style.display = 'block';
        provider.innerHTML = "Tiles: " + c.name;
        return layer;
      } else {
        map.removeLayer(layer);
      }
    }catch(e){
      // weiter zum nächsten
    }
  }
  document.getElementById('fallbackMsg').style.display = 'block';
  return null;
}

/* Karte + Layer */
async function init(){
  const cfg = initial.config || {start:{lat:51.153,lon:11.8088,zoom:14}};
  map = L.map('map', { center:[cfg.start.lat,cfg.start.lon], zoom:cfg.start.zoom, preferCanvas:true });

  await useFirstWorkingTiles(map);

  poisLayer = L.geoJSON(initial.pois || {type:'FeatureCollection',features:[]}, {
    pointToLayer:(f,latlng)=> L.marker(latlng,{title:(f.properties&&f.properties.title)?f.properties.title:'POI'})
      .on('click',()=> openPoiForm(f,latlng))
  }).addTo(map);

  polyLayer = L.geoJSON(initial.polygons || {type:'FeatureCollection',features:[]}, {
    style:f=>({ color:(f.properties&&f.properties.stroke)?f.properties.stroke:'#0a7cff',
                weight:+((f.properties&&f.properties['stroke-width'])||2),
                opacity:+((f.properties&&f.properties['stroke-opacity'])||0.9),
                fillColor:(f.properties&&f.properties.fill)?f.properties.fill:'#0a7cff',
                fillOpacity:+((f.properties&&f.properties['fill-opacity'])||0.15) })
  }).addTo(map);

  drawnItems = new L.FeatureGroup().addTo(map);

  map.on(L.Draw.Event.CREATED, function(e){
    if (e.layerType==='marker'){ const latlng=e.layer.getLatLng(); openPoiForm(null,latlng,e.layer); }
    else if (e.layerType==='polygon'){ drawnItems.addLayer(e.layer); }
  });
}

/* Werkzeuge */
function startAddMarker(){ if (window.L && map) new L.Draw.Marker(map).enable(); }
function startDrawPolygon(){ if (window.L && map) new L.Draw.Polygon(map).enable(); }
function deleteSelection(){ if(!drawnItems) return; const arr=Object.values(drawnItems._layers||{}); if(arr.length) drawnItems.removeLayer(arr[arr.length-1]); }

/* Speichern */
async function savePois(){
  const features=[];
  if(poisLayer) poisLayer.eachLayer(m=>{ if(m.feature&&m.feature.type==='Feature') features.push(m.feature); });
  if(drawnItems) drawnItems.eachLayer(l=>{ if(l instanceof L.Marker && l._poiProps){
      features.push({type:'Feature',geometry:{type:'Point',coordinates:[l.getLatLng().lng,l.getLatLng().lat]},properties:l._poiProps}); }});
  const fc={type:'FeatureCollection',features}; const msg=await bridge.savePois(JSON.stringify(fc)); alert(msg);
  if(poisLayer){ poisLayer.clearLayers(); poisLayer.addData(fc); }
  const rm=[]; drawnItems&&drawnItems.eachLayer(l=>{ if(l instanceof L.Marker && l._poiProps) rm.push(l); }); rm.forEach(l=>drawnItems.removeLayer(l));
}
async function savePolys(){
  const features=[]; if(polyLayer) polyLayer.eachLayer(l=>{ if(l.feature) features.push(l.feature); });
  if(drawnItems) drawnItems.eachLayer(l=>{ if(l instanceof L.Polygon && !(l instanceof L.Rectangle)){
      const coords=l.getLatLngs()[0].map(ll=>[ll.lng,ll.lat]);
      features.push({type:'Feature',geometry:{type:'Polygon',coordinates:[coords]},
        properties:{title:'Fläche',stroke:'#0a7cff','stroke-width':2,'stroke-opacity':0.9,fill:'#0a7cff','fill-opacity':0.15}}); }});
  const fc={type:'FeatureCollection',features}; const msg=await bridge.savePolygons(JSON.stringify(fc)); alert(msg);
  if(polyLayer){ polyLayer.clearLayers(); polyLayer.addData(fc); }
  const rm=[]; drawnItems&&drawnItems.eachLayer(l=>{ if(l instanceof L.Polygon && !(l instanceof L.Rectangle)) rm.push(l); }); rm.forEach(l=>drawnItems.removeLayer(l));
}

/* Startansicht & Bildimport */
async function pySaveStartView(){ if(!map) return; const c=map.getCenter(), z=map.getZoom(); alert(await bridge.saveStartView(c.lat,c.lng,z)); }
async function pyImportImage(){ const rel=await bridge.importImage(); if(rel && !String(rel).startsWith('ERROR')){ const el=document.getElementById('poi_image'); if(el) el.value=rel; } else if(String(rel).startsWith('ERROR')){ alert(rel); } }

/* POI-Formular */
function openPoiForm(feature,latlng,draftMarker=null){
  currentMarker=draftMarker;
  document.getElementById('poi_title').value       =(feature&&feature.properties&&feature.properties.title)||'';
  document.getElementById('poi_subtitle').value    =(feature&&feature.properties&&feature.properties.subtitle)||'';
  document.getElementById('poi_description').value =(feature&&feature.properties&&feature.properties.description)||'';
  const era=(feature&&feature.properties&&feature.properties.era)||null;
  document.getElementById('poi_era').value=Array.isArray(era)?era.join(', '):(era||'');
  document.getElementById('poi_tags').value=(feature&&feature.properties&&Array.isArray(feature.properties.tags)?feature.properties.tags:[]).join(', ');
  document.getElementById('poi_image').value=(feature&&feature.properties&&feature.properties.image)||'';
  document.getElementById('poi_link').value =(feature&&feature.properties&&feature.properties.link)||'';
  const form=document.getElementById('poiForm'); form.dataset.lat=latlng.lat; form.dataset.lng=latlng.lng; form.style.display='block';
}
function cancelPoiForm(){ if(currentMarker){ drawnItems.removeLayer(currentMarker); currentMarker=null; } document.getElementById('poiForm').style.display='none'; }
function pickImage(){ pyImportImage(); }
function savePoiForm(){
  const form=document.getElementById('poiForm'); const lat=+form.dataset.lat, lng=+form.dataset.lng;
  const props={ title:(document.getElementById('poi_title').value||'POI').trim(),
    subtitle:(document.getElementById('poi_subtitle').value||'').trim(),
    description:(document.getElementById('poi_description').value||'').trim(),
    era:(()=>{const s=(document.getElementById('poi_era').value||'').trim(); return s? s.split(',').map(x=>x.trim()).filter(Boolean): null;})(),
    tags:(()=>{const s=(document.getElementById('poi_tags').value||'').trim(); return s? s.split(',').map(x=>x.trim()).filter(Boolean): [];})(),
    image:(document.getElementById('poi_image').value||'').trim(),
    link:(document.getElementById('poi_link').value||'').trim()
  };
  if(currentMarker){ currentMarker._poiProps=props; drawnItems.addLayer(currentMarker); currentMarker=null; }
  else { const m=L.marker([lat,lng]); m._poiProps=props; drawnItems.addLayer(m); }
  form.style.display='none';
}
</script>
</body>
</html>
"""

# ---------- App starten ----------
def main():
    app = QtWidgets.QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()