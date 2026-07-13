const state = {
    map: null,
    markerLayer: null,
    searchCircle: null,
    center: [50.9271, 11.5892],
    importedFeatures: [],
    results: [],
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
    building: 'way["building"](around:RADIUS,LAT,LON);relation["building"](around:RADIUS,LAT,LON);',
    vegetation: 'node["natural"](around:RADIUS,LAT,LON);way["natural"](around:RADIUS,LAT,LON);relation["natural"](around:RADIUS,LAT,LON);way["landuse"~"forest|grass|meadow|orchard|vineyard|recreation_ground"](around:RADIUS,LAT,LON);way["leisure"~"park|garden|nature_reserve|playground"](around:RADIUS,LAT,LON);',
    poi: 'node["amenity"](around:RADIUS,LAT,LON);node["shop"](around:RADIUS,LAT,LON);node["tourism"](around:RADIUS,LAT,LON);node["historic"](around:RADIUS,LAT,LON);way["amenity"](around:RADIUS,LAT,LON);way["shop"](around:RADIUS,LAT,LON);way["tourism"](around:RADIUS,LAT,LON);',
    transport: 'node["highway"~"bus_stop|crossing|traffic_signals"](around:RADIUS,LAT,LON);node["public_transport"](around:RADIUS,LAT,LON);way["highway"](around:RADIUS,LAT,LON);node["railway"](around:RADIUS,LAT,LON);way["railway"](around:RADIUS,LAT,LON);',
    water: 'node["waterway"](around:RADIUS,LAT,LON);way["waterway"](around:RADIUS,LAT,LON);way["natural"="water"](around:RADIUS,LAT,LON);way["bridge"](around:RADIUS,LAT,LON);',
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function init() {
    state.map = L.map("map", { zoomControl: false }).setView(state.center, 14);
    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(state.map);
    state.markerLayer = L.layerGroup().addTo(state.map);
    drawSearchCircle();
    bindUi();
}

function bindUi() {
    $("#runBtn").addEventListener("click", runAnalysis);
    $("#clearBtn").addEventListener("click", clearMap);
    $("#searchPlaceBtn").addEventListener("click", searchPlace);
    $("#locateBtn").addEventListener("click", locateUser);
    $("#radiusSelect").addEventListener("change", drawSearchCircle);
    $("#fileInput").addEventListener("change", importFile);
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
    const sources = selectedSources();
    if (!sources.length && !state.importedFeatures.length) {
        setStatus("Mindestens eine Datenquelle aktivieren oder Datei importieren.");
        return;
    }
    setStatus("OSM-Daten werden ueber Overpass geladen ...");
    try {
        const osmFeatures = sources.length ? await fetchOverpass(sources) : [];
        const allFeatures = [...osmFeatures, ...state.importedFeatures];
        const query = parseQuery($("#queryInput").value, sources);
        const scored = scoreFeatures(allFeatures, query)
            .sort((a, b) => b.score - a.score)
            .slice(0, Number($("#limitSelect").value));
        state.results = scored;
        renderResults(scored, query);
        setStatus(`${scored.length} Punkte bewertet. Hoehere Werte bedeuten bessere Uebereinstimmung mit Query und Umgebung.`);
    } catch (error) {
        setStatus(`Analyse fehlgeschlagen: ${error.message}`);
    }
}

async function fetchOverpass(sources) {
    const queryParts = sources.map((source) => sourceQueries[source]).filter(Boolean).join("");
    const query = `[out:json][timeout:30];(${queryParts});out center 5000;`
        .replaceAll("RADIUS", String(radius()))
        .replaceAll("LAT", String(state.center[0]))
        .replaceAll("LON", String(state.center[1]));
    let lastError = null;
    for (const endpoint of overpassEndpoints) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: new URLSearchParams({ data: query }),
            });
            if (!response.ok) throw new Error(`${endpoint} HTTP ${response.status}`);
            const data = await response.json();
            return data.elements.map(osmElementToFeature).filter(Boolean);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("Keine Overpass-Antwort erhalten");
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
    const terms = text.split(/[^a-z0-9äöüß]+/i).filter((term) => term.length > 2);
    Object.entries(queryLexicon).forEach(([group, words]) => {
        if (words.some((word) => text.includes(normalize(word)))) active.add(group);
    });
    return { raw: text, terms, groups: Array.from(active) };
}

function scoreFeatures(features, query) {
    const weights = normalizedWeights();
    const density = buildDensityIndex(features);
    return features.map((feature) => {
        const tagText = normalize(`${feature.name} ${Object.entries(feature.tags).map(([key, value]) => `${key} ${value}`).join(" ")}`);
        const groupHits = query.groups.filter((group) => matchesGroup(feature.tags, group));
        const termHits = query.terms.filter((term) => tagText.includes(term));
        const distanceScore = Math.max(0, 1 - distanceMeters(state.center[0], state.center[1], feature.lat, feature.lon) / radius());
        const localDensity = density.get(feature.id) || 0;
        const poiScore = clamp((termHits.length / Math.max(query.terms.length, 1)) * .65 + (groupHits.length / Math.max(query.groups.length, 1)) * .35);
        const contextScore = clamp(distanceScore * .5 + groupHits.length * .14 + relationBonus(feature.tags, query.groups));
        const densityScore = clamp(localDensity / 12);
        const score = Math.round(100 * clamp(poiScore * weights.poi + contextScore * weights.context + densityScore * weights.density));
        return {
            ...feature,
            score,
            factors: {
                query: Math.round(poiScore * 100),
                context: Math.round(contextScore * 100),
                density: Math.round(densityScore * 100),
                hits: [...termHits, ...groupHits].slice(0, 8),
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
        <p class="popup-tags">${escapeHtml(tags)}</p>`;
}

function resultListItem(result, index, marker) {
    const template = $("#resultTemplate").content.cloneNode(true);
    const button = template.querySelector(".result-item");
    template.querySelector(".rank").textContent = index + 1;
    template.querySelector("strong").textContent = result.name;
    template.querySelector("small").textContent = `${result.source} · ${result.factors.hits.join(", ") || readableType(result.tags) || "Kontexttreffer"}`;
    template.querySelector(".probability").textContent = `${result.score}%`;
    button.addEventListener("click", () => {
        state.map.setView([result.lat, result.lon], 17);
        marker.openPopup();
    });
    return template;
}

function clearMap() {
    state.markerLayer.clearLayers();
    state.results = [];
    $("#resultList").innerHTML = "";
    $("#resultCount").textContent = "0";
    $("#bestScore").textContent = "0%";
    $("#factorList").innerHTML = "";
    setStatus("Karte geleert.");
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
