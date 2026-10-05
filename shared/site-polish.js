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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enableSpotlight, { once: true });
  else enableSpotlight();
})();
