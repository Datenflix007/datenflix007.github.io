const state = {
    map: null,
    view: null,
    baseLayer: null,
    searchSource: null,
    resultSource: null,
    imageSource: null,
    popupOverlay: null,
    popupElement: null,
    center: [50.9271, 11.5892],
    importedFeatures: [],
    reviewRecords: [],
    selectedEntities: new Set(),
    imageHints: [],
    results: [],
    loading: false,
};

const basemapConfigs = {
    voyager: {
        urls: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    light: {
        urls: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        ],
        attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    dark: {
        urls: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        ],
        attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    satellite: {
        urls: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        attribution: "Tiles &copy; Esri",
    },
};

const overpassEndpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
];

const queryLexicon = {
    building: ["haus", "haeuser", "häuser", "wohngebiet", "einfamilienhaus", "gebaeude", "gebäude", "siedlung", "residential"],
    vegetation: ["wald", "baeume", "bäume", "vegetation", "park", "gruen", "grün", "wiese", "field", "forest"],
    poi: ["poi", "laden", "supermarkt", "restaurant", "kirche", "schule", "spielplatz", "tankstelle", "hotel", "cafe", "bank"],
    transport: ["strasse", "straße", "weg", "radweg", "haltestelle", "bus", "bahn", "parkplatz", "bruecke", "brücke"],
    water: ["wasser", "fluss", "bach", "see", "ufer", "teich", "river"],
};

const tagGroups = {
    building: ["building"],
    vegetation: ["natural", "landuse", "leisure"],
    poi: ["amenity", "shop", "tourism", "historic", "office", "craft"],
    transport: ["highway", "railway", "public_transport", "route", "parking"],
    water: ["water", "waterway", "bridge"],
};

const sourceQueries = {
    building: 'way["building"~"yes|house|detached|semidetached_house|terrace|apartments|residential|school|church|commercial|retail"](around:RADIUS,LAT,LON);',
    vegetation: 'way["natural"~"wood|tree_row|scrub|heath|grassland"](around:RADIUS,LAT,LON);relation["natural"~"wood|scrub|heath|grassland"](around:RADIUS,LAT,LON);way["landuse"~"forest|grass|meadow|orchard|vineyard|recreation_ground"](around:RADIUS,LAT,LON);way["leisure"~"park|garden|nature_reserve|playground"](around:RADIUS,LAT,LON);',
    poi: 'node["amenity"](around:RADIUS,LAT,LON);node["shop"](around:RADIUS,LAT,LON);node["tourism"](around:RADIUS,LAT,LON);node["historic"](around:RADIUS,LAT,LON);way["amenity"](around:RADIUS,LAT,LON);way["shop"](around:RADIUS,LAT,LON);way["tourism"](around:RADIUS,LAT,LON);',
    transport: 'node["highway"~"bus_stop|crossing|traffic_signals"](around:RADIUS,LAT,LON);node["public_transport"](around:RADIUS,LAT,LON);node["railway"~"station|halt|tram_stop"](around:RADIUS,LAT,LON);way["highway"~"primary|secondary|tertiary|residential|footway|cycleway|path"](around:RADIUS,LAT,LON);',
    water: 'node["waterway"](around:RADIUS,LAT,LON);way["waterway"](around:RADIUS,LAT,LON);way["natural"="water"](around:RADIUS,LAT,LON);way["bridge"](around:RADIUS,LAT,LON);',
};

const focusedQueryRules = [
    focusRule("restaurant", "Restaurant", ["restaurant", "essen", "speiselokal"], 'node["amenity"="restaurant"](around:RADIUS,LAT,LON);way["amenity"="restaurant"](around:RADIUS,LAT,LON);'),
    focusRule("cafe", "Cafe", ["cafe", "kaffee"], 'node["amenity"="cafe"](around:RADIUS,LAT,LON);way["amenity"="cafe"](around:RADIUS,LAT,LON);'),
    focusRule("church", "Kirche", ["kirche", "gotteshaus", "kapelle", "church"], 'node["amenity"="place_of_worship"](around:RADIUS,LAT,LON);way["amenity"="place_of_worship"](around:RADIUS,LAT,LON);way["building"="church"](around:RADIUS,LAT,LON);'),
    focusRule("parking", "Parkplatz", ["parkplatz", "parking"], 'node["amenity"="parking"](around:RADIUS,LAT,LON);way["amenity"="parking"](around:RADIUS,LAT,LON);'),
    focusRule("historic", "Historisch", ["historisch", "historische", "denkmal", "monument", "historic"], 'node["historic"](around:RADIUS,LAT,LON);way["historic"](around:RADIUS,LAT,LON);'),
    focusRule("school", "Schule", ["schule", "school"], 'node["amenity"="school"](around:RADIUS,LAT,LON);way["amenity"="school"](around:RADIUS,LAT,LON);'),
    focusRule("playground", "Spielplatz", ["spielplatz", "playground"], 'node["leisure"="playground"](around:RADIUS,LAT,LON);way["leisure"="playground"](around:RADIUS,LAT,LON);'),
    focusRule("supermarket", "Supermarkt", ["supermarkt", "laden", "shop"], 'node["shop"="supermarket"](around:RADIUS,LAT,LON);way["shop"="supermarket"](around:RADIUS,LAT,LON);node["shop"](around:RADIUS,LAT,LON);'),
    focusRule("bus_stop", "Bushaltestelle", ["bus", "bushaltestelle", "haltestelle"], 'node["highway"="bus_stop"](around:RADIUS,LAT,LON);node["public_transport"="platform"](around:RADIUS,LAT,LON);'),
    focusRule("water", "Wasser", ["wasser", "fluss", "bach", "ufer", "bruecke", "brücke"], 'way["waterway"~"river|stream|canal"](around:RADIUS,LAT,LON);node["waterway"~"river|stream|canal"](around:RADIUS,LAT,LON);way["natural"="water"](around:RADIUS,LAT,LON);way["bridge"](around:RADIUS,LAT,LON);'),
    focusRule("forest", "Wald", ["wald", "baeume", "bäume", "vegetation", "park", "wiese"], 'way["landuse"~"forest|meadow|grass|recreation_ground"](around:RADIUS,LAT,LON);way["natural"~"wood|grassland|tree_row|scrub"](around:RADIUS,LAT,LON);way["leisure"~"park|garden"](around:RADIUS,LAT,LON);'),
    focusRule("residential", "Wohngebiet", ["wohngebiet", "haeuser", "häuser", "einfamilienhaus", "siedlung"], 'way["landuse"="residential"](around:RADIUS,LAT,LON);way["building"~"house|detached|semidetached_house|terrace|apartments|residential"](around:RADIUS,LAT,LON);'),
    focusRule("viewpoint", "Aussichtspunkt", ["aussicht", "aussichtspunkt", "viewpoint"], 'node["tourism"="viewpoint"](around:RADIUS,LAT,LON);way["tourism"="viewpoint"](around:RADIUS,LAT,LON);'),
];

