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

## Remote pricing catalog

`https://tokage.app/pricing/v1.json` is a public, versioned JSON contract for API
cost estimates. It is a static asset from `public/pricing/v1.json`; the existing
Cloudflare Pages build deploys it with the site. No session data is uploaded.
Responses are JSON, cacheable for five minutes, and available cross-origin.
Cloudflare Pages supplies ETags for conditional refreshes.

### Version 1 contract

- `schema_version` describes the contract; `revision` identifies the data release.
  Additive models/rates do not require a schema or app update. Breaking changes
  require a new URL and schema version; keep v1 available for existing clients.
- `published_at` and `verified_at` are UTC timestamps, **not** the provider's price
  effective dates. This initial snapshot is current API list pricing only.
- `currency` is USD and `unit_tokens` is 1,000,000. Use decimal arithmetic for money.
- `models` is keyed by exact model ID. No prefix matching or guessed aliases.
- `service_tier_aliases` maps `default` to `standard` and `priority` to `fast`.
  Missing/`auto` tier needs an explicit assumption labelled as an estimate. It
  must never silently become Standard. Unsupported model/tier is unavailable.
- Each model has `service_tiers`, with `short_context` and `long_context` rates.
  Select long context when **per-request total input**, including cache, exceeds
  `long_context_above_input_tokens` (272,000). Apply that bracket to the entire
  request; never select it using a session/day's accumulated input.
- Each rate object contains USD per million `input`, `cached_input`, `output`,
  `cache_write_30m`, and `cache_write_12h`. Input is uncached/non-write input;
  output already includes reasoning. Do not charge any token category twice.
  Cache-write duration must be known to use a write rate; otherwise mark the
  estimate incomplete. Unsupported tool charges, regional/FedRAMP uplifts and
  taxes are excluded. This is not subscription billing.
- Clients must validate before replacing their last valid cached catalog. On
  network/HTML/schema errors keep the previous catalog or a bundled fallback,
  clearly showing its age. Do not turn unknown prices into zero costs.

### Update and release

1. Verify rates against the `sources` and model documentation. The initial five
   GPT-6 model entries were transcribed from the official pricing table, including
   its context brackets and available service tiers.
2. Archive the previous JSON under `public/pricing/history/<revision>.json` before
   modifying it; never overwrite archived snapshots. Increment `revision` and
   update the timestamps. Archived verification dates do not establish historical
   provider effective dates; clients must not silently reprice past saved results.
3. Run `bun test` and `bun run build` (serially). The build rejects invalid rates.
4. Commit and push to `main`. Wait for the existing `tokageapp` Cloudflare Pages
   check for that exact commit to succeed.
5. Fetch the live JSON and check content type, revision, rates and body hash against
   `public/pricing/v1.json`. Confirm the homepage and appcast remain available.

The macOS app requires a separate update to read this catalog and retain per-event
model/tier/context information. Publishing the catalog does not update old apps.
