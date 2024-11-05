document.addEventListener('DOMContentLoaded', () => {
    const proxyUrlVigilance = `https://proxy-ddj0.onrender.com/vigilance`;
    const proxyUrlDay = `https://proxy-ddj0.onrender.com/meteoday`;
    const proxyUrlWeek = `https://proxy-ddj0.onrender.com/meteoweek`;

    const dep = '44';
    const urlVigilance = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/weatherref-france-vigilance-meteo-departement/records?where=domain_id=${dep}&limit=20`
    const urlOpenMeteoDay = 'https://api.open-meteo.com/v1/forecast?latitude=47.29&longitude=-2.52&hourly=temperature_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&forecast_days=2&timezone=Europe%2FBerlin';
    const urlOpenMeteoWeek = 'https://api.open-meteo.com/v1/forecast?latitude=47.29&longitude=-2.52&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_gusts_10m_max&timezone=Europe%2FBerlin';

    const isMobile = window.innerWidth < 1000;

    const setLoadingMessageDisplay = (display) => {
        document.getElementById('loading-message-vigilance').style.display = display;
        document.getElementById('loading-message-day').style.display = display;
        document.getElementById('loading-message-week').style.display = display;
    };

    // Appel aux API
    async function getApiData() {
        setLoadingMessageDisplay('block');
        // Appels API indépendants
        fetchData(urlVigilance, 'vigilance', 60, displayDataVigilance);
        fetchData(urlOpenMeteoDay, 'day', 15, displayDataDay);
        fetchData(urlOpenMeteoWeek, 'week', 60, displayDataWeek);
    }
    async function fetchData(apiUrl, cacheKey, duration, displayFunction) {
        const now = Date.now();
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && (now - cachedData.timestamp < duration * 60 * 1000)) {
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

    //Fonctions pour le tableau 24h
    function displayDataDay(jsonData) {
        document.getElementById('loading-message-day').style.display = 'none';
        document.getElementById('day-container-graphs').style.display = 'block';

        if (!isMobile) {
            document.getElementById('day-container-tab').style.display = 'block';
            fillDayContainer(jsonData);
        } else {
            document.getElementById('day-container-tab-mobile').style.display = 'block';
        }

    }
    function fillDayContainer(jsonData) {
        const now = new Date();
        const startHour = now.getHours(); // Utilise getUTCHours pour l'heure en UTC
        const hoursToDisplay = 24; // Nombre d'heures à afficher (de l'heure actuelle jusqu'à +23 heures)

        // Récupère les heures à partir de l'heure actuelle jusqu'à +23 heures
        const times = jsonData.hourly.time.map(time => new Date(time));
        const startIndex = times.findIndex(time => time.getHours() === startHour);

        // Sélectionne les données pour les heures dans la plage souhaitée
        let timesToDisplay = times.slice(startIndex, startIndex + hoursToDisplay);
        const tempToDisplay = jsonData.hourly.temperature_2m.slice(startIndex, startIndex + hoursToDisplay);
        const rainToDisplay = jsonData.hourly.precipitation.slice(startIndex, startIndex + hoursToDisplay);
        const windSpeedToDisplay = jsonData.hourly.wind_speed_10m.slice(startIndex, startIndex + hoursToDisplay);
        const windGustToDisplay = jsonData.hourly.wind_gusts_10m.slice(startIndex, startIndex + hoursToDisplay);
        const windDirectionToDisplay = jsonData.hourly.wind_direction_10m.slice(startIndex, startIndex + hoursToDisplay);
        const pressureToDisplay = jsonData.hourly.pressure_msl.slice(startIndex, startIndex + hoursToDisplay);
        const uvToDisplay = jsonData.hourly.uv_index.slice(startIndex, startIndex + hoursToDisplay);
        const weatherToDisplay = jsonData.hourly.weather_code.slice(startIndex, startIndex + hoursToDisplay);
        const isDayToDisplay = jsonData.hourly.is_day.slice(startIndex, startIndex + hoursToDisplay);

        const daysRow = document.getElementById('days-24h-row');
        const hoursRow = document.getElementById('hours-24h-row');

        // Crée un objet pour stocker le nombre d'heures par jour
        const hoursPerDay = {};

        // Parcours des heures pour créer les cellules fusionnées pour chaque jour
        timesToDisplay.forEach(date => {
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
            const hour = date.getHours();

            // Si c'est un nouveau jour, on initialise la cellule de jour
            if (!hoursPerDay[dayName]) {
                hoursPerDay[dayName] = 1; // Commence le comptage des heures
                const dayCell = document.createElement('th');
                dayCell.textContent = dayName;
                dayCell.colSpan = 1; // Initialement, on ne fusionne pas
                daysRow.appendChild(dayCell);
            } else {
                hoursPerDay[dayName]++;
            }

            // Remplit les entêtes des heures
            const hourCell = document.createElement('th');
            hourCell.textContent = `${hour}h`;
            hoursRow.appendChild(hourCell);
        });

        // Met à jour la colonne des jours pour fusionner correctement
        Object.entries(hoursPerDay).forEach(([dayName, count], index) => {
            const dayCell = daysRow.children[index + 1]; //A cause de la cellule 'Paramètres'
            dayCell.colSpan = count; // Met à jour la colSpan avec le nombre d'heures

        });

        // Remplit les données des différentes lignes
        function fillRow(rowId, data, decimals, floor, colorFunction) {
            const row = document.getElementById(rowId);
            data.forEach(value => {
                const cell = document.createElement('td');
                const { color, textColor } = colorFunction(value);
                value = roundToNearestMultiple(value, decimals, floor);
                cell.style.backgroundColor = color;
                cell.style.color = textColor;
                cell.textContent = value;
                row.appendChild(cell);
            });
        }

        fillRow('temperature-24h-row', tempToDisplay, 0, null, getTempColor);
        fillRow('rain-24h-row', rainToDisplay, 1, null, getRainColor);
        fillRow('wind-24h-row', windSpeedToDisplay, 0, 5, getWindColor);
        fillRow('wind-gust-24h-row', windGustToDisplay, 0, 5, getWindColor);
        fillRow('pressure-24h-row', pressureToDisplay, 0, null, defaultColorFunc);
        fillRow('uv-24h-row', uvToDisplay, 0, null, getUVColor);

        // Remplit les données des différentes lignes avec symbole
        function fillWindDirSymbol(rowId, data, widht, marginLeft) {
            const row = document.getElementById(rowId);
            data.forEach(value => {
                const cell = document.createElement('td');
                const icon = document.createElement('img');
                putIconStyle(icon, widht, 'auto%', 'contain', marginLeft);
                icon.src = getWindDirectionIcon(value);
                cell.appendChild(icon);
                row.appendChild(cell);
            });
        }
        async function fillWeatherSymbol(rowId, weathers, width, marginLeft) {
            const row = document.getElementById(rowId);
            for (const [index, value] of weathers.entries()) {
                const cell = document.createElement('td');
                const icon = document.createElement('img');

                // Configure le style de l'icône
                putIconStyle(icon, width, 'auto%', 'contain', marginLeft);

                // Attend l'URL de l'icône avant de l'assigner
                icon.src = await getWeatherIcon(value, isDayToDisplay[index]);

                // Ajoute l'icône dans la cellule et la cellule dans la ligne
                cell.appendChild(icon);
                row.appendChild(cell);
            }
        }

        fillWindDirSymbol('wind-direction-24h-row', windDirectionToDisplay, '65%', 0);
        fillWeatherSymbol('weather-24h-row', weatherToDisplay, '100%', 0);

        timesToDisplay = timesToDisplay.map(date => formatDate(date, false, false, false, true, false));
        createChartOM('temperature-day-chart', timesToDisplay, tempToDisplay, 1, 'Evolution de la température dans les prochaines 24h', 'Heure', 'Température (°C)', 0, 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
        createChartOM('precipitation-day-chart', timesToDisplay, rainToDisplay, 0.1, 'Evolution des précipitations dans les prochaines 24h', 'Heure', 'Pluie (mm)', 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChartOM('wind-day-chart', timesToDisplay, windSpeedToDisplay, 5, 'Evolution du vent dans les prochaines 24h', 'Heure', 'Vent (km/h)', 0, 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', windGustToDisplay);
        createChartOM('pressure-day-chart', timesToDisplay, pressureToDisplay, 1, 'Evolution de la pression dans les prochaines 24h', 'Heure', 'Pression (hPa)', 0, 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }
    function fillTableDayMobile(data) {
        const tableBody = document.querySelector('#weather-day-tab-mobile tbody');

        // Objet pour stocker les données regroupées par date
        const groupedData = {};

        // Mapping pour associer les paramètres aux propriétés dans `groupedData`
        const paramMapping = {
            't_2m:C': 'temperature',
            'precip_1h:mm': 'precipitations',
            'wind_speed_10m:ms': 'windSpeed',
            'wind_gusts_10m_1h:ms': 'windGusts',
            'wind_dir_10m:d': 'windDir',
            'msl_pressure:hPa': 'pressure',
            'weather_symbol_1h:idx': 'weatherSymbol',
            'uv:idx': 'uvIndex',
        };

        // Parcourir chaque paramètre de données
        data.forEach(parameter => {
            parameter.coordinates.forEach(coord => {
                coord.dates.forEach(dateData => {
                    const dateKey = new Date(dateData.date); // Utilisez une clé de date formatée

                    if (!groupedData[dateKey]) {
                        groupedData[dateKey] = {
                            temperature: null,
                            precipitations: null,
                            windSpeed: null,
                            windGusts: null,
                            windDir: null,
                            pressure: null,
                            weatherSymbol: null,
                            uvIndex: null,
                        };
                    }
                    const property = paramMapping[parameter.parameter];
                    if (property) groupedData[dateKey][property] = dateData.value;
                });
            });
        });

        // Calcul des occurrences de chaque jour
        const dayOccurrences = {};
        Object.keys(groupedData).forEach(dateKey => {
            const day = new Date(dateKey).getDate();
            dayOccurrences[day] = (dayOccurrences[day] || 0) + 1;
        });

        let previousDay = '';

        // 2. Créer les lignes du tableau avec fusion des cellules pour les dates identiques
        Object.keys(groupedData).forEach(dateKey => {
            const row = document.createElement('tr');
            const data = groupedData[dateKey];
            const day = new Date(dateKey).getDate();

            // Si c'est un nouveau jour ou la première apparition de ce jour
            if (day !== previousDay) {
                const dayCell = document.createElement('td');
                dayCell.setAttribute('rowspan', dayOccurrences[day]); // Applique le rowspan selon le comptage
                dayCell.textContent = new Date(dateKey).toLocaleDateString('fr-FR', { weekday: 'long' });
                row.appendChild(dayCell);
                previousDay = day;
            }
            const hourCell = document.createElement('td');
            hourCell.textContent = formatDate(new Date(dateKey), false, false, false, true, false);
            row.appendChild(hourCell);

            fillCellMobile(row, getTempColor, data.temperature, 0, 1);
            fillCellMobile(row, getRainColor, data.precipitations, 1, 1);
            fillCellMobile(row, getWindColor, data.windSpeed * 3.6, 0, 5);
            fillCellMobile(row, getWindColor, data.windGusts * 3.6, 0, 5);
            fillSymbolCellMobile(row, data.windDir, '75%', getWindDirectionIcon);
            fillCellMobile(row, null, data.pressure, 0, 1);
            fillCellMobile(row, getUVColor, data.uvIndex, 0, 1);
            fillSymbolCellMobile(row, data.weatherSymbol, '100%', getWeatherIcon);

            tableBody.appendChild(row);
        })
    }

    //Fonctions pour le tableau semaine
    function displayDataWeek(jsonData) {
        document.getElementById('loading-message-week').style.display = 'none';
        document.getElementById('week-container-graphs').style.display = 'block';

        if (!isMobile) {
            document.getElementById('week-container-tab').style.display = 'block';
            fillWeekContainer(jsonData);
        } else {
            document.getElementById('week-container-tab-mobile').style.display = 'block';
        }

    }
    function fillWeekContainer(jsonData) {
        const times = jsonData.daily.time.map(time => new Date(time));

        // Sélectionne les données pour les heures dans la plage souhaitée
        let timesToDisplay = times;
        const sunriseToDisplay = jsonData.daily.sunrise;
        const sunsetToDisplay = jsonData.daily.sunset;
        const tempMinToDisplay = jsonData.daily.temperature_2m_min;
        const tempMaxToDisplay = jsonData.daily.temperature_2m_max;
        const rainToDisplay = jsonData.daily.precipitation_sum;
        const windGustToDisplay = jsonData.daily.wind_gusts_10m_max;
        const uvToDisplay = jsonData.daily.uv_index_max;
        const weatherToDisplay = jsonData.daily.weather_code;

        // Remplit les données des différentes lignes
        function fillRow(rowId, data, decimals, floor, colorFunction) {
            const row = document.getElementById(rowId);
            data.forEach(value => {
                const cell = document.createElement('td');
                const { color, textColor } = colorFunction(value);
                value = roundToNearestMultiple(value, decimals, floor);
                cell.style.backgroundColor = color;
                cell.style.color = textColor;
                cell.textContent = value;
                row.appendChild(cell);
            });
        }

        timesToDisplay = timesToDisplay.map(date => new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }));

        fillRow('days-week-row', timesToDisplay, null, null, defaultColorFunc);
        fillRow('temp-min-week-row', tempMinToDisplay, 0, null, getTempColor);
        fillRow('temp-max-week-row', tempMaxToDisplay, 0, null, getTempColor);
        fillRow('rain-week-row', rainToDisplay, 1, null, getRainColor);
        fillRow('wind-week-row', windGustToDisplay, 0, 5, getWindColor);
        fillRow('uv-week-row', uvToDisplay, 0, null, getUVColor);

        async function fillWeatherSymbol(rowId, weathers, width, marginLeft) {
            const row = document.getElementById(rowId);
            for (const [index, value] of weathers.entries()) {
                const cell = document.createElement('td');
                const icon = document.createElement('img');

                // Configure le style de l'icône
                putIconStyle(icon, width, 'auto%', 'contain', marginLeft);

                // Attend l'URL de l'icône avant de l'assigner
                icon.src = await getWeatherIcon(value, isDayToDisplay[index]);

                // Ajoute l'icône dans la cellule et la cellule dans la ligne
                cell.appendChild(icon);
                row.appendChild(cell);
            }
        }

        fillWeatherSymbol('weather-week-row', weatherToDisplay, '100%', 0);

        createChartOM('temperature-week-chart', timesToDisplay, tempMinToDisplay, 1, 'Evolution de la température dans les prochaines 24h', 'Heure', 'Température (°C)', 0, 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)', tempMaxToDisplay);
        createChartOM('precipitation-week-chart', timesToDisplay, rainToDisplay, 0.1, 'Evolution des précipitations dans les prochaines 24h', 'Heure', 'Pluie (mm)', 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChartOM('wind-week-chart', timesToDisplay, windGustToDisplay, 5, 'Evolution du vent dans les prochaines 24h', 'Heure', 'Vent (km/h)', 0, 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', windGustToDisplay);
    }

    /*
        //Fonctions pour le tableau de la semaine
        function displayDataWeek(dataWeek) {
            document.getElementById('loading-message-week').style.display = 'none';
            document.getElementById('week-container-graphs').style.display = 'grid';
    
            if (!isMobile) {
                document.getElementById('week-container-tab').style.display = 'block';
                fillTableWeek(dataWeek);
            }
            else {
                document.getElementById('week-container-tab-mobile').style.display = 'block';
                fillTableWeekMobile(dataWeek.data);
            }
    
            createChart('temperature-week-chart', 'de la température sur les 7 prochains jours', 'Jour', 'Température (°C)', dataWeek.data[2].coordinates[0], 0, 'line', 'rgba(0, 0, 139, 1)', 'rgba(255, 255, 255, 0)', null, dataWeek.data[3].coordinates[0]);
            createChart('precipitation-week-chart', 'des précipitations sur les 7 prochains jours', 'Jour', 'Pluie (mm)', dataWeek.data[4].coordinates[0], 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
            createChart('wind-week-chart', 'du vent max sur les 7 prochains jours', 'Jour', 'Vent (km/h)', dataWeek.data[5].coordinates[0], 0, 'line', 'rgba(255, 140, 0, 1)', 'rgba(255, 140, 0, 0.2)');
            createChart('pressure-week-chart', 'de la pression sur les 7 prochains jours', 'Jour', 'Pression (Hpa))', dataWeek.data[6].coordinates[0], 0, 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
        }
        function fillTableWeek(data) {
            const daysRow = document.getElementById('days-week-row');
            const sunRow = document.getElementById('sun-week-row');
            const rowsConfig = {
                'temp-min-week-row': { index: 2, multiplier: 1, round: 0, colorFunc: getTempColor },
                'temp-max-week-row': { index: 3, multiplier: 1, round: 0, colorFunc: getTempColor },
                'rain-week-row': { index: 4, multiplier: 1, round: 1, colorFunc: getRainColor },
                'wind-week-row': { index: 5, multiplier: 3.6, round: 0, colorFunc: getWindColor, step: 5 },
                'pressure-week-row': { index: 6, multiplier: 1, round: 0, colorFunc: null, step: 1 }
            };
    
            // Fonction utilitaire pour ajouter les jours et heures de lever/coucher du soleil
            function addDayAndSunCells(dates) {
                dates.forEach((dateData, index) => {
                    const date = new Date(dateData.date);
                    date.setDate(date.getDate() - 1);
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    
                    // Ajout du jour
                    const dayCell = document.createElement('th');
                    dayCell.textContent = dayName;
                    daysRow.appendChild(dayCell);
    
                    // Ajout du lever et coucher du soleil
                    const sunriseTime = formatDate(new Date(dateData.value), false, false, false, true, true);
                    const sunsetTime = formatDate(new Date(data.data[1].coordinates[0].dates[index].value), false, false, false, true, true);
                    const sunCell = document.createElement('td');
                    sunCell.textContent = `${sunriseTime} -> ${sunsetTime}`;
                    sunRow.appendChild(sunCell);
                });
            }
    
            // Remplir les jours et heures de lever/coucher du soleil
            addDayAndSunCells(data.data[0].coordinates[0].dates);
    
            // Remplissage des lignes de données météo
            Object.entries(rowsConfig).forEach(([rowId, config]) => {
                const rowElement = document.getElementById(rowId);
                const { index, multiplier, round, colorFunc, step } = config;
                fillCellDesktop(data.data[index], round, multiplier, step, rowElement, colorFunc);
            });
    
            // Remplissage de la ligne pour les symboles météo
            fillSymboleCellDesktop(data.data[7], document.getElementById('weather-week-row'), '37%');
        }
        function fillTableWeekMobile(data) {
            const tableBody = document.querySelector('#weather-week-tab-mobile tbody');
            const groupedData = {};
    
            // Mapping des paramètres vers les propriétés de groupedData
            const paramMapping = {
                'sunrise:sql': 'sunrise',
                'sunset:sql': 'sunset',
                't_min_2m_24h:C': 'tempMin',
                't_max_2m_24h:C': 'tempMax',
                'precip_24h:mm': 'rain',
                'wind_gusts_10m_24h:ms': 'wind',
                'msl_pressure:hPa': 'pressure',
                'weather_symbol_24h:idx': 'weatherSymbol'
            };
    
            // Regrouper les données par date
            data.forEach(parameter => {
                parameter.coordinates.forEach(coord => {
                    coord.dates.forEach(dateData => {
                        const dateKey = new Date(dateData.date).toISOString();
    
                        if (!groupedData[dateKey]) {
                            groupedData[dateKey] = {
                                day: new Date(dateData.date),
                                sunrise: null,
                                sunset: null,
                                tempMin: null,
                                tempMax: null,
                                rain: null,
                                wind: null,
                                pressure: null,
                                weatherSymbol: null
                            };
                        }
    
                        const property = paramMapping[parameter.parameter];
                        if (property) groupedData[dateKey][property] = dateData.value;
                    });
                });
            });
    
            // Remplissage du tableau avec fusion des cellules pour les jours
            Object.keys(groupedData).forEach(dateKey => {
                const row = document.createElement('tr');
                const data = groupedData[dateKey];
    
                // Cellule de jour
                const dayCell = document.createElement('td');
                const dayName = data.day.toLocaleDateString('fr-FR', { weekday: 'long' });
                dayCell.textContent = dayName;
                row.appendChild(dayCell);
    
                // Cellule de lever et coucher du soleil
                const sunCell = document.createElement('td');
                const sunriseTime = formatDate(new Date(data.sunrise), false, false, false, true, true);
                const sunsetTime = formatDate(new Date(data.sunset), false, false, false, true, true);
                sunCell.textContent = `${sunriseTime} -> ${sunsetTime}`;
                row.appendChild(sunCell);
    
                fillCellMobile(row, getTempColor, data.tempMin, 0, 1);
                fillCellMobile(row, getTempColor, data.tempMax, 0, 1);
                fillCellMobile(row, getRainColor, data.rain, 1, 1);
                fillCellMobile(row, getWindColor, data.wind * 3.6, 0, 5);
                fillCellMobile(row, null, data.pressure, 0, 1);
                fillSymbolCellMobile(row, data.weatherSymbol, '100%', getWeatherIcon);
    
                tableBody.appendChild(row);
            });
        }
    
        //Fonctions de remplissage Mobile
        function fillCellMobile(row, colorFunc = defaultColorFunc, value, round, floor) {
            const cell = document.createElement('td');
            const effectiveColorFunc = colorFunc || defaultColorFunc;
            const { color, textColor } = effectiveColorFunc(value);
            cell.style.backgroundColor = color;
            cell.style.color = textColor;
            value = parseFloat(value).toFixed(round);
            value = Math.floor(value / floor) * floor;
            cell.textContent = value;
            row.appendChild(cell);
        }
        function fillSymbolCellMobile(row, value, width, symbolFunction) {
            const cell = document.createElement('td');
            const icon = document.createElement('img');
            icon.src = symbolFunction(value);
            putIconStyle(icon, width, 'auto', 'cover', 0);
            cell.appendChild(icon);
            row.appendChild(cell);
        }
    
    */

    getApiData();
});