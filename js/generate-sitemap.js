const fs = require('fs');

// Obtenir la date actuelle au format YYYY-MM-DD
const getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0]; // format YYYY-MM-DD
};

// Modèle pour le sitemap avec la date générée
const sitemapTemplate = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
      <loc>https://qud75.github.io/index.html</loc>
      <lastmod>${getCurrentDate()}</lastmod>
      <priority>1.0</priority>
   </url>
   <url>
      <loc>https://qud75.github.io/pages/previsions.htmk</loc>
      <lastmod>${getCurrentDate()}</lastmod>
      <priority>1.0</priority>
   </url>
   <!-- Ajoute d'autres URLs ici -->
</urlset>
`;

// Écrire le fichier sitemap.xml
fs.writeFileSync('sitemap.xml', sitemapTemplate.trim(), 'utf8');
