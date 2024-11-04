// Fonction pour charger le menu avec sessionStorage
function loadMenu() {
    // Vérifier si le menu est déjà dans le stockage de session
    const storedMenu = sessionStorage.getItem('menuContent');

    if (storedMenu) {
        // Si le menu est trouvé dans le stockage de session, l'afficher
        document.getElementById('menu-container').innerHTML = storedMenu;
    } else {
        // Si le menu n'est pas trouvé, le charger depuis le fichier
        fetch('/pages/menu.html')
            .then(response => response.text())
            .then(data => {
                // Stocker le contenu du menu dans le stockage de session
                sessionStorage.setItem('menuContent', data);
                // Afficher le menu
                document.getElementById('menu-container').innerHTML = data;
            })
            .catch(error => console.error('Erreur lors du chargement du menu:', error));
    }
}

// Appeler la fonction pour charger le menu
loadMenu();
