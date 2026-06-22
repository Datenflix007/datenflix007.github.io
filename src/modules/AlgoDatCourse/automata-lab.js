"use strict";

const STORAGE_KEY = "automata-lab-machine-v1";
const SVG_NS = "http://www.w3.org/2000/svg";
const EPSILON = "ε";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const unique = values => [...new Set(values)];

function newMachine(type = "DFA") {
  return { version: 1, type, name: `Neuer ${type}`, alphabet: ["0", "1"], stackAlphabet: ["A", "□"], blank: "□", acceptance: "final", states: [], transitions: [] };
}

let machine = newMachine();
let selection = null;
let tool = "select";
let history = [];
let future = [];
let zoom = 1;
let panX = 0;
let panY = 0;
let dragState = null;
let transitionSource = null;
let draftPoint = null;
let pendingTransition = null;
let playTimer = 0;
let toastTimer = 0;
let operationLog = [];
let sim = emptySimulation();

function emptySimulation() {
  return { configs: [], step: 0, status: "idle", word: "", seen: new Set(), activeTransitions: [], message: "Bereit zur Simulation" };
}

function snapshot() { return JSON.stringify(machine); }

function persist(showToast = false) {
  try {
    localStorage.setItem(STORAGE_KEY, snapshot());
    $("#saveState").textContent = `Gespeichert ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    if (showToast) toast("Im Browser gespeichert");
  } catch { toast("Browser-Speicher nicht verfügbar"); }
}

function commit(mutator, logMessage = "") {
  history.push(snapshot());
  if (history.length > 80) history.shift();
  future = [];
  mutator();
  persist();
  resetSimulation(false);
  if (logMessage) addLog(logMessage);
  render();
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  machine = normalizeMachine(JSON.parse(history.pop()));
  selection = null;
  persist();
  resetSimulation(false);
  render();
}

function redo() {
  if (!future.length) return;
  history.push(snapshot());
  machine = normalizeMachine(JSON.parse(future.pop()));
  selection = null;
  persist();
  resetSimulation(false);
  render();
}

function addLog(message, detail = "") {
  operationLog.unshift({ message, detail, time: new Date().toLocaleTimeString("de-DE") });
  operationLog = operationLog.slice(0, 80);
  renderLog();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 1800);
}

function normalizeSymbol(value) {
  const text = String(value ?? "").trim();
  return ["", "lambda", "λ", "eps", "epsilon"].includes(text.toLowerCase()) ? EPSILON : text;
}

function normalizeMachine(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.states) || !Array.isArray(value.transitions)) throw new Error("Ungültige AutomataLab-Datei");
  const type = ["DFA", "NFA", "PDA", "TM"].includes(value.type) ? value.type : "DFA";
  const base = newMachine(type);
  return {
    ...base, ...value, version: 1, type,
    name: String(value.name || `Importierter ${type}`),
    alphabet: unique((value.alphabet || []).map(String).filter(Boolean)),
    stackAlphabet: unique((value.stackAlphabet || base.stackAlphabet).map(String).filter(Boolean)),
    blank: String(value.blank || "□"),
    acceptance: ["final", "empty"].includes(value.acceptance) ? value.acceptance : "final",
    states: value.states.map((state, index) => ({ id: String(state.id || uid("q")), name: String(state.name ?? `q${index}`), x: Number(state.x) || 100 + index * 100, y: Number(state.y) || 150, start: Boolean(state.start), final: Boolean(state.final) })),
    transitions: value.transitions.map(rule => ({ id: String(rule.id || uid("t")), from: String(rule.from), to: String(rule.to), read: normalizeSymbol(rule.read), pop: normalizeSymbol(rule.pop), push: normalizeSymbol(rule.push), write: String(rule.write ?? ""), move: ["L", "R", "N"].includes(rule.move) ? rule.move : "R" }))
  };
}

function stateById(id) { return machine.states.find(state => state.id === id); }
function transitionById(id) { return machine.transitions.find(rule => rule.id === id); }
function rulesBetween(from, to) { return machine.transitions.filter(rule => rule.from === from && rule.to === to); }
function stateLabel(id) { return stateById(id)?.name || "?"; }

function addState(x, y) {
  const index = machine.states.length;
  const state = { id: uid("q"), name: `q${index}`, x, y, start: !machine.states.some(item => item.start), final: false };
  commit(() => { machine.states.push(state); selection = { kind: "state", id: state.id }; }, `Zustand ${state.name} angelegt`);
}

function deleteSelection() {
  if (!selection) return;
  commit(() => {
    if (selection.kind === "state") {
      machine.states = machine.states.filter(state => state.id !== selection.id);
      machine.transitions = machine.transitions.filter(rule => rule.from !== selection.id && rule.to !== selection.id);
    } else machine.transitions = machine.transitions.filter(rule => rule.id !== selection.id);
    selection = null;
  }, "Auswahl gelöscht");
}

function setTool(next) {
  tool = next;
  transitionSource = null;
  draftPoint = null;
  $$(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === tool));
  $("#modeHint").textContent = ({ select: "Zustände auswählen und verschieben", state: "Auf die Fläche klicken, um einen Zustand anzulegen", transition: "Quellzustand und anschließend Zielzustand anklicken", delete: "Zustand oder Übergang zum Löschen anklicken" })[tool];
  renderGraph();
}

function svgPoint(event) {
  const rect = $("#graph").getBoundingClientRect();
  return { x: (event.clientX - rect.left - panX) / zoom, y: (event.clientY - rect.top - panY) / zoom };
}

function applyView() {
  $("#world").setAttribute("transform", `translate(${panX} ${panY}) scale(${zoom})`);
  $("#zoomValue").textContent = `${Math.round(zoom * 100)} %`;
}

function edgeGeometry(from, to) {
  if (from.id === to.id) {
    return { path: `M ${from.x - 22} ${from.y - 29} C ${from.x - 68} ${from.y - 90}, ${from.x + 68} ${from.y - 90}, ${from.x + 22} ${from.y - 29}`, labelX: from.x, labelY: from.y - 79 };
  }
  const dx = to.x - from.x, dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length, uy = dy / length;
  const reverse = machine.transitions.some(rule => rule.from === to.id && rule.to === from.id);
  const curve = reverse ? 30 : 0;
  const nx = -uy, ny = ux;
  const x1 = from.x + ux * 39, y1 = from.y + uy * 39;
  const x2 = to.x - ux * 43, y2 = to.y - uy * 43;
  const cx = (x1 + x2) / 2 + nx * curve, cy = (y1 + y2) / 2 + ny * curve;
  return { path: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, labelX: cx, labelY: cy - 10 };
}

function ruleLabel(rule) {
  if (machine.type === "PDA") return `${rule.read || EPSILON}, ${rule.pop || EPSILON} → ${rule.push || EPSILON}`;
  if (machine.type === "TM") return `${rule.read || machine.blank} → ${rule.write || machine.blank}, ${rule.move || "N"}`;
  return rule.read || EPSILON;
}

function renderGraph() {
  const edgeLayer = $("#edgeLayer"), stateLayer = $("#stateLayer"), draftLayer = $("#draftLayer");
  edgeLayer.innerHTML = "";
  stateLayer.innerHTML = "";
  draftLayer.innerHTML = "";
  const groups = new Map();
  for (const rule of machine.transitions) {
    const key = `${rule.from}|${rule.to}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rule);
  }
  for (const rules of groups.values()) {
    const from = stateById(rules[0].from), to = stateById(rules[0].to);
    if (!from || !to) continue;
    const geometry = edgeGeometry(from, to);
    const labels = rules.map(ruleLabel);
    const width = Math.max(42, Math.min(270, Math.max(...labels.map(label => label.length)) * 6.5 + 14));
    const height = labels.length * 15 + 8;
    const selected = selection?.kind === "transition" && rules.some(rule => rule.id === selection.id);
    const active = rules.some(rule => sim.activeTransitions.includes(rule.id));
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", `edge-group${selected ? " selected" : ""}${active ? " active" : ""}`);
    group.dataset.transitionId = rules[0].id;
    group.innerHTML = `<path class="edge-hit" d="${geometry.path}"></path><path class="edge-path" d="${geometry.path}"></path><rect class="edge-label-bg" x="${geometry.labelX - width / 2}" y="${geometry.labelY - height / 2}" width="${width}" height="${height}" rx="5"></rect>${labels.map((label, index) => `<text class="edge-label" x="${geometry.labelX}" y="${geometry.labelY - (labels.length - 1) * 7.5 + index * 15}">${esc(label)}</text>`).join("")}`;
    edgeLayer.appendChild(group);
  }
  for (const state of machine.states) {
    if (state.start) {
      const arrow = document.createElementNS(SVG_NS, "path");
      arrow.setAttribute("class", "start-arrow");
      arrow.setAttribute("d", `M ${state.x - 82} ${state.y} L ${state.x - 42} ${state.y}`);
      stateLayer.appendChild(arrow);
    }
    const group = document.createElementNS(SVG_NS, "g");
    const selected = selection?.kind === "state" && selection.id === state.id;
    const active = sim.configs.some(config => config.stateId === state.id);
    group.setAttribute("class", `graph-state${selected ? " selected" : ""}${active ? " active" : ""}`);
    group.dataset.stateId = state.id;
    group.setAttribute("transform", `translate(${state.x} ${state.y})`);
    group.innerHTML = `<circle class="state-circle" r="36"></circle>${state.final ? '<circle class="state-final" r="30"></circle>' : ""}<text class="state-label">${esc(state.name)}</text>`;
    stateLayer.appendChild(group);
  }
  if (transitionSource && draftPoint) {
    const from = stateById(transitionSource);
    if (from) draftLayer.innerHTML = `<path class="draft-line" d="M ${from.x} ${from.y} L ${draftPoint.x} ${draftPoint.y}"></path>`;
  }
  applyView();
}

