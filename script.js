document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("recipes-container");

  // JSON-Daten laden
  fetch("../data/_experiments.json") // Angepasster Pfad zur JSON-Datei
    .then(response => {
      if (!response.ok) {
        throw new Error("Fehler beim Laden der JSON-Datei");
      }
      return response.json();
    })
    .then(data => {
      // Rezepte anzeigen
      data.forEach(recipe => {
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("recipe");

        recipeDiv.innerHTML = `
          <h2>${recipe.title}</h2>
          <p>${recipe.description}</p>
          <h3>Zutaten:</h3>
          <ul>
            ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join("")}
          </ul>
        `;

        container.appendChild(recipeDiv);
      });
    })
    .catch(error => {
      console.error("Fehler:", error);
    });

  // Beispiel-Daten aus gymnasium.json
  let experiments = [];

  const searchBar = document.getElementById("searchBar");
  const searchButton = document.getElementById("searchButton");
  const experimentList = document.getElementById("experimentList");

  // Funktion zum Rendern der Experimente
  function renderExperiments(filteredExperiments) {
    experimentList.innerHTML = ""; // Liste leeren
    filteredExperiments.forEach(exp => {
      const div = document.createElement("div");
      div.className = "experiment";
      div.innerHTML = `<h3>${exp.title}</h3><p>${exp.description}</p>`;
      experimentList.appendChild(div);
    });
  }

  // Event-Listener für den Suchbutton
  searchButton.addEventListener("click", () => {
    console.log("Der SUCHEN-Button wurde gedrückt."); // Konsolenausgabe

    const query = searchBar.value.trim().toLowerCase(); // Suchbegriff in Kleinbuchstaben

    if (query === "") {
      console.log("Suchleiste ist leer. Alle Experimente werden angezeigt."); // Konsolenausgabe
      // Wenn die Suchleiste leer ist, alle Experimente anzeigen
      renderExperiments(experiments);
    } else {
      console.log(`Suche nach: "${query}"`); // Konsolenausgabe mit Suchbegriff
      // Experimente filtern basierend auf dem Suchbegriff
      const filteredExperiments = experiments.filter(exp => {
        return (
          exp.title.toLowerCase().includes(query) || // Titel durchsuchen
          exp.description.toLowerCase().includes(query) || // Beschreibung durchsuchen
          exp.steps.some(step => step.toLowerCase().includes(query)) // Schritte durchsuchen
        );
      });

      // Nur die Experimente mit Übereinstimmungen anzeigen
      if (filteredExperiments.length > 0) {
        console.log(`${filteredExperiments.length} Experimente gefunden.`); // Anzahl der Ergebnisse
      } else {
        console.log("Keine Experimente gefunden."); // Keine Ergebnisse
      }
      renderExperiments(filteredExperiments);
    }
  });

  // JSON-Daten für Experimente laden
  fetch("dataEditor/_experiments.json")
    .then(response => response.json())
    .then(data => {
        experiments = data;
        renderExperiments(experiments);
    })
    .catch(error => console.error("Fehler beim Laden der JSON-Datei:", error));

  function showExperimentList() {
    // Experimentliste anzeigen
    document.getElementById("experimentList").style.display = "block";

    // Experimentdetails ausblenden
    document.getElementById("experimentDetails").style.display = "none";

    // Suchleiste leeren und Buttons zurücksetzen
    document.getElementById("searchBar").value = "";
    document.getElementById("clearSearchButton").style.display = "none";
    document.getElementById("noResultsMessage").style.display = "none";

    // Alle Experimente erneut rendern
    renderExperiments(experiments);
}
});