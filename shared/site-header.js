(function () {
  "use strict";

  if (window.__datenflixSiteHeader) return;
  window.__datenflixSiteHeader = true;

  const shellScriptUrl = document.currentScript?.src || window.location.href;
  const LANGUAGE_CONFIG = Object.freeze({
    de: { name: "Deutsch", flagClass: "de", labelKey: "common.language.german" },
    en: { name: "English", flagClass: "gb", labelKey: "common.language.english" },
    fr: { name: "Français", flagClass: "fr", labelKey: "common.language.french" }
  });
  window.DatenflixLanguageConfig = LANGUAGE_CONFIG;
  const links = [
    ["Referenzen", "https://datenflix007.github.io/src/Referenzen.html", "references"],
    ["Projekte", "https://datenflix007.github.io/src/projekte.html", "projects"],
    ["Kontakt", "https://datenflix007.github.io/src/kontakt.html", "contact"],
    ["Tools", "https://datenflix007.github.io/tools/", "tools"],
    ["Guides", "https://datenflix007.github.io/guides/", "guides"],
    ["Arbeitsblätter", "https://datenflix007.github.io/digital-worksheets/", "worksheets"]
  ];

  function loadI18n() {
    if (window.__datenflixI18nRequested || window.DatenflixI18n) return;
    window.__datenflixI18nRequested = true;
    const i18nScript = document.createElement("script");
    i18nScript.src = new URL("i18n.js", shellScriptUrl).href;
    i18nScript.async = false;
    document.head.append(i18nScript);
  }

  function loadSharedStylesheet(fileName) {
    const href = new URL(fileName, shellScriptUrl).href;
    if (document.querySelector(`link[data-datenflix-shared-style="${fileName}"]`)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    stylesheet.dataset.datenflixSharedStyle = fileName;
    document.head.append(stylesheet);
  }

  function loadSharedScript(fileName) {
    const src = new URL(fileName, shellScriptUrl).href;
    if (document.querySelector(`script[data-datenflix-shared-script="${fileName}"]`)) return;
    const sharedScript = document.createElement("script");
    sharedScript.src = src;
    sharedScript.async = false;
    sharedScript.dataset.datenflixSharedScript = fileName;
    document.head.append(sharedScript);
  }

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

  function renderHeader() {
    const active = activeArea(location.pathname);
    const currentLinks = links.map(([label, href, area]) => `<a class="site-nav__link" href="${href}" data-i18n="navigation.${area}"${area === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const languageOptions = Object.entries(LANGUAGE_CONFIG).map(([code, language]) => `<button class="site-language__option${code === "de" ? " is-active" : ""}" type="button" data-language="${code}" aria-current="${code === "de"}"><span class="site-language__flag site-language__flag--${language.flagClass}" aria-hidden="true"></span><span data-i18n="${language.labelKey}">${language.name}</span></button>`).join("");
    const header = document.createElement("header");
    header.className = "site-header";
    header.dataset.siteHeader = "true";
    header.innerHTML = `
      <div class="site-header__inner">
        <a class="site-brand" href="https://datenflix007.github.io/" aria-label="Zur Startseite von Felix Staacke" data-i18n-aria-label="common.brand.home"><span class="site-brand__mark" aria-hidden="true"></span><span>Felix Staacke</span></a>
        <button class="site-mobile-toggle" type="button" aria-expanded="false" aria-controls="datenflixSiteNav" aria-label="Navigation öffnen" data-i18n-aria-label="common.navigation.open"><span class="site-mobile-toggle__bar"></span><span class="site-mobile-toggle__bar"></span><span class="site-mobile-toggle__bar"></span></button>
        <nav class="site-nav" id="datenflixSiteNav" aria-label="Hauptnavigation" data-i18n-aria-label="common.navigation.label">
          ${currentLinks}
          <div class="site-language">
            <button class="site-language__toggle" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="datenflixLanguageMenu" aria-label="Sprache auswählen" data-i18n-aria-label="common.language.label"><span class="site-language__current site-language__flag site-language__flag--de" data-current-language-flag aria-hidden="true"></span><span class="site-language__chevron" aria-hidden="true">⌄</span></button>
            <div class="site-language__menu" id="datenflixLanguageMenu" hidden>
              ${languageOptions}
            </div>
          </div>
        </nav>
      </div>`;

    const existingHeader = document.querySelector("body > header");
    const isLegacyPortalHeader = existingHeader && (/Felix Staacke/i.test(existingHeader.textContent || "") || existingHeader.querySelector('a[href*="Referenzen"], a[href*="projekte"], a[href*="kontakt"]'));
    if (isLegacyPortalHeader) {
      existingHeader.remove();
    } else if (existingHeader) {
      const position = window.getComputedStyle(existingHeader).position;
      if (position === "sticky" || position === "fixed") existingHeader.classList.add("site-app-header--offset");
    }
    document.body.insertBefore(header, document.body.firstChild);
    document.body.classList.add("has-datenflix-shell");

    const navigation = header.querySelector(".site-nav");
    const toggle = header.querySelector(".site-mobile-toggle");
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", window.DatenflixI18n?.translate("common.navigation.open") || "Navigation öffnen");
    };
    toggle.addEventListener("click", () => {
      const open = navigation.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open
        ? window.DatenflixI18n?.translate("common.navigation.close") || "Navigation schließen"
        : window.DatenflixI18n?.translate("common.navigation.open") || "Navigation öffnen");
    });
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  loadSharedStylesheet("responsive.css");
  loadSharedScript("site-polish.js");
  loadI18n();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderHeader, { once: true });
  else renderHeader();
})();