function transitionFields(rule = {}) {
  if (machine.type === "PDA") return `<div class="property-section"><label><span>Eingabesymbol</span><input id="trRead" value="${esc(rule.read || EPSILON)}"></label><label><span>Keller-Top entfernen</span><input id="trPop" value="${esc(rule.pop || machine.blank)}"></label><label><span>Durch Kellerwort ersetzen</span><input id="trPush" value="${esc(rule.push || EPSILON)}"></label></div>`;
  if (machine.type === "TM") return `<div class="property-section"><label><span>Gelesenes Bandsymbol</span><input id="trRead" value="${esc(rule.read || machine.blank)}"></label><label><span>Schreiben</span><input id="trWrite" value="${esc(rule.write || machine.blank)}"></label><label><span>Kopfbewegung</span><select id="trMove"><option ${rule.move === "L" ? "selected" : ""}>L</option><option ${rule.move === "R" || !rule.move ? "selected" : ""}>R</option><option ${rule.move === "N" ? "selected" : ""}>N</option></select></label></div>`;
  return `<label><span>${machine.type === "DFA" ? "Eingabesymbol" : "Eingabesymbole"}</span><input id="trRead" value="${esc(rule.read || "")}" placeholder="z. B. 0 oder 0,1,ε"></label>`;
}

function openTransitionDialog(fromId, toId, editId = null) {
  const rule = editId ? transitionById(editId) : null;
  pendingTransition = { fromId, toId, editId };
  $("#transitionTitle").textContent = `${stateLabel(fromId)} → ${stateLabel(toId)}`;
  $("#transitionFields").innerHTML = transitionFields(rule || {});
  $("#transitionHelp").textContent = machine.type === "PDA" ? "Format gemäß Skript: Eingabe, Keller-Top → Ersatzwort. ε liest beziehungsweise schreibt nichts. Das erste Zeichen des Ersatzworts wird neues Top." : machine.type === "TM" ? "Format gemäß Skript: gelesen → geschrieben, Bewegung mit L, R oder N." : machine.type === "NFA" ? "Mehrere Symbole durch Komma trennen. ε-Übergänge sind erlaubt." : "Für einen DFA ist pro Zustand und Alphabetsymbol genau ein Folgezustand erlaubt.";
  $("#transitionDialog").showModal();
  setTimeout(() => $("#trRead")?.focus(), 30);
}

function submitTransition() {
  if (!pendingTransition) return;
  const base = { from: pendingTransition.fromId, to: pendingTransition.toId, read: normalizeSymbol($("#trRead")?.value), pop: EPSILON, push: EPSILON, write: "", move: "R" };
  let rules;
  if (["DFA", "NFA"].includes(machine.type)) rules = String($("#trRead").value).split(",").map(normalizeSymbol).filter(Boolean).map(read => ({ ...base, id: uid("t"), read }));
  else if (machine.type === "PDA") rules = [{ ...base, id: uid("t"), pop: normalizeSymbol($("#trPop").value), push: normalizeSymbol($("#trPush").value) }];
  else rules = [{ ...base, id: uid("t"), write: $("#trWrite").value || machine.blank, move: $("#trMove").value }];
  if (!rules.length || !rules[0].read) { toast("Übergangsregel ist unvollständig"); return; }
  commit(() => {
    if (pendingTransition.editId) machine.transitions = machine.transitions.filter(rule => rule.id !== pendingTransition.editId);
    machine.transitions.push(...rules);
    selection = { kind: "transition", id: rules[0].id };
  }, `${rules.length} Übergangsregel${rules.length === 1 ? "" : "n"} angelegt`);
  pendingTransition = null;
  $("#transitionDialog").close();
}

