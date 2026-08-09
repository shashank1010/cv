# Shashank Agarwal — CV

Multi-language CV built with **Astro** + **Puppeteer**.  
Static site with built-in PDF export (all languages).

## Features

- **Responsive design** — screen & print optimized
- **Multi-language** — English, Deutsch, Русский
- **PDF download** — header button exports as PDF (built at build time)
- **Sticky navigation** — smooth scrolling to sections
- **CSS Grid layouts** — fully rendered in PDF
- **Local fonts** — no external CDN dependencies

## Setup

```bash
bun install
```

## Development

```bash
bun run dev
```

Opens at `http://localhost:4321` (Astro default port).

Navigate between languages using the language switcher in the header, or via query params:

| URL | Language |
|-----|----------|
| `http://localhost:4321/` | English |
| `http://localhost:4321/de/` | Deutsch |
| `http://localhost:4321/ru/` | Русский |

## Build

```bash
bun run build
```

Generates:
- Static site in `dist/`
- PDF files in `public/` and `dist/`:
  - `/CV.pdf` (English)
  - `/CV-de.pdf` (Deutsch)
  - `/CV-ru.pdf` (Русский)

The build process:
1. Runs Astro build → `dist/`
2. Starts preview server
3. Puppeteer renders each language as PDF with print styles
4. Hides navigation elements in PDF output
5. Copies PDFs to both `public/` and `dist/`

## Download PDF

Click the **Download** button in the header navigation. Files are pre-generated at build time.

## Translations

All UI copy lives in:

- `src/i18n/en.json`
- `src/i18n/de.json`
- `src/i18n/ru.json`

Translations are accessed via the `t` object in components (e.g., `t.nav.download`).

## Fonts

All fonts are local (committed to `public/fonts/`):
- IBM Plex Sans (400, 500, 600, 700, 400i)
- IBM Plex Mono (400, 500)

No external CDN requests needed.

## Styling

All CSS in `src/styles/cv.css`. Uses:
- CSS Grid for layout
- CSS custom properties for theming
- `@media print` rules for PDF output
- No external frameworks

Print media (`@media print`) handles:
- Hiding interactive elements (nav, CTA, footer)
- Solid background colors for proper PDF contrast
- Page breaks and avoid rules for clean output

## Structure

```
src/
  i18n/           # per-locale messages + types
  components/     # CvPage, LanguageSwitcher
  layouts/        # CvLayout
  pages/index.astro
  scripts/        # sticky nav + CTA poke (client)
  styles/cv.css
dist/
  en/             # English static site
  de/             # German static site
  ru/             # Russian static site
```
