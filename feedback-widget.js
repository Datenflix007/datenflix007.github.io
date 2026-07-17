(function () {
  const repoUrl = "https://github.com/Datenflix007/datenflix007.github.io/issues/new";
  const categories = [
    ["Fehlerreport", "Etwas funktioniert nicht, sieht falsch aus oder ist kaputt."],
    ["Inspiration", "Idee fuer ein neues Feature, Modul, Thema oder Beispiel."],
    ["Anmerkung", "Feedback, Korrektur, Verstaendnisfrage oder sonstiger Hinweis."]
  ];

  if (window.__datenflixFeedbackWidget) return;
  window.__datenflixFeedbackWidget = true;

  const style = document.createElement("style");
  style.textContent = `
    .df-feedback-launch {
      position: fixed;
      right: max(18px, env(safe-area-inset-right));
      bottom: max(18px, env(safe-area-inset-bottom));
      z-index: 99990;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      min-height: 44px;
      padding: 0 15px;
      border: 1px solid rgba(125, 211, 252, .48);
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(15, 23, 42, .94), rgba(17, 24, 39, .9));
      color: #e6f6ff;
      box-shadow: 0 16px 42px rgba(2, 6, 23, .52);
      backdrop-filter: blur(14px);
      font: 700 13px/1 Inter, system-ui, -apple-system, Segoe UI, sans-serif;
      letter-spacing: .01em;
      cursor: pointer;
    }
    .df-feedback-launch:hover,
    .df-feedback-launch:focus-visible {
      outline: none;
      transform: translateY(-1px);
      border-color: rgba(167, 139, 250, .72);
      box-shadow: 0 18px 46px rgba(56, 189, 248, .16), 0 16px 42px rgba(2, 6, 23, .52);
    }
    .df-feedback-launch-mark {
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: linear-gradient(135deg, #38bdf8, #a78bfa);
      color: #020617;
      font-weight: 900;
    }
    .df-feedback-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99991;
      display: none;
      place-items: end center;
      padding: 18px;
      background: rgba(2, 6, 23, .58);
      backdrop-filter: blur(7px);
    }
    .df-feedback-backdrop.open { display: grid; }
    .df-feedback-panel {
      width: min(560px, 100%);
      border: 1px solid rgba(148, 163, 184, .28);
      border-radius: 14px;
      background:
        radial-gradient(circle at 20% 0%, rgba(56, 189, 248, .16), transparent 36%),
        radial-gradient(circle at 100% 18%, rgba(167, 139, 250, .16), transparent 34%),
        #0b111d;
      color: #e5edf7;
      box-shadow: 0 26px 80px rgba(0, 0, 0, .58);
      overflow: hidden;
      font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
    }
    .df-feedback-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(148, 163, 184, .18);
    }
    .df-feedback-title {
      margin: 0;
      font-size: 1.02rem;
      line-height: 1.25;
      color: #f8fafc;
    }
    .df-feedback-sub {
      margin: 4px 0 0;
      color: #9fb0cb;
      font-size: .86rem;
      line-height: 1.45;
    }
    .df-feedback-close {
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      border: 1px solid rgba(148, 163, 184, .32);
      border-radius: 9px;
      background: rgba(15, 23, 42, .78);
      color: #cbd5e1;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }
    .df-feedback-close:hover,
    .df-feedback-close:focus-visible {
      outline: none;
      color: #fff;
      border-color: rgba(125, 211, 252, .7);
    }
    .df-feedback-form {
      display: grid;
      gap: 13px;
      padding: 16px 18px 18px;
    }
    .df-feedback-field {
      display: grid;
      gap: 7px;
    }
    .df-feedback-field label {
      color: #cbd5e1;
      font-size: .84rem;
      font-weight: 700;
    }
    .df-feedback-field select,
    .df-feedback-field input,
    .df-feedback-field textarea {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, .28);
      border-radius: 10px;
      background: rgba(2, 6, 23, .72);
      color: #e5edf7;
      padding: 11px 12px;
      font: 500 .94rem/1.35 Inter, system-ui, -apple-system, Segoe UI, sans-serif;
      outline: none;
    }
    .df-feedback-field textarea {
      min-height: 132px;
      resize: vertical;
    }
    .df-feedback-field select:focus,
    .df-feedback-field input:focus,
    .df-feedback-field textarea:focus {
      border-color: rgba(125, 211, 252, .78);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, .12);
    }
    .df-feedback-hint {
      color: #8ea0ba;
      font-size: .78rem;
      line-height: 1.45;
    }
    .df-feedback-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      padding-top: 3px;
    }
    .df-feedback-secondary,
    .df-feedback-submit {
      min-height: 40px;
      border-radius: 10px;
      padding: 0 14px;
      cursor: pointer;
      font: 800 .88rem/1 Inter, system-ui, -apple-system, Segoe UI, sans-serif;
    }
    .df-feedback-secondary {
      border: 1px solid rgba(148, 163, 184, .28);
      background: rgba(15, 23, 42, .72);
      color: #cbd5e1;
    }
    .df-feedback-submit {
      border: 1px solid rgba(125, 211, 252, .58);
      background: linear-gradient(135deg, #38bdf8, #a78bfa);
      color: #020617;
    }
    .df-feedback-submit:hover,
    .df-feedback-submit:focus-visible {
      outline: none;
      filter: brightness(1.06);
    }
    .df-feedback-error {
      display: none;
      color: #fecaca;
      background: rgba(127, 29, 29, .2);
      border: 1px solid rgba(248, 113, 113, .35);
      border-radius: 10px;
      padding: 9px 10px;
      font-size: .84rem;
    }
    .df-feedback-error.show { display: block; }
    @media (min-width: 760px) {
      .df-feedback-backdrop { place-items: center; }
    }
    @media (max-width: 560px) {
      .df-feedback-launch {
        right: 12px;
        bottom: 12px;
        padding: 0;
        width: 48px;
        justify-content: center;
      }
      .df-feedback-launch-text { display: none; }
      .df-feedback-panel { border-radius: 13px; }
      .df-feedback-actions { justify-content: stretch; }
      .df-feedback-secondary,
      .df-feedback-submit { flex: 1 1 160px; }
    }
  `;
  document.head.appendChild(style);

  function currentPageLabel() {
    const heading = (document.querySelector("h1")?.textContent || "").trim();
    const title = (document.title || heading || "Unbekannte Seite").trim();
    const path = location.pathname.replace(/^\/+/, "") || "index.html";
    return { title, heading, path };
  }

  function buildIssueUrl(data) {
    const page = currentPageLabel();
    const title = `[${data.category}] ${data.shortTitle || page.title}`;
    const body = [
      "## Kategorie",
      data.category,
      "",
      "## Betroffene Seite",
      page.heading ? `${page.title} - ${page.heading}` : page.title,
      "",
      "## Pfad / URL",
      location.href,
      "",
      "## Beschreibung",
      data.description,
      "",
      "## Erwartung / Idee",
      data.expectation || "-",
      "",
      "## Hinweis",
      "Dieses Issue wurde ueber das Feedback-Widget der Website vorbereitet. Wenn du mit deinem GitHub-Account angemeldet bist, kannst du das Issue auf GitHub abschicken und bei Bedarf abonnieren."
    ].join("\n");

    const params = new URLSearchParams({ title, body });
    return `${repoUrl}?${params.toString()}`;
  }

  function createWidget() {
    const launch = document.createElement("button");
    launch.type = "button";
    launch.className = "df-feedback-launch";
    launch.setAttribute("aria-haspopup", "dialog");
    launch.innerHTML = '<span class="df-feedback-launch-mark">!</span><span class="df-feedback-launch-text">Feedback</span>';

    const backdrop = document.createElement("div");
    backdrop.className = "df-feedback-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-labelledby", "dfFeedbackTitle");
    backdrop.innerHTML = `
      <section class="df-feedback-panel">
        <div class="df-feedback-head">
          <div>
            <h2 id="dfFeedbackTitle" class="df-feedback-title">Feedback zur Website</h2>
            <p class="df-feedback-sub">Waehle eine Kategorie, beschreibe kurz dein Anliegen und sende es als GitHub-Issue ab.</p>
          </div>
          <button type="button" class="df-feedback-close" aria-label="Feedback schliessen">&times;</button>
        </div>
        <form class="df-feedback-form">
          <div class="df-feedback-field">
            <label for="dfFeedbackCategory">Art des Feedbacks</label>
            <select id="dfFeedbackCategory" name="category" required>
              ${categories.map(([name, desc]) => `<option value="${name}">${name} - ${desc}</option>`).join("")}
            </select>
          </div>
          <div class="df-feedback-field">
            <label for="dfFeedbackShort">Kurzer Titel</label>
            <input id="dfFeedbackShort" name="shortTitle" maxlength="90" placeholder="z. B. Button im DatastructureLab reagiert nicht">
          </div>
          <div class="df-feedback-field">
            <label for="dfFeedbackDescription">Beschreibung</label>
            <textarea id="dfFeedbackDescription" name="description" required placeholder="Was ist passiert? Was fehlt? Welche Idee hast du?"></textarea>
            <div class="df-feedback-hint">Die aktuelle Seite und URL werden automatisch in das Issue uebernommen.</div>
          </div>
          <div class="df-feedback-field">
            <label for="dfFeedbackExpectation">Erwartung oder Vorschlag</label>
            <textarea id="dfFeedbackExpectation" name="expectation" placeholder="Optional: Wie sollte es deiner Meinung nach funktionieren?"></textarea>
          </div>
          <div class="df-feedback-error" role="alert">Bitte beschreibe dein Anliegen kurz, bevor du das Issue oeffnest.</div>
          <div class="df-feedback-actions">
            <button type="button" class="df-feedback-secondary">Abbrechen</button>
            <button type="submit" class="df-feedback-submit">Issue auf GitHub oeffnen</button>
          </div>
        </form>
      </section>
    `;

    const closeBtn = backdrop.querySelector(".df-feedback-close");
    const cancelBtn = backdrop.querySelector(".df-feedback-secondary");
    const form = backdrop.querySelector("form");
    const error = backdrop.querySelector(".df-feedback-error");

    function open() {
      backdrop.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => backdrop.querySelector("select")?.focus(), 0);
    }

    function close() {
      backdrop.classList.remove("open");
      document.body.style.overflow = "";
      launch.focus();
    }

    launch.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && backdrop.classList.contains("open")) close();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!String(data.description || "").trim()) {
        error.classList.add("show");
        form.description.focus();
        return;
      }
      error.classList.remove("show");
      window.open(buildIssueUrl(data), "_blank", "noopener,noreferrer");
      close();
    });

    document.body.appendChild(launch);
    document.body.appendChild(backdrop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
