const ALLOWED_LANGUAGES = new Set(["de", "eng", "fr", "ru", "uk"]);
const ALLOWED_STEP_TYPES = new Set(["text", "aufgabe", "merksatz", "image", "audio"]);

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Nur POST-Anfragen sind erlaubt." }, 405, corsHeaders);
    }

    try {
      requireEnv(env, ["SUBMISSION_PASSWORD", "GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_WORKFLOW_FILE"]);

      const payload = await request.json();
      if (!payload || payload.accessCode !== env.SUBMISSION_PASSWORD) {
        return jsonResponse({ error: "Zugangscode ist ungueltig." }, 401, corsHeaders);
      }

      const language = String(payload.language || "").trim();
      const experiment = sanitizeExperiment(payload.experiment);
      const submitter = String(payload.submitter || "").trim();
      const errors = validateSubmission(language, experiment);
      if (errors.length) {
        return jsonResponse({ error: "Validierung fehlgeschlagen.", details: errors }, 400, corsHeaders);
      }

      const dispatchUrl = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/actions/workflows/${encodeURIComponent(env.GITHUB_WORKFLOW_FILE)}/dispatches`;
      const githubResponse = await fetch(dispatchUrl, {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "AlltagsLabor-Submission-Worker",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({
          ref: env.GITHUB_REF || "main",
          inputs: {
            language,
            experiment_json: JSON.stringify(experiment),
            submitter
          }
        })
      });

      if (!githubResponse.ok) {
        const body = await githubResponse.text();
        return jsonResponse({
          error: "GitHub Workflow konnte nicht gestartet werden.",
          details: body.slice(0, 1000)
        }, 502, corsHeaders);
      }

      return jsonResponse({
        ok: true,
        message: "Einreichung angenommen. Der GitHub Workflow erstellt nach Validierung einen Pull Request."
      }, 202, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: error.message || "Unbekannter Serverfehler." }, 500, corsHeaders);
    }
  }
};

function buildCorsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function requireEnv(env, keys) {
  const missing = keys.filter(key => !env[key]);
  if (missing.length) {
    throw new Error("Serverkonfiguration unvollstaendig: " + missing.join(", "));
  }
}

function validateSubmission(language, experiment) {
  const errors = [];
  if (!ALLOWED_LANGUAGES.has(language)) errors.push("Sprache ist nicht erlaubt.");
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) {
    errors.push("experiment muss ein Objekt sein.");
    return errors;
  }

  ["title", "shortDescription", "subject", "gradeLevel", "schoolType"].forEach(key => {
    if (typeof experiment[key] !== "string" || !experiment[key].trim()) {
      errors.push(`${key} muss ein nicht leerer String sein.`);
    }
  });

  if (!Array.isArray(experiment.steps) || !experiment.steps.length) {
    errors.push("steps muss ein Array mit mindestens einem Schritt sein.");
  } else {
    experiment.steps.forEach((step, index) => {
      if (!step || typeof step !== "object" || Array.isArray(step)) {
        errors.push(`Schritt ${index + 1} muss ein Objekt sein.`);
        return;
      }
      if (!ALLOWED_STEP_TYPES.has(step.type)) {
        errors.push(`Schritt ${index + 1}: type ist nicht erlaubt.`);
      }
      if (typeof step.content !== "string" || !step.content.trim()) {
        errors.push(`Schritt ${index + 1}: content muss ein nicht leerer String sein.`);
      }
    });
  }

  return errors;
}

function sanitizeExperiment(experiment) {
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) return experiment;
  const sanitized = { ...experiment };
  ["title", "subject", "gradeLevel", "schoolType"].forEach(key => {
    if (typeof sanitized[key] === "string") sanitized[key] = sanitizePlainText(sanitized[key]);
  });
  if (typeof sanitized.shortDescription === "string") {
    sanitized.shortDescription = sanitizeHtml(sanitized.shortDescription);
  }
  if (Array.isArray(sanitized.steps)) {
    sanitized.steps = sanitized.steps.map(step => {
      if (!step || typeof step !== "object" || Array.isArray(step)) return step;
      const copy = { ...step };
      if (typeof copy.content === "string") copy.content = sanitizeHtml(copy.content);
      if (typeof copy.description === "string") copy.description = sanitizePlainText(copy.description);
      return copy;
    });
  }
  return sanitized;
}

function sanitizePlainText(value) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

function sanitizeHtml(value) {
  return String(value || "")
    .replace(/<\s*(script|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|link|meta)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"]?)\s*javascript:[\s\S]*?\2/gi, "");
}
