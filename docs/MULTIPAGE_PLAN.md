> **Council synthesis — architecture plan.** Recommended approach: **incremental-hybrid + a static-multifile page shell** (unanimous, 3/3 judges). Produced by an 11-agent workflow, verified against the live repo. Keeps `index.html` as the single-pager; adds real, shareable detail pages for projects & publications with **zero build step**.
>
> Rendered version (artifact): https://claude.ai/code/artifact/78c2e456-d3bd-45cc-a748-de9c3f1043ac

---

# Multi-Page Projects & Publications — Lead Architect Plan for `MyWebsite`

## 1. Recommendation

**Adopt the incremental-hybrid architecture with two grafts from static-multifile.** Concretely: **hand-authored static HTML detail pages** (one real `.html` per project and publication, so social scrapers and Google see genuine per-page `<title>`/OpenGraph/canonical/JSON-LD — the single property that disqualifies any client-rendered detail page), **JSON-driven index pages** (`projects/index.html`, `publications/index.html` render their domain-grouped grids from `data/*.json` at runtime with a `<noscript>` static-link fallback for crawlers), a **blocking `site-shell.js` chrome injector** (nav + footer + the three modal shells + cursor, injected from one file so the ~17 detail pages carry only their unique content), and a **`detailStatus` stub-gate** so the 6 projects with dead `href="#"` links and the assistive vision agent's profile-only GitHub never ship a dead-CTA page or a sitemap entry. This wins because it is the only option that satisfies **both** hard constraints simultaneously: it stays **pure static on deploy-from-branch** (zero CI, no `package.json`, nothing can break a deploy — a bad HTML file just serves as bad HTML, exactly like today's `game.html` precedent), **and** it delivers real shareable per-item pages. We explicitly **reject** the Eleventy/GitHub-Actions SSG (violates the no-build constraint, switches Pages serving mode, introduces a deploy-blocking failure and a citations-workflow reconciliation — overkill for ~17 items) and **reject** client-rendered detail pages (JS-blind scrapers would show one generic card for every shared paper link). The same `data/*.json` we design now is exactly the front-matter an Eleventy build would later consume, so if the catalog ever blows past ~25–30 items the migration is incremental, not a rewrite.

---

## 2. Target URL & file structure under `/MyWebsite/`

**Convention:** new pages live **exactly one level deep** so every shared-asset reference is a uniform `../` (never `../../`). Lowercase-kebab slugs everywhere (`slug` == filename == URL segment == JSON key). No underscore-prefixed folders. `.nojekyll` removes Jekyll from the equation entirely.

```
MyWebsite/                                   https://reshadulkarim.me/
├── index.html                               .../               (single-pager — behavior UNCHANGED)
├── game.html                                .../game.html      (existing precedent)
├── .nojekyll                          NEW   (empty; pure static passthrough)
├── 404.html                          NEW   (shared shell + "browse projects / publications / home")
├── robots.txt                        NEW   (Sitemap: line)
├── sitemap.xml                       NEW   (index + both indexes + every READY detail page)
├── favicon.svg / favicon.ico         NEW   (none exists today)
├── site-shell.js                     NEW   (blocking chrome injector: nav/footer/modals/cursor/grain)
├── render.js                         NEW   (index-page JSON renderer: grouping + filter + own reveal)
├── citations.json                          (unchanged, root-only)
├── styles.css … modern-ui.css … script.js  (unchanged, shared by ALL pages)
│
├── data/                             NEW   (single source of truth for the NEW pages)
│   ├── taxonomy.json
│   ├── projects.json
│   └── publications.json
│
├── projects/                         NEW
│   ├── index.html                          .../projects/            (domain-grouped index)
│   ├── lumenaa.html                        .../projects/lumenaa.html
│   ├── mars-rover-keyboard-typing.html
│   ├── service-robot.html
│   ├── weheal.html
│   └── … (accreted over time; sleep-stage-xai, dristee-navigation, vit-autism-detection,
│          pedestrian-vehicle-conflict-risk, wearable-fall-detection, matrimonial-hub,
│          academic-success-prediction, gesture-keyboard-mouse, tower-defense-game)
│
├── publications/                     NEW
│   ├── index.html                          .../publications/
│   ├── stroke-xai-ieee-access.html
│   ├── ppg-sleep-4stage-xai.html
│   ├── ppg-sleep-ml.html
│   └── gesture-keyboard-jcsse-2026.html
│
├── templates/                        NEW   (author scaffolds; served but unlinked, harmless)
│   ├── project-detail.template.html
│   └── publication-detail.template.html
│
└── scripts/                          NEW (OPTIONAL, Phase 4 — never served, never in CI)
    └── generate.js                         (local Node generator; run on machine, commit output)
```