const entityCatalog = [
    entity("oak", "Eiche", "Baumarten", "vegetation", ["eiche", "oak", "quercus"], 'node["natural"="tree"]["species"~"Quercus|quercus|oak|Oak|Eiche|eiche"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Quercus|quercus"](around:RADIUS,LAT,LON);', [["species", "quercus", "oak", "eiche"], ["genus", "quercus"]]),
    entity("beech", "Buche", "Baumarten", "vegetation", ["buche", "beech", "fagus"], 'node["natural"="tree"]["species"~"Fagus|fagus|beech|Beech|Buche|buche"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Fagus|fagus"](around:RADIUS,LAT,LON);', [["species", "fagus", "beech", "buche"], ["genus", "fagus"]]),
    entity("birch", "Birke", "Baumarten", "vegetation", ["birke", "birch", "betula"], 'node["natural"="tree"]["species"~"Betula|betula|birch|Birch|Birke|birke"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Betula|betula"](around:RADIUS,LAT,LON);', [["species", "betula", "birch", "birke"], ["genus", "betula"]]),
    entity("pine", "Kiefer", "Baumarten", "vegetation", ["kiefer", "pine", "pinus"], 'node["natural"="tree"]["species"~"Pinus|pinus|pine|Pine|Kiefer|kiefer"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Pinus|pinus"](around:RADIUS,LAT,LON);', [["species", "pinus", "pine", "kiefer"], ["genus", "pinus"]]),
    entity("spruce", "Fichte", "Baumarten", "vegetation", ["fichte", "spruce", "picea"], 'node["natural"="tree"]["species"~"Picea|picea|spruce|Spruce|Fichte|fichte"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Picea|picea"](around:RADIUS,LAT,LON);', [["species", "picea", "spruce", "fichte"], ["genus", "picea"]]),
    entity("maple", "Ahorn", "Baumarten", "vegetation", ["ahorn", "maple", "acer"], 'node["natural"="tree"]["species"~"Acer|acer|maple|Maple|Ahorn|ahorn"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Acer|acer"](around:RADIUS,LAT,LON);', [["species", "acer", "maple", "ahorn"], ["genus", "acer"]]),
    entity("lime", "Linde", "Baumarten", "vegetation", ["linde", "lime", "tilia"], 'node["natural"="tree"]["species"~"Tilia|tilia|lime|Lime|Linde|linde"](around:RADIUS,LAT,LON);node["natural"="tree"]["genus"~"Tilia|tilia"](around:RADIUS,LAT,LON);', [["species", "tilia", "lime", "linde"], ["genus", "tilia"]]),
    entity("detached", "Einfamilienhaus", "Hausarten", "building", ["einfamilienhaus", "detached", "house"], 'way["building"~"detached|house|semidetached_house"](around:RADIUS,LAT,LON);', [["building", "detached", "house", "semidetached_house"]]),
    entity("apartments", "Mehrfamilienhaus", "Hausarten", "building", ["mehrfamilienhaus", "apartments", "residential"], 'way["building"~"apartments|residential"](around:RADIUS,LAT,LON);', [["building", "apartments", "residential"]]),
    entity("terrace", "Reihenhaus", "Hausarten", "building", ["reihenhaus", "terrace"], 'way["building"~"terrace|house"](around:RADIUS,LAT,LON);', [["building", "terrace"]]),
    entity("half_timbered", "Fachwerk", "Hausarten", "building", ["fachwerk", "half timbered", "timber"], 'way["building"]["building:architecture"~"half-timbered|half_timbered|fachwerk|timber"](around:RADIUS,LAT,LON);way["building"]["facade:material"~"timber|wood"](around:RADIUS,LAT,LON);', [["building:architecture", "half-timbered", "fachwerk", "timber"], ["facade:material", "timber", "wood"]]),
    entity("flat_roof", "Flachdach", "Hausarten", "building", ["flachdach", "flat roof"], 'way["roof:shape"="flat"](around:RADIUS,LAT,LON);', [["roof:shape", "flat"]]),
    entity("gabled_roof", "Satteldach", "Hausarten", "building", ["satteldach", "gabled roof"], 'way["roof:shape"~"gabled|half-hipped"](around:RADIUS,LAT,LON);', [["roof:shape", "gabled", "half-hipped"]]),
    entity("restaurant", "Restaurant", "POIs", "poi", ["restaurant", "essen"], 'node["amenity"="restaurant"](around:RADIUS,LAT,LON);way["amenity"="restaurant"](around:RADIUS,LAT,LON);', [["amenity", "restaurant"]]),
    entity("cafe", "Cafe", "POIs", "poi", ["cafe", "kaffee"], 'node["amenity"="cafe"](around:RADIUS,LAT,LON);way["amenity"="cafe"](around:RADIUS,LAT,LON);', [["amenity", "cafe"]]),
    entity("playground", "Spielplatz", "POIs", "poi", ["spielplatz", "playground"], 'node["leisure"="playground"](around:RADIUS,LAT,LON);way["leisure"="playground"](around:RADIUS,LAT,LON);', [["leisure", "playground"]]),
    entity("school", "Schule", "POIs", "poi", ["schule", "school"], 'node["amenity"="school"](around:RADIUS,LAT,LON);way["amenity"="school"](around:RADIUS,LAT,LON);', [["amenity", "school"]]),
    entity("viewpoint", "Aussichtspunkt", "POIs", "poi", ["aussicht", "viewpoint"], 'node["tourism"="viewpoint"](around:RADIUS,LAT,LON);way["tourism"="viewpoint"](around:RADIUS,LAT,LON);', [["tourism", "viewpoint"]]),
    entity("supermarket", "Supermarkt", "POIs", "poi", ["supermarkt", "supermarket"], 'node["shop"="supermarket"](around:RADIUS,LAT,LON);way["shop"="supermarket"](around:RADIUS,LAT,LON);', [["shop", "supermarket"]]),
    entity("pizza", "Pizza", "Kueche", "poi", ["pizza", "italian"], 'node["amenity"~"restaurant|fast_food"]["cuisine"~"pizza|italian"](around:RADIUS,LAT,LON);way["amenity"~"restaurant|fast_food"]["cuisine"~"pizza|italian"](around:RADIUS,LAT,LON);', [["cuisine", "pizza", "italian"]]),
    entity("kebab", "Kebab", "Kueche", "poi", ["kebab", "doener", "doner"], 'node["amenity"~"restaurant|fast_food"]["cuisine"~"kebab|doner|turkish"](around:RADIUS,LAT,LON);way["amenity"~"restaurant|fast_food"]["cuisine"~"kebab|doner|turkish"](around:RADIUS,LAT,LON);', [["cuisine", "kebab", "doner", "turkish"]]),
    entity("sushi", "Sushi", "Kueche", "poi", ["sushi", "japanese"], 'node["amenity"~"restaurant|fast_food"]["cuisine"~"sushi|japanese"](around:RADIUS,LAT,LON);way["amenity"~"restaurant|fast_food"]["cuisine"~"sushi|japanese"](around:RADIUS,LAT,LON);', [["cuisine", "sushi", "japanese"]]),
    entity("forest", "Wald", "Landschaft", "vegetation", ["wald", "forest", "wood"], 'way["landuse"="forest"](around:RADIUS,LAT,LON);way["natural"="wood"](around:RADIUS,LAT,LON);relation["landuse"="forest"](around:RADIUS,LAT,LON);', [["landuse", "forest"], ["natural", "wood"]]),
    entity("meadow", "Wiese", "Landschaft", "vegetation", ["wiese", "meadow", "grass"], 'way["landuse"~"meadow|grass|recreation_ground"](around:RADIUS,LAT,LON);way["natural"="grassland"](around:RADIUS,LAT,LON);', [["landuse", "meadow", "grass", "recreation_ground"], ["natural", "grassland"]]),
    entity("river", "Wasserlauf", "Landschaft", "water", ["wasser", "fluss", "bach", "river", "stream"], 'way["waterway"~"river|stream|canal"](around:RADIUS,LAT,LON);node["waterway"~"river|stream|canal"](around:RADIUS,LAT,LON);', [["waterway", "river", "stream", "canal"]]),
    entity("bridge", "Bruecke", "Landschaft", "transport", ["bruecke", "bridge"], 'way["bridge"](around:RADIUS,LAT,LON);node["bridge"](around:RADIUS,LAT,LON);', [["bridge", "yes"]]),
    entity("bus_stop", "Bushaltestelle", "Verkehr", "transport", ["bus", "haltestelle", "bus_stop"], 'node["highway"="bus_stop"](around:RADIUS,LAT,LON);node["public_transport"="platform"](around:RADIUS,LAT,LON);', [["highway", "bus_stop"], ["public_transport", "platform"]]),
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function init() {
    state.view = new ol.View({
        center: ol.proj.fromLonLat([state.center[1], state.center[0]]),
        zoom: 14,
        maxZoom: 20,
    });
    state.baseLayer = new ol.layer.Tile({
        source: createTileSource("voyager"),
        preload: 2,
    });
    state.searchSource = new ol.source.Vector();
    state.resultSource = new ol.source.Vector();
    state.imageSource = new ol.source.Vector();
    state.popupElement = createPopupElement();
    state.popupOverlay = new ol.Overlay({
        element: state.popupElement,
        positioning: "bottom-center",
        stopEvent: true,
        offset: [0, -18],
    });
    state.map = new ol.Map({
        target: "map",
        layers: [
            state.baseLayer,
            new ol.layer.Vector({ source: state.searchSource, style: searchRadiusStyle() }),
            new ol.layer.Vector({ source: state.resultSource, style: resultFeatureStyle }),
            new ol.layer.Vector({ source: state.imageSource, style: imageFeatureStyle() }),
        ],
        overlays: [state.popupOverlay],
        controls: ol.control.defaults.defaults({ zoom: false, rotate: false }).extend([
            new ol.control.Zoom({ className: "ol-zoom gvis-zoom" }),
        ]),
        interactions: ol.interaction.defaults.defaults({ mouseWheelZoom: false, altShiftDragRotate: false, pinchRotate: false }),
        view: state.view,
    });
    state.map.on("singleclick", handleMapClick);
    drawSearchCircle();
    renderEntityCatalog();
    renderSelectedEntities();
    bindUi();
    window.addEventListener("resize", () => state.map.updateSize());
    if ("ResizeObserver" in window) {
        new ResizeObserver(() => state.map.updateSize()).observe($("#map"));
    }
    [0, 120, 350, 800].forEach((delay) => setTimeout(() => state.map.updateSize(), delay));
}

function createTileSource(key) {
    const config = basemapConfigs[key] || basemapConfigs.voyager;
    return new ol.source.XYZ({
        urls: config.urls,
        attributions: config.attribution,
        maxZoom: 20,
        transition: 0,
    });
}

function createPopupElement() {
    const popup = document.createElement("div");
    popup.className = "gvis-popup";
    popup.hidden = true;
    return popup;
}

function searchRadiusStyle() {
    return new ol.style.Style({
        fill: new ol.style.Fill({ color: "rgba(96, 165, 250, 0.12)" }),
        stroke: new ol.style.Stroke({ color: "#2563eb", width: 2 }),
    });
}

function resultFeatureStyle(feature) {
    const result = feature.get("result");
    const score = result?.score || 0;
    const size = Math.max(7, Math.round(7 + score / 8));
    const color = score >= 70 ? "#16a34a" : score >= 42 ? "#f59e0b" : "#e11d48";
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: size,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 }),
        }),
    });
}

