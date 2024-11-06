//Fonctions d'icones
function putIconStyle(weatherIcon, width, height, objectFit) {
    weatherIcon.style.width = width;
    weatherIcon.style.height = height;
    weatherIcon.style.objectFit = objectFit;
}
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
async function getWeatherIcon(code, dayOrNight) {
    const response = await fetch(`/icons/weather/weatherIcons.json`);
    const weatherData = await response.json();
    return weatherData[code]
        ? (dayOrNight === 1 ? weatherData[code].day.image : weatherData[code].night?.image || weatherData[code].day.image)
        : '/icons/weather/wsymbol_0999_unknown.png';
}
async function fillWeatherSymbol(rowId, weathers, height, isDayToDisplay) {
    const row = document.getElementById(rowId);
    for (const [index, value] of weathers.entries()) {
        const cell = document.createElement('td');
        const icon = document.createElement('img');

        // Configure le style de l'icône
        putIconStyle(icon, 'auto', height, 'contain');

        // Attend l'URL de l'icône avant de l'assigner
        icon.src = await getWeatherIcon(value, isDayToDisplay?.[index]);

        // Ajoute l'icône dans la cellule et la cellule dans la ligne
        cell.style.backgroundColor = 'white';
        cell.appendChild(icon);
        row.appendChild(cell);
    }
}