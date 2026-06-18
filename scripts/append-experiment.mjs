import { readFile, writeFile } from "node:fs/promises";

const LANGUAGE_FILES = {
  de: "_experiments_de.json",
  eng: "_experiments_eng.json",
  fr: "_experiments_fr.json",
  ru: "_experiments_ru.json",
  uk: "_experiments_uk.json"
};

const ALLOWED_STEP_TYPES = new Set(["text", "aufgabe", "merksatz", "image", "audio"]);

const language = String(process.env.SUBMISSION_LANGUAGE || "").trim();
const experimentJson = process.env.EXPERIMENT_JSON || "";

try {
  const file = LANGUAGE_FILES[language];
  if (!file) {
    throw new Error("Ungueltige Sprache. Erlaubt sind: " + Object.keys(LANGUAGE_FILES).join(", "));
  }

  const experiment = parseJson(experimentJson, "EXPERIMENT_JSON");
  validateExperiment(experiment);

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

  current.push(experiment);
  await writeFile(file, JSON.stringify(current, null, 2) + "\n", "utf8");

  console.log(`Experiment "${experiment.title}" wurde an ${file} angehaengt.`);
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

function validateExperiment(experiment) {
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) {
    throw new Error("Experiment muss ein Objekt sein.");
  }

  ["title", "shortDescription", "subject", "gradeLevel", "schoolType"].forEach(key => {
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
