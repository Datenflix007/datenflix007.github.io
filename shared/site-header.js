(function () {
  "use strict";

  if (window.__datenflixSiteHeader) return;
  window.__datenflixSiteHeader = true;

  const links = [
    ["Referenzen", "https://datenflix007.github.io/src/Referenzen.html", "references"],
    ["Projekte", "https://datenflix007.github.io/src/projekte.html", "projects"],
    ["Kontakt", "https://datenflix007.github.io/src/kontakt.html", "contact"],
    ["Tools", "https://datenflix007.github.io/tools/", "tools"],
    ["Guides", "https://datenflix007.github.io/guides/", "guides"],
    ["Arbeitsblätter", "https://datenflix007.github.io/digital-worksheets/", "worksheets"]
  ];

  function activeArea(pathname) {
    const path = pathname.toLowerCase();
    if (path.includes("/digital-worksheets/")) return "worksheets";
    if (path.includes("/tools/")) return "tools";
    if (path.includes("/guides/")) return "guides";
    if (path.includes("/src/referenzen.html")) return "references";
    if (path.includes("/src/projekte.html")) return "projects";
    if (path.includes("/src/kontakt.html")) return "contact";
    return "";
  }

  function flags() {
    return {
      de: '<svg class="site-language__flag" viewBox="0 0 24 16" aria-hidden="true"><path fill="#111" d="M0 0h24v5.34H0z"/><path fill="#d00" d="M0 5.33h24v5.34H0z"/><path fill="#ffce00" d="M0 10.66h24V16H0z"/></svg>',
      en: '<svg class="site-language__flag" viewBox="0 0 24 16" aria-hidden="true"><path fill="#012169" d="M0 0h24v16H0z"/><path d="m0 0 24 16M24 0 0 16" stroke="#fff" stroke-width="3"/><path d="m0 0 24 16M24 0 0 16" stroke="#c8102e" stroke-width="1.5"/><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5"/><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"/></svg>'
    };
  }

  function renderHeader() {
    const active = activeArea(location.pathname);
    const currentLinks = links.map(([label, href, area]) => `<a class="site-nav__link" href="${href}"${area === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const icons = flags();
    const header = document.createElement("header");
    header.className = "site-header";
    header.dataset.siteHeader = "true";
    header.innerHTML = `
      <div class="site-header__inner">
        <a class="site-brand" href="https://datenflix007.github.io/" aria-label="Zur Startseite von Felix Staacke"><span class="site-brand__mark" aria-hidden="true"></span><span>Felix Staacke</span></a>
        <button class="site-mobile-toggle" type="button" aria-expanded="false" aria-controls="datenflixSiteNav" aria-label="Navigation öffnen"><span class="site-mobile-toggle__bar"></span><span class="site-mobile-toggle__bar"></span><span class="site-mobile-toggle__bar"></span></button>
        <nav class="site-nav" id="datenflixSiteNav" aria-label="Hauptnavigation">${currentLinks}
          <div class="site-language" aria-label="Sprachauswahl, Übersetzungen folgen">
            <button class="site-language__button" type="button" data-lang="de" aria-label="Deutsch" title="Deutsch (Standard)" aria-pressed="true">${icons.de}<span>DE</span></button>
            <button class="site-language__button" type="button" data-lang="en" aria-label="English" title="English (coming soon)" aria-pressed="false">${icons.en}<span>EN</span></button>
          </div>
        </nav>
      </div>`;

    const existingHeader = document.querySelector("body > header");
    const isLegacyPortalHeader = existingHeader && (/Felix Staacke/i.test(existingHeader.textContent || "") || existingHeader.querySelector('a[href*="Referenzen"], a[href*="projekte"], a[href*="kontakt"]'));
    if (isLegacyPortalHeader) existingHeader.remove();
    document.body.insertBefore(header, document.body.firstChild);

    const navigation = header.querySelector(".site-nav");
    const toggle = header.querySelector(".site-mobile-toggle");
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Navigation öffnen");
    };
    toggle.addEventListener("click", () => {
      const open = navigation.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Navigation schließen" : "Navigation öffnen");
    });
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
      const languageButton = event.target.closest("[data-lang]");
      if (languageButton) {
        navigation.querySelectorAll("[data-lang]").forEach((button) => button.setAttribute("aria-pressed", String(button === languageButton)));
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderHeader, { once: true });
  else renderHeader();
})();
