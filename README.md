# sidj.work

Portfolio of Sid Jameson, AI design engineer. Live at **https://sidj.work** (GitHub Pages).

## Layout

- `index.html` — the whole site in one file (home, case studies, résumé viewer). Built from `src/`.
- `assets/` — images, logos, videos and the résumé preview.
- `Sid_Jameson_Resume.pdf` — the résumé, built from `src/resume/`.
- `CNAME` — custom domain for GitHub Pages.

## Editing

The page is assembled from the pieces in `src/`:

```bash
cd src
python3 build.py              # writes ../index.html
```

- `home.html`, `home.css`, `script_home.js` — home page sections
- `sheet2.html`, `case.css`, `script_case.js` — case studies, lightboxes, timeline, résumé viewer
- `gen_sections.py`, `gen_workflow.py` — regenerate the Experience timeline and Workflow diagram inside `home.html`

Résumé:

```bash
cd src/resume
pip3 install pymupdf pillow fonttools
python3 make_resume.py        # writes ../../Sid_Jameson_Resume.pdf and assets/img/resume.webp
```

Push to `main` and GitHub Pages redeploys in a minute or two.
