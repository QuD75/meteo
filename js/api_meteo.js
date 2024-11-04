document.addEventListener('DOMContentLoaded', () => {
    const proxyUrlVigilance = `https://proxy-ddj0.onrender.com/vigilance`;
    const proxyUrlDay = `https://proxy-ddj0.onrender.com/meteoday`;
    const proxyUrlWeek = `https://proxy-ddj0.onrender.com/meteoweek`;

    const isMobile = window.innerWidth < 1000;

    const mock = getMockValue();
    function getMockValue() {
        const url = new URL(window.location.href);
        const mockParam = url.searchParams.get('mock');
        return mockParam !== null ? mockParam.toLowerCase() === 'true' : false;
    }

    const setLoadingMessageDisplay = (display) => {
        document.getElementById("loading-message-vigilance").style.display = display;
        document.getElementById("loading-message-day").style.display = display;
        document.getElementById("loading-message-week").style.display = display;
    };

    // Appel aux API
    async function getApiData() {
        setLoadingMessageDisplay("block");
        // Appels API indépendants
        fetchData(proxyUrlDay, 'day', 10, displayDataDay);
        fetchData(proxyUrlWeek, 'week', 60, displayDataWeek);
        fetchData(proxyUrlVigilance, 'vigilance', 60, displayDataVigilance);
    }
    async function fetchData(apiUrl, cacheKey, duration, displayFunction) {
        const now = Date.now();
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (!mock && cachedData && (now - cachedData.timestamp < duration * 60 * 1000)) {
            displayFunction(cachedData.data);
            return cachedData.data;
        } else {
            try {
                const response = await fetch(mock ? `/json/${cacheKey}.json` : apiUrl);
                if (!mock && !response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                if (!mock) localStorage.setItem(cacheKey, JSON.stringify({ data: data, timestamp: now }));
                displayFunction(data);
                return data;
            } catch (error) {
                console.error("Erreur lors de la récupération des données de " + cacheKey + ":", error);
                return null;
            }
        }
    }

    //Fonctions pour le tableau 24h
    function displayDataDay(dataDay) {
        document.getElementById("loading-message-day").style.display = "none";
        document.getElementById("day-container-graphs").style.display = "grid";

        if (!isMobile) {
            document.getElementById("day-container-tab").style.display = "block";
            fillTableDay(dataDay);
        }
        else {
            document.getElementById("day-container-tab-mobile").style.display = "block";
            fillTableDayMobile(dataDay.data);
        }

        createChart('temperature-day-chart', 'de la température dans les prochaines 24h', "Heure", "Température (°C)", dataDay.data[0].coordinates[0], 0, 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
        createChart('precipitation-day-chart', 'des précipitations dans les prochaines 24h', "Heure", "Pluie (mm)", dataDay.data[1].coordinates[0], 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-day-chart', 'du vent dans les prochaines 24h', "Heure", "Vent (km/h)", dataDay.data[2].coordinates[0], 0, 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', dataDay.data[3].coordinates[0]);
        createChart('pressure-day-chart', 'de la pression dans les prochaines 24h', "Heure", "Pression (hPa)", dataDay.data[5].coordinates[0], 0, 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }
    function fillTableDay(data) {
        const daysRow = document.getElementById('days-24h-row');
        const hoursRow = document.getElementById('hours-24h-row');
        const rowsConfig = {
            "temperature-24h-row": { index: 0, multiplier: 1, round: 0, colorFunc: getTempColor, min: -5, max: 40, hueMin: 300, hueMax: 0 },
            "rain-24h-row": { index: 1, multiplier: 1, round: 1, colorFunc: getRainColor },
            "wind-24h-row": { index: 2, multiplier: 3.6, round: 0, colorFunc: getWindColor, step: 5 },
            "wind-gust-24h-row": { index: 3, multiplier: 3.6, round: 0, colorFunc: getWindColor, step: 5 },
            "pressure-24h-row": { index: 5, multiplier: 1, round: 0 },
            "uv-24h-row": { index: 7, multiplier: 1, round: 0, colorFunc: getUVColor }
        };

        // Fonction utilitaire pour ajouter les cellules de jour et d'heure
        function addDateAndHourCells(dates) {
            let currentDate = null;
            let dateCell;
            let hourCount = 0;

            dates.forEach(dateData => {
                const date = new Date(dateData.date);
                const hour = formatDate(date, false, false, false, true, false);
                const newDate = date.toLocaleDateString('fr-FR', { weekday: 'long' });

                if (currentDate !== newDate) {
                    if (dateCell) dateCell.setAttribute('colspan', hourCount);
                    currentDate = newDate;
                    dateCell = document.createElement('th');
                    dateCell.textContent = currentDate;
                    daysRow.appendChild(dateCell);
                    hourCount = 1;
                } else {
                    hourCount++;
                }

                const th = document.createElement('th');
                th.textContent = hour;
                hoursRow.appendChild(th);
            });

            if (dateCell) dateCell.setAttribute('colspan', hourCount);
        }

        // Remplir les cellules de jour et d'heure
        addDateAndHourCells(data.data[0].coordinates[0].dates);

        // Remplissage des lignes de données météo
        Object.entries(rowsConfig).forEach(([rowId, config]) => {
            const rowElement = document.getElementById(rowId);
            const { index, multiplier, round, colorFunc, min, max, hueMin, hueMax, step } = config;
            fillCellDesktop(data.data[index], round, multiplier, step, rowElement, colorFunc, min, max, hueMin, hueMax);
        });

        // Remplir les lignes pour les directions du vent et les symboles météo
        fillWindDirectionCell(data.data[4], document.getElementById('wind-direction-24h-row'));
        fillSymboleCellDesktop(data.data[6], document.getElementById('weather-24h-row'), "0");
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
            fillSymbolCellMobile(row, data.windDir, "80%", getWindDirectionIcon);
            fillCellMobile(row, null, data.pressure, 0, 1);
            fillCellMobile(row, getUVColor, data.uvIndex, 0, 1);
            fillSymbolCellMobile(row, data.weatherSymbol, "100%", getWeatherIcon);

            tableBody.appendChild(row);
        })
    }

    //Fonctions pour le tableau de la semaine
    function displayDataWeek(dataWeek) {
        document.getElementById("loading-message-week").style.display = "none";
        document.getElementById("week-container-graphs").style.display = "grid";

        if (!isMobile) {
            document.getElementById("week-container-tab").style.display = "block";
            fillTableWeek(dataWeek);
        }
        else {
            document.getElementById("week-container-tab-mobile").style.display = "block";
            fillTableWeekMobile(dataWeek.data);
        }

        createChart('temperature-week-chart', 'de la température sur les 7 prochains jours', "Jour", "Température (°C)", dataWeek.data[2].coordinates[0], 0, 'line', 'rgba(0, 0, 139, 1)', 'rgba(255, 255, 255, 0)', null, dataWeek.data[3].coordinates[0]);
        createChart('precipitation-week-chart', 'des précipitations sur les 7 prochains jours', "Jour", "Pluie (mm)", dataWeek.data[4].coordinates[0], 1, 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-week-chart', 'du vent max sur les 7 prochains jours', "Jour", "Vent (km/h)", dataWeek.data[5].coordinates[0], 0, 'line', 'rgba(255, 140, 0, 1)', 'rgba(255, 140, 0, 0.2)');
        createChart('pressure-week-chart', 'de la pression sur les 7 prochains jours', "Jour", "Pression (Hpa))", dataWeek.data[6].coordinates[0], 0, 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }
    function fillTableWeek(data) {
        const daysRow = document.getElementById('days-week-row');
        const sunRow = document.getElementById('sun-week-row');
        const rowsConfig = {
            "temp-min-week-row": { index: 2, multiplier: 1, round: 0, colorFunc: getTempColor },
            "temp-max-week-row": { index: 3, multiplier: 1, round: 0, colorFunc: getTempColor },
            "rain-week-row": { index: 4, multiplier: 1, round: 1, colorFunc: getRainColor },
            "wind-week-row": { index: 5, multiplier: 3.6, round: 0, colorFunc: getWindColor, step: 5 },
            "pressure-week-row": { index: 6, multiplier: 1, round: 0, colorFunc: null, step: 1 }
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
        fillSymboleCellDesktop(data.data[7], document.getElementById('weather-week-row'), "37%");
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
            fillSymbolCellMobile(row, data.weatherSymbol, "100%", getWeatherIcon);

            tableBody.appendChild(row);
        });
    }

    //Fonctions de remplissage Desktop
    function fillCellDesktop(data, round = 0, multiple = 1, floor = null, rowElement, colorFunc = defaultColorFunc, minValue, maxValue, hueMin, hueMax, rain, uv) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            let valueMultiplied = dateData.value * multiple;

            // Appliquer arrondi si `floor` est défini
            if (floor != null) valueMultiplied = Math.floor(valueMultiplied / floor) * floor;

            // Déterminer la couleur de la cellule
            const effectiveColorFunc = colorFunc || defaultColorFunc;
            const { color, textColor } = effectiveColorFunc(valueMultiplied, minValue, maxValue, hueMin, hueMax, rain, uv);

            // Appliquer style et contenu
            td.textContent = valueMultiplied.toFixed(round);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            rowElement.appendChild(td);
        });
    }
    function fillSymboleCellDesktop(data, rowElement, marginLeft) {
        data.coordinates[0].dates.forEach(dateData => {
            const cell = document.createElement('td');
            const weatherIcon = document.createElement('img');
            putIconStyle(weatherIcon, "auto", "100%", "contain", marginLeft);
            weatherIcon.src = getWeatherIcon(dateData.value);
            cell.appendChild(weatherIcon);
            rowElement.appendChild(cell);
        });
    }
    function fillWindDirectionCell(data, rowElement) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const windDirectionIcon = document.createElement('img');
            windDirectionIcon.src = getWindDirectionIcon(dateData.value);
            windDirectionIcon.style.width = "30px";
            windDirectionIcon.style.height = "30px";
            td.appendChild(windDirectionIcon);
            rowElement.appendChild(td);
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
        putIconStyle(icon, width, "auto", "cover", 0);
        cell.appendChild(icon);
        row.appendChild(cell);
    }

    getApiData();
});