function imageFeatureStyle() {
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: 9,
            fill: new ol.style.Fill({ color: "#2563eb" }),
            stroke: new ol.style.Stroke({ color: "#ffffff", width: 3 }),
        }),
    });
}

function handleMapClick(event) {
    const feature = state.map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate);
    if (!feature) {
        hidePopup();
        return;
    }
    const html = feature.get("popupHtml");
    if (html) openFeaturePopup(feature, html);
}

function bindUi() {
    $("#runBtn").addEventListener("click", runAnalysis);
    $("#clearBtn").addEventListener("click", clearMap);
    $("#searchPlaceBtn").addEventListener("click", searchPlace);
    $("#locateBtn").addEventListener("click", locateUser);
    $("#radiusSelect").addEventListener("change", drawSearchCircle);
    $("#fileInput").addEventListener("change", importFile);
    $("#imageInput").addEventListener("change", analyzeImageFile);
    $("#reviewInput").addEventListener("change", importReviewFile);
    $("#entitySearch").addEventListener("input", renderEntityCatalog);
    $("#clearEntitiesBtn").addEventListener("click", clearEntitySelection);
    $("#addCustomEntityBtn").addEventListener("click", addCustomEntity);
    $("#applyImageHintsBtn").addEventListener("click", applyImageHintsToQuery);
    $("#basemapSelect").addEventListener("change", switchBasemap);
    $("#exportBtn").addEventListener("click", exportGeoJson);
    ["poiWeight", "contextWeight", "densityWeight"].forEach((id) => {
        const input = $(`#${id}`);
        input.addEventListener("input", () => {
            $(`#${id}Value`).textContent = input.value;
        });
    });
    $$(".chip-btn").forEach((button) => {
        button.addEventListener("click", () => {
            $("#queryInput").value = button.dataset.query;
        });
    });
    $("#placeInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") searchPlace();
    });
}

function switchBasemap(event) {
    state.baseLayer.setSource(createTileSource(event.target.value));
}

function selectedSources() {
    return $$(".source-check:checked").map((input) => input.value);
}

function entity(id, label, category, group, terms, query, matchers) {
    return {
        id,
        label,
        category,
        group,
        terms,
        query,
        matchers: matchers.map(([key, ...values]) => ({ key, values })),
    };
}

function focusRule(id, label, terms, query) {
    return { id, label, terms, query };
}

function selectedEntityObjects() {
    return entityCatalog.filter((item) => state.selectedEntities.has(item.id));
}

function renderEntityCatalog() {
    const catalog = $("#entityCatalog");
    if (!catalog) return;
    const filter = normalize($("#entitySearch")?.value || "");
    const visible = entityCatalog.filter((item) => {
        const haystack = normalize([item.label, item.category, item.group, ...item.terms].join(" "));
        return !filter || haystack.includes(filter);
    });
    catalog.innerHTML = "";
    const groups = [...new Set(visible.map((item) => item.category))];
    groups.forEach((group) => {
        const wrapper = document.createElement("div");
        wrapper.className = "entity-group";
        const title = document.createElement("div");
        title.className = "entity-group-title";
        title.textContent = group;
        wrapper.appendChild(title);
        visible.filter((item) => item.category === group).forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `entity-chip${state.selectedEntities.has(item.id) ? " active" : ""}`;
            button.textContent = item.label;
            button.addEventListener("click", () => toggleEntity(item.id));
            wrapper.appendChild(button);
        });
        catalog.appendChild(wrapper);
    });
}

function renderSelectedEntities() {
    const box = $("#selectedEntities");
    if (!box) return;
    box.innerHTML = "";
    selectedEntityObjects().forEach((item) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "selected-chip";
        chip.textContent = item.label;
        chip.title = "Entitaet entfernen";
        chip.addEventListener("click", () => toggleEntity(item.id));
        box.appendChild(chip);
    });
}

function toggleEntity(id) {
    if (state.selectedEntities.has(id)) {
        state.selectedEntities.delete(id);
    } else {
        state.selectedEntities.add(id);
    }
    syncEntityQueryText();
    renderEntityCatalog();
    renderSelectedEntities();
}

function clearEntitySelection() {
    state.selectedEntities.clear();
    syncEntityQueryText();
    renderEntityCatalog();
    renderSelectedEntities();
}

function addCustomEntity() {
    const keyInput = $("#customKeyInput");
    const valueInput = $("#customValueInput");
    const key = keyInput.value.trim();
    const value = valueInput.value.trim();
    if (!key) {
        setStatus("OSM-Key fehlt.");
        return;
    }
    const id = `custom-${Date.now()}`;
    const label = value ? `${key}=${value}` : key;
    const keyText = overpassString(key);
    const valueText = overpassString(value);
    const query = value
        ? `node["${keyText}"~"${valueText}"](around:RADIUS,LAT,LON);way["${keyText}"~"${valueText}"](around:RADIUS,LAT,LON);relation["${keyText}"~"${valueText}"](around:RADIUS,LAT,LON);`
        : `node["${keyText}"](around:RADIUS,LAT,LON);way["${keyText}"](around:RADIUS,LAT,LON);relation["${keyText}"](around:RADIUS,LAT,LON);`;
    entityCatalog.push(entity(id, label, "Eigene", inferGroupFromKey(key), [key, value, label].filter(Boolean), query, [[key, value]]));
    state.selectedEntities.add(id);
    keyInput.value = "";
    valueInput.value = "";
    syncEntityQueryText();
    renderEntityCatalog();
    renderSelectedEntities();
    setStatus(`Eigene Entitaet ${label} hinzugefuegt.`);
}