**Pretty-URL behavior (verified GitHub Pages):** `/MyWebsite/projects/` serves `projects/index.html`; a request without the trailing slash 301-redirects to add it. Detail pages keep the `.html` extension (`/MyWebsite/projects/lumenaa.html`) — extensionless clean URLs would need a folder-per-slug (`lumenaa/index.html`), not worth ×17 folders here.

**Single-pager → new pages** (bare relative from root — no `../`; these are the *only* edits `index.html` needs beyond the head fixes in §4, and they are purely additive):

```html
<!-- #projects section header -->
<a class="btn-outline" href="projects/">Browse all projects by research domain →</a>
<!-- #research section header -->
<a class="btn-outline" href="publications/">All publications →</a>
<!-- per-card "Details" affordance, inside an existing .project-links / publication actions -->
<a class="project-link" href="projects/lumenaa.html" aria-label="Assistive vision agent case study">
  <i class="fas fa-arrow-up-right-from-square"></i>
</a>
```

**New pages → back** (one level deep, so `../`; nav hrefs are rewritten by the shell — see §4):

```html
<a class="nav-logo" href="../index.html#home">RUK</a>          <!-- shell-injected -->
<a class="nav-link" href="../index.html#projects">Projects</a> <!-- shell-injected -->
<a href="index.html">← All projects</a>                        <!-- detail → its index (sibling) -->
<a href="../publications/gesture-keyboard-jcsse-2026.html">Related paper →</a>  <!-- cross-link -->
```

---

## 3. Data model

Three files under `data/`. `taxonomy.json` defines the domain vocabulary + ordering once; the two content files are arrays whose fields map 1:1 onto the existing card/publication DOM (so `render.js` output is styled by the current CSS for free).

### 3a. `data/taxonomy.json` — research-domain vocabulary

`order` drives top-to-bottom section order on the projects index; `icon` reuses already-loaded Font Awesome classes.

```json
{
  "domains": {
    "agentic-multimodal": { "label": "Agentic & Multimodal AI",         "order": 1, "icon": "fas fa-robot",       "blurb": "Assistive vision-language agents, on-device reasoning." },
    "computer-vision":    { "label": "Computer Vision & Perception",    "order": 2, "icon": "fas fa-eye",         "blurb": "Detection, OCR, segmentation, autonomous perception." },
    "xai":                { "label": "Explainable AI",                  "order": 3, "icon": "fas fa-lightbulb",   "blurb": "SHAP/LIME interpretability for high-stakes ML." },
    "healthcare-ai":      { "label": "Healthcare & Medical AI",         "order": 4, "icon": "fas fa-heart-pulse", "blurb": "Clinical prediction, biosignals, assistive health tech." },
    "robotics-edge":      { "label": "Robotics & Edge / Embedded",      "order": 5, "icon": "fas fa-microchip",   "blurb": "Rover autonomy, ESP32/Arduino, on-device inference." },
    "hci-signal":         { "label": "HCI & Gesture / Signal Interfaces","order": 6, "icon": "fas fa-hand",       "blurb": "Touchless input, landmark encoding." },
    "applied-ml":         { "label": "Applied ML (Tabular)",            "order": 7, "icon": "fas fa-chart-line",  "blurb": "Classification and analysis on structured data." },
    "software-systems":   { "label": "Software Systems & Full-Stack",   "order": 8, "icon": "fas fa-layer-group", "blurb": "Non-research engineering builds." }
  }
}
```

