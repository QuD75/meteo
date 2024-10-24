document.addEventListener('DOMContentLoaded', () => {
    const username = 'quentin_dusserre_quentin';
    const password = 'nIg974UeEM';
    const lat = '47.2917';
    const lon = '-2.5201';
    const params = 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx';

    const currentDate = new Date();
    currentDate.setMinutes(0, 0, 0);
    const beginDate = currentDate.toISOString().split('.')[0] + 'Z';
    const endDate = new Date(currentDate.getTime() + 23 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';

    const apiUrl = `https://api.meteomatics.com/${beginDate}--${endDate}:PT1H/${params}/${lat},${lon}/json`;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    async function getApiData() {
        const encodedCredentials = btoa(`${username}:${password}`);
        try {
            const response = await fetch(proxyUrl + apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + encodedCredentials,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
            });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            fillTable(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des données :", error);
        }
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
    }

    function fillWeatherRow(data, round, multiple, floor, rowElement, colorFunc) {
        data.coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            let value = dateData.value*multiple;
            if (floor != null) value = Math.floor(value / floor) * floor;
            value=value.toFixed(round);
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
            if (value === 0) weatherIcon.src
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

    function getParisTimezoneOffset(date) {
        const startDST = new Date(date.getFullYear(), 2, 31);
        startDST.setDate(31 - (startDST.getDay() + 1) % 7);
        const endDST = new Date(date.getFullYear(), 9, 31);
        endDST.setDate(31 - (endDST.getDay() + 1) % 7);

        return date >= startDST && date < endDST ? 2 : 1;
    }

    function getTemperatureColor(value) {
        const colors = [
            { range: [-Infinity, -10], color: 'rgb(0, 0, 139)', textColor: 'white' },
            { range: [-10, 2], color: 'rgb(173, 216, 230)', textColor: 'black' },
            { range: [2, 5], color: 'rgb(144, 238, 144)', textColor: 'black' },
            { range: [5, 10], color: 'rgb(0, 128, 0)', textColor: 'black' },
            { range: [10, 15], color: 'rgb(255, 255, 224)', textColor: 'black' },
            { range: [15, 20], color: 'rgb(255, 255, 0)', textColor: 'black' },
            { range: [20, 25], color: 'rgb(255, 165, 0)', textColor: 'black' },
            { range: [25, 30], color: 'rgb(255, 99, 71)', textColor: 'black' },
            { range: [30, 35], color: 'rgb(255, 0, 0)', textColor: 'black' },
            { range: [35, Infinity], color: 'rgb(128, 0, 128)', textColor: 'black' }
        ];
        return colors.find(c => value >= c.range[0] && value < c.range[1]) || { color: 'white', textColor: 'black' };
    }

    function getPrecipitationColor(value) {
        if (value < 0.1) return { color: 'rgb(255, 255, 255)', textColor: 'black' };
        if (value < 1) return { color: 'rgb(173, 216, 230)', textColor: 'black' };
        if (value <= 2) return { color: 'rgb(0, 191, 255)', textColor: 'black' };
        return { color: 'rgb(0, 0, 139)', textColor: 'white' };
    }

    function getWindColor(value) {
        if (value <= 20) return { color: `rgb(0, ${Math.round(255 * (value / 20))}, 255)`, textColor: 'black' };
        if (value <= 50) return { color: `rgb(0, 255, ${Math.round(255 - ((value - 20) * 255 / 30))})`, textColor: 'black' };
        return { color: `rgb(255, ${Math.round(255 - ((value - 50) * 255 / 50))}, 0)`, textColor: 'black' };
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
        else if (weather === 2) return 'icons/weather/wsymbol_0002_sunny_intervals.pngg';
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
        else if (weather === 115) return 'icons/weather/wsymbol_0066_drizzle_night.pngg';
        else if (weather === 16) return 'icons/weather/wsymbol_0056_dust_sand.png'
        else if (weather === 116) return 'icons/weather/wsymbol_0074_dust_sand_night.png';
        else return 'icons/weather/wsymbol_0999_unknown.png';
    }

    getApiData();
});