function renderInspector() {
  const empty = $("#inspectorEmpty"), form = $("#propertyForm");
  if (!selection) {
    empty.classList.add("hidden");
    form.classList.remove("hidden");
    form.innerHTML = `<div class="property-section"><h3>Formale Maschine</h3><label><span>Eingabealphabet Σ</span><input name="alphabet" value="${esc(machine.alphabet.join(", "))}"></label>${machine.type === "PDA" ? `<label><span>Kelleralphabet Γ</span><input name="stackAlphabet" value="${esc(machine.stackAlphabet.join(", "))}"></label><label><span>Akzeptanz</span><select name="acceptance"><option value="final" ${machine.acceptance === "final" ? "selected" : ""}>Endzustand</option><option value="empty" ${machine.acceptance === "empty" ? "selected" : ""}>Leerer Keller</option></select></label>` : ""}${machine.type === "TM" ? `<label><span>Leersymbol □</span><input name="blank" value="${esc(machine.blank)}" maxlength="3"></label>` : ""}</div><div class="property-section"><h3>Definition</h3><div class="formal-tuple">${formalDefinition()}</div></div>`;
    return;
  }
  empty.classList.add("hidden"); form.classList.remove("hidden");
  if (selection.kind === "state") {
    const state = stateById(selection.id);
    if (!state) { selection = null; renderInspector(); return; }
    form.innerHTML = `<div class="property-section"><h3>Zustand ${esc(state.name)}</h3><label><span>Name</span><input name="name" value="${esc(state.name)}"></label><label class="check-row"><input name="start" type="checkbox" ${state.start ? "checked" : ""}><span>Startzustand</span></label><label class="check-row"><input name="final" type="checkbox" ${state.final ? "checked" : ""}><span>Endzustand</span></label></div><div class="property-section"><h3>Position</h3><label><span>x</span><input name="x" type="number" value="${Math.round(state.x)}"></label><label><span>y</span><input name="y" type="number" value="${Math.round(state.y)}"></label></div><button class="btn danger-btn" data-delete type="button">Zustand löschen</button>`;
  } else {
    const rule = transitionById(selection.id);
    if (!rule) { selection = null; renderInspector(); return; }
    const siblings = rulesBetween(rule.from, rule.to);
    form.innerHTML = `<div class="property-section"><h3>${esc(stateLabel(rule.from))} → ${esc(stateLabel(rule.to))}</h3>${siblings.map(item => `<button class="btn ${item.id === rule.id ? "primary" : ""}" data-select-rule="${item.id}" type="button">${esc(ruleLabel(item))}</button>`).join("")}</div><div class="property-section"><h3>Gewählte Regel</h3><div class="formal-tuple">${esc(ruleLabel(rule))}</div><button class="btn" data-edit-rule type="button">Regel bearbeiten</button></div><button class="btn danger-btn" data-delete type="button">Regel löschen</button>`;
  }
}

function updateProperty(target) {
  if (!target.name) return;
  if (!selection) {
    commit(() => {
      if (["alphabet", "stackAlphabet"].includes(target.name)) machine[target.name] = unique(target.value.split(",").map(value => value.trim()).filter(Boolean));
      else machine[target.name] = target.value;
    }, "Maschineneigenschaft geändert");
    return;
  }
  if (selection.kind !== "state") return;
  const state = stateById(selection.id);
  if (!state) return;
  commit(() => {
    if (target.name === "start" && target.checked && machine.type !== "NFA") machine.states.forEach(item => { item.start = false; });
    state[target.name] = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value.trim();
  }, `Zustand ${state.name} geändert`);
}

function validateMachine() {
  const issues = [];
  const starts = machine.states.filter(state => state.start);
  if (!starts.length) issues.push("Kein Startzustand");
  if (["DFA", "PDA", "TM"].includes(machine.type) && starts.length > 1) issues.push("Mehr als ein Startzustand");
  if (!machine.states.some(state => state.final) && machine.acceptance !== "empty") issues.push("Kein Endzustand");
  const duplicateNames = machine.states.filter((state, index) => machine.states.findIndex(item => item.name === state.name) !== index);
  if (duplicateNames.length) issues.push("Zustandsnamen nicht eindeutig");
  if (machine.type === "DFA") {
    if (machine.transitions.some(rule => rule.read === EPSILON)) issues.push("DFA enthält ε-Übergang");
    for (const state of machine.states) for (const symbol of machine.alphabet) {
      const count = machine.transitions.filter(rule => rule.from === state.id && rule.read === symbol).length;
      if (count > 1) issues.push(`Nichtdeterministisch: δ(${state.name},${symbol})`);
      if (count === 0) issues.push(`Unvollständig: δ(${state.name},${symbol})`);
    }
  }
  if (machine.type === "PDA") {
    if (!isPdaDeterministic()) issues.push("PDA ist nichtdeterministisch");
  }
  if (machine.type === "TM") {
    if (!isTmDeterministic()) issues.push("TM ist nichtdeterministisch (NTM)");
    if (machine.alphabet.includes(machine.blank)) issues.push("Leersymbol darf nicht in Σ liegen");
  }
  return unique(issues);
}

function isPdaDeterministic() {
  for (const state of machine.states) for (const top of machine.stackAlphabet) {
    const rules = machine.transitions.filter(rule => rule.from === state.id && rule.pop === top);
    const reads = rules.map(rule => rule.read);
    if (new Set(reads).size !== reads.length) return false;
    if (reads.includes(EPSILON) && reads.length > 1) return false;
  }
  return true;
}

function isTmDeterministic() {
  const keys = machine.transitions.map(rule => `${rule.from}|${rule.read}`);
  return new Set(keys).size === keys.length;
}

function machineKindLabel() {
  if (machine.type === "PDA") return isPdaDeterministic() ? "DPDA" : "PDA";
  if (machine.type === "TM") return isTmDeterministic() ? "DTM" : "NTM";
  return machine.type;
}

function reachableStateIds() {
  const reached = new Set(machine.states.filter(state => state.start).map(state => state.id));
  const queue = [...reached];
  while (queue.length) {
    const id = queue.shift();
    for (const rule of machine.transitions.filter(item => item.from === id)) if (!reached.has(rule.to)) { reached.add(rule.to); queue.push(rule.to); }
  }
  return reached;
}

