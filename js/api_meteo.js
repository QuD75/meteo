document.addEventListener('DOMContentLoaded', () => {
    const lat = '47.29';
    const long = '-2.52';
    const dep = '44';
    const urlVigilance = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/weatherref-france-vigilance-meteo-departement/records?where=domain_id=${dep}&limit=20`
    const urlOpenMeteoDay = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&hourly=temperature_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&forecast_days=2&timezone=Europe%2FBerlin`;
    const urlOpenMeteoWeek = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_gusts_10m_max&timezone=Europe%2FBerlin`;

    const isMobile = window.innerWidth < 10000000;

    // Appel aux API
    async function getApiData() {
        // Appels API indépendants
        fetchData(urlVigilance, 'vigilance', 60, displayDataVigilance);
        fetchData(urlOpenMeteoDay, 'day', 15, displayDataDay);
        fetchData(urlOpenMeteoWeek, 'week', 60, displayDataWeek);
    }
    async function fetchData(apiUrl, cacheKey, duration, displayFunction) {
        const now = Date.now();
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && (now - cachedData.timestamp < duration * 60000)) {
            displayFunction(cachedData.data);
            return cachedData.data;
        } else {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                localStorage.setItem(cacheKey, JSON.stringify({ data: data, timestamp: now }));
                displayFunction(data);
                return data;
            } catch (error) {
                console.error('Erreur lors de la récupération des données de ' + cacheKey + ':', error);
                return null;
            }
        }
    }

    function displayData(type, jsonData) {
        // Variables génériques pour les éléments
        const loadingMessage = document.getElementById(`loading-message-${type}`);
        const containerGraphs = document.getElementById(`${type}-container-graphs`);
        const containerTab = document.getElementById(`${type}-container-tab`);
        const containerTabMobile = document.getElementById(`${type}-container-tab-mobile`);

        // Masquer le message de chargement et afficher les graphiques
        loadingMessage.style.display = 'none';
        containerGraphs.style.display = 'block';

        // Affichage en fonction de la plateforme
        if (!isMobile) {
            containerTab.style.display = 'block';
            if (type === 'day') {
                fillDayContainer(jsonData)
            }
            if (type === 'week') {
                fillWeekContainer(jsonData);
            }
        } else {
            type === 'day' ? fillDayMobileContainer(jsonData) : fillWeekContainer(jsonData); // Appel de la fonction appropriée
            containerTabMobile.style.display = 'block';
        }
    }

    function displayDataDay(jsonData) {
        const loadingMessage = document.getElementById(`loading-message-day`);
        const containerGraphs = document.getElementById(`day-container-graphs`);
        const containerTab = document.getElementById(`day-container-tab`);
        const containerTabMobile = document.getElementById(`day-container-tab-mobile`);

        // Masquer le message de chargement et afficher les graphiques
        loadingMessage.style.display = 'none';
        containerGraphs.style.display = 'block';

        const now = new Date();
        const startHour = now.getHours(); // Heure locale

        // Récupère les heures à partir de l'heure actuelle jusqu'à +23 heures
        const times = jsonData.hourly.time.map(time => new Date(time));
        const beginIndex = times.findIndex(time => time.getHours() === startHour);
        const endIndex = beginIndex + 24;

        // Sélectionne les données pour les heures dans la plage souhaitée
        let timesToDisplay = times.slice(beginIndex, endIndex);
        const tempToDisplay = jsonData.hourly.temperature_2m.slice(beginIndex, endIndex);
        const rainToDisplay = jsonData.hourly.precipitation.slice(beginIndex, endIndex);
        const windSpeedToDisplay = jsonData.hourly.wind_speed_10m.slice(beginIndex, endIndex);
        const windGustToDisplay = jsonData.hourly.wind_gusts_10m.slice(beginIndex, endIndex);
        const windDirectionToDisplay = jsonData.hourly.wind_direction_10m.slice(beginIndex, endIndex);
        const pressureToDisplay = jsonData.hourly.pressure_msl.slice(beginIndex, endIndex);
        const uvToDisplay = jsonData.hourly.uv_index.slice(beginIndex, endIndex);
        const weatherToDisplay = jsonData.hourly.weather_code.slice(beginIndex, endIndex);
        const isDayToDisplay = jsonData.hourly.is_day.slice(beginIndex, endIndex);

        // Affichage en fonction de la plateforme
        if (!isMobile) {
            fillDayContainer(timesToDisplay, tempToDisplay, rainToDisplay, windSpeedToDisplay, windGustToDisplay, windDirectionToDisplay, pressureToDisplay, uvToDisplay, weatherToDisplay, isDayToDisplay);
            containerTab.style.display = 'block';
        } else {
            fillDayMobileContainer(timesToDisplay, tempToDisplay, rainToDisplay, windSpeedToDisplay, windGustToDisplay, windDirectionToDisplay, pressureToDisplay, uvToDisplay, weatherToDisplay, isDayToDisplay);
            containerTabMobile.style.display = 'block';
        }
    }
    function fillDayContainer(timesToDisplay, tempToDisplay, rainToDisplay, windSpeedToDisplay, windGustToDisplay, windDirectionToDisplay, pressureToDisplay, uvToDisplay, weatherToDisplay, isDayToDisplay) {
        const daysRow = document.getElementById('days-24h-row');
        const hoursRow = document.getElementById('hours-24h-row');

        const hoursPerDay = getHoursPerDay(timesToDisplay);

        // Parcours des heures pour créer les cellules fusionnées pour chaque jour
        timesToDisplay.forEach(date => {
            const hour = date.getHours();
            // Remplit les entêtes des heures
            const hourCell = document.createElement('th');
            hourCell.textContent = `${hour}h`;
            hoursRow.appendChild(hourCell);
        });

        // Met à jour la colonne des jours pour fusionner correctement
        Object.entries(hoursPerDay).forEach(([dayName, count], index) => {
            let dayCell = document.createElement('th');
            dayCell = daysRow.children[index + 1]; //A cause de la cellule 'Paramètres'
            dayCell.textContent = dayName;
            dayCell.colSpan = count; // Met à jour la colSpan avec le nombre d'heures
            daysRow.appendChild(dayCell);
        });

        fillRowDesktop(false, 'temperature-24h-row', tempToDisplay, 0, null, getTempColor);
        fillRowDesktop(false, 'rain-24h-row', rainToDisplay, 1, null, getRainColor);
        fillRowDesktop(false, 'wind-24h-row', windSpeedToDisplay, 0, 5, getWindColor);
        fillRowDesktop(false, 'wind-gust-24h-row', windGustToDisplay, 0, 5, getWindColor);
        fillRowDesktop(false, 'pressure-24h-row', pressureToDisplay, 0, null, defaultColorFunc);
        fillRowDesktop(false, 'uv-24h-row', uvToDisplay, 0, null, getUVColor);

        // Remplit les données des différentes lignes avec symbole
        function fillWindDirSymbol(rowId, data, widht) {
            const row = document.getElementById(rowId);
            const rootStyles = getComputedStyle(document.documentElement);
            const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
            data.forEach(value => {

                const cell = document.createElement('td');
                const icon = document.createElement('img');
                putIconStyle(icon, widht, 'auto%', 'contain');
                icon.src = getWindDirectionIcon(value);
                cell.style.backgroundColor = 'white';
                cell.appendChild(icon);
                row.appendChild(cell);
            });
        }

        fillWindDirSymbol('wind-direction-24h-row', windDirectionToDisplay, '65%');
        fillWeatherSymbol('weather-24h-row', weatherToDisplay, '100%', isDayToDisplay);

        timesToDisplay = timesToDisplay.map(date => formatDate(date, false, false, false, true, false));
        createChart('temperature-day-chart', timesToDisplay, tempToDisplay, 1, 'Evolution de la température dans les prochaines 24h', 'Température (°C)', 0, 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
        createChart('precipitation-day-chart', timesToDisplay, rainToDisplay, 0.1, 'Evolution des précipitations dans les prochaines 24h', 'Pluie (mm)', 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-day-chart', timesToDisplay, windSpeedToDisplay, 5, 'Evolution du vent dans les prochaines 24h', 'Vent (km/h)', 0, 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', windGustToDisplay);
        createChart('pressure-day-chart', timesToDisplay, pressureToDisplay, 1, 'Evolution de la pression dans les prochaines 24h', 'Pression (hPa)', 0, 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }
    async function fillDayMobileContainer(timesToDisplay, tempToDisplay, rainToDisplay, windSpeedToDisplay, windGustToDisplay, windDirectionToDisplay, pressureToDisplay, uvToDisplay, weatherToDisplay, isDayToDisplay) {
        // Récupération de l'élément tbody du tableau
        const tbody = document.querySelector("#weather-day-tab-mobile tbody");

        // Crée un objet pour stocker le nombre d'heures par jour
        const hoursPerDay = getHoursPerDay(timesToDisplay);

        let previousDayName = '';

        // Utiliser une boucle for...of avec un index pour conserver l'ordre
        for (const [index, time] of timesToDisplay.entries()) {
            const hour = dateObj.getHours();

            // Crée une nouvelle ligne dans le tableau
            const row = document.createElement("tr");

            // Gestion de la fusion des lignes de jours
            const dayCell = document.createElement("td");
            const dayName = time.toLocaleDateString('fr-FR', { weekday: 'long' });

            if (previousDayName !== dayName) {
                dayCell.rowSpan = hoursPerDay[dayName];
                dayCell.textContent = dayName;
                row.appendChild(dayCell);
                previousDayName = dayName;
            }

            // Ajout des autres cellules pour chaque heure
            const hourCell = document.createElement("td");
            hourCell.textContent = hour;
            row.appendChild(hourCell);

            // Remplir les colonnes de données avec des fonctions asynchrones
            fillRowMobile(row, tempToDisplay[index], 0, null, getTempColor);
            fillRowMobile(row, rainToDisplay[index], 1, null, getRainColor);
            fillRowMobile(row, windSpeedToDisplay[index], 0, 5, getWindColor);
            fillRowMobile(row, windGustToDisplay[index], 0, 5, getWindColor);

            // Remplir la cellule de direction du vent
            const windDirCell = document.createElement("td");
            const windDirIcon = document.createElement('img');
            windDirIcon.src = getWindDirectionIcon(windDirectionToDisplay[index]);
            putIconStyle(windDirIcon, 'auto', 'auto', 'contain');
            windDirCell.style.backgroundColor = 'white';
            windDirCell.appendChild(windDirIcon);
            row.appendChild(windDirCell);

            fillRowMobile(row, pressureToDisplay[index], 0, null, defaultColorFunc);

            // Remplir la cellule du code météo avec une fonction asynchrone
            const weatherCodeCell = document.createElement("td");
            const weatherIcon = document.createElement('img');
            weatherIcon.src = await getWeatherIcon(weatherToDisplay[index], isDayToDisplay[index]);
            putIconStyle(weatherIcon, 'auto', 'auto', 'contain', 0.9);
            weatherCodeCell.style.backgroundColor = 'white';
            weatherCodeCell.appendChild(weatherIcon);
            row.appendChild(weatherCodeCell);

            fillRowMobile(row, uvToDisplay[index], 0, null, getUVColor);

            // Ajoute la ligne au tableau
            tbody.appendChild(row);
        }

    }

    function displayDataWeek(jsonData) {
        displayData('week', jsonData);
    }
    function fillWeekContainer(jsonData) {
        // Sélectionne les données pour les heures dans la plage souhaitée
        let timesToDisplay = jsonData.daily.time.map(time => new Date(time));
        let sunriseToDisplay = jsonData.daily.sunrise;
        let sunsetToDisplay = jsonData.daily.sunset;
        const tempMinToDisplay = jsonData.daily.temperature_2m_min;
        const tempMaxToDisplay = jsonData.daily.temperature_2m_max;
        const rainToDisplay = jsonData.daily.precipitation_sum;
        const windGustToDisplay = jsonData.daily.wind_gusts_10m_max;
        const uvToDisplay = jsonData.daily.uv_index_max;
        const weatherToDisplay = jsonData.daily.weather_code;

        timesToDisplay = timesToDisplay.map(date => new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }));
        sunriseToDisplay = sunriseToDisplay.map(date => formatDate(new Date(date), false, false, false, true, true));
        sunsetToDisplay = sunsetToDisplay.map(date => formatDate(new Date(date), false, false, false, true, true));
        let sunTimes = [];
        sunTimes = sunriseToDisplay.map((value, index) => ' ' + value + ' - ' + sunsetToDisplay[index] + ' ');

        fillRowDesktop(true, 'days-week-row', timesToDisplay, null, null, defaultColorFunc);
        fillRowDesktop(false, 'sun-week-row', sunTimes, null, null, defaultColorFunc);
        fillRowDesktop(false, 'temp-min-week-row', tempMinToDisplay, 0, null, getTempColor);
        fillRowDesktop(false, 'temp-max-week-row', tempMaxToDisplay, 0, null, getTempColor);
        fillRowDesktop(false, 'rain-week-row', rainToDisplay, 1, null, getRainColor);
        fillRowDesktop(false, 'wind-week-row', windGustToDisplay, 0, 5, getWindColor);
        fillRowDesktop(false, 'uv-week-row', uvToDisplay, 0, null, getUVColor);

        fillWeatherSymbol('weather-week-row', weatherToDisplay, '100%', null);

        createChart('temperature-week-chart', timesToDisplay, tempMinToDisplay, 1, 'Evolution de la température sur la semaine', 'Température (°C)', 0, 'line', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)', null, tempMaxToDisplay);
        createChart('precipitation-week-chart', timesToDisplay, rainToDisplay, 0.1, 'Evolution des précipitations sur la semaine', 'Pluie (mm)', 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-week-chart', timesToDisplay, windGustToDisplay, 5, 'Evolution du vent sur la semaine', 'Vent (km/h)', 0, 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', windGustToDisplay);
    }

    function fillRowDesktop(isHeading, rowId, data, decimals, floor, colorFunction) {
        const row = document.getElementById(rowId);

        data.forEach(value => {
            const cell = document.createElement(isHeading ? 'th' : 'td');
            const { color, textColor } = colorFunction(value);
            value = roundToNearestMultiple(value, decimals, floor);
            cell.style.backgroundColor = color;
            cell.style.color = textColor;

            // Création des icônes pour chaque cellule (si applicable)
            if (rowId === 'sun-week-row') {
                const iconBefore = document.createElement('img');
                const iconAfter = document.createElement('img');
                const size = '20px';

                // Configuration de l'icône de lever de soleil
                iconBefore.src = '/icons/sun/lever-du-soleil.png';
                iconBefore.style.width = size;
                iconBefore.style.height = 'auto';

                // Configuration de l'icône de coucher de soleil
                iconAfter.src = '/icons/sun/coucher-du-soleil.png';
                iconAfter.style.width = size;
                iconAfter.style.height = 'auto';

                // Ajout des icônes avant et après le texte
                cell.appendChild(iconBefore);
                cell.appendChild(document.createTextNode(value));
                cell.appendChild(iconAfter);
            } else {
                // Si ce n'est pas la ligne des heures de lever/coucher du soleil, ajoutez seulement le texte
                cell.textContent = value;
            }

            // Ajouter la cellule au row
            row.appendChild(cell);
        });
    }
    function fillRowMobile(row, value, decimals, floor, colorFunction) {
        const cell = document.createElement("td");
        const { color, textColor } = colorFunction(value);
        value = roundToNearestMultiple(value, decimals, floor);
        cell.style.backgroundColor = color;
        cell.style.color = textColor;
        cell.textContent = value;
        row.appendChild(cell);
    }
    function getHoursPerDay(timesToDisplay) {
        const hoursPerDay = {}

        timesToDisplay.forEach(date => {
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });

            // Si c'est un nouveau jour, on initialise la cellule de jour
            if (!hoursPerDay[dayName]) {
                hoursPerDay[dayName] = 1; // Commence le comptage des heures
            } else {
                hoursPerDay[dayName]++;
            }
        });

        return hoursPerDay;
    }

    getApiData();
});