### 3b. `data/projects.json` — schema + a real project object

`domains[0]` is the **primary** (grouping) domain; the rest are secondary (feed cross-cutting filter chips). `media` has exactly the two variants the DOM uses (`icon` | `youtube`). `detailStatus` gates whether a detail page/link/sitemap entry ships.

```json
{
  "slug": "lumenaa",
  "title": "Edge-Native Assistive Vision Agent",
  "shortTitle": "Assistive Vision Agent",
  "status": "ongoing",                          // "ongoing" | "completed"
  "flagship": true,
  "weight": 100,                                // higher = earlier within its domain group
  "date": "2025-06",                            // sort key (YYYY or YYYY-MM)
  "domains": ["agentic-multimodal", "healthcare-ai", "robotics-edge"],
  "description": "An edge-native multimodal assistive vision agent that runs perception on-device and only escalates to the cloud when needed, achieving a <strong>95%+ reduction in cloud vision API calls</strong> while preserving responsiveness and privacy for visually impaired users.",
  "techTags": ["Edge Inference", "Multimodal", "VLM"],
  "features": ["95%+ Cloud-Call Reduction", "On-Device Perception", "Multimodal Fusion"],
  "media": { "type": "icon", "icon": "fas fa-lightbulb", "label": "Assistive Vision Agent" },
  "metrics": [
    { "value": 95, "suffix": "%+", "label": "Cloud-Call Reduction" },
    { "value": 30, "suffix": "%",  "label": "Faster Inference" }
  ],
  "links": { "github": null, "youtube": null, "paper": null, "pdf": null, "poster": null, "live": null },
  "relatedPublications": [],
  "detailStatus": "stub",                       // "ready" | "stub"  (the assistive vision agent's github is profile-only → stub until real repo/links exist)
  "seo": { "description": "Edge-native assistive vision agent cutting cloud vision API calls 95%+.", "ogImage": null }
}
```

- **`media` variants:** `{ "type": "icon", "icon": "fas fa-brain", "label": "Sleep AI Research" }` **or** `{ "type": "youtube", "videoId": "vdP5qrJQqGc", "startTime": 131, "alt": "Mars Rover demo" }`.
- **`links` kinds** map 1:1 to the icons already in `.project-links`: `github` (`fab fa-github`), `youtube` (modal via `data-video-id`), `pdf` (`pdf-viewer-btn` + `data-pdf`/`data-title`), `paper` (DOI, `fas fa-file-alt`), `poster` (`fas fa-image`), `live` (`fas fa-external-link-alt`). A `null` value omits that action. **No `"#"` placeholders — a missing URL is `null`, which renders a disabled "coming soon" state, never a dead link.**
- **`detailStatus: "stub"`** → the card shows a "Coming soon" badge, links to no detail page, and is excluded from `sitemap.xml`. This is the data-integrity gate for the 6 dead-link projects + the assistive vision agent.

### 3c. `data/publications.json` — schema + real IEEE Access object

Splits the two DOM fields the content scout flagged as overloaded: `venue.qualifier` ("Q1 Journal") is separated from `status` ("featured"/"upcoming"/"published"), and `date` is ISO for sorting with a separate `dateDisplay`.

