document.addEventListener('DOMContentLoaded', () => {
    const username = 'quentin_dusserre_quentin';
    const password = 'nIg974UeEM';
    const lat = '47.2917';
    const lon = '-2.5201';
    const params = 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx';

    const currentDate = new Date();
    currentDate.setMinutes(0, 0, 0);
    const beginDate = currentDate.toISOString().split('.')[0] + 'Z';

    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 1);
    const endDate = futureDate.toISOString().split('.')[0] + 'Z';

    const apiUrl = `https://api.meteomatics.com/${beginDate}--${endDate}:PT1H/${params}/${lat},${lon}/json`;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    async function getApiData() {
        const encodedCredentials = btoa(`${username}:${password}`);
        fetch(proxyUrl + apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + encodedCredentials,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
        })
        .then(response => {
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            fillTable(data);
        })
        .catch(error => console.error("Erreur lors de la récupération des données :", error));
    }

    function fillTable(data) {
        const temperatureRow = document.getElementById('temperature-24h-row');
        const rainRow = document.getElementById('rain-24h-row');
        const windRow = document.getElementById('wind-24h-row');
        const windGustRow = document.getElementById('wind-gust-24h-row');
        const windDirectionRow = document.getElementById('wind-direction-24h-row');
        const pressureRow = document.getElementById('pressure-24h-row');
        const weatherRow = document.getElementById('weather-24h-row');
        const hoursRow = document.getElementById('hours-24h-row');
        const daysRow = document.getElementById('days-24h-row');
        
        let currentDate = null; // Pour suivre la date actuelle
        let dateCell; // Pour stocker la cellule de date fusionnée
        let hourCount = 0; // Compte le nombre d'heures
    
        data.data[0].coordinates[0].dates.forEach((dateData, index) => {
            const hour = new Date(dateData.date).getUTCHours();
    
            // Vérifier si nous avons changé de date
            const newDate = new Date(dateData.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
            });
    
            if (currentDate !== newDate) {
                // Si c'est une nouvelle date, créer une nouvelle cellule
                if (dateCell) {
                    // Fusionner les cellules de la date pour les heures précédentes
                    dateCell.setAttribute('colspan', hourCount);
                }
                currentDate = newDate; // Mettre à jour la date actuelle
                dateCell = document.createElement('th'); // Créer une nouvelle cellule de date
                dateCell.textContent = currentDate; // Définir le texte de la cellule
                dateCell.setAttribute('rowspan', '1'); // Initialiser rowspan
                daysRow.appendChild(dateCell); // Ajouter la cellule de date à la ligne de dates
                hourCount = 1; // Réinitialiser le compteur d'heures
            } else {
                hourCount++; // Incrémenter le compteur d'heures
            }
    
            // Créer une cellule d'heure
            const th = document.createElement('th');
            th.textContent = `${hour}h`; // Afficher l'heure au format XXh
            hoursRow.appendChild(th); // Ajouter la cellule d'heure à la ligne d'en-tête des heures
        });
    
        // Fusionner la dernière cellule de date
        if (dateCell) {
            dateCell.setAttribute('colspan', hourCount);
        }

        // Remplir les données de température
        data.data[0].coordinates[0].dates.forEach(dateData => {
        const td = document.createElement('td');
        td.textContent = dateData.value.toFixed(0); // Température avec 1 décimale
        td.style.backgroundColor = getTemperatureColor(dateData.value); // Appliquer la couleur
        temperatureRow.appendChild(td);
        });
    
        // Remplir les autres lignes avec les bonnes données
        //fillWeatherData(data, temperatureRow, 0, 1, 0); // Température
        fillWeatherData(data, rainRow, 1, 1, 1);  // Précipitations
        fillWeatherData(data, windRow, 2, 3.6, 0);  // Vent moyen en km/h (1 m/s = 3.6 km/h)
        fillWeatherData(data, windGustRow, 3, 3.6, 0);  // Vent rafales (si applicable)
        fillWeatherData(data, windDirectionRow, 4, 1, 0);  // Direction du vent
        fillWeatherData(data, pressureRow, 5, 1, 0);  // Pression atmosphérique
        fillWeatherData(data, weatherRow, 6, 1, 0);  // Ciel (symboles météo)
    }
    

    function fillWeatherData(data, rowElement, paramIndex, conversionFactor = 1, round) {
        // Remplir les lignes pour d'autres paramètres
        data.data[paramIndex].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            td.textContent = (dateData.value * conversionFactor).toFixed(round); // Appliquer la conversion si nécessaire
            rowElement.appendChild(td);
        });
    }

    function getTemperatureColor(value) {
        let color;
        if (value < 2) {
            // Dégradé de bleu (foncé à clair)
            const blueValue = Math.floor((value + 2) * (255 / 2)); // Convertir à une valeur entre 0 et 255
            color = `rgb(0, 0, ${blueValue})`;
        } else if (value >= 2 && value <= 10) {
            // Dégradé de vert (clair à normal)
            const greenValue = Math.floor((value - 2) * (255 / 8)); // Convertir à une valeur entre 0 et 255
            color = `rgb(0, ${greenValue}, 0)`;
        } else if (value > 10 && value <= 20) {
            // Dégradé de jaune (clair à orange)
            const redValue = Math.floor((value - 10) * (255 / 10)); // Convertir à une valeur entre 0 et 255
            const greenValue = 255 - redValue; // Réduire le vert
            color = `rgb(${redValue}, ${greenValue}, 0)`; // Jaune à orange
        } else if (value > 20 && value <= 30) {
            // Dégradé de orange à rouge
            const redValue = Math.floor((value - 20) * (255 / 10)); // Convertir à une valeur entre 0 et 255
            color = `rgb(255, ${255 - redValue}, 0)`; // Orange à rouge
        } else {
            // Au-dessus de 30, rouge foncé
            color = `rgb(255, 0, 0)`; // Rouge foncé
        }
        return color;
    }

    // Appel de la fonction
    getApiData();

});