function renderValidation() {
  const issues = validateMachine();
  const unreachable = machine.states.filter(state => !reachableStateIds().has(state.id));
  $("#validationCard").innerHTML = `<strong>Validierung</strong>${issues.length ? issues.slice(0, 5).map(issue => `<div class="warn">● ${esc(issue)}</div>`).join("") : '<div class="ok">● Formale Bedingungen erfüllt</div>'}${unreachable.length ? `<div class="warn">● ${unreachable.length} unerreichbar</div>` : ""}`;
}

function formalDefinition() {
  const sigma = `{${machine.alphabet.join(", ")}}`, states = `{${machine.states.map(state => state.name).join(", ")}}`, starts = machine.states.filter(state => state.start).map(state => state.name), finals = `{${machine.states.filter(state => state.final).map(state => state.name).join(", ")}}`;
  if (machine.type === "DFA") return `M = (${sigma}, ${states}, δ, ${starts[0] || "–"}, ${finals})`;
  if (machine.type === "NFA") return `M = (${sigma}, ${states}, δ, {${starts.join(", ")}}, ${finals})`;
  if (machine.type === "PDA") return `M = (${sigma}, {${machine.stackAlphabet.join(", ")}}, ${states}, δ, ${starts[0] || "–"}, ${finals})`;
  return `M = (${sigma}, {${unique([...machine.alphabet, machine.blank, ...machine.transitions.flatMap(rule => [rule.read, rule.write])]).filter(Boolean).join(", ")}}, ${states}, δ, ${starts[0] || "–"}, ${finals}, ${machine.blank})`;
}

function renderStatus() {
  const kind = machineKindLabel();
  $("#statusText").textContent = `${kind} · ${machine.states.length} Zustände · ${machine.transitions.length} Regeln`;
  $("#selectionText").textContent = selection ? selection.kind === "state" ? `Zustand ${stateLabel(selection.id)}` : `Übergang ${ruleLabel(transitionById(selection.id) || {})}` : "Keine Auswahl";
  $("#machineBadge").textContent = kind;
  $("#machineType").value = machine.type;
  $("#machineName").value = machine.name;
  $("#undoBtn").disabled = !history.length;
  $("#redoBtn").disabled = !future.length;
}

function render() {
  renderGraph();
  renderInspector();
  renderValidation();
  renderStatus();
  renderSimulation();
  renderLog();
}

// Simulation ---------------------------------------------------------------

function configKey(config) {
  if (machine.type === "PDA") return `${config.stateId}|${config.pos}|${config.stack.join("")}`;
  if (machine.type === "TM") return `${config.stateId}|${config.head}|${Object.entries(config.tape).sort((a, b) => Number(a[0]) - Number(b[0])).map(([key, value]) => `${key}:${value}`).join(";")}`;
  return `${config.stateId}|${config.pos}`;
}

function epsilonClosure(configs) {
  if (! ["NFA"].includes(machine.type)) return configs;
  const result = [...configs], queue = [...configs], seen = new Set(configs.map(configKey));
  while (queue.length) {
    const config = queue.shift();
    for (const rule of machine.transitions.filter(item => item.from === config.stateId && item.read === EPSILON)) {
      const next = { ...config, stateId: rule.to, path: [...config.path, rule.id] };
      const key = configKey(next);
      if (!seen.has(key)) { seen.add(key); result.push(next); queue.push(next); }
    }
  }
  return result;
}

function resetSimulation(renderNow = true) {
  clearInterval(playTimer); playTimer = 0;
  sim = emptySimulation();
  sim.word = $("#wordInput")?.value || "";
  if (renderNow) render();
}

function startSimulation() {
  const starts = machine.states.filter(state => state.start);
  sim = emptySimulation();
  sim.word = $("#wordInput").value;
  if (!starts.length) { sim.status = "rejected"; sim.message = "Kein Startzustand definiert"; renderSimulation(); return false; }
  if (["DFA", "NFA"].includes(machine.type)) sim.configs = epsilonClosure(starts.map(state => ({ stateId: state.id, pos: 0, path: [] })));
  if (machine.type === "PDA") sim.configs = [{ stateId: starts[0].id, pos: 0, stack: [machine.blank], path: [] }];
  if (machine.type === "TM") {
    const tape = {}; [...sim.word].forEach((symbol, index) => { tape[index] = symbol; });
    sim.configs = starts.map(state => ({ stateId: state.id, head: 0, tape, path: [] }));
  }
  sim.seen = new Set(sim.configs.map(configKey));
  sim.status = "running"; sim.message = "Startkonfiguration geladen";
  addLog("Simulation gestartet", `Eingabe: ${sim.word || EPSILON}`);
  render(); return true;
}

function isAccepted(config) {
  const state = stateById(config.stateId);
  if (!state) return false;
  if (["DFA", "NFA"].includes(machine.type)) return config.pos === sim.word.length && state.final;
  if (machine.type === "PDA") return config.pos === sim.word.length && (machine.acceptance === "empty" ? config.stack.length === 0 : state.final);
  return state.final;
}

function stepFinite() {
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", "Wort akzeptiert");
  const next = [], used = [];
  for (const config of sim.configs) {
    if (config.pos >= sim.word.length) continue;
    const symbol = sim.word[config.pos];
    for (const rule of machine.transitions.filter(item => item.from === config.stateId && item.read === symbol)) {
      next.push({ stateId: rule.to, pos: config.pos + 1, path: [...config.path, rule.id] }); used.push(rule.id);
    }
  }
  sim.configs = epsilonClosure(next);
  sim.activeTransitions = unique([...used, ...sim.configs.flatMap(config => config.path.slice(-1))]);
  if (!sim.configs.length) return finishSimulation("rejected", "Keine passende Überführung");
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", "Wort akzeptiert");
  if (sim.configs.every(config => config.pos >= sim.word.length)) return finishSimulation("rejected", "Eingabe vollständig, kein Endzustand erreicht");
}

function stepPda() {
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", machine.acceptance === "empty" ? "Mit leerem Keller akzeptiert" : "Im Endzustand akzeptiert");
  const next = [], used = [];
  for (const config of sim.configs) {
    const top = config.stack[0];
    for (const rule of machine.transitions.filter(item => item.from === config.stateId)) {
      const consumes = rule.read !== EPSILON;
      if (consumes && sim.word[config.pos] !== rule.read) continue;
      if (rule.pop !== EPSILON && top !== rule.pop) continue;
      const stack = [...config.stack];
      if (rule.pop !== EPSILON) stack.shift();
      if (rule.push !== EPSILON) stack.unshift(...[...rule.push]);
      const candidate = { stateId: rule.to, pos: config.pos + (consumes ? 1 : 0), stack, path: [...config.path, rule.id] };
      const key = configKey(candidate);
      if (!sim.seen.has(key)) { sim.seen.add(key); next.push(candidate); used.push(rule.id); }
    }
  }
  sim.configs = next.slice(0, 500); sim.activeTransitions = unique(used);
  if (!next.length) return finishSimulation("rejected", "Keine Folgekonfiguration");
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", "Wort akzeptiert");
}