function overpassString(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function inferGroupFromKey(key) {
    if (["building", "roof:shape", "building:architecture", "facade:material"].includes(key)) return "building";
    if (["natural", "landuse", "leisure", "species", "genus", "taxon"].includes(key)) return "vegetation";
    if (["water", "waterway", "bridge"].includes(key)) return "water";
    if (["highway", "railway", "public_transport"].includes(key)) return "transport";
    return "poi";
}

function syncEntityQueryText() {
    const input = $("#queryInput");
    const selectedLabels = selectedEntityObjects().map((item) => item.label);
    const base = input.value.replace(/\n?Entitaeten:.*$/s, "").trim();
    input.value = selectedLabels.length ? `${base}${base ? "\n" : ""}Entitaeten: ${selectedLabels.join(", ")}` : base;
}

function setStatus(message) {
    $("#statusText").textContent = message;
}

function radius() {
    return Number($("#radiusSelect").value);
}

function setMapView(center, zoom) {
    if (!state.view) return;
    state.view.animate({
        center: ol.proj.fromLonLat([center[1], center[0]]),
        zoom,
        duration: 450,
    });
}

function drawSearchCircle() {
    if (!state.searchSource) return;
    state.searchSource.clear();
    const center = ol.proj.fromLonLat([state.center[1], state.center[0]]);
    const feature = new ol.Feature(new ol.geom.Circle(center, radius()));
    state.searchSource.addFeature(feature);
}

async function searchPlace() {
    const raw = $("#placeInput").value.trim();
    if (!raw) return;
    const coordinateMatch = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinateMatch) {
        state.center = [Number(coordinateMatch[1]), Number(coordinateMatch[2])];
        setMapView(state.center, 14);
        drawSearchCircle();
        setStatus("Koordinaten gesetzt.");
        return;
    }
    setStatus("Ort wird gesucht ...");
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(raw)}`;
    try {
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        const places = await response.json();
        if (!places.length) {
            setStatus("Ort nicht gefunden.");
            return;
        }
        state.center = [Number(places[0].lat), Number(places[0].lon)];
        setMapView(state.center, 14);
        drawSearchCircle();
        setStatus(`Suchraum gesetzt: ${places[0].display_name}`);
    } catch (error) {
        setStatus(`Ortssuche fehlgeschlagen: ${error.message}`);
    }
}

function locateUser() {
    if (!navigator.geolocation) {
        setStatus("Geolocation ist in diesem Browser nicht verfuegbar.");
        return;
    }
    setStatus("Standort wird abgefragt ...");
    navigator.geolocation.getCurrentPosition((position) => {
        state.center = [position.coords.latitude, position.coords.longitude];
        setMapView(state.center, 15);
        drawSearchCircle();
        setStatus("Suchraum auf aktuellen Standort gesetzt.");
    }, () => setStatus("Standort konnte nicht ermittelt werden."));
}

async function runAnalysis() {
    if (state.loading) return;
    const sources = selectedSources();
    if (!sources.length && !state.importedFeatures.length && !state.selectedEntities.size) {
        setStatus("Mindestens eine Datenquelle, Entitaet oder Datei auswaehlen.");
        return;
    }
    setLoading(true);
    const query = parseQuery($("#queryInput").value, sources);
    setStatus("OSM-Daten werden gezielt ueber Overpass geladen ...");
    try {
        const osmFeatures = sources.length || state.selectedEntities.size ? await fetchOverpass(sources, query) : [];
        const allFeatures = [...osmFeatures, ...state.importedFeatures];
        if (!allFeatures.length) {
            renderResults([], query);
            setStatus("Keine passenden Daten im Suchraum gefunden. Radius, Ort oder Datenquellen anpassen.");
            return;
        }
        const scored = scoreFeatures(allFeatures, query)
            .sort((a, b) => b.score - a.score)
            .slice(0, Number($("#limitSelect").value));
        state.results = scored;
        renderResults(scored, query);
        setStatus(`${scored.length} Punkte bewertet. Hoehere Werte bedeuten bessere Uebereinstimmung mit Query und Umgebung.`);
    } catch (error) {
        setStatus(`Analyse fehlgeschlagen: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

async function fetchOverpass(sources, query) {
    const queryRadius = Math.min(radius(), hasFocusedQuery(query) ? 1800 : 1100);
    const plans = buildOverpassPlans(sources, query);
    if (!plans.length) return [];
    const rawLimit = Math.max(160, Math.min(900, Number($("#limitSelect").value) * (plans.length <= 3 ? 8 : 5)));
    const labels = plans.map((plan) => plan.label).slice(0, 5).join(", ");
    setStatus(`Lade fokussierte OSM-Abfrage: ${labels}${plans.length > 5 ? " ..." : ""}`);
    try {
        const primary = await fetchOverpassPlans(plans, queryRadius, rawLimit, 14000);
        if (primary.length) return primary;
        const emptyFallback = await fetchPhotonFallback(plans, queryRadius, rawLimit);
        if (emptyFallback.length) {
            setStatus("Overpass lieferte keine Treffer. Fallback ueber Photon geladen.");
            return emptyFallback;
        }
        return [];
    } catch (combinedError) {
        const fastFallback = await fetchPhotonFallback(plans, queryRadius, rawLimit);
        if (fastFallback.length) {
            setStatus("Overpass war langsam. Fallback ueber Photon geladen.");
            return fastFallback;
        }
        setStatus("Sammelabfrage langsam. Versuche kleine Fallback-Abfragen ...");
        const features = [];
        const failures = [];
        for (const plan of plans.slice(0, 6)) {
            try {
                const part = await fetchOverpassPlans([plan], queryRadius, Math.max(80, Math.floor(rawLimit / 3)), 7000);
                features.push(...part);
                if (features.length >= rawLimit) break;
            } catch (error) {
                failures.push(`${plan.label}: ${error.message}`);
            }
        }
        if (!features.length) {
            const fallback = await fetchPhotonFallback(plans, queryRadius, rawLimit);
            if (fallback.length) {
                setStatus("Overpass war langsam. Fallback ueber Photon geladen.");
                return fallback;
            }
            const nominatimFallback = await fetchNominatimFallback(plans, queryRadius, rawLimit);
            if (nominatimFallback.length) {
                setStatus("Overpass war langsam. Fallback ueber Nominatim geladen.");
                return nominatimFallback;
            }
            throw new Error(`Overpass antwortet nicht schnell genug. ${failures[0] || combinedError.message}`);
        }
        if (failures.length) setStatus(`Teilergebnis geladen. Langsam: ${failures.map((failure) => failure.split(":")[0]).join(", ")}.`);
        return dedupeFeatures(features);
    }
}

async function fetchOverpassPlans(plans, queryRadius, rawLimit, timeoutMs) {
    const queryParts = plans.map((plan) => plan.query).join("");
    const query = `[out:json][timeout:${Math.ceil(timeoutMs / 1000)}];(${queryParts});out center qt ${rawLimit};`
        .replaceAll("RADIUS", String(queryRadius))
        .replaceAll("LAT", String(state.center[0]))
        .replaceAll("LON", String(state.center[1]));
    try {
        const data = await Promise.any(overpassEndpoints.map((endpoint) => requestOverpass(endpoint, query, timeoutMs)));
        return dedupeFeatures(data.elements.map(osmElementToFeature).filter(Boolean));
    } catch (error) {
        const reason = error.errors?.[0]?.message || error.message;
        throw new Error(reason || "Keine Overpass-Antwort erhalten");
    }
}

function buildOverpassPlans(sources, query) {
    const plans = [];
    selectedEntityObjects().forEach((item) => plans.push({ id: `entity-${item.id}`, label: item.label, query: item.query }));
    focusedQueryRules.forEach((rule) => {
        if (rule.terms.some((term) => query.raw.includes(normalize(term)))) {
            plans.push({ id: `focus-${rule.id}`, label: rule.label, query: rule.query });
        }
    });
    if (!plans.length) {
        sources.forEach((source) => {
            const queryPart = sourceQueries[source];
            if (queryPart) plans.push({ id: `source-${source}`, label: sourceLabel(source), query: queryPart });
        });
    }
    return dedupePlans(plans);
}

function hasFocusedQuery(query) {
    return Boolean(state.selectedEntities.size) || focusedQueryRules.some((rule) => rule.terms.some((term) => query.raw.includes(normalize(term))));
}

