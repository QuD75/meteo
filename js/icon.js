    //Fonctions d'icones
    function putIconStyle(weatherIcon, width, height, objectFit, marginLeft) {
        weatherIcon.style.width = width;
        weatherIcon.style.height = height;
        weatherIcon.style.objectFit = objectFit;
        weatherIcon.style.display = "block";
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