function tapeRead(config) { return config.tape[config.head] ?? machine.blank; }

function stepTm() {
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", "Endzustand erreicht");
  const next = [], used = [];
  for (const config of sim.configs) for (const rule of machine.transitions.filter(item => item.from === config.stateId && item.read === tapeRead(config))) {
    const tape = { ...config.tape };
    if ((rule.write || machine.blank) === machine.blank) delete tape[config.head]; else tape[config.head] = rule.write;
    const head = config.head + (rule.move === "L" ? -1 : rule.move === "R" ? 1 : 0);
    const candidate = { stateId: rule.to, head, tape, path: [...config.path, rule.id] };
    const key = configKey(candidate);
    if (!sim.seen.has(key)) { sim.seen.add(key); next.push(candidate); used.push(rule.id); }
  }
  sim.configs = next.slice(0, 500); sim.activeTransitions = unique(used);
  if (!next.length) return finishSimulation("rejected", "Maschine hält verwerfend");
  if (sim.configs.some(isAccepted)) return finishSimulation("accepted", "Endzustand erreicht");
}

function finishSimulation(status, message) {
  sim.status = status; sim.message = message;
  clearInterval(playTimer); playTimer = 0;
  addLog(status === "accepted" ? "Akzeptiert" : "Verworfen", message);
}

function simulationStep() {
  if (sim.status === "idle" && !startSimulation()) return;
  if (sim.status !== "running") return;
  const limit = Math.max(1, Number($("#stepLimit").value) || 250);
  if (sim.step >= limit) { finishSimulation("limit", `Schrittlimit ${limit} erreicht`); render(); return; }
  sim.step++;
  if (["DFA", "NFA"].includes(machine.type)) stepFinite();
  else if (machine.type === "PDA") stepPda(); else stepTm();
  sim.message = sim.status === "running" ? `Schritt ${sim.step}: ${sim.configs.length} aktive Konfiguration${sim.configs.length === 1 ? "" : "en"}` : sim.message;
  addLog(`Simulationsschritt ${sim.step}`, sim.message);
  render();
}

function togglePlay() {
  if (playTimer) { clearInterval(playTimer); playTimer = 0; $("#simPlayBtn").textContent = "▶ Abspielen"; return; }
  if (sim.status !== "running" && !startSimulation()) return;
  $("#simPlayBtn").textContent = "Ⅱ Pause";
  playTimer = setInterval(() => { simulationStep(); if (sim.status !== "running") { clearInterval(playTimer); playTimer = 0; $("#simPlayBtn").textContent = "▶ Abspielen"; } }, 420);
}

function configText(config) {
  if (["DFA", "NFA"].includes(machine.type)) return `(${stateLabel(config.stateId)}, ${sim.word.slice(config.pos) || EPSILON})`;
  if (machine.type === "PDA") return `(${stateLabel(config.stateId)}, ${sim.word.slice(config.pos) || EPSILON}, ${config.stack.join("") || EPSILON})`;
  return `(${stateLabel(config.stateId)}, Kopf ${config.head}, liest ${tapeRead(config)})`;
}

function renderSimulation() {
  const status = $("#simStatus"); status.className = `sim-status ${sim.status}`; status.textContent = sim.message;
  const first = sim.configs[0];
  if (machine.type === "TM") {
    const positions = first ? Object.keys(first.tape).map(Number) : [];
    const center = first?.head || 0, min = Math.min(center - 5, ...positions, 0), max = Math.max(center + 5, ...positions, 5);
    $("#wordTape").innerHTML = Array.from({ length: max - min + 1 }, (_, offset) => { const index = min + offset; return `<span class="tape-cell ${first?.head === index ? "head" : ""}" title="Position ${index}">${esc(first?.tape[index] ?? machine.blank)}</span>`; }).join("");
    $("#machineMemory").textContent = first ? `Bandkonfiguration · Zustand ${stateLabel(first.stateId)} · Kopfposition ${first.head}` : "TM-Band wird beim Start initialisiert";
  } else {
    const position = first?.pos ?? 0;
    $("#wordTape").innerHTML = (sim.word ? [...sim.word] : [EPSILON]).map((symbol, index) => `<span class="tape-cell ${index < position ? "consumed" : index === position ? "current" : ""}">${esc(symbol)}</span>`).join("");
    $("#machineMemory").textContent = machine.type === "PDA" ? `Keller (Top links): ${first?.stack.join(" ") || machine.blank}` : `Aktive Zustände: ${unique(sim.configs.map(config => stateLabel(config.stateId))).join(", ") || "–"}`;
  }
  $("#configList").innerHTML = sim.configs.length ? sim.configs.map(config => `<div class="config-item ${isAccepted(config) ? "accept" : ""}">${esc(configText(config))}</div>`).join("") : '<div class="empty"><p>Noch keine Konfigurationen.</p></div>';
}

function renderLog() {
  $("#operationLog").innerHTML = operationLog.length ? operationLog.map(entry => `<div class="log-entry"><strong>${esc(entry.message)}</strong><p>${esc(entry.detail)}${entry.detail ? " · " : ""}${entry.time}</p></div>`).join("") : "<p>Operationen und Simulationsschritte erscheinen hier.</p>";
}

// Transformations ----------------------------------------------------------

function epsilonClosureIds(ids) {
  const result = new Set(ids), queue = [...ids];
  while (queue.length) {
    const id = queue.shift();
    for (const rule of machine.transitions.filter(item => item.from === id && item.read === EPSILON)) if (!result.has(rule.to)) { result.add(rule.to); queue.push(rule.to); }
  }
  return [...result].sort();
}