function dedupePlans(plans) {
    const seen = new Set();
    return plans.filter((plan) => {
        const key = plan.query;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function requestOverpass(endpoint, query, timeoutMs) {
    const body = new URLSearchParams({ data: query });
    const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
    }, timeoutMs);
    return await parseOverpassResponse(response);
}

async function fetchPhotonFallback(plans, queryRadius, rawLimit) {
    const terms = dedupeText(plans.flatMap(nominatimTermsForPlan)).slice(0, 5);
    if (!terms.length) return [];
    const features = [];
    for (const term of terms) {
        setStatus(`Fallback-Suche: ${term} ...`);
        const params = new URLSearchParams({
            q: term,
            lat: String(state.center[0]),
            lon: String(state.center[1]),
            limit: String(Math.max(8, Math.min(35, Math.ceil(rawLimit / Math.max(terms.length, 1))))),
        });
        try {
            const response = await fetchWithTimeout(`https://photon.komoot.io/api/?${params}`, {
                method: "GET",
                headers: { "Accept": "application/geo+json" },
            }, 9000);
            if (!response.ok) continue;
            const data = await response.json();
            features.push(...(data.features || []).map((feature, index) => photonFeatureToFeature(feature, term, index)).filter((feature) => {
                return feature && distanceMeters(state.center[0], state.center[1], feature.lat, feature.lon) <= queryRadius * 1.35;
            }));
        } catch {
            // Keep trying the remaining terms; this is only a resilience fallback.
        }
    }
    return dedupeFeatures(features).slice(0, rawLimit);
}

function photonFeatureToFeature(feature, term, index) {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;
    const props = feature.properties || {};
    const tags = {
        name: props.name || term,
        class: props.osm_key,
        type: props.osm_value,
        search: term,
        city: props.city,
        street: props.street,
        country: props.country,
    };
    if (props.osm_key && props.osm_value) tags[props.osm_key] = props.osm_value;
    return {
        id: `photon-${term}-${props.osm_type || "x"}-${props.osm_id || index}`,
        source: "Photon",
        lat: Number(coordinates[1]),
        lon: Number(coordinates[0]),
        name: props.name || `${term} ${index + 1}`,
        tags,
    };
}

async function fetchNominatimFallback(plans, queryRadius, rawLimit) {
    const terms = dedupeText(plans.flatMap(nominatimTermsForPlan)).slice(0, 5);
    if (!terms.length) return [];
    const bbox = bboxAround(state.center, queryRadius);
    const features = [];
    for (const term of terms) {
        setStatus(`Fallback-Suche: ${term} ...`);
        const params = new URLSearchParams({
            format: "geojson",
            q: term,
            limit: String(Math.max(8, Math.min(30, Math.ceil(rawLimit / Math.max(terms.length, 1))))),
            bounded: "1",
            viewbox: `${bbox.west},${bbox.north},${bbox.east},${bbox.south}`,
            addressdetails: "0",
            extratags: "1",
            namedetails: "1",
        });
        try {
            const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`, {
                method: "GET",
                headers: { "Accept": "application/geo+json" },
            }, 9000);
            const data = await response.json();
            features.push(...(data.features || []).map((feature, index) => nominatimFeatureToFeature(feature, term, index)).filter(Boolean));
        } catch {
            // Keep trying the remaining terms; this is only a resilience fallback.
        }
    }
    return dedupeFeatures(features).slice(0, rawLimit);
}

function nominatimTermsForPlan(plan) {
    const id = plan.id.replace(/^entity-|^focus-/, "");
    const byId = {
        restaurant: ["restaurant"],
        cafe: ["cafe"],
        church: ["church", "place of worship"],
        parking: ["parking"],
        historic: ["historic", "monument"],
        school: ["school"],
        playground: ["playground"],
        supermarket: ["supermarket"],
        bus_stop: ["bus stop"],
        viewpoint: ["viewpoint"],
    };
    if (byId[id]) return byId[id];
    if (/restaurant/i.test(plan.label)) return ["restaurant"];
    if (/cafe/i.test(plan.label)) return ["cafe"];
    if (/kirche/i.test(plan.label)) return ["church"];
    if (/parkplatz/i.test(plan.label)) return ["parking"];
    if (/histor/i.test(plan.label)) return ["historic"];
    return [];
}

function nominatimFeatureToFeature(feature, term, index) {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;
    const props = feature.properties || {};
    const tags = {
        name: props.name || props.display_name || term,
        class: props.class,
        type: props.type,
        search: term,
        ...(props.extratags || {}),
    };
    if (props.class && props.type) tags[props.class] = props.type;
    return {
        id: `nominatim-${term}-${props.osm_type || "x"}-${props.osm_id || index}`,
        source: "Nominatim",
        lat: Number(coordinates[1]),
        lon: Number(coordinates[0]),
        name: props.name || props.display_name || `${term} ${index + 1}`,
        tags,
    };
}

function bboxAround(center, meters) {
    const [lat, lon] = center;
    const latDelta = meters / 111320;
    const lonDelta = meters / (111320 * Math.max(Math.cos(lat * Math.PI / 180), .2));
    return {
        west: lon - lonDelta,
        south: lat - latDelta,
        east: lon + lonDelta,
        north: lat + latDelta,
    };
}

function dedupeText(values) {
    const seen = new Set();
    return values.filter((value) => {
        const key = normalize(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function parseOverpassResponse(response) {
    const text = await response.text();
    if (!response.ok) {
        const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        throw new Error(`HTTP ${response.status}${clean ? ` ${clean.slice(0, 120)}` : ""}`);
    }
    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Overpass lieferte kein JSON");
    }
}

async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === "AbortError") throw new Error(`Overpass-Timeout nach ${Math.round(timeoutMs / 1000)} Sekunden`);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function setLoading(isLoading) {
    state.loading = isLoading;
    $("#runBtn").disabled = isLoading;
    $("#runBtn").textContent = isLoading ? "Laedt ..." : "Analyse starten";
}

function sourceLabel(source) {
    return {
        building: "Gebaeude",
        vegetation: "Vegetation",
        poi: "POIs",
        transport: "Verkehr",
        water: "Wasser",
    }[source] || source;
}

function dedupeFeatures(features) {
    const seen = new Set();
    return features.filter((feature) => {
        if (seen.has(feature.id)) return false;
        seen.add(feature.id);
        return true;
    });
}

function osmElementToFeature(element) {
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    const tags = element.tags || {};
    return {
        id: `osm-${element.type}-${element.id}`,
        source: "OSM",
        lat,
        lon,
        name: tags.name || readableType(tags) || `${element.type} ${element.id}`,
        tags,
    };
}

function readableType(tags) {
    const keys = ["amenity", "shop", "tourism", "historic", "building", "natural", "landuse", "leisure", "highway", "waterway"];
    const key = keys.find((candidate) => tags[candidate]);
    return key ? `${key}: ${tags[key]}` : "";
}

function parseQuery(raw, fallbackSources) {
    const text = normalize(raw);
    const active = new Set(fallbackSources);
    const entities = selectedEntityObjects();
    const entityTerms = entities.flatMap((item) => [item.label, ...item.terms]).map(normalize);
    const terms = text.split(/[^a-z0-9äöüß]+/i).filter((term) => term.length > 2);
    Object.entries(queryLexicon).forEach(([group, words]) => {
        if (words.some((word) => text.includes(normalize(word)))) active.add(group);
    });
    entities.forEach((item) => active.add(item.group));
    return {
        raw: text,
        terms: Array.from(new Set([...terms, ...entityTerms])).filter((term) => term.length > 2),
        groups: Array.from(active),
        entities,
    };
}

function scoreFeatures(features, query) {
    const weights = normalizedWeights();
    const density = buildDensityIndex(features);
    return features.map((feature) => {
        const tagText = normalize(`${feature.name} ${Object.entries(feature.tags).map(([key, value]) => `${key} ${value}`).join(" ")}`);
        const groupHits = query.groups.filter((group) => matchesGroup(feature.tags, group));
        const termHits = query.terms.filter((term) => tagText.includes(term));
        const entityHits = query.entities.filter((item) => matchesEntityFeature(feature.tags, item));
        const distanceScore = Math.max(0, 1 - distanceMeters(state.center[0], state.center[1], feature.lat, feature.lon) / radius());
        const localDensity = density.get(feature.id) || 0;
        const entityScore = query.entities.length ? entityHits.length / query.entities.length : 0;
        const poiScore = clamp((termHits.length / Math.max(query.terms.length, 1)) * .45 + (groupHits.length / Math.max(query.groups.length, 1)) * .25 + entityScore * .55);
        const contextScore = clamp(distanceScore * .5 + groupHits.length * .14 + relationBonus(feature.tags, query.groups));
        const densityScore = clamp(localDensity / 12);
        const reviews = findReviewsForFeature(feature);
        const reviewScore = reviewConfidence(reviews);
        const score = Math.round(100 * clamp(poiScore * weights.poi + contextScore * weights.context + densityScore * weights.density + reviewScore * .06));
        return {
            ...feature,
            reviews,
            score,
            factors: {
                query: Math.round(poiScore * 100),
                context: Math.round(contextScore * 100),
                density: Math.round(densityScore * 100),
                reviews: Math.round(reviewScore * 100),
                hits: [...entityHits.map((item) => item.label), ...termHits, ...groupHits].slice(0, 8),
            },
        };
    });
}

function normalizedWeights() {
    const poi = Number($("#poiWeight").value);
    const context = Number($("#contextWeight").value);
    const density = Number($("#densityWeight").value);
    const sum = Math.max(1, poi + context + density);
    return { poi: poi / sum, context: context / sum, density: density / sum };
}

function matchesGroup(tags, group) {
    const keys = tagGroups[group] || [];
    return keys.some((key) => Object.prototype.hasOwnProperty.call(tags, key));
}

function matchesEntityFeature(tags, item) {
    return item.matchers.some((matcher) => {
        const value = normalize(tags[matcher.key]);
        const expectedValues = matcher.values.flatMap((expected) => String(expected).split("|")).filter(Boolean);
        return value && (!expectedValues.length || expectedValues.some((expected) => value.includes(normalize(expected))));
    });
}

function relationBonus(tags, groups) {
    let bonus = 0;
    if (groups.includes("vegetation") && (tags.leisure === "playground" || tags.leisure === "park")) bonus += .12;
    if (groups.includes("building") && tags.building && tags.building !== "no") bonus += .16;
    if (groups.includes("transport") && (tags.highway || tags.public_transport || tags.railway)) bonus += .14;
    if (groups.includes("water") && (tags.waterway || tags.water || tags.bridge)) bonus += .14;
    if (groups.includes("poi") && (tags.amenity || tags.shop || tags.tourism || tags.historic)) bonus += .18;
    return bonus;
}

function buildDensityIndex(features) {
    const index = new Map(features.map((feature) => [feature.id, 0]));
    for (let i = 0; i < features.length; i += 1) {
        for (let j = i + 1; j < features.length; j += 1) {
            if (distanceMeters(features[i].lat, features[i].lon, features[j].lat, features[j].lon) <= 160) {
                index.set(features[i].id, index.get(features[i].id) + 1);
                index.set(features[j].id, index.get(features[j].id) + 1);
            }
        }
    }
    return index;
}

function renderResults(results, query) {
    clearResultMarkers();
    const list = $("#resultList");
    list.innerHTML = "";
    $("#resultCount").textContent = results.length;
    $("#bestScore").textContent = results.length ? `${results[0].score}%` : "0%";
    renderFactors(results, query);
    const bounds = [];
    results.forEach((result, index) => {
        const marker = createMarker(result);
        state.resultSource.addFeature(marker);
        bounds.push([result.lat, result.lon]);
        const item = resultListItem(result, index, marker);
        list.appendChild(item);
    });
    if (bounds.length) fitResultBounds(bounds);
}

function clearResultMarkers() {
    state.resultSource.clear();
    hidePopup();
}

function fitResultBounds(points) {
    if (!points.length) return;
    const extent = ol.extent.boundingExtent(points.map(([lat, lon]) => ol.proj.fromLonLat([lon, lat])));
    state.view.fit(extent, {
        padding: [90, 90, 90, 90],
        maxZoom: 16,
        duration: 550,
    });
}

function renderFactors(results, query) {
    const factorList = $("#factorList");
    const avg = (key) => results.length ? Math.round(results.reduce((sum, item) => sum + item.factors[key], 0) / results.length) : 0;
    factorList.innerHTML = "";
    [
        ["Query-Tags", `${avg("query")}%`],
        ["Umgebung", `${avg("context")}%`],
        ["Dichte", `${avg("density")}%`],
        ["Reviews", state.reviewRecords.length ? `${state.reviewRecords.length} geladen` : "keine"],
        ["Entitaeten", selectedEntityObjects().map((item) => item.label).join(", ") || "keine"],
        ["Aktive Gruppen", query.groups.join(", ") || "keine"],
    ].forEach(([name, value]) => {
        const row = document.createElement("div");
        row.className = "factor";
        row.innerHTML = `<span>${escapeHtml(name)}</span><strong>${escapeHtml(value)}</strong>`;
        factorList.appendChild(row);
    });
}

function createMarker(result) {
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([result.lon, result.lat])),
        result,
        popupHtml: popupHtml(result),
    });
    return feature;
}

function popupHtml(result) {
    const tags = Object.entries(result.tags).slice(0, 8).map(([key, value]) => `${key}=${value}`).join(", ");
    return `<p class="popup-title">${escapeHtml(result.name)}</p>
        <strong>${result.score}% Wahrscheinlichkeit</strong>
        <div>Query ${result.factors.query}% · Umgebung ${result.factors.context}% · Dichte ${result.factors.density}%</div>
        ${reviewsHtml(result)}
        ${externalLinksHtml(result)}
        <p class="popup-tags">${escapeHtml(tags)}</p>`;
}

function resultListItem(result, index, marker) {
    const template = $("#resultTemplate").content.cloneNode(true);
    const button = template.querySelector(".result-item");
    template.querySelector(".rank").textContent = index + 1;
    template.querySelector("strong").textContent = result.name;
    const reviewText = result.reviews?.length ? `rating ${averageRating(result.reviews).toFixed(1)} aus ${result.reviews.length} Quellen` : "";
    template.querySelector("small").textContent = [result.source, result.factors.hits.join(", ") || readableType(result.tags) || "Kontexttreffer", reviewText].filter(Boolean).join(" · ");
    template.querySelector(".probability").textContent = `${result.score}%`;
    button.addEventListener("click", () => {
        setMapView([result.lat, result.lon], 17);
        openMarkerPopup(marker);
    });
    return template;
}

function openMarkerPopup(marker) {
    openFeaturePopup(marker, marker.get("popupHtml"));
}

function openFeaturePopup(feature, html) {
    if (!html) return;
    state.popupElement.hidden = false;
    state.popupElement.innerHTML = html;
    state.popupOverlay.setPosition(feature.getGeometry().getCoordinates());
}

function hidePopup() {
    if (!state.popupElement) return;
    state.popupElement.hidden = true;
    state.popupOverlay?.setPosition(undefined);
}

function clearMap() {
    clearResultMarkers();
    state.imageSource.clear();
    state.results = [];
    $("#resultList").innerHTML = "";
    $("#resultCount").textContent = "0";
    $("#bestScore").textContent = "0%";
    $("#factorList").innerHTML = "";
    setStatus("Karte geleert.");
}

async function analyzeImageFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const url = URL.createObjectURL(file);
    const preview = $("#imagePreview");
    preview.src = url;
    preview.hidden = false;
    try {
        const gps = extractGpsFromExif(buffer);
        const image = await loadImage(url);
        const hints = analyzeImagePixels(image, gps, file.name);
        state.imageHints = hints;
        renderImageSignals(hints, gps);
        if (gps) {
            state.center = [gps.lat, gps.lon];
            setMapView(state.center, 16);
            state.imageSource.clear();
            const imageFeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([gps.lon, gps.lat])),
                popupHtml: "<strong>Fotostandort aus EXIF</strong>",
            });
            state.imageSource.addFeature(imageFeature);
            openFeaturePopup(imageFeature, imageFeature.get("popupHtml"));
            drawSearchCircle();
            setStatus("Bild-GPS gefunden. Suchraum wurde auf das Foto gesetzt.");
        } else {
            setStatus(`${hints.length} Bildhinweise erkannt. Mit + in die Query uebernehmen.`);
        }
    } catch (error) {
        setStatus(`Bildanalyse fehlgeschlagen: ${error.message}`);
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
        image.src = url;
    });
}

function analyzeImagePixels(image, gps, fileName) {
    const canvas = document.createElement("canvas");
    const maxSide = 180;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const total = pixels.length / 4;
    const counts = { green: 0, blue: 0, gray: 0, warm: 0, dark: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (g > r * 1.12 && g > b * 1.08) counts.green += 1;
        if (b > r * 1.1 && b > g * 1.02) counts.blue += 1;
        if (max - min < 28 && max > 70) counts.gray += 1;
        if (r > g * 1.08 && g > b * 1.08) counts.warm += 1;
        if (max < 58) counts.dark += 1;
    }
    const ratio = (key) => counts[key] / Math.max(total, 1);
    const hints = [];
    if (gps) hints.push(imageHint("GPS-Koordinaten", "exakte Fotokoordinaten", "transport", .95, []));
    if (ratio("green") > .22) hints.push(imageHint("viel Gruen", "Wald, Park, Wiese, Baeume", "vegetation", ratio("green"), ["forest", "meadow"]));
    if (ratio("blue") > .18) hints.push(imageHint("blaues Wasser/Himmel", "Wasser, Fluss, Bruecke, Ufer", "water", ratio("blue"), ["river", "bridge"]));
    if (ratio("gray") > .28) hints.push(imageHint("graue Flaechen", "Strasse, Wege, Gebaeude, Haltestellen", "transport", ratio("gray"), ["bus_stop"]));
    if (ratio("warm") > .16) hints.push(imageHint("warme Fassaden/Daecher", "Satteldach, Wohngebiet, Fachwerk", "building", ratio("warm"), ["gabled_roof", "half_timbered", "detached"]));
    if (ratio("dark") > .2 && ratio("green") > .14) hints.push(imageHint("dunkle Vegetation", "Waldnaehe, dichter Bewuchs", "vegetation", ratio("dark"), ["forest"]));
    const nameText = normalize(fileName);
    entityCatalog.forEach((item) => {
        if ([item.label, ...item.terms].some((term) => nameText.includes(normalize(term)))) {
            hints.push(imageHint(`Dateiname: ${item.label}`, item.label, item.group, .8, [item.id]));
        }
    });
    return hints;
}

function imageHint(label, query, group, confidence, entityIds) {
    return { label, query, group, confidence: clamp(confidence), entityIds };
}

function renderImageSignals(hints, gps) {
    const box = $("#imageSignals");
    box.innerHTML = "";
    if (!hints.length) {
        const empty = document.createElement("div");
        empty.className = "signal";
        empty.innerHTML = "<span>keine stabilen Hinweise</span><strong>0%</strong>";
        box.appendChild(empty);
        return;
    }
    hints.forEach((hint) => {
        const row = document.createElement("div");
        row.className = "signal";
        row.innerHTML = `<span>${escapeHtml(hint.label)}</span><strong>${Math.round(hint.confidence * 100)}%</strong>`;
        box.appendChild(row);
    });
    if (gps) {
        const row = document.createElement("div");
        row.className = "signal";
        row.innerHTML = `<span>${gps.lat.toFixed(5)}, ${gps.lon.toFixed(5)}</span><strong>GPS</strong>`;
        box.appendChild(row);
    }
}

function applyImageHintsToQuery() {
    if (!state.imageHints.length) {
        setStatus("Noch keine Bildhinweise vorhanden.");
        return;
    }
    const queryText = state.imageHints.map((hint) => hint.query).filter(Boolean).join(", ");
    const input = $("#queryInput");
    input.value = appendUniqueText(input.value, queryText);
    state.imageHints.flatMap((hint) => hint.entityIds).forEach((id) => state.selectedEntities.add(id));
    syncEntityQueryText();
    renderEntityCatalog();
    renderSelectedEntities();
    setStatus("Bildhinweise wurden in Query und Entitaeten uebernommen.");
}

function appendUniqueText(current, addition) {
    if (!addition) return current;
    const normalizedCurrent = normalize(current);
    const parts = addition.split(",").map((part) => part.trim()).filter(Boolean);
    const missing = parts.filter((part) => !normalizedCurrent.includes(normalize(part)));
    return missing.length ? `${current.trim()}${current.trim() ? ", " : ""}${missing.join(", ")}` : current;
}

function extractGpsFromExif(buffer) {
    try {
        const view = new DataView(buffer);
        if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return null;
        let offset = 2;
        while (offset + 4 < view.byteLength) {
            if (view.getUint8(offset) !== 0xff) return null;
            const marker = view.getUint8(offset + 1);
            const size = view.getUint16(offset + 2, false);
            if (marker === 0xe1 && readAscii(view, offset + 4, 6) === "Exif\0\0") {
                const tiffOffset = offset + 10;
                const endian = view.getUint16(tiffOffset, false);
                const little = endian === 0x4949;
                if (!little && endian !== 0x4d4d) return null;
                const firstIfdOffset = tiffOffset + view.getUint32(tiffOffset + 4, little);
                const ifd0 = readIfdEntries(view, tiffOffset, firstIfdOffset, little);
                const gpsPointer = ifd0.get(0x8825);
                if (!gpsPointer?.value) return null;
                const gpsIfd = readIfdEntries(view, tiffOffset, tiffOffset + gpsPointer.value, little);
                const lat = gpsCoordinate(view, gpsIfd.get(0x0002), asciiTag(view, gpsIfd.get(0x0001)), little);
                const lon = gpsCoordinate(view, gpsIfd.get(0x0004), asciiTag(view, gpsIfd.get(0x0003)), little);
                return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
            }
            offset += 2 + size;
        }
    } catch {
        return null;
    }
    return null;
}

function readIfdEntries(view, tiffOffset, ifdOffset, little) {
    const entries = new Map();
    const count = view.getUint16(ifdOffset, little);
    for (let i = 0; i < count; i += 1) {
        const entryOffset = ifdOffset + 2 + i * 12;
        const tag = view.getUint16(entryOffset, little);
        const type = view.getUint16(entryOffset + 2, little);
        const entryCount = view.getUint32(entryOffset + 4, little);
        const valueOffset = view.getUint32(entryOffset + 8, little);
        const bytes = typeByteSize(type) * entryCount;
        entries.set(tag, {
            type,
            count: entryCount,
            value: type === 4 && entryCount === 1 ? valueOffset : null,
            dataOffset: bytes <= 4 ? entryOffset + 8 : tiffOffset + valueOffset,
        });
    }
    return entries;
}

function typeByteSize(type) {
    return { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[type] || 1;
}

function asciiTag(view, entry) {
    if (!entry) return "";
    return readAscii(view, entry.dataOffset, entry.count).replace(/\0/g, "");
}

function gpsCoordinate(view, entry, ref, little) {
    if (!entry || entry.type !== 5 || entry.count < 3) return null;
    const parts = [];
    for (let i = 0; i < 3; i += 1) {
        const offset = entry.dataOffset + i * 8;
        const numerator = view.getUint32(offset, little);
        const denominator = view.getUint32(offset + 4, little) || 1;
        parts.push(numerator / denominator);
    }
    const value = parts[0] + parts[1] / 60 + parts[2] / 3600;
    return ref === "S" || ref === "W" ? -value : value;
}

function readAscii(view, offset, length) {
    let output = "";
    for (let i = 0; i < length && offset + i < view.byteLength; i += 1) {
        output += String.fromCharCode(view.getUint8(offset + i));
    }
    return output;
}

async function importReviewFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
        const reviews = file.name.toLowerCase().endsWith(".csv") ? parseReviewCsv(text) : parseReviewJson(JSON.parse(text));
        state.reviewRecords = reviews;
        renderReviewSummary();
        setStatus(`${reviews.length} Review-Datensaetze geladen.`);
        if (state.results.length) {
            const query = parseQuery($("#queryInput").value, selectedSources());
            state.results = scoreFeatures(state.results, query).sort((a, b) => b.score - a.score);
            renderResults(state.results, query);
        }
    } catch (error) {
        setStatus(`Review-Import fehlgeschlagen: ${error.message}`);
    }
}

function parseReviewJson(data) {
    const rows = Array.isArray(data) ? data : data.features || [];
    return rows.map((row, index) => {
        const props = row.properties || row;
        const coords = row.geometry?.type === "Point" ? row.geometry.coordinates : null;
        return normalizeReviewRecord({
            name: props.name || props.title,
            source: props.source || props.platform || "Review",
            rating: props.rating || props.stars || props.score,
            count: props.count || props.reviews || props.review_count,
            url: props.url || props.link,
            text: props.text || props.review,
            lat: props.lat || props.latitude || coords?.[1],
            lon: props.lon || props.lng || props.longitude || coords?.[0],
        }, index);
    }).filter(Boolean);
}

function parseReviewCsv(text) {
    const rows = parseCsvRows(text);
    const header = rows.shift()?.map((cell) => normalize(cell)) || [];
    return rows.map((row, index) => {
        const get = (...names) => {
            const target = names.map(normalize);
            const found = header.findIndex((item) => target.includes(item));
            return found >= 0 ? row[found] : "";
        };
        return normalizeReviewRecord({
            name: get("name", "title", "restaurant"),
            source: get("source", "platform", "map"),
            rating: get("rating", "stars", "score"),
            count: get("count", "reviews", "review_count"),
            url: get("url", "link"),
            text: get("text", "review"),
            lat: get("lat", "latitude"),
            lon: get("lon", "lng", "longitude"),
        }, index);
    }).filter(Boolean);
}

function normalizeReviewRecord(raw, index) {
    const rating = Number(String(raw.rating || "").replace(",", "."));
    const lat = Number(String(raw.lat || "").replace(",", "."));
    const lon = Number(String(raw.lon || "").replace(",", "."));
    if (!raw.name && (!Number.isFinite(lat) || !Number.isFinite(lon))) return null;
    return {
        id: `review-${index}`,
        name: raw.name || `Review ${index + 1}`,
        source: raw.source || "Review",
        rating: Number.isFinite(rating) ? rating : null,
        count: Number(raw.count) || null,
        url: raw.url || "",
        text: raw.text || "",
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
    };
}

function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const delimiter = guessCsvDelimiter(text);
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];
        if (char === '"' && quoted && next === '"') {
            cell += '"';
            i += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === delimiter && !quoted) {
            row.push(cell.trim());
            cell = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && next === "\n") i += 1;
            row.push(cell.trim());
            if (row.some(Boolean)) rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += char;
        }
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
}

function guessCsvDelimiter(text) {
    const firstLine = text.split(/\r?\n/, 1)[0] || "";
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    return semicolons > commas ? ";" : ",";
}

function renderReviewSummary() {
    const box = $("#reviewSummary");
    const sources = [...new Set(state.reviewRecords.map((review) => review.source))];
    box.textContent = `${state.reviewRecords.length} Review-Datensaetze${sources.length ? ` aus ${sources.join(", ")}` : ""}`;
}

function findReviewsForFeature(feature) {
    const featureName = normalize(feature.name);
    return state.reviewRecords.filter((review) => {
        const reviewName = normalize(review.name);
        const nameMatch = featureName && reviewName && (featureName === reviewName || featureName.includes(reviewName) || reviewName.includes(featureName));
        const geoMatch = Number.isFinite(review.lat) && Number.isFinite(review.lon) && distanceMeters(feature.lat, feature.lon, review.lat, review.lon) <= 90;
        return nameMatch || geoMatch;
    });
}

function reviewConfidence(reviews) {
    if (!reviews.length) return 0;
    return clamp((averageRating(reviews) || 0) / 5);
}

function averageRating(reviews) {
    const values = reviews.map((review) => review.rating).filter((rating) => Number.isFinite(rating));
    return values.length ? values.reduce((sum, rating) => sum + rating, 0) / values.length : 0;
}

function reviewsHtml(result) {
    if (!result.reviews?.length) return "";
    const rows = result.reviews.slice(0, 4).map((review) => {
        const rating = Number.isFinite(review.rating) ? `${review.rating.toFixed(1)}/5` : "ohne Rating";
        const count = review.count ? ` (${review.count})` : "";
        const label = `${review.source}: ${rating}${count}`;
        return review.url
            ? `<a class="review-pill" href="${escapeHtml(review.url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`
            : `<span class="review-pill">${escapeHtml(label)}</span>`;
    }).join("");
    return `<div class="review-stack"><div class="review-row">${rows}</div></div>`;
}

function externalLinksHtml(result) {
    if (!isFoodPlace(result)) return "";
    const q = encodeURIComponent(`${result.name} ${state.center[0].toFixed(4)},${state.center[1].toFixed(4)}`);
    const lat = encodeURIComponent(result.lat);
    const lon = encodeURIComponent(result.lon);
    return `<div class="external-links">
        <a class="external-link" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Google Maps</a>
        <a class="external-link" href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}" target="_blank" rel="noopener">OSM</a>
        <a class="external-link" href="https://www.tripadvisor.com/Search?q=${q}" target="_blank" rel="noopener">Tripadvisor</a>
    </div>`;
}

function isFoodPlace(result) {
    return ["restaurant", "cafe", "fast_food", "bar", "pub"].includes(result.tags.amenity) || Boolean(result.tags.cuisine);
}

async function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
        const features = file.name.toLowerCase().endsWith(".csv") ? parseCsv(text) : parseGeoJson(JSON.parse(text));
        state.importedFeatures = features;
        setStatus(`${features.length} importierte Punkte aus ${file.name} geladen.`);
    } catch (error) {
        setStatus(`Import fehlgeschlagen: ${error.message}`);
    }
}

