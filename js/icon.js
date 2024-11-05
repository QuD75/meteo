//Fonctions d'icones
function putIconStyle(weatherIcon, width, height, objectFit, marginLeft) {
    weatherIcon.style.width = width;
    weatherIcon.style.height = height;
    weatherIcon.style.objectFit = objectFit;
    //weatherIcon.style.display = "block";
    weatherIcon.style.marginLeft = marginLeft;
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
async function getWeatherIcon(code, day) {
    console.log("Code : " + code);
    console.log("Day : " + day);
    console.log("-------------------");
    const response = await fetch(`/icons/weather/weatherIcons.json`);
    const weatherData = await response.json();

    if (weatherData[code]) {
        return day ? weatherData[code].day.image : weatherData[code].night.image;
    } else {
        return '/icons/weather/wsymbol_0999_unknown.png';
    }
}