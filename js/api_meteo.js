document.addEventListener('DOMContentLoaded', () => {
    const config = {
        username: 'quentin_dusserre_quentin',
        password: 'nIg974UeEM',
        lat: '47.2917',
        lon: '-2.5201',
        params: 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx',
        proxyUrl: 'https://cors-anywhere.herokuapp.com/',
        apiBaseUrl: 'https://api.meteomatics.com'
    };

    const currentDate = new Date();
    currentDate.setMinutes(0, 0, 0);
    const beginDate = currentDate.toISOString().split('.')[0] + 'Z';
    const endDate = new Date(currentDate.getTime() + 23 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
    const apiUrl = `${config.apiBaseUrl}/${beginDate}--${endDate}:PT1H/${config.params}/${config.lat},${config.lon}/json`;

    async function getApiData() {
        try {
            const response = await fetch(config.proxyUrl + apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            fillTable(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des données :", error);
        }
    }

    function fillTable(data) {
        const tableRows = {
            temperatureRow: document.getElementById('temperature-24h-row'),
            rainRow: document.getElementById('rain-24h-row'),
            windRow: document.getElementById('wind-24h-row'),
            windGustRow: document.getElementById('wind-gust-24h-row'),
            windDirectionRow: document.getElementById('wind-direction-24h-row'),
            pressureRow: document.getElementById('pressure-24h-row'),
            weatherRow: document.getElementById('weather-24h-row'),
            hoursRow: document.getElementById('hours-24h-row'),
            daysRow: document.getElementById('days-24h-row')
        };

        let currentDate = null;
        let dateCell = null;
        let hourCount = 0;

        data.data[0].coordinates[0].dates.forEach((dateData, index) => {
            const newDate = new Date(dateData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

            if (currentDate !== newDate) {
                if (dateCell) dateCell.setAttribute('colspan', hourCount);
                currentDate = newDate;
                dateCell = createTableCell(currentDate, 'th', { rowspan: '1' });
                tableRows.daysRow.appendChild(dateCell);
                hourCount = 1;
            } else {
                hourCount++;
            }

            const th = createTableCell(`${getParisTimezoneOffset(new Date()) + new Date(dateData.date).getUTCHours()}h`, 'th');
            tableRows.hoursRow.appendChild(th);
        });

        if (dateCell) dateCell.setAttribute('colspan', hourCount);

        fillWeatherRow(tableRows.temperatureRow, data.data[0].coordinates[0].dates, getTemperatureColor);
        fillWeatherRow(tableRows.rainRow, data.data[1].coordinates[0].dates, getPrecipitationColor);
        fillWeatherRow(tableRows.windRow, data.data[2].coordinates[0].dates, getWindColor, true);
        fillWeatherRow(tableRows.windGustRow, data.data[3].coordinates[0].dates, getWindColor, true);
        fillWeatherIcons(tableRows.windDirectionRow, data.data[4].coordinates[0].dates, getWindDirectionIcon);
        fillWeatherData(data, tableRows.pressureRow, 5, 1, 0); // Pressure
        fillWeatherData(data, tableRows.weatherRow, 6, 1, 0); // Weather symbol
    }

    function createTableCell(content, tag = 'td', attributes = {}) {
        const cell = document.createElement(tag);
        cell.textContent = content;
        Object.keys(attributes).forEach(attr => cell.setAttribute(attr, attributes[attr]));
        return cell;
    }

    function fillWeatherRow(row, data, getColorFunc, isRounded = false) {
        data.forEach(dateData => {
            const td = createTableCell(isRounded ? Math.floor(dateData.value * 3.6 / 5) * 5 : dateData.value.toFixed(0));
            const { color, textColor } = getColorFunc(td.textContent);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            row.appendChild(td);
        });
    }

    function fillWeatherIcons(row, data, getIconFunc) {
        data.forEach(dateData => {
            const td = createTableCell('', 'td', { style: 'background-color:#ADD8E6' });
            const icon = document.createElement('img');
            icon.src = getIconFunc(dateData.value.toFixed(0));
            icon.style.width = '30px';
            icon.style.height = '30px';
            td.appendChild(icon);
            row.appendChild(td);
        });
    }

    getApiData();
});