function parseGeoJson(data) {
    const features = data.type === "FeatureCollection" ? data.features : [data];
    return features.map((feature, index) => {
        const coords = coordinatesFromGeometry(feature.geometry || feature);
        if (!coords) return null;
        const props = feature.properties || {};
        return {
            id: `import-${index}-${coords[0]}-${coords[1]}`,
            source: "Import",
            lat: coords[1],
            lon: coords[0],
            name: props.name || props.title || `Importpunkt ${index + 1}`,
            tags: props,
        };
    }).filter(Boolean);
}

function coordinatesFromGeometry(geometry) {
    if (!geometry) return null;
    if (geometry.type === "Point") return geometry.coordinates;
    if (geometry.type === "Polygon") return geometry.coordinates?.[0]?.[0] || null;
    if (geometry.type === "LineString") return geometry.coordinates?.[0] || null;
    if (geometry.type === "MultiPolygon") return geometry.coordinates?.[0]?.[0]?.[0] || null;
    return null;
}

function parseCsv(text) {
    const rows = text.trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
    const header = rows.shift().map((cell) => cell.toLowerCase());
    const latIndex = header.findIndex((cell) => ["lat", "latitude", "breite"].includes(cell));
    const lonIndex = header.findIndex((cell) => ["lon", "lng", "longitude", "laenge", "länge"].includes(cell));
    if (latIndex < 0 || lonIndex < 0) throw new Error("CSV braucht lat/lon oder latitude/longitude Spalten.");
    return rows.map((row, index) => {
        const tags = Object.fromEntries(header.map((key, column) => [key, row[column] || ""]));
        return {
            id: `csv-${index}`,
            source: "CSV",
            lat: Number(row[latIndex]),
            lon: Number(row[lonIndex]),
            name: tags.name || tags.title || `CSV-Punkt ${index + 1}`,
            tags,
        };
    }).filter((feature) => Number.isFinite(feature.lat) && Number.isFinite(feature.lon));
}

function exportGeoJson() {
    const geojson = {
        type: "FeatureCollection",
        features: state.results.map((result) => ({
            type: "Feature",
            properties: {
                name: result.name,
                score: result.score,
                source: result.source,
                ...result.tags,
            },
            geometry: {
                type: "Point",
                coordinates: [result.lon, result.lat],
            },
        })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gvis-ergebnisse.geojson";
    link.click();
    URL.revokeObjectURL(url);
}

function distanceMeters(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;
    const toRad = (degree) => degree * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replaceAll("ä", "ae")
        .replaceAll("ö", "oe")
        .replaceAll("ü", "ue")
        .replaceAll("ß", "ss");
}

function clamp(value) {
    return Math.max(0, Math.min(1, value));
}

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[char]));
}

init();
