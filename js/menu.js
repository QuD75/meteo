document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/menu.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
        })
        .catch(error => console.error('Erreur lors du chargement du menu:', error));
});