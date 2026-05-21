# MNG Summit Website

Static HTML/CSS/JS site for mngsummit.org. No build step. All assets are local.

## Run locally

From this folder:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in a browser.

## Deploy

Drop this entire folder onto any static host. No backend needed. Tested targets:

- Netlify · drag-and-drop the folder onto app.netlify.com
- Vercel · `vercel --prod` from this folder
- GitHub Pages · push this folder as the root of a `gh-pages` branch
- Squarespace / Wix · doesn't apply, this is a clean static site you'd self-host

## File map

| Path | What it is |
| --- | --- |
| `index.html` | Homepage |
| `summit-2026.html` | Upcoming flagship (NYC, Oct 9–11, 2026) |
| `summit-2014.html` … `summit-2024.html` | Past summit pages, one per year |
| `archive.html` | Past Summits index |
| `programs.html` | Programs (NHUB, Mongolians Are…, etc.) |
| `mongolians-are.html` | Mongolians Are… webinar archive |
| `about.html` | About the org, team, advisory, past boards |
| `sponsor.html` | Sponsorship tiers and partner pitch |
| `get-involved.html` | Speaker / volunteer / attendee paths |
| `css/site.css` | All site styles |
| `js/site.js` | Header scroll, fade-in observer, countdown timer |
| `assets/` | Logos, favicons, OG image, real summit photos |
| `sitemap.xml`, `robots.txt` | SEO |

## Edit copy

Every page is a single HTML file. Open in any editor, change copy, save, refresh.

The site is built with vanilla HTML + a single CSS file. There are no React, build tools, npm dependencies, or CMS. To swap a photo, drop a new file into `assets/photos/` and update the `background-image: url(...)` reference on the relevant page.

## Update the team

Edit `about.html` for the main team grid (President, Board, Advisory, Past Boards). Speaker grids on each year page live inline in that year's HTML.

## Domain

The current production domain is mngsummit.org. To point a new host at this folder, update DNS records to point at whichever static host you deploy to.

## Last build

2026-05-11. Reach out at contact@mngsummit.org for questions.
