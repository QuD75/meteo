document.addEventListener('DOMContentLoaded', () => {

const username = 'quentin_dusserre_quentin'; // Remplace par ton nom d'utilisateur
const password = 'nIg974UeEM'; // Remplace par ton mot de passe
const lat = '47.2917';
const lon = '-2.5201';
const params = 't_2m:C,msl_pressure:hPa,precip_1h:mm,wind_speed_10m:ms,wind_dir_10m:d,weather_symbol_1h:idx';

// Récupérer la date actuelle et la formater en ISO
const currentDate = new Date();
currentDate.setMinutes(0, 0, 0);
const beginDate = currentDate.toISOString().split('.')[0] + 'Z';
// Calculer la date du lendemain
const futureDate = new Date(currentDate);
futureDate.setDate(currentDate.getDate() + 1);
const endDate = futureDate.toISOString().split('.')[0] + 'Z'; //

const apiUrl = `https://api.meteomatics.com/${beginDate}--${endDate}:PT1H/${params}/${lat},${lon}/json`;
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

async function getApiData() {
    const encodedCredentials = btoa(`${username}:${password}`);
    fetch(proxyUrl + apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic '+encodedCredentials,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
    })
    .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log(data);
        // Traite tes données ici
    })
    .catch(error => console.error("Erreur lors de la récupération des données :", error));
}


// Appel de la fonction
getApiData();

});