function determinize() {
  if (machine.type !== "NFA") { toast("Potenzmengenkonstruktion benötigt einen NFA"); return; }
  const starts = epsilonClosureIds(machine.states.filter(state => state.start).map(state => state.id));
  if (!starts.length) { toast("Kein Startzustand"); return; }
  const result = newMachine("DFA"); result.name = `${machine.name} – DFA`; result.alphabet = machine.alphabet.filter(symbol => symbol !== EPSILON);
  const subsetMap = new Map(), queue = [];
  const addSubset = subset => {
    const key = subset.join("|"); if (subsetMap.has(key)) return subsetMap.get(key);
    const index = subsetMap.size; const names = subset.map(stateLabel);
    const state = { id: uid("q"), name: `{${names.join(",") || "∅"}}`, x: 150 + (index % 4) * 180, y: 130 + Math.floor(index / 4) * 150, start: index === 0, final: subset.some(id => stateById(id)?.final), subset };
    subsetMap.set(key, state); result.states.push(state); queue.push(state); return state;
  };
  addSubset(starts);
  while (queue.length) {
    const from = queue.shift();
    for (const symbol of result.alphabet) {
      const targets = epsilonClosureIds(unique(from.subset.flatMap(id => machine.transitions.filter(rule => rule.from === id && rule.read === symbol).map(rule => rule.to))));
      if (!targets.length) continue;
      const to = addSubset(targets); result.transitions.push({ id: uid("t"), from: from.id, to: to.id, read: symbol, pop: EPSILON, push: EPSILON, write: "", move: "R" });
    }
  }
  result.states.forEach(state => delete state.subset);
  commit(() => { machine = result; selection = null; }, "Potenzmengenkonstruktion abgeschlossen");
}

function completeDfaData(source) {
  const result = clone(source); let trap = null;
  for (const state of [...result.states]) for (const symbol of result.alphabet) if (!result.transitions.some(rule => rule.from === state.id && rule.read === symbol)) {
    if (!trap) { trap = { id: uid("q"), name: "qTrap", x: 160 + (result.states.length % 4) * 180, y: 130 + Math.floor(result.states.length / 4) * 150, start: false, final: false }; result.states.push(trap); }
    result.transitions.push({ id: uid("t"), from: state.id, to: trap.id, read: symbol, pop: EPSILON, push: EPSILON, write: "", move: "R" });
  }
  if (trap) for (const symbol of result.alphabet) result.transitions.push({ id: uid("t"), from: trap.id, to: trap.id, read: symbol, pop: EPSILON, push: EPSILON, write: "", move: "R" });
  return result;
}

function completeDfa() {
  if (machine.type !== "DFA") { toast("Nur DFA können so vervollständigt werden"); return; }
  const completed = completeDfaData(machine);
  if (completed.states.length === machine.states.length) { toast("DFA ist bereits vollständig"); return; }
  commit(() => { machine = completed; selection = null; }, "Fangzustand ergänzt");
}

function removeUnreachable() {
  const reached = reachableStateIds();
  const count = machine.states.length - reached.size;
  if (!count) { toast("Alle Zustände sind erreichbar"); return; }
  commit(() => { machine.states = machine.states.filter(state => reached.has(state.id)); machine.transitions = machine.transitions.filter(rule => reached.has(rule.from) && reached.has(rule.to)); selection = null; }, `${count} unerreichbare Zustände entfernt`);
}

function minimizeDfa() {
  if (machine.type !== "DFA" || validateMachine().some(issue => issue.includes("Nichtdeterministisch") || issue.includes("ε-"))) { toast("Minimierung benötigt einen deterministischen DFA"); return; }
  let source = completeDfaData(machine);
  const startIds = new Set(machine.states.filter(state => state.start).map(state => state.id));
  const reachable = new Set(); const queue = [...startIds]; queue.forEach(id => reachable.add(id));
  while (queue.length) { const id = queue.shift(); for (const rule of source.transitions.filter(item => item.from === id)) if (!reachable.has(rule.to)) { reachable.add(rule.to); queue.push(rule.to); } }
  source.states = source.states.filter(state => reachable.has(state.id)); source.transitions = source.transitions.filter(rule => reachable.has(rule.from) && reachable.has(rule.to));
  let partitions = [source.states.filter(state => state.final).map(state => state.id), source.states.filter(state => !state.final).map(state => state.id)].filter(group => group.length);
  let changed = true;
  while (changed) {
    changed = false; const next = [];
    for (const group of partitions) {
      const buckets = new Map();
      for (const id of group) {
        const signature = source.alphabet.map(symbol => { const to = source.transitions.find(rule => rule.from === id && rule.read === symbol)?.to; return partitions.findIndex(part => part.includes(to)); }).join("|");
        if (!buckets.has(signature)) buckets.set(signature, []); buckets.get(signature).push(id);
      }
      next.push(...buckets.values()); if (buckets.size > 1) changed = true;
    }
    partitions = next;
  }
  const result = newMachine("DFA"); result.name = `${machine.name} – minimal`; result.alphabet = [...source.alphabet];
  const groupState = new Map();
  partitions.forEach((group, index) => { const members = group.map(id => source.states.find(state => state.id === id)); const state = { id: uid("q"), name: members.map(item => item.name).join("/") || "∅", x: 150 + (index % 4) * 190, y: 140 + Math.floor(index / 4) * 150, start: members.some(item => item.start), final: members.some(item => item.final) }; result.states.push(state); group.forEach(id => groupState.set(id, state)); });
  for (const [index, group] of partitions.entries()) for (const symbol of result.alphabet) { const original = source.transitions.find(rule => rule.from === group[0] && rule.read === symbol); if (original) result.transitions.push({ id: uid("t"), from: result.states[index].id, to: groupState.get(original.to).id, read: symbol, pop: EPSILON, push: EPSILON, write: "", move: "R" }); }
  commit(() => { machine = result; selection = null; }, `DFA auf ${result.states.length} Zustände minimiert`);
}

