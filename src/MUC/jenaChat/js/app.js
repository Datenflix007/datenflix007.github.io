const poiLayer = document.getElementById("poiLayer");
const mapShell = document.querySelector(".map-shell");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayBadge = document.getElementById("overlayBadge");
const overlayFootnote = document.getElementById("overlayFootnote");

const btnClose = document.getElementById("btnClose");
const btnReset = document.getElementById("btnReset");
const btnNext = document.getElementById("btnNext");

const btnHelp = document.getElementById("btnHelp");
const helpOverlay = document.getElementById("helpOverlay");
const btnCloseHelp = document.getElementById("btnCloseHelp");
const btnCloseHelp2 = document.getElementById("btnCloseHelp2");

const hudText = document.getElementById("hudText");

let pois = [];
let currentIndex = -1;
let isMouseOverMap = false;
let lastPointerEvent = null;

const coordProbe = document.createElement("div");
coordProbe.className = "coord-probe";
coordProbe.setAttribute("aria-hidden", "true");
document.body.appendChild(coordProbe);

async function loadPOIs() {
  const res = await fetch("data/pois.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Konnte data/pois.json nicht laden.");
  pois = await res.json();
}

function createPOIElement(poi, index) {
  const el = document.createElement("button");
  el.className = "poi";
  el.type = "button";
  el.style.left = `${poi.x}%`;
  el.style.top = `${poi.y}%`;
  el.setAttribute("aria-label", poi.title);

  el.innerHTML = `
    <div class="pin"></div>
    <div class="poi-label">${escapeHtml(poi.label ?? poi.title)}</div>
  `;

  el.addEventListener("click", () => openPOI(index));
  return el;
}

function renderPOIs() {
  poiLayer.innerHTML = "";
  pois.forEach((poi, idx) => {
    poiLayer.appendChild(createPOIElement(poi, idx));
  });
}

async function openPOI(index) {
  currentIndex = index;
  const poi = pois[index];

  overlayTitle.textContent = poi.title ?? "POI";
  overlayBadge.textContent = poi.badge ?? "POI";
  overlayFootnote.textContent = poi.markdown ? `Quelle: ${poi.markdown}` : "";

  overlayBody.innerHTML = `<p style="opacity:.8">Lade Inhalt…</p>`;
  showOverlay(overlay);

  try {
    if (!poi.markdown) {
      overlayBody.innerHTML = `<p>Keine Markdown-Datei verknüpft.</p>`;
      return;
    }
    const res = await fetch(poi.markdown, { cache: "no-store" });
    if (!res.ok) throw new Error(`Konnte ${poi.markdown} nicht laden.`);
    const md = await res.text();
    overlayBody.innerHTML = marked.parse(md);
    hudText.textContent = `Geöffnet: ${poi.title}`;
  } catch (err) {
    overlayBody.innerHTML = `<p><strong>Fehler:</strong> ${escapeHtml(err.message)}</p>`;
  }
}

function showOverlay(el) {
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeOverlay(el) {
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");

  // Wenn beide Overlays zu sind: scroll wieder aktivieren
  const anyOpen = document.querySelector(".overlay.is-open");
  if (!anyOpen) document.body.style.overflow = "";
}

function openNext() {
  if (!pois.length) return;
  const next = (currentIndex + 1) % pois.length;
  openPOI(next);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wireOverlayClose(overlayEl) {
  overlayEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.close === "true") {
      closeOverlay(overlayEl);
    }
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay(overlayEl);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hideCoordProbe() {
  coordProbe.classList.remove("is-visible");
}

function updateCoordProbe(evt) {
  if (!mapShell) return;
  const rect = mapShell.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const insideX = evt.clientX >= rect.left && evt.clientX <= rect.right;
  const insideY = evt.clientY >= rect.top && evt.clientY <= rect.bottom;
  const isInside = insideX && insideY;

  if (!evt.ctrlKey || !isInside) {
    hideCoordProbe();
    return;
  }

  const xPct = clamp(((evt.clientX - rect.left) / rect.width) * 100, 0, 100);
  const yPct = clamp(((evt.clientY - rect.top) / rect.height) * 100, 0, 100);
  coordProbe.textContent = `x: ${xPct.toFixed(1)}% | y: ${yPct.toFixed(1)}%`;

  const offsetX = 14;
  const offsetY = 12;
  coordProbe.style.left = `${evt.clientX + offsetX}px`;
  coordProbe.style.top = `${evt.clientY + offsetY}px`;
  coordProbe.classList.add("is-visible");
}

function setupCoordProbe() {
  if (!mapShell) return;

  mapShell.addEventListener("mouseenter", () => {
    isMouseOverMap = true;
  });

  mapShell.addEventListener("mouseleave", () => {
    isMouseOverMap = false;
    lastPointerEvent = null;
    hideCoordProbe();
  });

  mapShell.addEventListener("mousemove", (evt) => {
    lastPointerEvent = evt;
    updateCoordProbe(evt);
  });

  window.addEventListener("keydown", (evt) => {
    if (evt.key === "Control" && isMouseOverMap && lastPointerEvent) {
      updateCoordProbe(lastPointerEvent);
    }
  });

  window.addEventListener("keyup", (evt) => {
    if (evt.key === "Control") {
      hideCoordProbe();
    }
  });
}

btnClose.addEventListener("click", () => closeOverlay(overlay));
if (btnReset) {
  btnReset.addEventListener("click", (e) => {
    e.preventDefault();
    closeOverlay(overlay);
  });
}

btnNext.addEventListener("click", openNext);

btnHelp.addEventListener("click", () => showOverlay(helpOverlay));
btnCloseHelp.addEventListener("click", () => closeOverlay(helpOverlay));
btnCloseHelp2.addEventListener("click", () => closeOverlay(helpOverlay));

wireOverlayClose(overlay);
wireOverlayClose(helpOverlay);
setupCoordProbe();

(async function init(){
  try{
    await loadPOIs();
    renderPOIs();
    hudText.textContent = `Bereit: ${pois.length} POIs geladen.`;
  }catch(err){
    hudText.textContent = "Fehler beim Laden der POIs.";
    poiLayer.innerHTML = `
      <div style="position:absolute;left:14px;top:14px;right:14px;
                  padding:12px;border-radius:14px;
                  background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);">
        <strong>Fehler:</strong> ${escapeHtml(err.message)}
      </div>
    `;
  }
})();
