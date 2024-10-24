document.addEventListener('DOMContentLoaded', () => {
    const username = 'quentin_dusserre_quentin';
    const password = 'nIg974UeEM';
    const lat = '47.2917';
    const lon = '-2.5201';
    const params = 't_2m:C,precip_1h:mm,wind_speed_10m:ms,wind_gusts_10m_1h:ms,wind_dir_10m:d,msl_pressure:hPa,weather_symbol_1h:idx';

    const currentDate = new Date();
    currentDate.setMinutes(0, 0, 0);
    const beginDate = currentDate.toISOString().split('.')[0] + 'Z';

    const futureDate = new Date(currentDate.getTime() + 23 * 60 * 60 * 1000);
    const endDate = futureDate.toISOString().split('.')[0] + 'Z';

    const apiUrl = `https://api.meteomatics.com/${beginDate}--${endDate}:PT1H/${params}/${lat},${lon}/json`;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    async function getApiData() {
        const encodedCredentials = btoa(`${username}:${password}`);
        fetch(proxyUrl + apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + encodedCredentials,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
            })
            .then(response => {
                if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => {
                fillTable(data);
            })
            .catch(error => console.error("Erreur lors de la récupération des données :", error));
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

        let currentDate = null; // Pour suivre la date actuelle
        let dateCell; // Pour stocker la cellule de date fusionnée
        let hourCount = 0; // Compte le nombre d'heures

        data.data[0].coordinates[0].dates.forEach((dateData, index) => {
            const hour = new Date(dateData.date).getUTCHours();

            // Vérifier si nous avons changé de date
            const newDate = new Date(dateData.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
            });

            if (currentDate !== newDate) {
                // Si c'est une nouvelle date, créer une nouvelle cellule
                if (dateCell) {
                    // Fusionner les cellules de la date pour les heures précédentes
                    dateCell.setAttribute('colspan', hourCount);
                }
                currentDate = newDate; // Mettre à jour la date actuelle
                dateCell = document.createElement('th'); // Créer une nouvelle cellule de date
                dateCell.textContent = currentDate; // Définir le texte de la cellule
                dateCell.setAttribute('rowspan', '1'); // Initialiser rowspan
                daysRow.appendChild(dateCell); // Ajouter la cellule de date à la ligne de dates
                hourCount = 1; // Réinitialiser le compteur d'heures
            } else {
                hourCount++; // Incrémenter le compteur d'heures
            }

            // Créer une cellule d'heure
            const timeParis = getParisTimezoneOffset(new Date());
            var targetHour = hour + timeParis;
            if (targetHour === 24) targetHour = 0;
            if (targetHour === 25) targetHour = 1;
            const th = document.createElement('th');
            th.textContent = `${targetHour}h`; // Afficher l'heure au format XXh
            hoursRow.appendChild(th); // Ajouter la cellule d'heure à la ligne d'en-tête des heures
        });

        // Fusionner la dernière cellule de date
        if (dateCell) {
            //dateCell.setAttribute('colspan', hourCount);
        }

        // Remplir les données de température
        data.data[0].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const temperatureValue = dateData.value.toFixed(0);
            td.textContent = temperatureValue;
            const {
                color,
                textColor
            } = getTemperatureColor(temperatureValue);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            temperatureRow.appendChild(td);
        });

        // Remplir les données de pluie
        data.data[1].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const rainValue = dateData.value.toFixed(1);
            td.textContent = rainValue;
            const {
                color,
                textColor
            } = getPrecipitationColor(rainValue);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            rainRow.appendChild(td);
        });

        // Remplir les données de vent
        data.data[2].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const windValue = (Math.floor(dateData.value * 3.6 / 5) * 5).toFixed(0);
            td.textContent = windValue
            const {
                color,
                textColor
            } = getWindColor(windValue);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            windRow.appendChild(td);
        });
        data.data[3].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            const windValue = (Math.floor(dateData.value * 3.6 / 5) * 5).toFixed(0);
            td.textContent = windValue
            const {
                color,
                textColor
            } = getWindColor(windValue);
            td.style.backgroundColor = color;
            td.style.color = textColor;
            windGustRow.appendChild(td);
        });
        data.data[4].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            td.style.backgroundColor = '#ADD8E6'; // Bleu clair
            const windDirection = dateData.value.toFixed(0);
            const windDirectionIcon = document.createElement('img');
            windDirectionIcon.style.width = "30px";
            windDirectionIcon.style.height = "30px";
            windDirectionIcon.src = getWindDirectionIcon(windDirection);
            td.appendChild(windDirectionIcon);
            windDirectionRow.appendChild(td);
        });

        // Remplir les autres lignes avec les bonnes données
        fillWeatherData(data, pressureRow, 5, 1, 0); // Pression atmosphérique
        fillWeatherData(data, weatherRow, 6, 1, 0); // Ciel (symboles météo)
    }

    function fillWeatherData(data, rowElement, paramIndex, conversionFactor = 1, round) {
        // Remplir les lignes pour d'autres paramètres
        data.data[paramIndex].coordinates[0].dates.forEach(dateData => {
            const td = document.createElement('td');
            td.textContent = (dateData.value * conversionFactor).toFixed(round); // Appliquer la conversion si nécessaire
            rowElement.appendChild(td);
        });
    }

    function getTemperatureColor(value) {
        let color;
        let textColor = 'black'; // Couleur du texte par défaut

        if (value < -10) {
            color = 'rgb(0, 0, 139)'; // Bleu foncé
            textColor = 'white'; // Texte en blanc
        } else if (value >= -10 && value < 2) {
            color = 'rgb(173, 216, 230)'; // Bleu clair
        } else if (value >= 2 && value < 5) {
            color = 'rgb(144, 238, 144)'; // Vert clair
            textColor = 'black'; // Texte en noir
        } else if (value >= 5 && value < 10) {
            color = 'rgb(0, 128, 0)'; // Vert normal
            textColor = 'black'; // Texte en noir
        } else if (value >= 10 && value < 15) {
            color = 'rgb(255, 255, 224)'; // Jaune clair
            textColor = 'black'; // Texte en noir
        } else if (value >= 15 && value < 20) {
            color = 'rgb(255, 255, 0)'; // Jaune normal
            textColor = 'black'; // Texte en noir
        } else if (value >= 20 && value < 25) {
            color = 'rgb(255, 165, 0)'; // Orange
            textColor = 'black'; // Texte en noir
        } else if (value >= 25 && value < 30) {
            color = 'rgb(255, 99, 71)'; // Rouge clair
            textColor = 'black'; // Texte en noir
        } else if (value >= 30 && value < 35) {
            color = 'rgb(255, 0, 0)'; // Rouge foncé
            textColor = 'black'; // Texte en noir
        } else {
            color = 'rgb(128, 0, 128)'; // Violet
            textColor = 'black'; // Texte en noir
        }
        return {
            color,
            textColor
        };
    }

    function getPrecipitationColor(value) {
        let color = 'white';
        let textColor = 'black'; // Couleur du texte par défaut
        if (value < 0.1) {
            // Couleur blanche pour une précipitation de 0
            color = `rgb(255, 255, 255)`; // Blanc
        } else if (value < 1) {
            // Bleu clair
            color = `rgb(173, 216, 230)`; // LightSkyBlue
        } else if (value >= 1 && value <= 2) {
            // Bleu normal
            color = `rgb(0, 191, 255)`; // DeepSkyBlue
        } else {
            // Bleu foncé
            color = `rgb(0, 0, 139)`; // DarkBlue
            textColor = 'white';
        }
        return {
            color,
            textColor
        };
    }

    function getWindColor(value) {
        let color;
        let textColor = 'black'; // Couleur du texte par défaut
        if (value <= 20) {
            // Bleu pour le vent faible
            color = `rgb(0, ${Math.round(255 * (value / 20))}, 255)`;
        } else if (value > 20 && value <= 50) {
            // Vert pour le vent moyen
            color = `rgb(0, 255, ${Math.round(255 - ((value - 20) * 255 / 30))})`;
        } else {
            // Rouge pour le vent fort
            color = `rgb(255, ${Math.round(255 - ((value - 50) * 255 / 50))}, 0)`;
        }
        return {
            color,
            textColor
        };
    }

    function getParisTimezoneOffset(date) {
        // Date de début de l'heure d'été : dernier dimanche de mars
        const startDST = new Date(date.getFullYear(), 2, 31); // Mars a l'index 2
        startDST.setDate(31 - (startDST.getDay() + 1) % 7); // Dernier dimanche de mars

        // Date de fin de l'heure d'été : dernier dimanche d'octobre
        const endDST = new Date(date.getFullYear(), 9, 31); // Octobre a l'index 9
        endDST.setDate(31 - (endDST.getDay() + 1) % 7); // Dernier dimanche d'octobre

        // Vérifier si la date donnée est dans l'heure d'été
        if (date >= startDST && date < endDST) {
            return 2; // Heure d'été (UTC+2)
        } else {
            return 1; // Heure d'hiver (UTC+1)
        }
    }

    function getWindDirectionIcon(wind_deg) {
        console.log("Direction vent : " + wind_deg);
        const directions = [{
                min: 348.75,
                max: 360,
                icon: 'icons/wind/n.png'
            },
            {
                min: 0,
                max: 11.25,
                icon: 'icons/wind/n'
            },
            {
                min: 11.25,
                max: 33.75,
                icon: 'icons/wind/nne.png'
            },
            {
                min: 33.75,
                max: 56.25,
                icon: 'icons/wind/ne.png'
            },
            {
                min: 56.25,
                max: 78.75,
                icon: 'icons/wind/ene.png'
            },
            {
                min: 78.75,
                max: 101.25,
                icon: 'icons/wind/e.png'
            },
            {
                min: 101.25,
                max: 123.75,
                icon: 'icons/wind/ese.png'
            },
            {
                min: 123.75,
                max: 146.25,
                icon: 'icons/wind/se.png'
            },
            {
                min: 146.25,
                max: 168.75,
                icon: 'icons/wind/sse.png'
            },
            {
                min: 168.75,
                max: 191.25,
                icon: 'icons/wind/s.png'
            },
            {
                min: 191.25,
                max: 213.75,
                icon: 'icons/wind/sso.png'
            },
            {
                min: 213.75,
                max: 236.25,
                icon: 'icons/wind/so.png'
            },
            {
                min: 236.25,
                max: 258.75,
                icon: 'icons/wind/oso.png'
            },
            {
                min: 258.75,
                max: 281.25,
                icon: 'icons/wind/o.png'
            },
            {
                min: 281.25,
                max: 303.75,
                icon: 'icons/wind/ono.png'
            },
            {
                min: 303.75,
                max: 326.25,
                icon: 'icons/wind/no.png'
            },
            {
                min: 326.25,
                max: 348.75,
                icon: 'icons/wind/nno.png'
            }
        ];

        for (const direction of directions) {
            if (wind_deg >= direction.min && wind_deg < direction.max) {
                return direction.icon;
            }
        }

        return 'icons/question-mark.png';
    }

    // Appel de la fonction
    getApiData();

});