```json
{
  "slug": "stroke-xai-ieee-access",
  "type": "journal",                            // "journal" | "conference"
  "status": "featured",                         // "featured" | "upcoming" | "published"
  "title": "Optimizing Stroke Recognition with MediaPipe and Machine Learning: An Explainable AI Approach for Facial Landmark Analysis",
  "authorsShort": "<strong>Karim, R. U.</strong>, et al.",
  "authorRole": "First author",
  "authors": ["Reshad Ul Karim", "…full list sourced from IEEE Xplore…"],
  "venue": { "name": "IEEE Access", "qualifier": "Q1 Journal", "location": null },
  "date": "2025-03-12",
  "dateDisplay": "March 12, 2025",
  "doi": "10.1109/ACCESS.2025.3550577",
  "url": "https://doi.org/10.1109/ACCESS.2025.3550577",
  "media": { "type": "none" },                  // or { "type":"youtube", "videoId":"nAP8e5IfGZI" }
  "pdf": null,                                  // e.g. "assets/papers/xai-sleep-classification.pdf" (verified on disk)
  "contribution": "Detects stroke from facial landmarks using MediaPipe and ML, with SHAP-based explanations so clinicians can see why each prediction is made.",
  "abstract": "…full abstract for the detail page, sourced from IEEE Xplore…",
  "tags": ["Explainable AI", "MediaPipe", "SHAP", "Medical Imaging"],
  "citation": { "apa": "Karim, R. U., et al. (2025). Optimizing Stroke Recognition… IEEE Access. https://doi.org/10.1109/ACCESS.2025.3550577", "bibtex": "@article{karim2025stroke, … }" },
  "relatedProjects": [],
  "detailStatus": "ready",
  "seo": { "description": "IEEE Access (Q1) first-author paper: explainable ML for stroke recognition from facial landmarks.", "ogImage": null }
}
```

The two ICEACE sleep papers carry `media.videoId` (`nAP8e5IfGZI`, `FfUJttHAkyk`) + `pdf` (`assets/papers/xai-sleep-classification.pdf`, `assets/papers/sleep-classification.pdf` — both confirmed present). The JCSSE 2026 paper uses `status:"upcoming"`, `url:null`, `doi:null` → disabled-pill treatment.

### 3d. Domain grouping / sorting / filtering (projects index)

