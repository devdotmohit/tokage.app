# tokage.app

Tokage marketing site and appcast feed built with Astro.

## Key URLs

- Site: https://tokage.app
- Appcast: `/appcast.xml`
- Release notes: `/release-notes/{version}`

## Content-driven appcast

The RSS appcast is assembled from Astro content collections:

- `appcastChannel` in `src/content/appcastChannel/channel.mdx`
- `appcast` items in `src/content/appcast/*.mdx`
- `release-notes` entries in `src/content/release-notes/*.mdx`

The appcast endpoint reads these collections in
`src/pages/appcast.xml.ts`.

### Add a new release

1) Create a new appcast item in `src/content/appcast/`:

```mdx
---
title: Tokage 1.1
version: 2
shortVersionString: "1.1"
pubDate: "Mon, 01 Feb 2025 12:00:00 +0000"
enclosure:
  url: https://tokage.app/downloads/Tokage-1.1.zip
  length: 23456789
  type: application/octet-stream
  edSignature: BASE64_SIGNATURE_HERE
releaseNotesLink: https://tokage.app/release-notes/1.1
---
```

2) Create matching release notes in `src/content/release-notes/1.1.mdx`:

```mdx
---
title: Tokage 1.1
slug: "1.1"
---

Release notes here.
```

Note: if the version includes dots, set `slug` explicitly to keep the
exact URL (otherwise Astro will slugify `1.1` to `1-1`).

## Commands

| Command        | Action                                      |
| :------------- | :------------------------------------------ |
| `bun install`  | Install dependencies                         |
| `bun dev`      | Start local dev server at `localhost:4321`   |
| `bun build`    | Build the production site to `./dist/`       |
| `bun preview`  | Preview the build locally                    |
| `bun astro ...`| Run Astro CLI commands                       |
