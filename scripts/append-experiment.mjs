import { readFile, writeFile } from "node:fs/promises";

const LANGUAGE_FILES = {
  de: "_experiments_de.json",
  eng: "_experiments_eng.json",
  es: "_experiments_es.json",
  fa: "_experiments_fa.json",
  fr: "_experiments_fr.json",
  pol: "_experiments_pol.json",
  ru: "_experiments_ru.json",
  rum: "_experiments_rum.json",
  turk: "_experiments_turk.json",
  uk: "_experiments_uk.json"
};

const ALLOWED_ACTIONS = new Set(["create", "edit", "delete"]);
const ALLOWED_STEP_TYPES = new Set(["text", "aufgabe", "merksatz", "image", "audio"]);

const action = String(process.env.SUBMISSION_ACTION || "create").trim();
const language = String(process.env.SUBMISSION_LANGUAGE || "").trim();
const experimentJson = process.env.EXPERIMENT_JSON || "";
const targetId = String(process.env.TARGET_EXPERIMENT_ID || "").trim();
const targetTitle = String(process.env.TARGET_EXPERIMENT_TITLE || "").trim();

try {
  const file = LANGUAGE_FILES[language];
  if (!file) {
    throw new Error("Ungueltige Sprache. Erlaubt sind: " + Object.keys(LANGUAGE_FILES).join(", "));
  }
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error("Ungueltige Aktion. Erlaubt sind: create, edit, delete.");
  }

  const currentText = await readFile(file, "utf8").catch(error => {
    if (error.code === "ENOENT") {
      throw new Error(`${file} existiert nicht im Repository.`);
    }
    throw error;
  });
  const current = parseJson(currentText, file);
  if (!Array.isArray(current)) {
    throw new Error(`${file} muss ein JSON-Array enthalten.`);
  }

  if (action === "create") {
    const experiment = parseJson(experimentJson, "EXPERIMENT_JSON");
    normalizeExperiment(experiment);
    validateExperiment(experiment);
    current.push(experiment);
    await writeFile(file, JSON.stringify(current, null, 2) + "\n", "utf8");
    console.log(`Experiment "${experiment.title}" wurde an ${file} angehaengt.`);
  }

  if (action === "edit") {
    const experiment = parseJson(experimentJson, "EXPERIMENT_JSON");
    normalizeExperiment(experiment);
    validateExperiment(experiment);
    const index = findExperimentIndex(current);
    if (index === -1) {
      throw new Error("Zu bearbeitendes Experiment wurde nicht gefunden.");
    }
    current[index] = {
      ...current[index],
      ...experiment,
      id: experiment.id || current[index].id || stableId(experiment.title)
    };
    await writeFile(file, JSON.stringify(current, null, 2) + "\n", "utf8");
    console.log(`Experiment "${current[index].title}" wurde in ${file} aktualisiert.`);
  }

  if (action === "delete") {
    const index = findExperimentIndex(current);
    if (index === -1) {
      throw new Error("Zu loeschendes Experiment wurde nicht gefunden.");
    }
    const [removed] = current.splice(index, 1);
    await writeFile(file, JSON.stringify(current, null, 2) + "\n", "utf8");
    console.log(`Experiment "${removed.title || targetTitle || targetId}" wurde aus ${file} entfernt.`);
  }
} catch (error) {
  console.error("append-experiment fehlgeschlagen:", error.message);
  process.exit(1);
}

function parseJson(value, label) {
  try {
    return JSON.parse(String(value).replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`${label} ist kein gueltiges JSON: ${error.message}`);
  }
}

function findExperimentIndex(experiments) {
  if (!targetId && !targetTitle) {
    throw new Error("Bearbeiten/Loeschen braucht TARGET_EXPERIMENT_ID oder TARGET_EXPERIMENT_TITLE.");
  }
  return experiments.findIndex(experiment => {
    const idMatches = targetId && String(experiment.id || "") === targetId;
    const titleMatches = targetTitle && String(experiment.title || "") === targetTitle;
    return idMatches || titleMatches;
  });
}

function normalizeExperiment(experiment) {
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) return;
  if (!experiment.id && experiment.title) {
    experiment.id = stableId(experiment.title);
  }
}

function stableId(value) {
  return String(value || "experiment")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80) || "experiment";
}

function validateExperiment(experiment) {
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) {
    throw new Error("Experiment muss ein Objekt sein.");
  }

  ["id", "title", "shortDescription", "subject", "gradeLevel", "schoolType"].forEach(key => {
    if (typeof experiment[key] !== "string" || !experiment[key].trim()) {
      throw new Error(`${key} muss ein nicht leerer String sein.`);
    }
  });

  if (!Array.isArray(experiment.steps) || experiment.steps.length === 0) {
    throw new Error("steps muss ein Array mit mindestens einem Eintrag sein.");
  }

  experiment.steps.forEach((step, index) => {
    const prefix = `Schritt ${index + 1}`;
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      throw new Error(`${prefix} muss ein Objekt sein.`);
    }
    if (!ALLOWED_STEP_TYPES.has(step.type)) {
      throw new Error(`${prefix}: type ist ungueltig. Erlaubt sind: ${[...ALLOWED_STEP_TYPES].join(", ")}`);
    }
    if (typeof step.content !== "string" || !step.content.trim()) {
      throw new Error(`${prefix}: content muss ein nicht leerer String sein.`);
    }
  });
}
