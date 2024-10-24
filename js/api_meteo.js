document.addEventListener('DOMContentLoaded', () => {
    const username = 'quentin_dusserre_quentin';
    const password = 'nIg974UeEM';
    const lat = '47.2917';
    const lon = '-2.5201';
    const params = 't_2m:C,msl_pressure:hPa,precip_1h:mm,wind_speed_10m:ms,wind_dir_10m:d,weather_symbol_1h:idx';

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
    
        // Remplir les en-têtes des heures
        data.data[0].coordinates[0].dates.forEach(dateData => {
            const hour = new Date(dateData.date).getUTCHours();
            const th = document.createElement('th');
            th.textContent = `${hour}h`; // Afficher l'heure au format XXh
            hoursRow.appendChild(th);
        });
    
        // Remplir les données de température
        data.data[0].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            td.textContent = dateData.value.toFixed(1); // Température avec 1 décimale
            temperatureRow.appendChild(td);
        });
    
        // Remplir les autres lignes avec les bonnes données
        fillWeatherData(data, rainRow, 2);  // Précipitations
        fillWeatherData(data, windRow, 3, 3.6);  // Vent moyen en km/h (1 m/s = 3.6 km/h)
        fillWeatherData(data, windGustRow, 3, 3.6);  // Vent rafales (si applicable)
        fillWeatherData(data, windDirectionRow, 4);  // Direction du vent
        fillWeatherData(data, pressureRow, 1);  // Pression atmosphérique
        fillWeatherData(data, weatherRow, 5);  // Ciel (symboles météo)
    }

    function fillWeatherData(data, rowElement, paramIndex, conversionFactor = 1) {
        // Remplir les lignes pour d'autres paramètres
        data.data[paramIndex].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            td.textContent = (dateData.value * conversionFactor).toFixed(1); // Appliquer la conversion si nécessaire
            rowElement.appendChild(td);
        });
    }

    // Appel de la fonction
    getApiData();

});