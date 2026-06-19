const ALLOWED_LANGUAGES = new Set(["de", "eng", "es", "fa", "fr", "pol", "ru", "rum", "turk", "uk"]);
const ALLOWED_ACTIONS = new Set(["create", "edit", "delete"]);
const ALLOWED_STEP_TYPES = new Set(["text", "aufgabe", "merksatz", "image", "audio"]);
const ACCOUNTS = {
  devTeam: {
    passwordEnv: "DEVTEAM_PASSWORD",
    permissions: new Set(["create", "edit", "delete"])
  },
  academicTest: {
    passwordEnv: "ACADEMICTEST_PASSWORD",
    permissions: new Set(["create", "edit"])
  },
  schoolAccount: {
    passwordEnv: "SCHOOLACCOUNT_PASSWORD",
    permissions: new Set(["create"])
  }
};

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
      requireEnv(env, ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_WORKFLOW_FILE"]);

      const payload = await request.json();
      const account = authenticate(payload, env);
      const action = String(payload.action || "create").trim();
      const language = String(payload.language || "").trim();
      const target = sanitizeTarget(payload.target || {});
      const experiment = action === "delete" ? {} : sanitizeExperiment(payload.experiment);
      const submitter = account.name + (payload.submitter ? ` / ${sanitizePlainText(payload.submitter)}` : "");
      const errors = validateSubmission({ action, language, experiment, target, account });
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
            action,
            language,
            experiment_json: JSON.stringify(experiment),
            target_experiment_id: target.id || "",
            target_experiment_title: target.title || "",
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
        message: "Anfrage angenommen. Der GitHub Workflow erstellt nach Validierung einen Pull Request.",
        action,
        account: account.name
      }, 202, corsHeaders);
    } catch (error) {
      const status = error.status || 500;
      return jsonResponse({ error: error.message || "Unbekannter Serverfehler." }, status, corsHeaders);
    }
  }
};

function authenticate(payload, env) {
  if (!payload || typeof payload !== "object") {
    throw httpError("Ungueltige Anfrage.", 400);
  }

  const accountName = String(payload.accountName || "").trim();
  const accountPassword = String(payload.accountPassword || "").trim();
  const accountConfig = ACCOUNTS[accountName];
  if (!accountConfig) {
    throw httpError("Unbekannter Account.", 401);
  }

  const expected = env[accountConfig.passwordEnv];
  if (!expected) {
    throw httpError(`Serverkonfiguration unvollstaendig: ${accountConfig.passwordEnv}`, 500);
  }
  if (!accountPassword || accountPassword !== expected) {
    throw httpError("Account oder Passwort ist ungueltig.", 401);
  }

  return {
    name: accountName,
    permissions: accountConfig.permissions
  };
}

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

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireEnv(env, keys) {
  const missing = keys.filter(key => !env[key]);
  if (missing.length) {
    throw new Error("Serverkonfiguration unvollstaendig: " + missing.join(", "));
  }
}

function validateSubmission({ action, language, experiment, target, account }) {
  const errors = [];
  if (!ALLOWED_ACTIONS.has(action)) errors.push("Aktion ist nicht erlaubt.");
  if (!account.permissions.has(action)) errors.push(`${account.name} darf die Aktion ${action} nicht ausfuehren.`);
  if (!ALLOWED_LANGUAGES.has(language)) errors.push("Sprache ist nicht erlaubt.");

  if (action === "edit" || action === "delete") {
    if (!target.id && !target.title) {
      errors.push("Bearbeiten/Loeschen braucht ein Ziel-Experiment.");
    }
  }

  if (action !== "delete") {
    errors.push(...validateExperiment(experiment));
  }

  return errors;
}

function validateExperiment(experiment) {
  const errors = [];
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) {
    errors.push("experiment muss ein Objekt sein.");
    return errors;
  }

  ["id", "title", "shortDescription", "subject", "gradeLevel", "schoolType"].forEach(key => {
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

function sanitizeTarget(target) {
  return {
    id: sanitizePlainText(target.id || ""),
    title: sanitizePlainText(target.title || "")
  };
}

function sanitizeExperiment(experiment) {
  if (!experiment || typeof experiment !== "object" || Array.isArray(experiment)) return experiment;
  const sanitized = { ...experiment };
  ["id", "title", "subject", "gradeLevel", "schoolType"].forEach(key => {
    if (typeof sanitized[key] === "string") sanitized[key] = sanitizePlainText(sanitized[key]);
  });
  if (!sanitized.id && sanitized.title) sanitized.id = stableId(sanitized.title);
  if (typeof sanitized.shortDescription === "string") {
    sanitized.shortDescription = sanitizeHtml(sanitized.shortDescription);
  }
  if (Array.isArray(sanitized.steps)) {
    sanitized.steps = sanitized.steps.map(step => {
      if (!step || typeof step !== "object" || Array.isArray(step)) return step;
      const copy = { ...step };
      if (typeof copy.type === "string") copy.type = sanitizePlainText(copy.type);
      if (typeof copy.content === "string") copy.content = sanitizeHtml(copy.content);
      if (typeof copy.description === "string") copy.description = sanitizePlainText(copy.description);
      return copy;
    });
  }
  return sanitized;
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
