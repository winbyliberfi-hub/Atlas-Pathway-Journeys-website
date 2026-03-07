ATLAS PATHWAY JOURNEYS — ONE-PAGE WEBSITE

Folder structure
/atlas-pathway-website
  index.html
  styles.css
  script.js
  robots.txt
  sitemap.xml
  site.webmanifest
  /assets
    gallery.json
  /images
    /hero
    /gallery
    /thumbs
    logo.png
    favicon.ico
    apple-touch-icon.png
    icon-192.png
    icon-512.png
    guide.webp

How to publish (static hosting)
1) Buy a domain (optional) and choose hosting (any of these work):
   - Netlify
   - Cloudflare Pages
   - GitHub Pages
   - Traditional cPanel hosting

2) Upload EVERYTHING inside /atlas-pathway-website to your hosting root folder:
   - On cPanel: public_html/
   - On Netlify/Cloudflare: drag & drop the folder contents or connect a Git repo

3) Verify paths:
   - Open your website URL and check the Gallery loads.
   - Confirm the WhatsApp/Phone/Email buttons work.

How the contact form works
- This is a static website (no server). The form opens the visitor’s email app with the message pre-filled.
- If you want a server-side form later, you can connect a form service (Netlify Forms, Formspree, etc.).

Edit content
- Text content lives in index.html
- Styles live in styles.css
- Gallery images are listed in assets/gallery.json

SEO notes
- Update the domain in index.html (canonical + OpenGraph URL) and sitemap.xml to match your real domain.

Support
- Contact: contact@atlaspathwayjourneys.com
