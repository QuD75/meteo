document.addEventListener('DOMContentLoaded', () => {
    const dep = '44';
    const lat = '47.2917';
    const lon = '-2.5201';
    const paramsDay = 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx,uv:idx';
    const paramsWeek = 'sunrise:sql,sunset:sql,t_min_2m_24h:C,t_max_2m_24h:C,precip_24h:mm,wind_gusts_10m_24h:ms,weather_symbol_24h:idx';

    const currentDate = new Date();
    const currentHour = new Date(currentDate);
    currentHour.setMinutes(0, 0, 0);

    const nextDayMidnight = new Date(currentDate);
    nextDayMidnight.setHours(0, 0, 0, 0);
    nextDayMidnight.setDate(nextDayMidnight.getDate() + 1);

    const beginDateDay = currentHour.toISOString().split('.')[0] + 'Z';
    const beginDateWeek = nextDayMidnight.toISOString().split('.')[0] + 'Z';

    const apiUrlDay = `https://api.meteomatics.com/${beginDateDay}PT23H:PT1H/${paramsDay}/${lat},${lon}/json`;
    const apiUrlWeek = `https://api.meteomatics.com/${beginDateWeek}P6D:P1D/${paramsWeek}/${lat},${lon}/json`;
    const apiVigilance = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/weatherref-france-vigilance-meteo-departement/records?where=domain_id%3D%22${dep}%22&limit=20`;
    const proxyUrlDay = `https://proxy-ddj0.onrender.com/apimeteo?url=${apiUrlDay}`;
    const proxyUrlWeek = `https://proxy-ddj0.onrender.com/apimeteo?url=${apiUrlWeek}`;

    //Récupérer si les données doivent être mockées ou non
    function getMockValue() {
        const url = new URL(window.location.href);
        const mockParam = url.searchParams.get('mock');
        //return mockParam !== null ? mockParam.toLowerCase() === 'true' : false;
        return true;
    }

    // Appel aux API
    async function getApiData(mock) {
        document.getElementById("loading-message-vigilance").style.display = "block";
        document.getElementById("loading-message-day").style.display = "block";
        document.getElementById("loading-message-week").style.display = "block";

        console.log(mock ? "Données mockées" : "Données non mockées");
        const now = Date.now();

        // Fonction pour récupérer et gérer les données d'une API
        async function fetchData(apiUrl, cacheKey, duration, displayFunction) {
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));

            // Vérifier si les données en cache sont encore valides
            if (!mock && cachedData && (now - cachedData.timestamp < duration)) {
                console.log("Données en cache pour " + cacheKey);
                displayFunction(cachedData.data); // Affiche les données mises en cache immédiatement
                return cachedData.data;
            } else {
                try {
                    console.log("Données non cachées pour " + cacheKey);
                    const response = await fetch(mock ? `/json/${cacheKey}.json` : apiUrl);

                    if (!mock && !response.ok) throw new Error(`HTTP Error: ${response.status}`);

                    const data = await response.json();

                    if (!mock) {
                        localStorage.setItem(cacheKey, JSON.stringify({ data: data, timestamp: now }));
                        console.log("Données mises en cache pour " + cacheKey);
                    }
                    displayFunction(data); // Affiche les données dès qu'elles sont disponibles
                    return data;
                } catch (error) {
                    console.error("Erreur lors de la récupération des données de " + cacheKey + ":", error);
                    return null; // Retourner null en cas d'erreur
                }
            }
        }

        // Appels API indépendants
        fetchData(proxyUrlDay, 'day', 15 * 60 * 1000, displayDataDay);
        fetchData(proxyUrlWeek, 'week', 60 * 60 * 1000, displayDataWeek);
        fetchData(apiVigilance, 'vigilance', 60 * 60 * 1000, displayDataVigilance);
    }

    //Afficher les données des API
    function displayDataVigilance(dataVigilance) {
        // Masquer le message de chargement et afficher les conteneurs des jours et de la semaine
        document.getElementById("loading-message-vigilance").style.display = "none";
        document.getElementById("vigilance-encart").style.display = "block";

        fillVigilance(dataVigilance);
    }
    function displayDataDay(dataDay) {
        // Masquer le message de chargement et afficher les conteneurs des jours et de la semaine
        document.getElementById("loading-message-day").style.display = "none";
        document.getElementById("day-container-tab").style.display = "block";
        document.getElementById("day-container-graphs").style.display = "grid";

        fillTableDay(dataDay);

        // Générer les graphiques pour les données de la journée
        createChart('temperature-day-chart', 'de la température dans les prochaines 24h', "Heure", "Température (°C)", dataDay.data[0].coordinates[0], 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
        createChart('precipitation-day-chart', 'des précipitations dans les prochaines 24h', "Heure", "Pluie (mm)", dataDay.data[1].coordinates[0], 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-day-chart', 'du vent dans les prochaines 24h', "Heure", "Vent (km/h)", dataDay.data[2].coordinates[0], 'line', 'rgba(204, 204, 0, 1)', 'rgba(255, 255, 0, 0.2)', dataDay.data[3].coordinates[0]);
        createChart('pressure-day-chart', 'de la pression dans les prochaines 24h', "Heure", "Pression (hPa)", dataDay.data[5].coordinates[0], 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }
    function displayDataWeek(dataWeek) {
        // Masquer le message de chargement et afficher les conteneurs des jours et de la semaine
        document.getElementById("loading-message-week").style.display = "none";
        document.getElementById("week-container-tab").style.display = "block";
        document.getElementById("week-container-graphs").style.display = "grid";

        fillTableWeek(dataWeek);

        // Générer les graphiques pour les données de la semaine
        createChart('temperature-week-chart', 'de la température sur les 7 prochaines jours', "Jour", "Température (°C)", dataWeek.data[2].coordinates[0], 'line', 'rgba(0, 0, 139, 1)', 'rgba(255, 255, 255, 0)', null, dataWeek.data[3].coordinates[0]);
        createChart('precipitation-week-chart', 'des précipitations sur les 7 prochaines jours', "Jour", "Pluie (mm)", dataWeek.data[4].coordinates[0], 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-week-chart', 'du vent max sur les 7 prochaines jours', "Jour", "Vent (km/h)", dataWeek.data[5].coordinates[0], 'line', 'rgba(255, 140, 0, 1)', 'rgba(255, 140, 0, 0.2)');
    }
    function fillVigilance(data) {
        if (data.results && data.results.length > 0) {
            // Trier les résultats par color_id pour obtenir la vigilance la plus forte
            data.results.sort((a, b) => b.color_id - a.color_id);

            // Récupérer le niveau de vigilance le plus élevé
            const highestVigilanceLevel = data.results[0].color_id;

            // Vérifier si la vigilance la plus élevée est verte
            const pastille = document.getElementById('pastille');
            const phenomenonName = document.getElementById('phenomenon-name');
            const vigilanceDetails = document.getElementById('vigilance-details');
            const vigilanceIcon = document.getElementById('vigilance-icon'); // Nouvelle ligne
            const vigilanceEncart = document.getElementById('vigilance-encart');

            // Déterminer la couleur et l'icône de la vigilance
            const colorMap = {
                1: { color: 'green', icon: '/icons/44/44_vert.svg' },
                2: { color: 'yellow', icon: '/icons/44/44_jaune.svg' },
                3: { color: 'orange', icon: '/icons/44/44_orange.svg' },
                4: { color: 'red', icon: '/icons/44/44_rouge.svg' }
            };

            if (highestVigilanceLevel in colorMap) {
                pastille.style.backgroundColor = colorMap[highestVigilanceLevel].color;
                vigilanceIcon.src = colorMap[highestVigilanceLevel].icon; // Nouvelle ligne pour définir l'icône
            }

            // Vérifier si la vigilance la plus élevée est verte
            if (highestVigilanceLevel === 1) {
                phenomenonName.textContent = '';
                vigilanceDetails.innerHTML = '';
                vigilanceEncart.style.display = 'block'; // Afficher seulement la pastille verte
                return;
            }

            // Filtrer pour obtenir toutes les vigilances du niveau le plus élevé
            const highestVigilances = data.results.filter(vigilance => vigilance.color_id === highestVigilanceLevel);

            // Regrouper les vigilances par phénomène et fusionner les périodes
            const vigilanceGroups = {};

            highestVigilances.forEach(vigilance => {
                const key = `${vigilance.phenomenon}-${vigilance.color_id}`;
                if (!vigilanceGroups[key]) {
                    vigilanceGroups[key] = {
                        phenomenon: vigilance.phenomenon,
                        color_id: vigilance.color_id,
                        periods: []
                    };
                }
                vigilanceGroups[key].periods.push({
                    begin_time: new Date(vigilance.begin_time),
                    end_time: new Date(vigilance.end_time)
                });
            });

            // Fusionner les périodes
            const mergedVigilances = Object.values(vigilanceGroups).map(group => {
                const mergedPeriods = mergePeriods(group.periods);
                return {
                    phenomenon: group.phenomenon,
                    color_id: group.color_id,
                    periods: mergedPeriods
                };
            });

            phenomenonName.textContent = mergedVigilances.map(v => v.phenomenon).join(', ');

            // Fonction pour formater les dates
            function formatPeriod(begin, end) {
                const formatDate = date => date.toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return `${formatDate(begin)} à ${formatDate(end)}`;
            }

            // Affichage des périodes fusionnées
            vigilanceDetails.innerHTML = mergedVigilances.map(vigilance =>
                `Phénomène: ${vigilance.phenomenon}<br>${vigilance.periods.map(period =>
                    `Période: ${formatPeriod(period.begin_time, period.end_time)}`
                ).join('<br>')}<br><br>`
            ).join('');

            vigilanceEncart.style.display = 'block'; // Afficher l'encart
        } else {
            vigilanceEncart.style.display = 'none'; // Cacher l'encart si aucune donnée
        }
    }
    function mergePeriods(periods) {
        // Tri des périodes par date de début
        periods.sort((a, b) => a.begin_time - b.begin_time);

        const merged = [];
        let currentPeriod = periods[0];

        for (let i = 1; i < periods.length; i++) {
            if (currentPeriod.end_time >= periods[i].begin_time) {
                // Il y a chevauchement, fusionner les périodes
                currentPeriod.end_time = new Date(Math.max(currentPeriod.end_time, periods[i].end_time));
            } else {
                // Pas de chevauchement, ajouter la période courante à la liste et passer à la suivante
                merged.push(currentPeriod);
                currentPeriod = periods[i];
            }
        }

        // Ajouter la dernière période
        merged.push(currentPeriod);

        return merged;
    }
    function fillTableDay(data) {
        const daysRow = document.getElementById('days-24h-row');
        const hoursRow = document.getElementById('hours-24h-row');
        const temperatureRow = document.getElementById('temperature-24h-row');
        const rainRow = document.getElementById('rain-24h-row');
        const windRow = document.getElementById('wind-24h-row');
        const windGustRow = document.getElementById('wind-gust-24h-row');
        const windDirectionRow = document.getElementById('wind-direction-24h-row');
        const pressureRow = document.getElementById('pressure-24h-row');
        const weatherRow = document.getElementById('weather-24h-row');
        const uvRow = document.getElementById('uv-24h-row');

        let currentDate = null;
        let dateCell;
        let hourCount = 0;

        data.data[0].coordinates[0].dates.forEach((dateData) => {
            const hour = new Date(dateData.date).getUTCHours();
            const newDate = new Date(dateData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

            if (currentDate !== newDate) {
                if (dateCell) {
                    dateCell.setAttribute('colspan', hourCount);
                }
                currentDate = newDate;
                dateCell = document.createElement('th');
                dateCell.textContent = currentDate;
                daysRow.appendChild(dateCell);
                hourCount = 1;
            } else {
                hourCount++;
            }

            const th = document.createElement('th');
            const targetHour = (hour + getParisTimezoneOffset(new Date())) % 24;
            th.textContent = `${targetHour}h`;
            hoursRow.appendChild(th);
        });

        if (dateCell) {
            dateCell.setAttribute('colspan', hourCount);
        }

        fillWeatherRow(data.data[0], 0, 1, null, temperatureRow, getTempRainWindColor, -5, 40, 300, 0);
        fillWeatherRow(data.data[1], 1, 1, null, rainRow, getTempRainWindColor, 0, 5, 180, 240, true);
        fillWeatherRow(data.data[2], 0, 3.6, 5, windRow, getTempRainWindColor, 0, 100, 210, 0);
        fillWeatherRow(data.data[3], 0, 3.6, 5, windGustRow, getTempRainWindColor, 0, 100, 210, 0);
        fillWindDirectionRow(data.data[4], windDirectionRow);
        fillWeatherRow(data.data[5], 0, 1, null, pressureRow, () => ({ color: 'white', textColor: 'black' }));
        fillSymbolRow(data.data[6], weatherRow);
        fillWeatherRow(data.data[7], 0, 1, null, uvRow, getUVColor);
    }
    function fillWeatherRow(data, round, multiple, floor, rowElement, colorFunc, minValue, maxValue, hueMin, hueMax) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            let value = dateData.value * multiple;
            if (floor != null) value = Math.floor(value / floor) * floor;
            value = value.toFixed(round);
            const { color, textColor } = colorFunc(value, minValue, maxValue, hueMin, hueMax);
            td.textContent = value;
            td.style.backgroundColor = color;
            td.style.color = textColor;
            rowElement.appendChild(td);
        });
    }
    function fillSymbolRow(data, rowElement) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const weatherIcon = document.createElement('img');
            weatherIcon.style.width = "40px";
            weatherIcon.style.height = "40px";
            weatherIcon.src = getWeatherIcon(dateData.value);
            td.appendChild(weatherIcon);
            rowElement.appendChild(td);
        });
    }
    function fillWindDirectionRow(data, rowElement) {
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
    function fillTableWeek(data) {
        const daysRow = document.getElementById('days-week-row');
        const sunRow = document.getElementById('sun-week-row');
        const tempMinRow = document.getElementById('temp-min-week-row');
        const tempMaxRow = document.getElementById('temp-max-week-row');
        const rainRow = document.getElementById('rain-week-row');
        const windRow = document.getElementById('wind-week-row');
        const weatherRow = document.getElementById('weather-week-row');

        data.data[0].coordinates[0].dates.forEach((dateData, index) => {
            const date = new Date(dateData.date);
            date.setDate(date.getDate() - 1);
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });

            const th = document.createElement('th');
            th.textContent = dayName;
            daysRow.appendChild(th);

            const sunriseTime = new Date(dateData.value);
            const sunsetTime = new Date(data.data[1].coordinates[0].dates[index].value);
            const sunriseHours = sunriseTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const sunsetHours = sunsetTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });

            const td = document.createElement('td');
            td.textContent = `${sunriseHours} -> ${sunsetHours}`;
            sunRow.appendChild(td);
        });

        fillWeatherRow(data.data[2], 0, 1, 1, tempMinRow, getTempRainWindColor, -5, 40, 300, 0);
        fillWeatherRow(data.data[3], 0, 1, 1, tempMaxRow, getTempRainWindColor, -5, 40, 300, 0);
        fillWeatherRow(data.data[4], 1, 1, 1, rainRow, getTempRainWindColor, 0, 5, 180, 240, true);
        fillWeatherRow(data.data[5], 0, 3.6, 5, windRow, getTempRainWindColor, 0, 100, 210, 0);
        fillSymbolRow(data.data[6], weatherRow);
    }
    function getParisTimezoneOffset(date) {
        // Crée une date correspondant au dernier jour de janvier et juillet pour vérifier l'heure standard et l'heure d'été
        const january = new Date(date.getFullYear(), 0, 1); // Janvier
        const july = new Date(date.getFullYear(), 6, 1);    // Juillet

        // Compare les décalages horaires entre la date donnée et janvier/juillet
        const isDST = date.getTimezoneOffset() < Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());

        return isDST ? 2 : 1; // 2 = Heure d'été, 1 = Heure d'hiver
    }

    //Fonction de générations du graphique
    function createChart(elementId, label, xAxisLabel, yAxisLabel, data, chartType, borderColor, backgroundColor, secondaryDataWind = null, secondaryDataTemp = null) {
        const ctx = document.getElementById(elementId).getContext('2d');
        const labels = getChartLabels(elementId, data);
        const values = getChartValues(data, label);

        const datasets = createDatasets(label, values, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp);

        // Créer le graphique
        new Chart(ctx, {
            type: chartType,
            data: {
                labels,
                datasets
            },
            options: {
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Évolution ${label}`,
                        font: { size: 20 }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: xAxisLabel },
                        ticks: { maxRotation: 30, minRotation: 30 }
                    },
                    y: {
                        title: { display: true, text: yAxisLabel },
                        ticks: { callback: value => value.toFixed(0) }
                    }
                }
            }
        });
    }
    function getChartLabels(elementId, data) {
        return elementId.includes('day')
            ? data.dates.map(date => `${new Date(date.date).getHours()}h`)
            : data.dates.map(date => {
                const parsedDate = new Date(date.date);
                return parsedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            });
    }
    function getChartValues(data, label) {
        return data.dates.map(date => date.value * (label.includes('vent') ? 3.6 : 1)); // Convertir en km/h si nécessaire
    }
    function createDatasets(label, values, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp) {
        const datasets = [{
            label,
            data: values,
            borderColor,
            backgroundColor,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.5,
            cubicInterpolationMode: 'monotone',
            fill: secondaryDataWind ? true : 'start'
        }];

        if (secondaryDataWind) {
            const secondaryValues = secondaryDataWind.dates.map(date => date.value * 3.6);
            datasets.push({
                pointRadius: 0,
                data: secondaryValues,
                borderColor: 'rgba(255, 140, 0, 1)',
                backgroundColor: 'rgba(255, 140, 0, 0.2)',
                fill: '-1',
                tension: 0.5,
                cubicInterpolationMode: 'monotone',
            });
        }

        if (secondaryDataTemp) {
            const secondaryValues = secondaryDataTemp.dates.map(date => date.value);
            datasets.push({
                pointRadius: 0,
                data: secondaryValues,
                borderColor: 'rgba(139, 0, 0, 1)',
                tension: 0.5,
                cubicInterpolationMode: 'monotone',
            });
        }

        return datasets;
    }

    //Fonctions d'icones
    function getWindDirectionIcon(wind_deg) {
        const directions = [
            { min: 348.75, max: 360, icon: '/icons/wind/n.png' },
            { min: 0, max: 11.25, icon: '/icons/wind/n.png' },
            { min: 11.25, max: 33.75, icon: '/icons/wind/nne.png' },
            { min: 33.75, max: 56.25, icon: '/icons/wind/ne.png' },
            { min: 56.25, max: 78.75, icon: '/icons/wind/ene.png' },
            { min: 78.75, max: 101.25, icon: '/icons/wind/e.png' },
            { min: 101.25, max: 123.75, icon: '/icons/wind/ese.png' },
            { min: 123.75, max: 146.25, icon: '/icons/wind/se.png' },
            { min: 146.25, max: 168.75, icon: '/icons/wind/sse.png' },
            { min: 168.75, max: 191.25, icon: '/icons/wind/s.png' },
            { min: 191.25, max: 213.75, icon: '/icons/wind/sso.png' },
            { min: 213.75, max: 236.25, icon: '/icons/wind/so.png' },
            { min: 236.25, max: 258.75, icon: '/icons/wind/oso.png' },
            { min: 258.75, max: 281.25, icon: '/icons/wind/o.png' },
            { min: 281.25, max: 303.75, icon: '/icons/wind/ono.png' },
            { min: 303.75, max: 326.25, icon: '/icons/wind/no.png' },
            { min: 326.25, max: 348.75, icon: '/icons/wind/nno.png' }
        ];
        return directions.find(d => wind_deg >= d.min && wind_deg <= d.max)?.icon || '/icons/wind/unknown.png';
    }
    function getWeatherIcon(weather) {
        if (weather === 0) return '/icons/weather/wsymbol_0999_unknown.png';
        else if (weather === 1) return '/icons/weather/wsymbol_0001_sunny.png';
        else if (weather === 101) return '/icons/weather/wsymbol_0008_clear_sky_night.png';
        else if (weather === 2) return '/icons/weather/wsymbol_0002_sunny_intervals.png';
        else if (weather === 102) return '/icons/weather/wsymbol_0041_partly_cloudy_night.png';
        else if (weather === 3) return '/icons/weather/wsymbol_0043_mostly_cloudy.png';
        else if (weather === 103) return '/icons/weather/wsymbol_0044_mostly_cloudy_night.png';
        else if (weather === 4) return '/icons/weather/wsymbol_0003_white_cloud.png';
        else if (weather === 104) return '/icons/weather/wsymbol_0042_cloudy_night.png';
        else if (weather === 5) return '/icons/weather/wsymbol_0018_cloudy_with_heavy_rain.png';
        else if (weather === 105) return '/icons/weather/wsymbol_0034_cloudy_with_heavy_rain_night.png';
        else if (weather === 6) return '/icons/weather/wsymbol_0021_cloudy_with_sleet.png';
        else if (weather === 106) return '/icons/weather/wsymbol_0037_cloudy_with_sleet_night.png';
        else if (weather === 7) return '/icons/weather/wsymbol_0020_cloudy_with_heavy_snow.png';
        else if (weather === 107) return '/icons/weather/wsymbol_0036_cloudy_with_heavy_snow_night.png';
        else if (weather === 8) return '/icons/weather/wsymbol_0009_light_rain_showers.png';
        else if (weather === 108) return '/icons/weather/wsymbol_0025_light_rain_showers_night.png';
        else if (weather === 9) return '/icons/weather/wsymbol_0011_light_snow_showers.png';
        else if (weather === 109) return '/icons/weather/wsymbol_0027_light_snow_showers_night.png';
        else if (weather === 10) return '/icons/weather/wsymbol_0013_sleet_showers.png';
        else if (weather === 110) return '/icons/weather/wsymbol_0029_sleet_showers_night.png';
        else if (weather === 11) return '/icons/weather/wsymbol_0006_mist.png';
        else if (weather === 111) return '/icons/weather/wsymbol_0063_mist_night.png';
        else if (weather === 12) return '/icons/weather/wsymbol_0007_fog.png';
        else if (weather === 112) return '/icons/weather/wsymbol_0064_fog_night.png';
        else if (weather === 13) return '/icons/weather/wsymbol_0050_freezing_rain.png';
        else if (weather === 113) return '/icons/weather/wsymbol_0068_freezing_rain_night.png';
        else if (weather === 14) return '/icons/weather/wsymbol_0024_thunderstorms.png';
        else if (weather === 114) return '/icons/weather/wsymbol_0040_thunderstorms_night.png';
        else if (weather === 15) return '/icons/weather/wsymbol_0048_drizzle.png';
        else if (weather === 115) return '/icons/weather/wsymbol_0066_drizzle_night.png';
        else if (weather === 16) return '/icons/weather/wsymbol_0056_dust_sand.png'
        else if (weather === 116) return '/icons/weather/wsymbol_0074_dust_sand_night.png';
        else return '/icons/weather/wsymbol_0999_unknown.png';
    }

    //Fonctions de coloriage
    function getTempRainWindColor(value, minValue, maxValue, hueMin, hueMax, rain) {
        let color;
        const numericValue = Number(value);
        if (numericValue === 0 && rain) {
            console.log("Pluie nulle : " + numericValue);
            color = `hsl(0, 0%, 100%)`
        } else if (numericValue < minValue) {
            color = `hsl(${hueMin}, 100%, 50%)`;
        } else if (numericValue > maxValue) {
            color = `hsl(${hueMax}, 100%, 50%)`;
        } else {
            const hue = Math.round(hueMin + ((value - minValue) / (maxValue - minValue)) * (hueMax - hueMin));
            color = `hsl(${hue}, 100%, 50%)`;
        }
        const textColor = getTextColor(color);
        return { color, textColor };
    }
    function getUVColor(value) {
        let color;
        if (value < 1) {
            // Blanc pour un indice UV de 0
            color = 'rgb(255, 255, 255)';
        } else if (value < 10) {
            // Dégradé de jaune à orange entre 1 et 9
            const red = 255;
            const green = Math.round(255 - ((value - 1) * 31));  // Passe de 255 à 120
            const blue = 0;
            color = `rgb(${red}, ${green}, ${blue})`;
        } else {
            // Rouge foncé pour un indice UV de 10
            color = 'rgb(139, 0, 0)';
        }
        const textColor = getTextColor(color);
        return { color, textColor };
    }
    function getTextColor(color) {
        let r, g, b;

        // Vérifier si la couleur est au format HSL
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
            const h = parseInt(hslMatch[1], 10);
            const s = parseInt(hslMatch[2], 10);
            const l = parseInt(hslMatch[3], 10);

            // Conversion HSL vers RGB
            const hslToRgb = (h, s, l) => {
                s /= 100;
                l /= 100;
                let r, g, b;

                if (s === 0) {
                    r = g = b = l; // achromatic (grayscale)
                } else {
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;

                    const hueToRgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                    };

                    r = hueToRgb(p, q, h / 360 + 1 / 3);
                    g = hueToRgb(p, q, h / 360);
                    b = hueToRgb(p, q, h / 360 - 1 / 3);
                }

                return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
            };

            [r, g, b] = hslToRgb(h, s, l);
        }
        // Vérifier si la couleur est au format RGB
        else {
            const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                r = parseInt(rgbMatch[1], 10);
                g = parseInt(rgbMatch[2], 10);
                b = parseInt(rgbMatch[3], 10);
            } else {
                return 'black'; // Valeur par défaut si le format n'est pas reconnu
            }
        }

        // Calcul de la luminosité
        const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminosity < 110 ? 'white' : 'black';
    }

    getApiData(getMockValue());
});