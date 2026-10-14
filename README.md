# sidj.work

Portfolio of Sid Jameson, AI design engineer. Live at **https://sidj.work** (GitHub Pages, custom domain).

## What's here

| Path | What it is |
|---|---|
| `index.html` | Home page, with the four case studies and the résumé viewer in the same document. **Built** from `src/`, don't edit by hand. |
| `promotion-center/`, `balad-maps/`, `graph-vault/`, `job-search/` | One built page per case study: the same document with that case open, plus its own title, description and share image. |
| `assets/` | Images (`img/`), company logos (`logo/`), recommender photos (`people/`), videos (`vid/`), the self-hosted Archivo font (`fonts/`, SIL OFL). |
| `Sid_Jameson_Resume.pdf` | The résumé, built from `src/resume/`. |
| `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.ico`, `apple-touch-icon.png` | Production extras (`sitemap.xml` is written by the build). |
| `CNAME`, `.nojekyll` | GitHub Pages settings for the `sidj.work` domain. |

## Editing the site

```bash
cd src
python3 build.py          # writes ../index.html, ../<case>/index.html and ../sitemap.xml (needs Pillow)
```

| File | Holds |
|---|---|
| `head.html` | `<head>` template: title, description, share card, icons, structured data |
| `base.css` | Fonts, design tokens (light + dark), globals, shared bits |
| `home.css` / `home.html` / `home.js` | Home page: hero, work, workflow diagram, experience timeline, articles, recommendations, contact |
| `case.css` / `cases.html` / `cases.js` | Case studies and their widgets (tabs, sliders, carousels), plus the overlays' behaviour. Each case `<article>` carries its page title (`data-page-title`) and description (`data-desc`). |
| `overlays.html` | Résumé viewer, video and image lightboxes |

The build also adds width/height to every local image, makes local paths root-relative, and fails on a duplicated id or on a script that looks up an id that doesn't exist.

## Résumé, share images and videos

```bash
pip3 install pymupdf pillow fonttools
cd src/resume && python3 make_resume.py   # Sid_Jameson_Resume.pdf + assets/img/resume.webp (+ hotspot positions)
cd src/tools && python3 make_covers.py    # project covers (cover-*.webp), built from real product screens
cd src/tools && python3 make_social.py    # og-image.png, og-<case>.png, favicons, apple-touch-icon
```

The résumé and share-image scripts download their fonts (Carlito, Archivo; SIL OFL) into gitignored local folders on first run.
If the résumé's header line moves, copy the printed hotspot positions into `src/overlays.html`.

Looping videos on the page are small copies (`*-sm.mp4`); the lightbox plays the full file (`data-full`).
`src/tools/transcode.swift` makes those copies on a Mac (usage at the top of the file).

Push to `main` and GitHub Pages redeploys in a minute or two.
