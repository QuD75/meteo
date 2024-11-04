// Fonction pour charger le header avec sessionStorage
function loadHeader() {
    // Vérifier si le header est déjà dans le stockage de session
    const storedHeader = sessionStorage.getItem('headerContent');

    if (storedHeader) {
        // Si le header est trouvé dans le stockage de session, l'afficher
        document.getElementById('header-container').innerHTML = storedHeader;
    } else {
        // Si le header n'est pas trouvé, le charger depuis le fichier
        fetch('/pages/header.html')
            .then(response => response.text())
            .then(data => {
                // Stocker le contenu du header dans le stockage de session
                sessionStorage.setItem('headerContent', data);
                // Afficher le header
                document.getElementById('header-container').innerHTML = data;
            })
            .catch(error => console.error('Erreur lors du chargement du header:', error));
    }
}

// Appeler la fonction pour charger le header
loadHeader();
