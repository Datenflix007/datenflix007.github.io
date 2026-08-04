(function () {
    "use strict";

    const profiles = {
        "a0-compiler": {
            moduleClass: "lab-module-a0",
            kind: "Compiler-Labor",
            summary: "Quelle, Objektband, Symboltabelle und Laufzeit sind in getrennte Arbeitsmodi aufgeteilt.",
            steps: ["Quelle schreiben", "Kompilieren", "Ausfuehren"],
            runLabel: "Ausfuehren"
        },
        "eniac-emulator": {
            moduleClass: "lab-module-eniac",
            kind: "Patch-Deck-Labor",
            summary: "Akkumulatoren, gesteckte Schritte und Impulslog werden wie ein Arbeitsplatz sortiert.",
            steps: ["Patch stecken", "Impuls senden", "Ausgabe lesen"],
            runLabel: "Laufen lassen"
        },
        "analytical-engine": {
            moduleClass: "lab-module-analytical",
            kind: "Kartenmaschinen-Labor",
            summary: "Karten, Store, Mill und Drucker sind in Arbeits- und Schrittansicht getrennt.",
            steps: ["Karten lesen", "Takt ausfuehren", "Drucker pruefen"],
            runLabel: "Laufen lassen"
        },
        "lambda-calculus": {
            moduleClass: "lab-module-lambda",
            kind: "Lambda-Uebungslabor",
            summary: "Term, naechster Redex, Schrittverlauf und Uebung sind klar getrennt.",
            steps: ["Term pruefen", "Beta-Schritt", "Normalform"],
            runLabel: "Normalisieren"
        }
    };

    const focusModes = {
        work: {
            className: "lab-focus-work",
            status: "Arbeitsflaeche: nur die wichtigsten Panels fuer Eingabe und Zustand."
        },
        steps: {
            className: "lab-focus-steps",
            status: "Schritte & Ergebnis: Log, Deck, Verlauf und Ausgabe stehen im Vordergrund."
        },
        details: {
            className: "lab-focus-details",
            status: "Details & Quellen: alle Panels und die Quellenarbeit sind sichtbar."
        }
    };

    function currentProfile() {
        const path = window.location.pathname.toLowerCase();
        const key = Object.keys(profiles).find((name) => path.includes(name));
        return profiles[key] || {
            moduleClass: "lab-module-generic",
            kind: "Informatikgeschichte-Labor",
            summary: "Arbeitsmodus, Schritte und Quellenarbeit sind getrennt.",
            steps: ["Beispiel laden", "Schritt pruefen", "Ergebnis lesen"],
            runLabel: "Start"
        };
    }

    function queryFirst(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        return null;
    }

    function setStatus(text) {
        const status = document.querySelector(".lab-statusline");
        if (status) {
            status.textContent = text;
        }
    }

    function setFocus(mode) {
        const selected = focusModes[mode] || focusModes.work;
        document.body.classList.remove(
            focusModes.work.className,
            focusModes.steps.className,
            focusModes.details.className
        );
        document.body.classList.add(selected.className);

        document.querySelectorAll(".lab-view-tabs button").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.labMode === mode));
        });

        setStatus(selected.status);
    }

    function clickExisting(selectors, label) {
        const target = queryFirst(selectors);
        if (!target) {
            setStatus(label + ": Aktion ist auf dieser Seite nicht vorhanden.");
            return;
        }

        target.click();
        setStatus(label + ": ausgefuehrt. Die bestehenden Panels wurden aktualisiert.");
    }

    function buildWorkflow(profile) {
        return profile.steps
            .map((step, index) => `<span><b>${index + 1}</b>${step}</span>`)
            .join("");
    }

    function buildCommandbar(profile) {
        const heading = document.querySelector("h1");
        const title = heading ? heading.textContent.trim() : "Informatikgeschichte-Labor";
        const commandbar = document.createElement("section");
        commandbar.className = "lab-commandbar";
        commandbar.setAttribute("aria-label", "Laborsteuerung");
        commandbar.innerHTML = `
            <div class="lab-command-title">
                <span>${profile.kind}</span>
                <strong>${title}</strong>
                <small>${profile.summary}</small>
            </div>
            <div class="lab-workflow" aria-label="Arbeitsablauf">
                ${buildWorkflow(profile)}
            </div>
            <div class="lab-actions">
                <div class="lab-view-tabs" role="group" aria-label="Ansicht waehlen">
                    <button type="button" data-lab-mode="work" aria-pressed="true">Arbeitsfl&auml;che</button>
                    <button type="button" data-lab-mode="steps" aria-pressed="false">Schritte &amp; Ergebnis</button>
                    <button type="button" data-lab-mode="details" aria-pressed="false">Details &amp; Quellen</button>
                </div>
                <div class="lab-quick-actions" role="group" aria-label="Schnellaktionen">
                    <button type="button" data-lab-action="sample">Beispiel</button>
                    <button type="button" data-lab-action="prepare" class="primary">Vorbereiten</button>
                    <button type="button" data-lab-action="step">Schritt</button>
                    <button type="button" data-lab-action="run">${profile.runLabel}</button>
                    <button type="button" data-lab-action="reset">Reset</button>
                </div>
            </div>
        `;
        return commandbar;
    }

    function wireCommandbar() {
        document.querySelectorAll(".lab-view-tabs button").forEach((button) => {
            button.addEventListener("click", () => {
                const mode = button.dataset.labMode || "work";
                setFocus(mode);
                if (mode === "details" && isDetailsHash(window.location.hash)) {
                    document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
                }
            });
        });

        const actionMap = {
            sample: {
                selectors: ["#sampleBtn", "#loadExampleBtn"],
                label: "Beispiel"
            },
            prepare: {
                selectors: ["#compileBtn", "#parseBtn"],
                label: "Vorbereiten"
            },
            step: {
                selectors: ["#stepBtn"],
                label: "Schritt"
            },
            run: {
                selectors: ["#runBtn", "#normalizeBtn"],
                label: "Durchlauf"
            },
            reset: {
                selectors: ["#resetBtn"],
                label: "Reset"
            }
        };

        document.querySelectorAll(".lab-quick-actions button").forEach((button) => {
            button.addEventListener("click", () => {
                const action = actionMap[button.dataset.labAction];
                if (action) {
                    clickExisting(action.selectors, action.label);
                }
            });
        });
    }

    function wireSourceLinks() {
        document.querySelectorAll('a[href="#quellenarbeit"], a[href="#lernvideo"]').forEach((link) => {
            link.addEventListener("click", () => {
                setFocus("details");
            });
        });

        if (isDetailsHash(window.location.hash)) {
            setFocus("details");
        }
    }

    function isDetailsHash(hash) {
        return hash === "#quellenarbeit" || hash === "#lernvideo";
    }

    function init() {
        const workspace = document.querySelector(".workspace");
        if (!workspace || document.querySelector(".lab-commandbar")) {
            return;
        }

        const profile = currentProfile();
        document.body.classList.add("history-lab-enhanced", profile.moduleClass);

        const commandbar = buildCommandbar(profile);
        workspace.before(commandbar);

        const statusline = document.createElement("div");
        statusline.className = "lab-statusline";
        statusline.textContent = focusModes.work.status;
        workspace.after(statusline);

        wireCommandbar();
        setFocus(isDetailsHash(window.location.hash) ? "details" : "work");
        wireSourceLinks();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
