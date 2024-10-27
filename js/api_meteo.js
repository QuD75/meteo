document.addEventListener('DOMContentLoaded', () => {
    const lat = '47.2917';
    const lon = '-2.5201';
    const paramsDay = 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx,uv:idx';
    const paramsWeek = 'sunrise:sql,sunset:sql,t_min_2m_24h:C,t_max_2m_24h:C,precip_24h:mm,weather_symbol_24h:idx';

    const currentDate = new Date();
    const currentHour = new Date(currentDate.setMinutes(0, 0, 0));
    const tomorrowDay = new Date(currentDate.setHours(0, 0, 0, 0));
    tomorrowDay.setDate(tomorrowDay.getDate() + 1);
    const beginDateDay = currentHour.toISOString().split('.')[0] + 'Z';
    const beginDateWeek = tomorrowDay.toISOString().split('.')[0] + 'Z';

    const apiUrlDay = `https://api.meteomatics.com/${beginDateDay}PT24H:PT1H/${paramsDay}/${lat},${lon}/json`;
    const apiUrlWeek = `https://api.meteomatics.com/${beginDateWeek}P6D:P1D/${paramsWeek}/${lat},${lon}/json`;
    const proxyUrlDay = `https://proxy-ddj0.onrender.com/proxy?url=${apiUrlDay}`;
    const proxyUrlWeek = `https://proxy-ddj0.onrender.com/proxy?url=${apiUrlWeek}`;

    const cacheKeyDay = 'weatherDayDataCache';
    const cacheKeyWeek = 'weatherWeekDataCache';
    //const cacheDuration = 15 * 60 * 1000; // 15 minutes en millisecondes
    const cacheDuration = 1;

    async function getApiData() {
        const cachedDataDay = JSON.parse(localStorage.getItem(cacheKeyDay));
        const cachedDataWeek = JSON.parse(localStorage.getItem(cacheKeyWeek));
        const now = Date.now();

        // Vérifiez si les données mises en cache sont valides
        if (cachedDataDay && cachedDataWeek && (now - cachedDataDay.timestamp < cacheDuration)
            && (now - cachedDataWeek.timestamp < cacheDuration)) {
            displayData(cachedDataDay.data, cachedDataWeek.data); // Affichez les données des deux jours et de la semaine
        } else {
            try {
                document.getElementById("loading-message").style.display = "block";

                // Récupération des données en parallèle
                const [responseDay, responseWeek] = await Promise.all([
                    fetch(proxyUrlDay),
                    fetch(proxyUrlWeek)
                ]);

                // Vérifiez si les réponses sont valides
                if (!responseDay.ok) throw new Error(`HTTP Error Day: ${responseDay.status}`);
                if (!responseWeek.ok) throw new Error(`HTTP Error Week: ${responseWeek.status}`);

                const dataDay = await responseDay.json();
                const dataWeek = await responseWeek.json();

                // Stockez les données dans le cache
                localStorage.setItem(cacheKeyDay, JSON.stringify({ data: dataDay, timestamp: now }));
                localStorage.setItem(cacheKeyWeek, JSON.stringify({ data: dataWeek, timestamp: now }));

                displayData(dataDay, dataWeek); // Affichez les données des deux
            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
                document.getElementById("loading-message").textContent = "Une erreur est survenue.";
            } finally {
                document.getElementById("loading-message").style.display = "none"; // Masquez le message de chargement
            }
        }
    }

    function displayData(dataDay, dataWeek) {
        document.getElementById("loading-message").style.display = "none";
        document.getElementById("day-container").style.display = "block";
        document.getElementById("week-container").style.display = "block";
        fillTableDay(dataDay);
        fillTableWeek(dataWeek);

        // Générer chaque graphique avec les données pertinentes
        createChart('temperature-chart', 'de la température', "Température (°C)", dataDay.data[0].coordinates[0], 'line', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
        createChart('precipitation-chart', 'des précipitations', "Pluie (mm)", dataDay.data[1].coordinates[0], 'bar', 'rgba(0, 0, 139, 1)', 'rgba(0, 0, 139, 0.2)');
        createChart('wind-chart', 'du vent', "Vent (km/h)", dataDay.data[2].coordinates[0], 'line', 'rgba(204, 153, 0, 1)', 'rgba(204, 153, 0, 0.2)', dataDay.data[3].coordinates[0]);
        createChart('pressure-chart', 'de la pression', "Pression (hPa)", dataDay.data[5].coordinates[0], 'line', 'rgba(0, 100, 0, 1)', 'rgba(0, 100, 0, 0.2)');
    }

    function createChart(elementId, label, y, data, type, borderColor, backgroundColor, secondaryData = null) {
        const ctx = document.getElementById(elementId).getContext('2d');
        const labels = data.dates.map(date => new Date(date.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        const values = data.dates.map(date => date.value * (label.includes('Vent') ? 3.6 : 1)); // Convertir en km/h si nécessaire

        const datasets = [
            {
                label,
                data: values,
                borderColor,
                backgroundColor,
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.5,
                cubicInterpolationMode: 'monotone',
                fill: secondaryData ? true : 'start'
            }
        ];

        if (secondaryData) {
            const secondaryValues = secondaryData.dates.map(date => date.value * 3.6);
            datasets.push({
                label: 'Rafales (km/h)',
                pointRadius: 0,
                data: secondaryValues,
                borderColor: 'rgba(255, 165, 0, 1)',
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                fill: '-1'
            });
        }

        new Chart(ctx, {
            type,
            data: {
                labels,
                datasets
            },
            options: {
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Évolution ${label} dans les prochaines 24h`,
                        font: { size: 20 }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Heure' },
                        ticks: { maxRotation: 30, minRotation: 30 }
                    },
                    y: {
                        title: { display: true, text: y },
                        ticks: { callback: value => value.toFixed(0) }
                    }
                }
            }
        });
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

        data.data[0].coordinates[0].dates.forEach((dateData, index) => {
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

        fillWeatherRow(data.data[0], 0, 1, null, temperatureRow, getTemperatureColor);
        fillWeatherRow(data.data[1], 1, 1, null, rainRow, getPrecipitationColor);
        fillWeatherRow(data.data[2], 0, 3.6, 5, windRow, getWindColor);
        fillWeatherRow(data.data[3], 0, 3.6, 5, windGustRow, getWindColor);
        fillWindDirectionRow(data.data[4], windDirectionRow);
        fillWeatherRow(data.data[5], 0, 1, null, pressureRow, () => ({ color: 'white', textColor: 'black' }));
        fillSymbolRow(data.data[6], weatherRow);
        fillWeatherRow(data.data[7], 0, 1, null, uvRow, getUVColor);
    }

    function fillWeatherRow(data, round, multiple, floor, rowElement, colorFunc) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            let value = dateData.value * multiple;
            if (floor != null) value = Math.floor(value / floor) * floor;
            value = value.toFixed(round);
            const { color, textColor } = colorFunc(value);
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
            weatherIcon.style.width = "30px";
            weatherIcon.style.height = "30px";
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
        const sunriseRow = document.getElementById('sunrise-week-row');  
        
        data.data[0].coordinates[0].dates.forEach((dateData) => {
            const date = new Date(dateData.date);
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' }); // Format français
            
            const th = document.createElement('th');
            th.textContent = dayName; // Assignez le nom du jour au texte de l'en-tête
            daysRow.appendChild(th);

            const td = document.createElement('td');
            const sunriseTime = new Date(dateData.value); // Assurez-vous que 'value' est l'heure de lever du soleil
            const sunriseHours = sunriseTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
            td.textContent = sunriseHours;
            sunriseRow.appendChild(td);
        });
    }    

    function getParisTimezoneOffset(date) {
        // Crée une date correspondant au dernier jour de janvier et juillet pour vérifier l'heure standard et l'heure d'été
        const january = new Date(date.getFullYear(), 0, 1); // Janvier
        const july = new Date(date.getFullYear(), 6, 1);    // Juillet

        // Compare les décalages horaires entre la date donnée et janvier/juillet
        const isDST = date.getTimezoneOffset() < Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());

        return isDST ? 2 : 1; // 2 = Heure d'été, 1 = Heure d'hiver
    }

    function getTemperatureColor(value) {
        let color;
        if (value < -10) {
            color = 'purple';
        } else if (value < -5) {
            color = 'darkblue';
        } else if (value < 1) {
            const ratio = (value + 5) / 6;
            color = `rgb(0, 0, ${Math.round(139 + (116 * ratio))})`;
        } else if (value < 15) {
            const ratio = (value - 1) / 14;
            color = `rgb(${Math.round(173 + (82 * ratio))}, 255, 0)`;
        } else if (value < 25) {
            const ratio = (value - 15) / 10;
            color = `rgb(255, ${Math.round(255 - (127 * ratio))}, 0)`;
        } else if (value < 40) {
            const ratio = (value - 25) / 15;
            color = `rgb(255, ${Math.round(102 - (102 * ratio))}, ${Math.round(102 - (102 * ratio))})`;
        } else {
            color = 'purple';
        }
        const textColor = getTextColor(color);
        return { color, textColor };
    }

    function getPrecipitationColor(value) {
        if (value < 0.1) return { color: 'rgb(255, 255, 255)', textColor: 'black' };
        if (value < 1) return { color: 'rgb(173, 216, 230)', textColor: 'black' };
        if (value <= 2) return { color: 'rgb(0, 191, 255)', textColor: 'black' };
        return { color: 'rgb(0, 0, 139)', textColor: 'white' };
    }

    function getWindColor(value) {
        let color;
        if (value < 20) {
            // Couleur dégradée de bleu clair à bleu foncé pour les valeurs < 20
            color = `rgb(0, ${Math.round(255 * (value / 20))}, 255)`;
        } else if (value <= 40) {
            // Couleur dégradée de bleu clair à vert pour les valeurs entre 20 et 40
            color = `rgb(0, 255, ${Math.round(255 - ((value - 20) * 255 / 20))})`;
        } else {
            // Couleur dégradée de vert à rouge pour les valeurs > 40
            color = `rgb(${Math.round((value - 40) * 255 / 60)}, ${Math.round(255 - ((value - 40) * 255 / 60))}, 0)`;
        }
        const textColor = getTextColor(color);
        return { color, textColor };
    }

    function getWindDirectionIcon(wind_deg) {
        const directions = [
            { min: 348.75, max: 360, icon: 'icons/wind/n.png' },
            { min: 0, max: 11.25, icon: 'icons/wind/n.png' },
            { min: 11.25, max: 33.75, icon: 'icons/wind/nne.png' },
            { min: 33.75, max: 56.25, icon: 'icons/wind/ne.png' },
            { min: 56.25, max: 78.75, icon: 'icons/wind/ene.png' },
            { min: 78.75, max: 101.25, icon: 'icons/wind/e.png' },
            { min: 101.25, max: 123.75, icon: 'icons/wind/ese.png' },
            { min: 123.75, max: 146.25, icon: 'icons/wind/se.png' },
            { min: 146.25, max: 168.75, icon: 'icons/wind/sse.png' },
            { min: 168.75, max: 191.25, icon: 'icons/wind/s.png' },
            { min: 191.25, max: 213.75, icon: 'icons/wind/sso.png' },
            { min: 213.75, max: 236.25, icon: 'icons/wind/so.png' },
            { min: 236.25, max: 258.75, icon: 'icons/wind/oso.png' },
            { min: 258.75, max: 281.25, icon: 'icons/wind/o.png' },
            { min: 281.25, max: 303.75, icon: 'icons/wind/ono.png' },
            { min: 303.75, max: 326.25, icon: 'icons/wind/no.png' },
            { min: 326.25, max: 348.75, icon: 'icons/wind/nno.png' }
        ];
        return directions.find(d => wind_deg >= d.min && wind_deg <= d.max)?.icon || 'icons/wind/unknown.png';
    }

    function getWeatherIcon(weather) {
        if (weather === 0) return 'icons/weather/wsymbol_0999_unknown.png';
        else if (weather === 1) return 'icons/weather/wsymbol_0001_sunny.png';
        else if (weather === 101) return 'icons/weather/wsymbol_0008_clear_sky_night.png';
        else if (weather === 2) return 'icons/weather/wsymbol_0002_sunny_intervals.png';
        else if (weather === 102) return 'icons/weather/wsymbol_0041_partly_cloudy_night.png';
        else if (weather === 3) return 'icons/weather/wsymbol_0043_mostly_cloudy.png';
        else if (weather === 103) return 'icons/weather/wsymbol_0044_mostly_cloudy_night.png';
        else if (weather === 4) return 'icons/weather/wsymbol_0003_white_cloud.png';
        else if (weather === 104) return 'icons/weather/wsymbol_0042_cloudy_night.png';
        else if (weather === 5) return 'icons/weather/wsymbol_0018_cloudy_with_heavy_rain.png';
        else if (weather === 105) return 'icons/weather/wsymbol_0034_cloudy_with_heavy_rain_night.png';
        else if (weather === 6) return 'icons/weather/wsymbol_0021_cloudy_with_sleet.png';
        else if (weather === 106) return 'icons/weather/wsymbol_0037_cloudy_with_sleet_night.png';
        else if (weather === 7) return 'icons/weather/wsymbol_0020_cloudy_with_heavy_snow.png';
        else if (weather === 107) return 'icons/weather/wsymbol_0036_cloudy_with_heavy_snow_night.png';
        else if (weather === 8) return 'icons/weather/wsymbol_0009_light_rain_showers.png';
        else if (weather === 108) return 'icons/weather/wsymbol_0025_light_rain_showers_night.png';
        else if (weather === 9) return 'icons/weather/wsymbol_0011_light_snow_showers.png';
        else if (weather === 109) return 'icons/weather/wsymbol_0027_light_snow_showers_night.png';
        else if (weather === 10) return 'icons/weather/wsymbol_0013_sleet_showers.png';
        else if (weather === 110) return 'icons/weather/wsymbol_0029_sleet_showers_night.png';
        else if (weather === 11) return 'icons/weather/wsymbol_0006_mist.png';
        else if (weather === 111) return 'icons/weather/wsymbol_0063_mist_night.png';
        else if (weather === 12) return 'icons/weather/wsymbol_0007_fog.png';
        else if (weather === 112) return 'icons/weather/wsymbol_0064_fog_night.png';
        else if (weather === 13) return 'icons/weather/wsymbol_0050_freezing_rain.png';
        else if (weather === 113) return 'icons/weather/wsymbol_0068_freezing_rain_night.png';
        else if (weather === 14) return 'icons/weather/wsymbol_0024_thunderstorms.png';
        else if (weather === 114) return 'icons/weather/wsymbol_0040_thunderstorms_night.png';
        else if (weather === 15) return 'icons/weather/wsymbol_0048_drizzle.png';
        else if (weather === 115) return 'icons/weather/wsymbol_0066_drizzle_night.png';
        else if (weather === 16) return 'icons/weather/wsymbol_0056_dust_sand.png'
        else if (weather === 116) return 'icons/weather/wsymbol_0074_dust_sand_night.png';
        else return 'icons/weather/wsymbol_0999_unknown.png';
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
        // Calcul de la luminosité pour définir la couleur du texte
        const rgb = color.match(/\d+/g).map(Number);
        const luminosity = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        return luminosity < 128 ? 'white' : 'black';
    }

    getApiData();
});