`render.js` applies deterministic rules — **no keyword-guessing** (unlike the single-pager's `projects-motion.js` categorizer):

1. **Sections** = domains ordered by `taxonomy.order`.
2. A project renders **once**, under its **primary** domain (`domains[0]`) — no duplicate cards across sections.
3. **Within a section:** `flagship` desc → `weight` desc → `date` desc → `title` A→Z.
4. **Filter bar** ("All" + one chip per domain): clicking a chip flattens the sections and shows **every** project whose full `domains[]` **includes** that id — so the assistive vision agent surfaces under *Agentic*, *Healthcare*, **and** *Edge*. One `domains[]` field powers both the grouped default view and the cross-cutting filtered view. Cards carry `data-domains="agentic-multimodal healthcare-ai robotics-edge"` for the filter.

**Primary-domain assignment (each project appears once; owner may re-slot — see §8):**

| Domain | Projects (primary) |
|---|---|
| Agentic & Multimodal AI | lumenaa ★, dristee-navigation |
| Computer Vision & Perception | mars-rover-keyboard-typing ★, vit-autism-detection, pedestrian-vehicle-conflict-risk |
| Explainable AI | sleep-stage-xai |
| Healthcare & Medical AI | weheal ★ |
| Robotics & Edge / Embedded | service-robot ★, wearable-fall-detection |
| HCI & Gesture / Signal | gesture-keyboard-mouse |
| Applied ML (Tabular) | academic-success-prediction |
| Software Systems & Full-Stack | matrimonial-hub, tower-defense-game |

(★ = one of the four flagship-reel items.)

---

## 4. The shared "page shell"

### 4a. Subpage `<head>` — exact includes, `../`-prefixed, in load-bearing order

The order below is copied from the verified `index.html` head (lines 34–93): fonts → Font Awesome → deferred `vanilla-tilt`/`pdf.js` → **non-deferred** Lenis + GSAP×3 → the 10 CSS files ending `fixes.css` then `modern-ui.css` → deferred motion modules. Do not reorder.

```html
<!-- 1. PRE-PAINT theme+accent bootstrap — MUST be the first element in <head>, before any CSS -->
<script>
(function(){try{
  var t=localStorage.getItem('theme'), a=localStorage.getItem('accent');
  if(t)document.documentElement.setAttribute('data-theme',t);
  if(a)document.documentElement.setAttribute('data-accent',a);
}catch(e){}})();
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<!-- 2. Per-page SEO/meta block (see §5) -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer></script> <!-- detail pages w/ PDF only -->
<script src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>

<link rel="stylesheet" href="../styles.css?v=1.3.0">
<link rel="stylesheet" href="../reveal-motion.css?v=1.0.0">
<link rel="stylesheet" href="../morph-motion.css?v=1.0.0">
<link rel="stylesheet" href="../positioning.css?v=1.1.0">
<link rel="stylesheet" href="../accent-theme.css?v=1.0.0">
<link rel="stylesheet" href="../projects-motion.css?v=1.0.0">  <!-- card/tag/reel styles -->
<link rel="stylesheet" href="../fixes.css?v=1.0.0">            <!-- after styles.css -->
<link rel="stylesheet" href="../modern-ui.css?v=1.0.0">       <!-- LAST — wins cascade -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.1/vanilla-tilt.min.js" defer></script>
<script src="../reveal-motion.js?v=1.1.0" defer></script>
<script src="../morph-motion.js?v=1.0.0" defer></script>
<script src="../accent-theme.js?v=1.0.0" defer></script>
<!-- render.js: INDEX pages only.  projects-motion.js: INDEX only (see §6). -->
<!-- DROPPED on all subpages: three-scene.js, section-three.js, scholar-citations.js -->
```

…and, as the **last, non-deferred** tag before `</body>`, `<script src="../script.js?v=2.2.0"></script>`. It must not be deferred and must not move to `<head>` — it builds `window._lenis` before the deferred modules run and depends on the shell chrome already existing (see 4b).

### 4b. `site-shell.js` — blocking chrome injector (adopted from static-multifile)

A **blocking, self-locating, synchronous** injector — *not* an async `fetch` of a partial (async would inject the nav *after* `script.js` already ran `initNavigation()`, and would fail on `file://`). It derives its base from its own script URL (rename-proof, depth-independent) and fills two placeholder divs.

```html
<body>
  <div id="shell-chrome"></div>
  <script src="../site-shell.js"></script>   <!-- BLOCKING; runs during parse, before script.js -->

  <main class="detail-page">…unique page content only…</main>

  <div id="shell-footer"></div>
  <script src="../script.js?v=2.2.0"></script>   <!-- LAST tag; non-deferred -->
</body>
```

`site-shell.js` injects, as inline HTML strings, **everything the shared JS only queries** (never creates): `.grain-svg` + `.grain-overlay`, `#custom-cursor` + `#cursor-dot`, `#scroll-progress-ring`, `<nav class="navbar" id="navbar">` (logo + 8 nav links pointing at `<base>index.html#section`), `<footer class="footer">`, and the three modal shells copied verbatim from `index.html` (`#youtube-modal` L2345, `#image-modal` L2355, `#pdf-modal` L2387). Base is derived once: `var base = document.currentScript.src.replace(/site-shell\.js.*$/, '')`. Because the shell runs first, `initCustomCursor`, `initNavigation`, `initMagneticButtons`, and every modal opener in `script.js` find their targets. **Contract, documented in the file header:** this script must stay blocking and placed before `script.js` — deferring or moving it silently breaks nav/cursor/modals.

### 4c. What must be generalized/omitted from the single-pager selectors

| Item | Action on subpages | Why |
|---|---|---|
| `#floating-nav` (L2426) | **Omit** | Hardcoded to the 8 single-pager sections; `initFloatingNav()` no-ops when absent. |
| `#particles-js` | **Omit** | Dead code; library never loaded. |
| Nav hrefs (`#about`…) | **Rewrite** → `../index.html#about` | Cross-page nav; not Lenis-intercepted (selector needs `href^="#"`) → correct native navigation. |
| Fixed-navbar overlap | Add `padding-top: calc(4rem + var(--safe-area-inset-top))` to `.detail-page`/first `<main>` | No hero absorbs the `position:fixed` navbar on a content page. |
| Cross-page deep-link offset | Add `scroll-margin-top: 5rem` to `index.html` section rule | So `index.html#projects` arrivals land below the navbar. |

The dark/light toggle button and accent-swatch tray are **built by JS** (`script.js` `initThemeToggle()`, `accent-theme.js` `buildUI()`) — do not hand-add them.

---

## 5. Asset-path, 404 & SEO strategy

**Path rule:** `../`-relative for the HTML shell (all subpages exactly one level deep → always `../`, never `../../`); runtime-derived absolute base inside `site-shell.js`/`render.js` (from `currentScript.src` / `new URL('../', document.baseURI)` — rename-proof, works on `file://`); **full absolute URLs** for OG/canonical/JSON-LD (spec requires it — scrapers don't resolve relative). **No `<base href>`** (it would hijack in-page anchors on detail pages). **No hardcoded `/MyWebsite/` in HTML** (breaks on rename; there's no CNAME). The one page-relative `fetch` in the shared stack (`scholar-citations.js:57`) is sidestepped by **not including that script on subpages**.

**Per-page `<head>` SEO block** (fill `{{…}}`; project uses `og:type=website` + `SoftwareSourceCode` JSON-LD, publication uses `og:type=article` + `ScholarlyArticle`):

```html
<title>{{title}} — Reshad Ul Karim</title>
<meta name="description" content="{{seo.description}}">
<link rel="canonical" href="https://reshadulkarim.me/projects/{{slug}}.html">
<meta property="og:type" content="article">
<meta property="og:url" content="https://reshadulkarim.me/publications/{{slug}}.html">
<meta property="og:title" content="{{title}} — Reshad Ul Karim">
<meta property="og:description" content="{{seo.description}}">
<meta property="og:image" content="https://reshadulkarim.me/{{seo.ogImage or 'profile%20picture.jpg'}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://reshadulkarim.me/{{seo.ogImage or 'profile%20picture.jpg'}}">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ScholarlyArticle",
 "headline":"{{title}}","author":{"@type":"Person","name":"Reshad Ul Karim"},
 "isPartOf":"{{venue.name}}","datePublished":"{{date}}",
 "sameAs":"https://doi.org/{{doi}}"}
</script>
```

Until per-item share images exist, `seo.ogImage` falls back to the existing root `profile picture.jpg` (a safe, on-brand card); the owner can later drop `assets/images/project-cards/<slug>-og.jpg` and set `seo.ogImage`.

**`sitemap.xml`** (root): `index.html` + `/projects/` + `/publications/` + one `<url>` per **`detailStatus:"ready"`** detail page (never a stub).
**`robots.txt`** (root): `User-agent: *` / `Allow: /` / `Sitemap: https://reshadulkarim.me/sitemap.xml`. (Today the single-pager exposes only `#anchors` — effectively zero crawlable outbound links.)
**`404.html`** (root, so its shell refs are **root-relative** bare, not `../`): shared chrome + "page not found — home / browse projects / browse publications". Served for any unmatched `/MyWebsite/*` (typo'd or removed slugs; extensionless URLs 404 rather than auto-appending `.html`).
**`.nojekyll`** (empty, root): pure static passthrough — removes any `_`-folder / Liquid `{{ }}` risk. Do it now.
**Fix in the same pass:** `index.html:14` `og:url` → `https://reshadulkarim.me/`, and add `<link rel="canonical" href="https://reshadulkarim.me/">`.
**Index-page crawlability hedge:** each JSON-rendered index also emits a `<noscript>` block of static `<a href>` links to every ready detail page, so link discovery survives even if JS is blocked.

*(Optional, deferred:)* pretty extensionless URLs via a `404.html` SPA-redirect are possible but **not recommended** — they add fragility and still can't fix JS-blind previews, which is precisely why detail pages are real static files.

---

## 6. Reusing the motion system (GSAP / Lenis / accent)

**Keep on all new pages** (all confirmed to self-init or `if(!el)return`): `styles/fixes/modern-ui/positioning/accent-theme` CSS, the Lenis↔ScrollTrigger bridge + theme toggle + custom cursor + magnetic buttons + spotlight/tilt in `script.js`, `accent-theme.js` (accent tray), `morph-motion.js` (View-Transition theme toggle, GSAP-Flip modal morph), and `reveal-motion.js` (generic class-based fly-ins — reusing `.publication-item`/`.section-header` gives detail pages the fly-in "for free"; it strips `data-aos`, so don't add AOS markup).

**Drop on all subpages:**

| Module | Reason |
|---|---|
| `section-three.js` | Fires the ~600 KB Three.js CDN fetch **unconditionally** on `DOMContentLoaded`, then bails only *after* loading when its 7 hardcoded section IDs are absent → pure waste. |
| `three-scene.js` | Hero backdrop; self-guards on `#home`/`.hero` (harmless if kept) but no hero here → drop for cleanliness. |
| `scholar-citations.js` | Page-relative `citations.json` fetch 404s from `/projects/`; badge not needed on subpages. |

**`projects-motion.js` — index pages ONLY, and even there `render.js` owns interactions.** Its flagship-reel pin + `buildFilter()` scan `.projects-grid` **at boot**, but `render.js` injects cards **asynchronously after** boot → a boot-time scan finds an empty grid (race). Therefore: **do not rely on `projects-motion.js`'s filter on the index.** `render.js` provides its **own** deterministic domain filter, its **own** `IntersectionObserver` reveal, and its **own** `VanillaTilt.init()` on the injected cards — immune to the boot race. Include `projects-motion.css` for the card/tag/reel *styles*; include `projects-motion.js` only if you want the flagship-reel pin on the index (feed it real `data-domains`, not its keyword guesser). Detail pages: omit it entirely (no grid).

**Content-heavy detail pages — keep vs. drop:** keep `reveal-motion.js` fly-ins, custom cursor, magnetic buttons, accent tray, theme toggle, and the injected YouTube/PDF/image modals. Drop all Three.js (no hero), the flagship reel, and count-up unless a page has metrics. This keeps detail pages fast and readable while staying visually consistent with the single-pager.

---

## 7. Phased roadmap

Sequenced so the live site never breaks; each phase is independently shippable. Effort: **S** ≤ ½ day · **M** ≈ 1–2 days · **L** ≥ 3 days.

| Phase | Deliverable | Effort | Notes / ship-safety |
|---|---|---|---|
| **0 — Infra & fixes** | `.nojekyll`, `404.html`, `robots.txt`, favicon, per-page `<head>` template; **fix `index.html:14` og:url** + add self-canonical; **retrofit the pre-paint theme/accent bootstrap** as the first `<head>` element of `index.html`; add `scroll-margin-top:5rem` to sections. | **S** | Pure additions + 3 tiny non-destructive `index.html` edits. Fixes the existing dark/accent flash. Ship first. |
| **1 — Data & shell** | `data/taxonomy.json` + author `projects.json` (13) + `publications.json` (4) from the DOM; build `site-shell.js` (nav/footer/modals/cursor injector) + prove it on **one** detail page end-to-end. | **M** | The transcription is mechanical; the *work* is sourcing real GitHub URLs for the 6 stubs + full author lists from IEEE Xplore. `site-shell.js` is the highest-leverage file — validate init timing against `script.js` here. |
| **2 — Index pages** | `render.js` (grouping + filter + own reveal/tilt) + ~20 lines CSS; `projects/index.html` + `publications/index.html` skeletons (nav + empty containers + `<noscript>` static links); add the two "Browse →" links + per-card "Details" links on `index.html`. | **M** | Index pages go live pointing only at `detailStatus:"ready"` items; stubs render "coming soon". |
| **3 — Flagship detail pages** | `templates/*.template.html` scaffolds, then the **4 flagships** (the assistive vision agent, Mars Rover, Service Robot, WeHeal) — elaborated prose, cross-links, per-page OG/canonical/JSON-LD; add their `<url>` lines to `sitemap.xml`. | **L** | Template once, then ~S each; the elaborated *writing* is the real cost. Only pages whose links are real go `"ready"`. |
| **4 — Accrete the rest + optional generator** | Remaining detail pages as their links firm up; **optionally** add `scripts/generate.js` (local Node — run on machine, commit output; **no CI**) to generate detail pages + sitemap from the same JSON once hand-maintenance exceeds ~15–20 pages. | **M–L** | Deploy-from-branch untouched; the generator is a local convenience, not a build. Graduate to Eleventy only if the catalog blows past ~25–30. |

**Ship first:** Phase 0 (half a day, immediate SEO/flash wins, zero risk), then Phase 1+2 to get the two live domain-grouped index pages, then Phase 3 flagships. Detail pages accrete afterward without blocking anything.

---

## 8. Risks, mitigations & open decisions

**Risks & mitigations**

- **Dead `href="#"` links becoming public (highest).** 6 projects + the assistive vision agent's profile-only GitHub. → **`detailStatus:"stub"` gate**: never ship or sitemap a page whose primary CTA is dead; stubs show "coming soon". Resolve the URL before promoting to `"ready"`.
- **Shell init timing.** If `site-shell.js` is ever deferred or moved after `script.js`, nav/cursor/modals silently break. → Blocking-before-`script.js` contract documented in the file header; verify on the first detail page.
- **Index boot-vs-async-inject race.** `projects-motion.js`/`reveal-motion.js` scan at boot before `render.js` injects. → `render.js` owns its own reveal/tilt/filter; don't depend on the boot-time scan.
- **No-JS index pages.** → `<noscript>` static links + `sitemap.xml` cover crawlers; detail pages are static HTML (immune).
- **Path drift.** A missing `../` 404s silently (no build to catch it). → One proven template; never hand-type asset paths; `curl -sI` spot-check after deploy. Hard rule: detail pages stay exactly one level deep.
- **Content drift (3 copies: `index.html` card + JSON + detail page).** → JSON declared canonical for the new pages; reconcile the flagship-vs-card title mismatches (e.g. "Service Bot" vs "Service Robot") into `title`/`shortTitle` once; the optional Phase-4 generator eliminates the JSON→detail copy.
- **Case/slug mismatch** silently 404s (Linux-backed Pages). → Lowercase-kebab everywhere; `slug` == filename == JSON key.

**Open decisions for the owner to confirm**

1. **Stub links.** For the 6 placeholder projects + the assistive vision agent, provide real GitHub/live/PDF URLs now, or ship them as index-only "coming soon" cards (no detail page) until the links exist? (Recommendation: ship "coming soon"; add detail pages as links land.)
2. **Primary-domain slotting.** Confirm the §3d assignments — the debatable ones are DRISTEE (agentic-multimodal vs computer-vision), ViT-Autism (computer-vision vs healthcare-ai), and whether WeHeal's card lives under Healthcare or Software Systems. Each project still appears under every one of its `domains[]` via the filter chips; only its default section is at stake.
3. **Per-item share images.** Accept the `profile picture.jpg` fallback OG card for now, or budget ~1200×630 branded cards per item under `assets/images/project-cards/<slug>-og.jpg`? (Recommendation: fallback now, add real cards for the 4 flagships in Phase 3.)
