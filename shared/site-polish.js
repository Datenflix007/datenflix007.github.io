(function () {
  "use strict";

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  function nearestCard(target) {
    return target instanceof Element
      ? target.closest(".project, .cat-card, .catalog-grid .card")
      : null;
  }

  function enableSpotlight() {
    if (!supportsHover.matches) return;

    document.addEventListener("pointermove", (event) => {
      const card = nearestCard(event.target);
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      card.classList.add("df-spotlight");
      card.style.setProperty("--df-spotlight-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--df-spotlight-y", `${event.clientY - bounds.top}px`);
      card.style.setProperty("--df-spotlight-opacity", "1");
    }, { passive: true });

    document.addEventListener("pointerout", (event) => {
      const card = nearestCard(event.target);
      if (card && !card.contains(event.relatedTarget)) {
        card.style.setProperty("--df-spotlight-opacity", "0");
      }
    }, { passive: true });
  }

  function addCatalogSkeletons() {
    const catalog = document.getElementById("projectCatalog");
    if (!catalog || !catalog.querySelector(".catalog-status")) return;
    catalog.innerHTML = '<div class="df-catalog-skeleton" aria-hidden="true"></div>'.repeat(6);
  }

  function normaliseCardVisuals(root = document) {
    root.querySelectorAll(".catalog-grid .project").forEach((card) => {
      if (card.dataset.dfVisualReady === "true") return;
      card.dataset.dfVisualReady = "true";
      const image = card.querySelector("img");
      if (image) {
        image.classList.add("df-card-media");
        return;
      }
      const visual = document.createElement("div");
      visual.className = "df-card-visual";
      visual.setAttribute("aria-hidden", "true");
      visual.innerHTML = "<span></span><i></i><b></b>";
      const heading = card.querySelector("h2, h3");
      heading?.insertAdjacentElement("afterend", visual);
    });
  }

  function addReadingTools() {
    const path = location.pathname.toLowerCase();
    const main = document.querySelector("main");
    const isReadingArea = /\/(guides|digital-worksheets)\//.test(path)
      && !/\/(index\.html)?$/.test(path)
      && main
      && main.innerText.trim().length > 1600;
    if (!isReadingArea) return;

    document.body.classList.add("df-reading-page");
    const progress = document.createElement("div");
    progress.className = "df-reading-progress";
    progress.innerHTML = '<span></span>';
    document.body.append(progress);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "df-focus-toggle";
    const updateToggle = () => {
      const enabled = document.body.classList.contains("df-focus-mode");
      const label = window.DatenflixI18n?.translate(enabled ? "common.buttons.exitFocus" : "common.buttons.focus")
        || (enabled ? "Fokus verlassen" : "Fokus");
      toggle.textContent = label;
      toggle.setAttribute("aria-pressed", String(enabled));
    };
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("df-focus-mode");
      updateToggle();
    });
    document.addEventListener("datenflix:i18n-applied", updateToggle);
    updateToggle();
    document.body.append(toggle);

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const amount = scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0;
      progress.firstElementChild.style.transform = `scaleX(${amount})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  function initialise() {
    enableSpotlight();
    addCatalogSkeletons();
    normaliseCardVisuals();
    addReadingTools();
    const observer = new MutationObserver(() => normaliseCardVisuals());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise, { once: true });
  else initialise();
})();
