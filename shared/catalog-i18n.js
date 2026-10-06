(function () {
  "use strict";

  // These cards are reused by the Projects, Tools, and Guides catalogues. Keeping
  // the copy here makes the language selector work for cards loaded after startup.
  const translations = {
    en: {
      "alltagslabor": { m: "Summer term 2025", d: "This project is being developed in the summer term of 2025 by Felix Staacke and two fellow students. The finished program is the assessed work for the course \"Digital Teaching and Learning at the Werkstattschule Jena\" (course no. 219464) at Friedrich Schiller University Jena." },
      "edsp": { m: "School year 2020/21", d: "As a year-12 project, the incident dispatch software was programmed." },
      "lautstarke-visualisierung": { t: "Sound visualisation", m: "Winter term 2025", d: "Group project for the course \"Visualisation with Unity\". Further information will follow." },
      "lus": { m: "Summer term 2025", d: "Project work on learning-level assessment software at Friedrich Schiller University Jena. Further information will follow." },
      "der-jenaer-wald-und-wir": { t: "The Jena Forest and Us", m: "Digital worksheet", d: "A digital worksheet for a workshop on the history of the Jena forest and historical forest occupations." },
      "datastructurelab": { d: "Interactive lab for creating, visualising and trying out core data structures and their operations." },
      "automatalab": { d: "A tool for constructing, simulating and transforming finite automata, pushdown automata and Turing machines." },
      "lambda-kalkul-labor": { t: "Lambda calculus lab", m: "History of computing", d: "Interactive lab on Alonzo Church and lambda calculus: enter terms, follow beta reduction step by step, find normal forms and check exercises." },
      "babbage-analytical-engine-emulator": { m: "History of computing", d: "Educational browser emulator for Babbage's Analytical Engine: explore Store, Mill, Operation Cards, Variable Cards, loops and printer output as a card program." },
      "z3-emulator": { m: "History of computing", d: "Educational browser emulator for Konrad Zuse's Z3: read program tape, load memory words, inspect registers and follow floating-point operations step by step." },
      "informatikgeschichte-emulator-lab": { t: "History of computing emulator lab", m: "History of computing", d: "A collection of working mini emulators for ELIZA, Turing machines, relay logic, FORTRAN, LISP, BASIC, Intel 4004, C/Stack, RSA, DNS and MapReduce." },
      "a-0-compiler-emulator": { m: "History of computing", d: "Educational browser emulator for the A-0 System Compiler: write symbolic routine calls, create object tape and see how a compiler establishes an abstraction layer for later high-level languages." },
      "eniac-emulator": { m: "History of computing", d: "Educational browser emulator for ENIAC: patch the deck, inspect 20 decimal accumulators, constant transmitters, the Master Programmer, pulse lines and punched-card output." },
      "algodat-kurs": { t: "AlgoDat course", d: "Interactive course on algorithms, data structures, runtime analysis and sorting methods." },
      "gvis": { m: "Geospatial analysis", d: "Static GIS tool for OSM, GeoJSON and CSV data: formulate a query, assess POIs, vegetation, buildings and paths, then display likely locations on an OSM map." },
      "kunstwerk": { m: "Photoshop-style tool", d: "A Photoshop-style browser tool for image editing: open and crop images, select or pixelate areas, cut out objects with Magic Pen, remove backgrounds and apply filters." },
      "regie-wall": { m: "Control wall for streams and sources", d: "Production and monitoring wall for arranging websites, sign-in pages, YouTube, HLS streams or local IPv4 services, including presets, full-screen mode, audio controls and a soundboard." },
      "jenatramboard": { m: "Small side project", d: "Compact departure monitor for Jena trams: local web interface, desktop window and settings for routes, stops, display and small companion displays." },
      "ti-trainer": { m: "Interactive learning environment", d: "Structured learning modules on automata, algorithms and data structures, computer scientists and the von Neumann architecture." },
      "algorithmplanner": { d: "A visual toolkit for modelling program flows as Nassi-Shneiderman diagrams or flowcharts and classes as UML diagrams. It generates Java, C#, C++, Python, Prolog or JavaScript code from the model." },
      "hologramm-history": { t: "Hologram History", m: "Winter term 2025", d: "A web application for asking questions about images of historical figures (later holograms). The application is still in development." },
      "ub-heidelberg-author-tracker": { m: "Historical journals", d: "Local research tool for building author indexes for historical journals. It retrieves metadata from UB Heidelberg/DWork and ThULB/journals@UrMEL and creates structured JSON and ZIP output." },
      "author-publication-tracker": { m: "Publication directories", d: "Local Python/Svelte application for source-critical publication directories for freely entered authors. It compares, deduplicates and exports GND, OpenAlex, Crossref, DNB and historical-journal sources." },
      "nara-trace": { m: "Archival person search", d: "Local, unofficial research tool for source-based person searches in the NARA National Archives Catalog, with search history, detail views, original pages and transcripts." },
      "markdown-generator": { t: "Markdown generator", m: "Summer term 2025", d: "A web application that lets users create Markdown files by assembling Markdown elements like building blocks. It is intended for pupils and colleagues." },
      "paper-maker": { t: "Paper maker", m: "Term papers and articles", d: "Word-like browser editor for academic papers, with A4 layout, table of contents, character counter, footnotes, bibliography management, LaTeX import and project export." },
      "manuskript-maker": { t: "Manuscript maker", m: "Still in progress", d: "Still in progress." },
      "meme-maker": { t: "Meme maker", m: "Still in progress", d: "Still in progress." },
      "mysql-trainee-ground": { m: "Winter term 2025", d: "Docker provides a MySQL and phpMyAdmin environment for learning and deepening SQL skills. Integrated exercises make working with databases easier." },
      "mywebhub": { m: "Summer term 2025", d: "A start page for my web browser. All data is stored locally in the browser." },
      "ocr-extractor": { m: "Summer term 2025", d: "Still in progress." },
      "qr-generator": { m: "Summer term 2025", d: "A web application for generating QR codes. Users can change the QR code's size and add a logo, for example that of an organisation, in the middle." },
      "scrum-4-school": { m: "Winter term 2024/2025", d: "A web application through which pupils practise structured work in a learning sequence. Originally designed for a year-11 class, it can also be used in other year groups and school types." },
      "school-notebook": { m: "Winter term 2025/2026", d: "A web application through which pupils learn a Python-inspired language. The interface imitates an IDE and console, with the backend recreated in JavaScript." },
      "zotero-x-docker-x-github": { d: "A setup that connects Zotero to a self-hosted WebDAV server run with Docker and provided through GitHub. This synchronises the Zotero library without commercial cloud services: private, free and entirely under your own control." },
      "tivisualizer": { m: "Summer term 2025", d: "A web application that visualises the von Neumann architecture. Users can select the individual components. Still in progress." },
      "programm-exe-erstellen": { t: "Create a program.exe", m: "Build code as a Windows app", d: "Guide to producing runnable Program.exe files from Python, Java, C#, Node.js, Go and Rust projects, including icons, resources, GUI mode and a distribution folder." },
      "installer-guide": { m: "Make apps installable", d: "Guide to CLI installers, Tkinter installer interfaces, Start menu entries, desktop shortcuts, icons and packaging Java and Python applications on Windows and Linux." },
      "pake-guide": { m: "Websites as desktop apps", d: "Guide to Pake, Rust, Tauri and WebViews: install dependencies, build a first app and use common options in practice." },
      "redis-caching-guide": { m: "Cache storage", d: "Detailed guide to Redis caching, TTLs, cache-aside, invalidation and practical Node.js and Python examples." },
      "winget-guide": { d: "Guide to finding, installing, updating and managing software with WinGet." },
      "git-github-guide": { m: "Interactive complete course", d: "A guide to the foundations and workflows of Git, GitHub and GitLab." },
      "just-guide": { m: "Command runner", d: "Guide to installing and using Justfiles for reusable project commands." }
    },
    fr: {
      "alltagslabor": { m: "Semestre d'été 2025", d: "Ce projet est développé au semestre d'été 2025 par Felix Staacke et deux camarades. Le programme final constitue le travail évalué du cours « Enseignement et apprentissage numériques à la Werkstattschule Jena » (n° 219464) à l'université Friedrich-Schiller d'Iéna." },
      "edsp": { m: "Année scolaire 2020/21", d: "Dans le cadre d'un projet de terminale, le logiciel de répartition des interventions a été programmé." },
      "lautstarke-visualisierung": { t: "Visualisation sonore", m: "Semestre d'hiver 2025", d: "Projet de groupe réalisé dans le cadre du cours « Visualisation avec Unity ». Plus d'informations suivront." },
      "lus": { m: "Semestre d'été 2025", d: "Projet sur un logiciel d'évaluation des acquis à l'université Friedrich-Schiller d'Iéna. Plus d'informations suivront." },
      "der-jenaer-wald-und-wir": { t: "La forêt d'Iéna et nous", m: "Fiche de travail numérique", d: "Une fiche de travail numérique pour un atelier sur l'histoire de la forêt d'Iéna et des métiers forestiers historiques." },
      "datastructurelab": { d: "Laboratoire interactif pour créer, visualiser et expérimenter les principales structures de données et leurs opérations." },
      "automatalab": { d: "Outil pour construire, simuler et transformer des automates finis, automates à pile et machines de Turing." },
      "lambda-kalkul-labor": { t: "Laboratoire de calcul lambda", m: "Histoire de l'informatique", d: "Laboratoire interactif sur Alonzo Church et le calcul lambda : saisir des termes, suivre la bêta-réduction pas à pas, trouver des formes normales et vérifier des exercices." },
      "babbage-analytical-engine-emulator": { m: "Histoire de l'informatique", d: "Émulateur pédagogique de l'Analytical Engine de Babbage : explorer le Store, le Mill, les cartes d'opération, les cartes de variable, les boucles et l'impression sous forme de programme de cartes." },
      "z3-emulator": { m: "Histoire de l'informatique", d: "Émulateur pédagogique du Z3 de Konrad Zuse : lire une bande-programme, charger des mots mémoire, observer les registres et suivre les opérations en virgule flottante pas à pas." },
      "informatikgeschichte-emulator-lab": { t: "Laboratoire d'émulateurs d'histoire de l'informatique", m: "Histoire de l'informatique", d: "Collection de mini-émulateurs pour ELIZA, les machines de Turing, la logique à relais, FORTRAN, LISP, BASIC, l'Intel 4004, C/Stack, RSA, DNS et MapReduce." },
      "a-0-compiler-emulator": { m: "Histoire de l'informatique", d: "Émulateur pédagogique du compilateur A-0 System : écrire des appels de routines symboliques, créer une bande objet et comprendre comment un compilateur établit une couche d'abstraction pour les futurs langages de haut niveau." },
      "eniac-emulator": { m: "Histoire de l'informatique", d: "Émulateur pédagogique d'ENIAC : câbler le panneau, observer 20 accumulateurs décimaux, les émetteurs de constantes, le Master Programmer, les lignes d'impulsion et les sorties sur cartes perforées." },
      "algodat-kurs": { t: "Cours AlgoDat", d: "Cours interactif sur les algorithmes, les structures de données, l'analyse de complexité et les méthodes de tri." },
      "gvis": { m: "Analyse géospatiale", d: "Outil SIG statique pour les données OSM, GeoJSON et CSV : formuler une requête, évaluer les POI, la végétation, les bâtiments et les chemins, puis afficher les lieux probables sur une carte OSM." },
      "kunstwerk": { m: "Outil de type Photoshop", d: "Outil de retouche d'images dans le navigateur : ouvrir et recadrer des images, sélectionner ou pixelliser des zones, détourer avec Magic Pen, supprimer des arrière-plans et appliquer des filtres." },
      "regie-wall": { m: "Mur de contrôle pour flux et sources", d: "Mur de régie et de supervision permettant d'organiser des sites web, pages de connexion, YouTube, flux HLS ou services IPv4 locaux, avec préréglages, plein écran, commandes audio et soundboard." },
      "jenatramboard": { m: "Petit projet personnel", d: "Moniteur compact des départs de tramway à Iéna : interface web locale, fenêtre de bureau et réglages pour les lignes, arrêts, l'affichage et de petits écrans auxiliaires." },
      "ti-trainer": { m: "Environnement d'apprentissage interactif", d: "Modules d'apprentissage structurés sur les automates, les algorithmes et les structures de données, les personnalités de l'informatique et l'architecture de von Neumann." },
      "algorithmplanner": { d: "Boîte à outils visuelle pour modéliser des déroulements de programme sous forme de structogrammes ou d'organigrammes, et des classes sous forme de diagrammes UML. Elle génère du code Java, C#, C++, Python, Prolog ou JavaScript à partir du modèle." },
      "hologramm-history": { t: "Hologram History", m: "Semestre d'hiver 2025", d: "Application web permettant de poser des questions sur des images de personnages historiques (plus tard des hologrammes). L'application est encore en développement." },
      "ub-heidelberg-author-tracker": { m: "Revues historiques", d: "Outil de recherche local pour créer des index d'auteurs de revues historiques. Il récupère des métadonnées auprès de UB Heidelberg/DWork et ThULB/journals@UrMEL et produit des sorties JSON et ZIP structurées." },
      "author-publication-tracker": { m: "Répertoires de publications", d: "Application locale Python/Svelte pour créer de manière critique des répertoires de publications d'auteurs saisis librement. Elle compare, déduplique et exporte les sources GND, OpenAlex, Crossref, DNB et les revues historiques." },
      "nara-trace": { m: "Recherche archivistique de personnes", d: "Outil de recherche local et non officiel pour les recherches de personnes fondées sur les sources dans le National Archives Catalog de la NARA, avec historique, vues détaillées, pages originales et transcriptions." },
      "markdown-generator": { t: "Générateur Markdown", m: "Semestre d'été 2025", d: "Application web qui permet de créer des fichiers Markdown en assemblant des éléments Markdown comme des blocs de construction. Elle est conçue pour les élèves et les collègues." },
      "paper-maker": { t: "Créateur de documents", m: "Travaux universitaires et articles", d: "Éditeur de navigateur de type Word pour les travaux universitaires, avec mise en page A4, table des matières, compteur de caractères, notes de bas de page, gestion bibliographique, import LaTeX et export de projet." },
      "manuskript-maker": { t: "Créateur de manuscrits", m: "Encore en cours", d: "Encore en cours." },
      "meme-maker": { t: "Créateur de mèmes", m: "Encore en cours", d: "Encore en cours." },
      "mysql-trainee-ground": { m: "Semestre d'hiver 2025", d: "Docker fournit un environnement MySQL et phpMyAdmin pour apprendre et approfondir SQL. Des exercices intégrés facilitent le travail avec les bases de données." },
      "mywebhub": { m: "Semestre d'été 2025", d: "Une page d'accueil pour mon navigateur web. Toutes les données sont stockées localement dans le navigateur." },
      "ocr-extractor": { m: "Semestre d'été 2025", d: "Encore en cours." },
      "qr-generator": { m: "Semestre d'été 2025", d: "Application web pour générer des codes QR. Les utilisateurs peuvent modifier la taille du code QR et ajouter un logo, par exemple celui d'une organisation, au centre." },
      "scrum-4-school": { m: "Semestre d'hiver 2024/2025", d: "Application web permettant aux élèves de s'exercer à un travail structuré dans une séquence d'apprentissage. Initialement conçue pour une classe de première, elle peut aussi servir dans d'autres niveaux et types d'établissements." },
      "school-notebook": { m: "Semestre d'hiver 2025/2026", d: "Application web avec laquelle les élèves apprennent un langage inspiré de Python. L'interface imite un IDE et une console, dont le backend est recréé en JavaScript." },
      "zotero-x-docker-x-github": { d: "Configuration qui relie Zotero à un serveur WebDAV auto-hébergé, exécuté avec Docker et fourni via GitHub. Elle synchronise la bibliothèque Zotero sans services cloud commerciaux : privée, gratuite et entièrement sous votre contrôle." },
      "tivisualizer": { m: "Semestre d'été 2025", d: "Application web qui visualise l'architecture de von Neumann. Les utilisateurs peuvent sélectionner chacun de ses composants. Encore en cours." },
      "programm-exe-erstellen": { t: "Créer un programme.exe", m: "Transformer du code en application Windows", d: "Guide pour produire des fichiers Program.exe exécutables à partir de projets Python, Java, C#, Node.js, Go et Rust, y compris les icônes, ressources, le mode GUI et le dossier de distribution." },
      "installer-guide": { m: "Rendre les applications installables", d: "Guide sur les installateurs CLI, les interfaces d'installation Tkinter, les entrées du menu Démarrer, les raccourcis de bureau, les icônes et le packaging d'applications Java et Python sous Windows et Linux." },
      "pake-guide": { m: "Sites web comme applications de bureau", d: "Guide sur Pake, Rust, Tauri et les WebViews : installer les dépendances, créer une première application et utiliser les options courantes en pratique." },
      "redis-caching-guide": { m: "Stockage en cache", d: "Guide détaillé sur la mise en cache Redis, les TTL, le cache-aside, l'invalidation et des exemples pratiques en Node.js et Python." },
      "winget-guide": { d: "Guide pour rechercher, installer, mettre à jour et gérer des logiciels avec WinGet." },
      "git-github-guide": { m: "Cours complet interactif", d: "Guide sur les bases et les méthodes de travail avec Git, GitHub et GitLab." },
      "just-guide": { m: "Lanceur de commandes", d: "Guide pour installer et utiliser des Justfiles afin de réemployer les commandes de projet." }
    }
  };

  const tagTranslations = {
    en: { Bildung: "Education", Datenstrukturen: "Data structures", Algorithmen: "Algorithms", Automaten: "Automata", Informatikgeschichte: "History of computing", Berechenbarkeit: "Computability", "Theoretische Informatik": "Theoretical computer science", Rechnerarchitektur: "Computer architecture", Emulatoren: "Emulators", Turingmaschine: "Turing machine", Compilerbau: "Compiler construction", Bildbearbeitung: "Image editing", Regie: "Production", "Technische Informatik": "Computer engineering", Interaktiv: "Interactive", Codegenerierung: "Code generation", Zeitschriften: "Journals", Bibliografie: "Bibliography", Archivarbeit: "Archival research", Hausarbeiten: "Term papers", Automatisierung: "Automation" },
    fr: { Bildung: "Éducation", Datenstrukturen: "Structures de données", Algorithmen: "Algorithmes", Automaten: "Automates", Informatikgeschichte: "Histoire de l'informatique", Berechenbarkeit: "Calculabilité", "Theoretische Informatik": "Informatique théorique", Rechnerarchitektur: "Architecture des ordinateurs", Emulatoren: "Émulateurs", Turingmaschine: "Machine de Turing", Compilerbau: "Construction de compilateurs", Bildbearbeitung: "Retouche d'image", Regie: "Régie", "Technische Informatik": "Informatique technique", Interaktiv: "Interactif", Codegenerierung: "Génération de code", Zeitschriften: "Revues", Bibliografie: "Bibliographie", Archivarbeit: "Recherche archivistique", Hausarbeiten: "Travaux universitaires", Automatisierung: "Automatisation" }
  };
  const labels = {
    en: { online: "Use online", infopedia: "Open InfoPedia", topic: "Open topic", guide: "Open guide", repository: "GitHub repository", link: "Link to: ", preview: "Preview: " },
    fr: { online: "Utiliser en ligne", infopedia: "Ouvrir InfoPedia", topic: "Ouvrir le thème", guide: "Ouvrir le guide", repository: "Dépôt GitHub", link: "Lien : ", preview: "Aperçu : " }
  };
  const slug = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  function prepare(card) {
    if (card.dataset.catalogI18nReady === "true") return true;
    const title = card.querySelector(":scope > h3");
    const paragraphs = card.querySelectorAll(":scope > p.muted");
    if (!title || paragraphs.length < 2) return false;
    card.dataset.catalogI18nReady = "true";
    card.dataset.catalogKey = slug(title.textContent.trim());
    card.dataset.catalogTitle = title.textContent;
    card.dataset.catalogMeta = paragraphs[0].textContent;
    card.dataset.catalogDescription = paragraphs[1].innerHTML;
    card.querySelectorAll("img[alt]").forEach((image) => { image.dataset.catalogOriginalAlt = image.alt; });
    return true;
  }
  function action(link) {
    const text = link.dataset.catalogOriginalLabel || link.textContent.trim();
    link.dataset.catalogOriginalLabel = text;
    if (/infopedia/i.test(text)) return "infopedia";
    if (/themenbereich/i.test(text)) return "topic";
    if (/guide.*(öffnen|oeffnen)/i.test(text)) return "guide";
    if (/online nutzen/i.test(text)) return "online";
    if (/repository|repositorium/i.test(text)) return "repository";
    return null;
  }
  function translate(card, language) {
    if (!prepare(card)) return;
    const title = card.querySelector(":scope > h3");
    const paragraphs = card.querySelectorAll(":scope > p.muted");
    const description = paragraphs[1];
    if (language === "de") {
      title.textContent = card.dataset.catalogTitle;
      paragraphs[0].textContent = card.dataset.catalogMeta;
      description.innerHTML = card.dataset.catalogDescription;
      card.querySelectorAll("img[alt]").forEach((image) => { image.alt = image.dataset.catalogOriginalAlt || image.alt; });
      card.querySelectorAll(".tag").forEach((tag) => { if (tag.dataset.catalogOriginalLabel) tag.textContent = tag.dataset.catalogOriginalLabel; });
      return;
    }
    const item = translations[language]?.[card.dataset.catalogKey];
    if (!item) return;
    const dictionary = labels[language];
    title.textContent = item.t || card.dataset.catalogTitle;
    paragraphs[0].textContent = item.m || card.dataset.catalogMeta;
    const links = [...description.querySelectorAll("a")].map((link) => ({ link, action: action(link) }));
    const hasLinkPrefix = /Link zum:/i.test(card.dataset.catalogDescription);
    description.replaceChildren(document.createTextNode(item.d));
    links.forEach(({ link, action: kind }, index) => {
      description.append(document.createElement("br"), document.createElement("br"));
      if (hasLinkPrefix && index === 0) description.append(document.createTextNode(dictionary.link));
      link.textContent = kind ? dictionary[kind] : link.dataset.catalogOriginalLabel;
      description.append(link);
    });
    card.querySelectorAll("img[alt]").forEach((image) => { image.alt = `${dictionary.preview}${title.textContent}`; });
    card.querySelectorAll(".tag").forEach((tag) => {
      const original = tag.dataset.catalogOriginalLabel || tag.textContent.trim();
      tag.dataset.catalogOriginalLabel = original;
      tag.textContent = tagTranslations[language]?.[original] || original;
    });
  }
  function apply() {
    const language = window.DatenflixI18n?.currentLanguage || document.documentElement.lang || "de";
    document.querySelectorAll(".card.project").forEach((card) => translate(card, language));
  }
  document.addEventListener("datenflix:i18n-applied", apply);
  const observe = () => new MutationObserver((records) => {
    const hasNewCard = records.some((record) => [...record.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE && (node.matches?.(".card.project") || node.querySelector?.(".card.project"))));
    if (hasNewCard) apply();
  }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { observe(); apply(); }, { once: true });
  else { observe(); apply(); }
})();