function transitionTableHtml() {
  if (["DFA", "NFA"].includes(machine.type)) {
    const symbols = unique([...machine.alphabet, ...(machine.transitions.some(rule => rule.read === EPSILON) ? [EPSILON] : [])]);
    return `<table class="transition-table"><thead><tr><th>Zustand</th>${symbols.map(symbol => `<th>${esc(symbol)}</th>`).join("")}</tr></thead><tbody>${machine.states.map(state => `<tr><td>${state.start ? "→" : ""}${state.final ? "*" : ""}${esc(state.name)}</td>${symbols.map(symbol => `<td>${esc(machine.transitions.filter(rule => rule.from === state.id && rule.read === symbol).map(rule => stateLabel(rule.to)).join(", ") || "–")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  return `<table class="transition-table"><thead><tr><th>Von</th><th>Regel</th><th>Nach</th></tr></thead><tbody>${machine.transitions.map(rule => `<tr><td>${esc(stateLabel(rule.from))}</td><td>${esc(ruleLabel(rule))}</td><td>${esc(stateLabel(rule.to))}</td></tr>`).join("")}</tbody></table>`;
}

function grammarText() {
  if (!["DFA", "NFA"].includes(machine.type)) return "Eine rechtslineare Grammatik wird nur für endliche Automaten erzeugt.";
  const lines = [];
  for (const state of machine.states) {
    const rules = machine.transitions.filter(rule => rule.from === state.id && rule.read !== EPSILON).map(rule => `${rule.read}${stateLabel(rule.to)}`);
    if (state.final) rules.push(EPSILON);
    for (const rule of machine.transitions.filter(rule => rule.from === state.id && rule.read === EPSILON)) rules.push(stateLabel(rule.to));
    lines.push(`${state.name} → ${rules.join(" | ") || "∅"}`);
  }
  return `G = (Σ, N, S, R)\nΣ = {${machine.alphabet.join(", ")}}\nN = {${machine.states.map(state => state.name).join(", ")}}\nS = ${machine.states.find(state => state.start)?.name || "–"}\n\n${lines.join("\n")}`;
}

function showInfo(title, content, eyebrow = "ANALYSE") {
  $("#infoTitle").textContent = title; $("#infoEyebrow").textContent = eyebrow; $("#infoContent").innerHTML = content; $("#infoDialog").showModal();
}

// Examples -----------------------------------------------------------------

function exampleMachine(kind) {
  if (kind === "dfa") return normalizeMachine({ type: "DFA", name: "Endet auf 01", alphabet: ["0", "1"], states: [{ id: "q0", name: "q0", x: 170, y: 220, start: true, final: false }, { id: "q1", name: "q1", x: 390, y: 140, start: false, final: false }, { id: "q2", name: "q2", x: 610, y: 220, start: false, final: true }], transitions: [{ id: "a", from: "q0", to: "q1", read: "0" }, { id: "b", from: "q0", to: "q0", read: "1" }, { id: "c", from: "q1", to: "q1", read: "0" }, { id: "d", from: "q1", to: "q2", read: "1" }, { id: "e", from: "q2", to: "q1", read: "0" }, { id: "f", from: "q2", to: "q0", read: "1" }] });
  if (kind === "nfa") return normalizeMachine({ type: "NFA", name: "Enthält 01", alphabet: ["0", "1"], states: [{ id: "q0", name: "q0", x: 170, y: 220, start: true }, { id: "q1", name: "q1", x: 390, y: 140 }, { id: "q2", name: "q2", x: 610, y: 220, final: true }], transitions: [{ id: "a", from: "q0", to: "q0", read: "0" }, { id: "b", from: "q0", to: "q0", read: "1" }, { id: "c", from: "q0", to: "q1", read: "0" }, { id: "d", from: "q1", to: "q2", read: "1" }, { id: "e", from: "q2", to: "q2", read: "0" }, { id: "f", from: "q2", to: "q2", read: "1" }] });
  if (kind === "pda") return normalizeMachine({ type: "PDA", name: "aⁿbⁿ", alphabet: ["a", "b"], stackAlphabet: ["A", "□"], blank: "□", acceptance: "final", states: [{ id: "q0", name: "q0", x: 150, y: 220, start: true }, { id: "q1", name: "q1", x: 390, y: 220 }, { id: "qe", name: "qE", x: 630, y: 220, final: true }], transitions: [{ id: "a", from: "q0", to: "q0", read: "a", pop: "□", push: "A□" }, { id: "b", from: "q0", to: "q0", read: "a", pop: "A", push: "AA" }, { id: "c", from: "q0", to: "q1", read: "b", pop: "A", push: EPSILON }, { id: "d", from: "q1", to: "q1", read: "b", pop: "A", push: EPSILON }, { id: "e", from: "q1", to: "qe", read: EPSILON, pop: "□", push: "□" }] });
  return normalizeMachine({ type: "TM", name: "Binärer Nachfolger", alphabet: ["0", "1"], blank: "□", states: [{ id: "q0", name: "q0", x: 120, y: 220, start: true }, { id: "q1", name: "q1", x: 340, y: 130 }, { id: "q2", name: "q2", x: 560, y: 220 }, { id: "qe", name: "qE", x: 780, y: 220, final: true }], transitions: [{ id: "a", from: "q0", to: "q0", read: "0", write: "0", move: "R" }, { id: "b", from: "q0", to: "q0", read: "1", write: "1", move: "R" }, { id: "c", from: "q0", to: "q1", read: "□", write: "□", move: "L" }, { id: "d", from: "q1", to: "q1", read: "1", write: "0", move: "L" }, { id: "e", from: "q1", to: "q2", read: "0", write: "1", move: "L" }, { id: "f", from: "q1", to: "qe", read: "□", write: "1", move: "N" }, { id: "g", from: "q2", to: "q2", read: "0", write: "0", move: "L" }, { id: "h", from: "q2", to: "q2", read: "1", write: "1", move: "L" }, { id: "i", from: "q2", to: "qe", read: "□", write: "□", move: "R" }] });
}

// Events -------------------------------------------------------------------

function bindGraphEvents() {
  const graph = $("#graph"), viewport = $("#graphViewport");
  graph.addEventListener("dblclick", event => { if (!event.target.closest("[data-state-id],[data-transition-id]")) { const point = svgPoint(event); addState(point.x, point.y); } });
  graph.addEventListener("mousedown", event => {
    const stateElement = event.target.closest("[data-state-id]");
    const edgeElement = event.target.closest("[data-transition-id]");
    if (event.button === 2) {
      const startX = event.clientX, startY = event.clientY, baseX = panX, baseY = panY; viewport.classList.add("panning");
      const move = moveEvent => { panX = baseX + moveEvent.clientX - startX; panY = baseY + moveEvent.clientY - startY; applyView(); };
      const up = () => { viewport.classList.remove("panning"); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
      window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); return;
    }
    if (stateElement) {
      const id = stateElement.dataset.stateId;
      if (tool === "delete") { selection = { kind: "state", id }; deleteSelection(); return; }
      if (tool === "transition") return;
      if (event.shiftKey) {
        transitionSource = id; draftPoint = svgPoint(event); renderGraph(); return;
      }
      selection = { kind: "state", id }; render();
      if (tool === "select") {
        const state = stateById(id), point = svgPoint(event), offsetX = point.x - state.x, offsetY = point.y - state.y, before = snapshot();
        dragState = id; stateElement.classList.add("dragging");
        const move = moveEvent => { const p = svgPoint(moveEvent); state.x = p.x - offsetX; state.y = p.y - offsetY; renderGraph(); };
        const up = () => { dragState = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); if (before !== snapshot()) { history.push(before); future = []; persist(); addLog(`Zustand ${state.name} verschoben`); } render(); };
        window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
      }
      return;
    }
    if (edgeElement) {
      selection = { kind: "transition", id: edgeElement.dataset.transitionId };
      if (tool === "delete") deleteSelection(); else render();
      return;
    }
    if (tool === "state" && event.button === 0) { const point = svgPoint(event); addState(point.x, point.y); }
    else { selection = null; render(); }
  });
  graph.addEventListener("mousemove", event => { if (transitionSource) { draftPoint = svgPoint(event); renderGraph(); } });
  graph.addEventListener("mouseup", event => {
    if (!transitionSource || event.button !== 0) return;
    const target = event.target.closest("[data-state-id]"); const source = transitionSource; transitionSource = null; draftPoint = null; renderGraph();
    if (target) openTransitionDialog(source, target.dataset.stateId);
  });
  graph.addEventListener("click", event => {
    if (tool !== "transition") return;
    const state = event.target.closest("[data-state-id]"); if (!state) return;
    if (!transitionSource) { transitionSource = state.dataset.stateId; draftPoint = { x: stateById(transitionSource).x, y: stateById(transitionSource).y }; renderGraph(); }
    else { const source = transitionSource; transitionSource = null; draftPoint = null; openTransitionDialog(source, state.dataset.stateId); }
  });
  viewport.addEventListener("contextmenu", event => event.preventDefault());
  viewport.addEventListener("wheel", event => {
    event.preventDefault(); const rect = graph.getBoundingClientRect(); const mouseX = event.clientX - rect.left, mouseY = event.clientY - rect.top; const worldX = (mouseX - panX) / zoom, worldY = (mouseY - panY) / zoom; const next = Math.max(.25, Math.min(2.5, zoom * (event.deltaY < 0 ? 1.1 : .9))); panX = mouseX - worldX * next; panY = mouseY - worldY * next; zoom = next; applyView();
  }, { passive: false });
}

function fitGraph() {
  if (!machine.states.length) { zoom = 1; panX = 0; panY = 0; applyView(); return; }
  const viewport = $("#graphViewport"), xs = machine.states.map(state => state.x), ys = machine.states.map(state => state.y); const minX = Math.min(...xs) - 100, maxX = Math.max(...xs) + 100, minY = Math.min(...ys) - 100, maxY = Math.max(...ys) + 100; zoom = Math.max(.25, Math.min(1.4, viewport.clientWidth / (maxX - minX), viewport.clientHeight / (maxY - minY))); panX = (viewport.clientWidth - (maxX - minX) * zoom) / 2 - minX * zoom; panY = (viewport.clientHeight - (maxY - minY) * zoom) / 2 - minY * zoom; applyView();
}

function downloadJson() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(machine, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `${machine.name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "automat"}.automata.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initEvents() {
  bindGraphEvents();
  $$(".tool").forEach(button => button.addEventListener("click", () => setTool(button.dataset.tool)));
  $$(".tab").forEach(button => button.addEventListener("click", () => { $$(".tab").forEach(item => item.classList.toggle("active", item === button)); $$(".tab-pane").forEach(pane => pane.classList.toggle("active", pane.id === `${button.dataset.tab}Pane`)); }));
  $("#propertyForm").addEventListener("change", event => updateProperty(event.target));
  $("#propertyForm").addEventListener("click", event => { if (event.target.closest("[data-delete]")) deleteSelection(); const select = event.target.closest("[data-select-rule]"); if (select) { selection = { kind: "transition", id: select.dataset.selectRule }; render(); } if (event.target.closest("[data-edit-rule]")) { const rule = transitionById(selection.id); openTransitionDialog(rule.from, rule.to, rule.id); } });
  $("#transitionSubmit").addEventListener("click", event => { event.preventDefault(); submitTransition(); });
  $("#machineType").addEventListener("change", event => { if (!confirm("Beim Wechsel des Maschinentyps werden Zustände und Übergänge gelöscht. Fortfahren?")) { event.target.value = machine.type; return; } commit(() => { machine = newMachine(event.target.value); selection = null; }, `Neuen ${event.target.value} angelegt`); fitGraph(); });
  $("#machineName").addEventListener("change", event => commit(() => { machine.name = event.target.value.trim() || `Mein ${machine.type}`; }));
  $("#undoBtn").addEventListener("click", undo); $("#redoBtn").addEventListener("click", redo);
  $("#saveBtn").addEventListener("click", () => persist(true)); $("#exportBtn").addEventListener("click", downloadJson); $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { const imported = normalizeMachine(JSON.parse(await file.text())); commit(() => { machine = imported; selection = null; }, "Automat importiert"); fitGraph(); } catch (error) { toast(error.message); } event.target.value = ""; });
  $("#newBtn").addEventListener("click", () => { if (confirm("Aktuellen Automaten verwerfen?")) commit(() => { machine = newMachine(machine.type); selection = null; }, "Neuer Automat"); });
  $$("[data-example]").forEach(button => button.addEventListener("click", () => { const example = exampleMachine(button.dataset.example); commit(() => { machine = example; selection = null; }, `Beispiel ${example.name} geladen`); setTimeout(fitGraph, 0); }));
  $("#simResetBtn").addEventListener("click", () => resetSimulation()); $("#simStepBtn").addEventListener("click", simulationStep); $("#simPlayBtn").addEventListener("click", togglePlay); $("#wordInput").addEventListener("input", () => resetSimulation());
  $("#determinizeBtn").addEventListener("click", determinize); $("#completeBtn").addEventListener("click", completeDfa); $("#minimizeBtn").addEventListener("click", minimizeDfa); $("#removeUnreachableBtn").addEventListener("click", removeUnreachable);
  $("#fitBtn").addEventListener("click", fitGraph); $("#tableBtn").addEventListener("click", () => showInfo("Übergangstabelle", transitionTableHtml())); $("#formalBtn").addEventListener("click", () => showInfo("Formale Definition", `<div class="formal-tuple">${esc(formalDefinition())}</div>`)); $("#grammarBtn").addEventListener("click", () => showInfo("Rechtslineare Grammatik", `<pre class="formal-tuple">${esc(grammarText())}</pre>`, "KONVERTIERUNG"));
  document.addEventListener("keydown", event => { if (event.key === "Delete" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) deleteSelection(); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); } });
  window.addEventListener("resize", () => renderGraph());
}

try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) machine = normalizeMachine(JSON.parse(saved)); } catch { localStorage.removeItem(STORAGE_KEY); }
initEvents();
render();
if (!machine.states.length) { machine = exampleMachine("dfa"); persist(); render(); setTimeout(fitGraph, 20); }
