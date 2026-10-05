(() => {
  "use strict";

  const script = document.currentScript;
  const baseUrl = new URL(".", script?.src || window.location.href);
  const DEFAULT_LANGUAGE = "de";
  const fallbackLanguageConfig = Object.freeze({
    de: { name: "Deutsch", flagClass: "de", labelKey: "common.language.german" },
    en: { name: "English", flagClass: "gb", labelKey: "common.language.english" },
    fr: { name: "Français", flagClass: "fr", labelKey: "common.language.french" }
  });
  const LANGUAGES = window.DatenflixLanguageConfig || fallbackLanguageConfig;
  const translationFiles = ["common.json", "navigation.json", "pages.json"];
  let currentLanguage = DEFAULT_LANGUAGE;
  let translations = {};
  let fallbackTranslations = {};
  let changeSequence = 0;

  function getNestedValue(object, path) {
    return path.split(".").reduce((value, key) => value?.[key], object);
  }

  function isSupported(language) {
    return Object.prototype.hasOwnProperty.call(LANGUAGES, language);
  }

  function readStoredLanguage() {
    try {
      const saved = localStorage.getItem("language");
      return isSupported(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  function detectInitialLanguage() {
    const requested = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
    if (isSupported(requested)) return requested;

    const saved = readStoredLanguage();
    if (saved) return saved;

    const browserLanguage = navigator.language?.toLowerCase().split("-")[0];
    return isSupported(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
  }

  async function fetchJson(language, file) {
    const response = await fetch(new URL(`lang/${language}/${file}`, baseUrl), { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Could not load translation file: ${language}/${file}`);
    return response.json();
  }

  async function loadLanguage(language) {
    const values = await Promise.all(translationFiles.map((file) => fetchJson(language, file)));
    return Object.fromEntries(translationFiles.map((file, index) => [file.replace(".json", ""), values[index]]));
  }

  function translate(key, replacements) {
    const value = getNestedValue(translations, key) ?? getNestedValue(fallbackTranslations, key);
    if (typeof value !== "string") return null;
    if (!replacements) return value;
    return value.replace(/\{([^}]+)\}/g, (_, token) => replacements[token] ?? `{${token}}`);
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = translate(element.dataset.i18n);
      if (value !== null) element.textContent = value;
    });

    const attributeMappings = [
      ["data-i18n-placeholder", "i18nPlaceholder", "placeholder"],
      ["data-i18n-title", "i18nTitle", "title"],
      ["data-i18n-aria-label", "i18nAriaLabel", "aria-label"],
      ["data-i18n-alt", "i18nAlt", "alt"]
    ];
    attributeMappings.forEach(([selector, datasetKey, attribute]) => {
      document.querySelectorAll(`[${selector}]`).forEach((element) => {
        const value = translate(element.dataset[datasetKey]);
        if (value !== null) element.setAttribute(attribute, value);
      });
    });
  }

  function closeLanguageMenu() {
    const menu = document.querySelector(".site-language__menu");
    const button = document.querySelector(".site-language__toggle");
    if (!menu || !button) return;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function updateLanguageSelector() {
    const language = LANGUAGES[currentLanguage];
    document.querySelectorAll("[data-current-language-flag]").forEach((element) => {
      element.className = `site-language__current site-language__flag site-language__flag--${language.flagClass}`;
    });
    document.querySelectorAll("[data-language]").forEach((option) => {
      const active = option.dataset.language === currentLanguage;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function bindLanguageSelector() {
    const selector = document.querySelector(".site-language");
    const toggle = selector?.querySelector(".site-language__toggle");
    const menu = selector?.querySelector(".site-language__menu");
    if (!selector || !toggle || !menu || selector.dataset.i18nBound === "true") return;
    selector.dataset.i18nBound = "true";

    toggle.addEventListener("click", () => {
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
    menu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-language]");
      if (option) setLanguage(option.dataset.language);
    });
    document.addEventListener("click", (event) => {
      if (!selector.contains(event.target)) closeLanguageMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        closeLanguageMenu();
        toggle.focus();
      }
    });
  }

  async function setLanguage(language, { persist = true } = {}) {
    const targetLanguage = isSupported(language) ? language : DEFAULT_LANGUAGE;
    const sequence = ++changeSequence;
    try {
      const fallback = fallbackTranslations.common ? fallbackTranslations : await loadLanguage(DEFAULT_LANGUAGE);
      const selected = targetLanguage === DEFAULT_LANGUAGE ? fallback : await loadLanguage(targetLanguage);
      if (sequence !== changeSequence) return;
      fallbackTranslations = fallback;
      translations = selected;
      currentLanguage = targetLanguage;
      document.documentElement.lang = targetLanguage;
      if (persist) {
        try { localStorage.setItem("language", targetLanguage); } catch { /* Storage can be unavailable. */ }
      }
      applyTranslations();
      updateLanguageSelector();
      closeLanguageMenu();
      document.dispatchEvent(new CustomEvent("datenflix:i18n-applied", { detail: { language: targetLanguage } }));
    } catch (error) {
      console.warn("Datenflix i18n could not load translations; German HTML fallback remains visible.", error);
    }
  }

  window.DatenflixI18n = Object.freeze({
    languages: LANGUAGES,
    get currentLanguage() { return currentLanguage; },
    setLanguage,
    translate
  });

  const initialise = () => {
    bindLanguageSelector();
    setLanguage(detectInitialLanguage());
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise, { once: true });
  else initialise();
})();
