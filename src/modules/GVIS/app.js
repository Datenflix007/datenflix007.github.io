const state = {
    map: null,
    markerLayer: null,
    searchCircle: null,
    imageMarker: null,
    center: [50.9271, 11.5892],
    importedFeatures: [],
    reviewRecords: [],
    selectedEntities: new Set(),
    imageHints: [],
    results: [],
    loading: false,
};

const overpassEndpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
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
    state.map = L.map("map", {
        zoomControl: false,
        scrollWheelZoom: false,
        wheelDebounceTime: 80,
        trackResize: true,
        preferCanvas: true,
    }).setView(state.center, 14);
    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    const basemaps = createBasemaps();
    basemaps["Carto Light"].addTo(state.map);
    L.control.layers(basemaps, null, { position: "bottomright", collapsed: true }).addTo(state.map);
    state.markerLayer = L.layerGroup().addTo(state.map);
    drawSearchCircle();
    renderEntityCatalog();
    renderSelectedEntities();
    bindUi();
    window.addEventListener("resize", () => state.map.invalidateSize());
    if ("ResizeObserver" in window) {
        new ResizeObserver(() => state.map.invalidateSize()).observe($("#map"));
    }
    [0, 120, 350, 800].forEach((delay) => setTimeout(() => state.map.invalidateSize(), delay));
}

function createBasemaps() {
    const common = {
        maxZoom: 20,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: false,
    };
    return {
        "Carto Light": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            ...common,
            subdomains: "abcd",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }),
        "Carto Voyager": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            ...common,
            subdomains: "abcd",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }),
        "Esri Satellit": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            ...common,
            attribution: "Tiles &copy; Esri",
        }),
        "OSM Standard": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            ...common,
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }),
    };
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

function drawSearchCircle() {
    if (!state.map) return;
    if (state.searchCircle) state.searchCircle.remove();
    state.searchCircle = L.circle(state.center, {
        radius: radius(),
        color: "#2563eb",
        weight: 2,
        fillColor: "#60a5fa",
        fillOpacity: .08,
    }).addTo(state.map);
}

async function searchPlace() {
    const raw = $("#placeInput").value.trim();
    if (!raw) return;
    const coordinateMatch = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinateMatch) {
        state.center = [Number(coordinateMatch[1]), Number(coordinateMatch[2])];
        state.map.setView(state.center, 14);
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
        state.map.setView(state.center, 14);
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
        state.map.setView(state.center, 15);
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
    setStatus("OSM-Daten werden begrenzt ueber Overpass geladen ...");
    try {
        const osmFeatures = sources.length || state.selectedEntities.size ? await fetchOverpass(sources) : [];
        const allFeatures = [...osmFeatures, ...state.importedFeatures];
        if (!allFeatures.length) {
            renderResults([], parseQuery($("#queryInput").value, sources));
            setStatus("Keine passenden Daten im Suchraum gefunden. Radius, Ort oder Datenquellen anpassen.");
            return;
        }
        const query = parseQuery($("#queryInput").value, sources);
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

async function fetchOverpass(sources) {
    const queryRadius = Math.min(radius(), 2500);
    const selectedEntities = selectedEntityObjects();
    const requestCount = Math.max(sources.length + selectedEntities.length, 1);
    const rawLimit = Math.max(80, Math.min(420, Math.ceil(Number($("#limitSelect").value) * 2.4 / requestCount)));
    const features = [];
    const failures = [];

    for (const source of sources) {
        const queryPart = sourceQueries[source];
        if (!queryPart) continue;
        setStatus(`Lade ${sourceLabel(source)} von OSM ...`);
        try {
            const sourceFeatures = await fetchOverpassSource(queryPart, queryRadius, rawLimit);
            features.push(...sourceFeatures);
        } catch (error) {
            failures.push(`${sourceLabel(source)}: ${error.message}`);
        }
    }

    for (const item of selectedEntities) {
        setStatus(`Lade Entitaet ${item.label} von OSM ...`);
        try {
            const entityFeatures = await fetchOverpassSource(item.query, queryRadius, rawLimit);
            features.push(...entityFeatures);
        } catch (error) {
            failures.push(`${item.label}: ${error.message}`);
        }
    }

    if (!features.length && failures.length) {
        throw new Error(failures.join(" | "));
    }
    if (failures.length) {
        setStatus(`Teilergebnis geladen. Nicht erreichbar: ${failures.map((failure) => failure.split(":")[0]).join(", ")}.`);
    }
    return dedupeFeatures(features);
}

async function fetchOverpassSource(queryPart, queryRadius, rawLimit) {
    const query = `[out:json][timeout:10];(${queryPart});out center qt ${rawLimit};`
        .replaceAll("RADIUS", String(queryRadius))
        .replaceAll("LAT", String(state.center[0]))
        .replaceAll("LON", String(state.center[1]));
    let lastError = null;
    for (const endpoint of overpassEndpoints) {
        try {
            const data = await requestOverpass(endpoint, query);
            return data.elements.map(osmElementToFeature).filter(Boolean);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("Keine Overpass-Antwort erhalten");
}

async function requestOverpass(endpoint, query) {
    const getUrl = `${endpoint}?data=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(getUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
    }, 7000);
    return await parseOverpassResponse(response);
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
    state.markerLayer.clearLayers();
    const list = $("#resultList");
    list.innerHTML = "";
    $("#resultCount").textContent = results.length;
    $("#bestScore").textContent = results.length ? `${results[0].score}%` : "0%";
    renderFactors(results, query);
    const bounds = [];
    results.forEach((result, index) => {
        const marker = createMarker(result).addTo(state.markerLayer);
        marker.bindPopup(popupHtml(result));
        bounds.push([result.lat, result.lon]);
        const item = resultListItem(result, index, marker);
        list.appendChild(item);
    });
    if (bounds.length) state.map.fitBounds(bounds, { maxZoom: 16, padding: [40, 40] });
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
    const size = Math.max(12, Math.round(14 + result.score / 4));
    const color = result.score >= 70 ? "#16a34a" : result.score >= 42 ? "#f59e0b" : "#e11d48";
    return L.circleMarker([result.lat, result.lon], {
        radius: size / 2,
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: .82,
        className: "probability-marker",
    });
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
        state.map.setView([result.lat, result.lon], 17);
        marker.openPopup();
    });
    return template;
}

function clearMap() {
    state.markerLayer.clearLayers();
    if (state.imageMarker) {
        state.imageMarker.remove();
        state.imageMarker = null;
    }
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
            state.map.setView(state.center, 16);
            if (state.imageMarker) state.imageMarker.remove();
            state.imageMarker = L.marker(state.center).addTo(state.map).bindPopup("Fotostandort aus EXIF").openPopup();
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
