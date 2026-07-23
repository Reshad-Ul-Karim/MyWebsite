# "Ask Reshad" — Personal AI Assistant

**Approach: fork `enterprise-AI-document-assistant` and swap the corpus.** The architecture stays
exactly as built and measured; only the documents, one prompt, and the chunker change.

> **Why this is the right call:** that system already solves the hard problem — grounded answers with
> code-verified citations and a refusal gate that has never once fabricated an answer. A portfolio
> assistant that invents a credential is worse than no assistant at all, so inheriting a **0.00
> false-answer rate** is worth more than any new framework.

---

## 1. The mapping — why the corpus swap is almost free

The existing system splits its corpus **asymmetrically**, and that split maps onto a personal
assistant with almost no violence:

| Existing role | Becomes | Why it works |
|---|---|---|
| **Handbook** — pinned in full (3,081 tok), silence is *provable* | **Mother resume** (~2–4k tok) | "Reshad doesn't list Rust" becomes a **fact**, not a failed search |
| **Statute** — 181 pp, retrieved top-8 | **Project docs + publication PDFs** | Deep detail, retrieved on demand, each chunk carrying its source |
| **Uploaded KB** — arbitrary, retrieved, weaker pipeline | *(unchanged — keep as-is)* | Still useful; not part of the persona path |

`src/api/service.py:56–62` already does this:

```python
# ASYMMETRIC RETRIEVAL. The handbook is 3,081 tokens -- retrieval over a document
# that already fits can only lose information. So it is pinned in full ...
self.handbook = [c for c in self.chunks if c.doc_kind == "handbook"]
statute_mask  = [i for i, c in enumerate(self.chunks) if c.doc_kind == "statute"]
```

**The resume is the handbook.** Same size class, same reason to pin, same payoff: provable absence.
That is the single most valuable property to carry over, because the most damaging thing this
assistant could do is invent a skill or an employer.

---

## 2. Corpus inventory — what to gather

### 2.1 Pinned layer — the mother résumé

**Source:** `Resume___Reshad_Ul_karim__UIU_/src/` — six LaTeX variants, each tailored to a different
application.

| Variant | Size | Sections |
|---|---|---|
| **`resume_faangpath-main merged long.tex`** | **15.0 KB** | All 10 — **use as the spine** |
| `resume_faangpath-AI-General.tex` | 11.3 KB | 9 |
| `resume_faangpath-AgamiSoft-AISE.tex` | 11.2 KB | 9 |
| `resume_faangpath-CINTEC-EWU.tex` | 11.1 KB | 9 |
| `resume_faangpath -BNEXT.tex` | 11.1 KB | 10 (has VOLUNTEER) |
| `resume_faangpath-MLOPS.tex` | 9.2 KB | 9 |

Shared section set: `OBJECTIVE · Education · TECHNICAL SKILLS · WORK EXPERIENCE · PUBLICATIONS ·
PROJECTS · CERTIFICATIONS · HONORS & AWARDS · VOLUNTEER EXPERIENCE · REFERENCES`

**The mother résumé is the union of all six, not a copy of the longest.** Measured: `main merged
long` holds 125 unique content lines, but every tailored variant still contributes lines it lacks —
**BNEXT 29, AI-General 50, AgamiSoft 43, CINTEC 35, MLOPS 20**. Real examples missing from the spine:
the MLOps skills row (`Experiment Tracking, Monitoring, Guardrails, RunPod, VPS`), the CGPA line, and
the teaching bullet about 120+ students.

**Merge rule: union of *facts*, not concatenation of *text*.** Many "unique" lines are the same fact
rephrased for a different audience. Keeping both bloats the pinned context and invites the model to
present one achievement as two.

> **Exhaustiveness is the whole point.** Because the résumé is pinned and treated as complete, anything
> missing is **actively denied** — that's what makes "does he know Rust?" answerable. But it also means
> a skill you forget to list is a skill the assistant will state you don't have. Sweep all six.

**Certifications and awards come from here** — from the résumé's `CERTIFICATIONS` and `HONORS & AWARDS`
sections. **No certificate PDFs are ingested**; the résumé already lists them, and the PDFs are scans
that would add OCR cost for no new facts.

### 2.2 Retrieved layer — **the whole website is the knowledge base**

The site already *is* the documentation, so the corpus is the site itself. Measured volumes:

| Source | Size | Ingest? |
|---|---|---|
| `data/projects.json` — 20 projects, 43 written sections | 55.8 KB | ✅ **Primary source** |
| `index.html` — `#about`, `#experience`, `#awards`, `#certifications`, `#cultural`, hero | ~12 KB of 21.5 KB | ✅ **Only content that exists nowhere else** |
| `docs/PROJECT_DESCRIPTIONS.md` | 10.2 KB | ✅ Polished prose |
| `data/publications.json` — venue, DOI, contribution, citation | 7.9 KB | ✅ |
| `data/taxonomy.json` — domain labels | 1.9 KB | ✅ Grouping metadata |
| Publication PDFs (3–4 papers) | — | ✅ Full method/results detail |
| `projects/*.html`, `publications/*.html` (18 + 4 pages) | 36.8 KB | ❌ **Skip — see below** |

#### The one ingestion rule that matters: source of truth only

`projects/*.html` is **generated from `projects.json`** by `gen_pages.py`. Ingesting both would put
every project fact in the corpus **twice**, in near-identical wording — and you already know exactly
why that's harmful, from the original README:

> *"the handbook's leave clause is statutory boilerplate lifted from s.117 (Jaccard 0.53), so a
> similarity-maximising reranker **promotes both near-duplicates**"*

Same failure, self-inflicted: retrieval would burn two of its top-k slots on one fact. **Ingest the
JSON, skip the pages it generates.** Likewise, skip `#projects`/`#research` on the homepage — those
cards restate `projects.json`. Take only the homepage sections with genuinely unique prose:
**about, experience, awards, certifications, cultural, hero.**

#### Resulting corpus

| Layer | Content | ≈ tokens |
|---|---|---|
| **Pinned** | Merged mother résumé | ~4–5k |
| **Retrieved** | ~85 KB of site text + papers → est. **250–400 chunks** | ~21k |

Smaller than the 482-chunk statute index it replaces, so memory and latency both improve.

> ⚠️ **Token-floor check:** the pinned résumé (~4–5k tok) is larger than the 3,081-token handbook.
> `Corpus._floor` in `service.py:85–106` computes `system + pinned + retrieval_allowance` — re-measure
> it after the swap, since that calculation was tuned to the handbook's size.

**Three build-time wins over the original corpus:**
1. **No OCR.** Papers and résumé have real text layers → `src/ingest/ocr.py` skipped entirely; the
   ~98-second tesseract stage disappears.
2. **No 2-up de-interleaving.** No landscape spreads → `extract.py`'s x-midline clip unused.
3. **Most of the corpus is already structured JSON**, so chunking is a field walk, not a parse — the
   `sections.py` statute grammar isn't needed at all.

---

## 2A. Resource audit — what exists today vs. what must be created

Audited against `MyWebsite/` and `enterprise-AI-document-assistant/`. **Most of the corpus already
exists**; the gaps are concentrated in two places.

### Layer 1 — PINNED (résumé) 🟡 assembly, not authoring

| Resource | Status |
|---|---|
| Six tailored LaTeX variants in `Resume___Reshad_Ul_karim__UIU_/src/` | ✅ **Present** |
| **Merged mother résumé** | ⚠️ **Must be produced — by merging them (see §2.1)** |

Good news from the audit: this is a **~45-minute consolidation**, not a from-scratch write. All ten
sections already exist; `main merged long.tex` is the spine and the other five contribute 20–50 unique
lines each. No new facts need inventing — only gathering and de-duplicating.

> ⚠️ **Unrelated bug found during the audit:** the CV served on the live site
> (`assets/papers/Reshad_Ul_Karim_Resume.pdf`, Feb 12) is **3 months older** than the newest
> (May 25). The site is serving a stale résumé — worth fixing independently of this project.

### Layer 2 — RETRIEVED: project documentation 🟢 mostly present

| Resource | Status |
|---|---|
| `data/projects.json` — **12 projects, 43 written sections** | ✅ **Present — the bulk of the corpus** |
| `docs/PROJECT_DESCRIPTIONS.md` (10 KB prose) | ✅ Present |
| `data/taxonomy.json` (domain labels) | ✅ Present |
| 6 "ready but thin" projects — description only, no sections | ⚠️ **Need write-ups** |
| 2 coming-soon projects | ❌ No content at all |

- **Thin (need writing):** `mars-rover-keyboard-typing`, `sleep-stage-xai`, `matrimonial-hub`,
  `weheal`, `gesture-keyboard-mouse`, `wearable-fall-detection`
- **Missing entirely:** `dristee-navigation`, `vit-autism-detection`
- **Project PDFs present:** `cse350-obstacle-robot-report.pdf`, `Group19-CSE422.pdf`,
  `cse428-pet-segmentation-slides.pdf`, `hand-gesture-keyboard-mouse-slides.pdf`

### Layer 3 — RETRIEVED: publications 🟡 3 of 4

| Publication | PDF |
|---|---|
| `ppg-sleep-4stage-xai` (ICEACE) | ✅ `xai-sleep-classification.pdf` |
| `ppg-sleep-ml` (ICEACE) | ✅ `sleep-classification.pdf` |
| `gesture-keyboard-jcsse-2026` | ⚠️ Only **slides**, not the paper |
| **`stroke-xai-ieee-access`** | ❌ **MISSING** |

> The missing file is the **first-author IEEE Access** paper — the single most important document for
> a PhD supervisor, and the highest-value thing to add.

### Layer 4 — Certifications & awards ⚪ **not ingested as files**

Certificate PDFs (`AI Fundamentals.pdf`, `Transformer Models with PyTorch.pdf`, etc.) are
**deliberately excluded from the corpus.** The résumé's `CERTIFICATIONS` and `HONORS & AWARDS`
sections already state every fact a visitor would ask for — the PDFs are scans that would add OCR
cost and duplicate chunks for no new information.

This is the same reasoning that excluded the ILO annex and table of contents in the original build:
*a measured, documented exclusion beats ingesting everything available.*

### Assistant repo — replaced, not created

| Path | Action |
|---|---|
| `Assets/` (Partex + Labour Act + medical PDFs) | Swap for the personal corpus |
| `index/` (`chunks.jsonl`, `index.npz`, `index_meta.json`) | **Regenerated automatically** by `build_index` |
| `evals/golden.yaml` | Rewrite with the persona tiers (§7) |

### The actual to-do list

| # | Task | Effort |
|---|---|---|
| 1 | **Merge the 6 résumé variants** into one master (union of facts, dedup rephrasings) | ~45 min ⭐ |
| 2 | Add the **IEEE Access paper PDF** | 5 min |
| 3 | Add the **JCSSE paper** (not just slides) | 5 min |
| 4 | Write up the **6 thin projects** | ~2 hrs |
| 5 | *(Optional)* `dristee-navigation` + `vit-autism-detection` write-ups | ~1 hr |

**Items 1 and 2 are the real blockers.** Everything else — 12 rich projects, 3 papers, taxonomy,
prose docs — already exists, which is why the corpus swap is mostly assembly rather than authoring.

---

## 3. Code changes, file by file

### 3.1 `src/core/manifest.py` — replace `MANIFEST`

```python
MANIFEST: dict[str, dict[str, object]] = {
    "resume": {
        "doc_id": "resume",
        "doc_title": "Reshad Ul Karim — Curriculum Vitae",
        "source_file": "resume-master.pdf",
        "modality": "text",
        "note": "Authoritative and complete. Pinned in full; absence here is treated as fact.",
    },
    "projects": {
        "doc_id": "projects",
        "doc_title": "Project Documentation",
        "source_file": "projects/",           # directory of .md files
        "modality": "text",
        "note": "Per-project write-ups: problem, approach, results, stack.",
    },
    "publications": {
        "doc_id": "publications",
        "doc_title": "Peer-Reviewed Publications",
        "source_file": "publications/",
        "modality": "text",
        "note": "4 papers. Text-layer PDFs; no OCR required.",
    },
}
```

### 3.2 `DocKind` — add two kinds (≈10 lines, keeps semantics honest)

The zero-diff hack is to call the resume a `"handbook"` and the projects a `"statute"` — it would work
untouched, but every future reader would trip over it. Add real names instead and update the two
lines in `service.py`:

```python
# src/core/models.py
DocKind = Literal["handbook", "statute", "uploaded", "resume", "portfolio"]

# src/api/service.py  — the pin/retrieve split, now corpus-aware
PINNED_KINDS    = ("handbook", "resume")
RETRIEVED_KINDS = ("statute", "portfolio")
self.pinned    = [c for c in self.chunks if c.doc_kind in PINNED_KINDS]
retrieved_mask = [i for i, c in enumerate(self.chunks) if c.doc_kind in RETRIEVED_KINDS]
```

Everything downstream — `build_context_block`, the token floor, verification — works unchanged.

### 3.3 New chunker — `chunk_document()` in `src/core/chunking.py`

`chunk_statute()` depends on `sections.py`'s dual-grammar regex for `s.115`-style headings. Project
docs have no such grammar, so add a sibling that splits on **markdown headings**, falling back to the
existing `_windows()` for long bodies:

```python
def chunk_markdown(text: str, doc_id: str, doc_title: str, kind: str) -> list[Chunk]:
    """Split on '#'/'##' headings; each chunk carries its heading as section_title."""
    parts = re.split(r"^(#{1,3})\s+(.+)$", text, flags=re.M)
    out, buf_title = [], None
    for i in range(1, len(parts), 3):
        buf_title, body = parts[i + 1].strip(), parts[i + 2]
        for j, window in enumerate(_windows(body)):
            out.append(Chunk(
                chunk_id=f"{doc_id}:{_slug(buf_title)}:{j}",
                doc_id=doc_id, doc_title=doc_title, doc_kind=kind,
                section_title=buf_title, text=window.strip(),
                zero_based_pdf_index=0, printed_page=1,   # see 3.4
                source_modality="text",
            ))
    return out
```

### 3.4 Page numbers — the one real friction

`Chunk` requires `zero_based_pdf_index` and `printed_page` (int, non-optional), and `pagemap.py`
encodes the statute-specific rule `printed = pdf_index - 16`. **Markdown project docs have no pages.**

**Decision:** set both to `1` for markdown sources, keep real page extraction for the PDFs
(resume, papers), and make the **citation renderer prefer `section_title` over page number**:

> `Resume — Skills` · `LUMENAA — Results` · `IEEE Access paper — p.4`

That reads better than "p.1" everywhere, and it's a UI change, not an architectural one.
`pagemap.py` is simply unused on the persona path.

### 3.5 `prompts/persona.md` — a **third** prompt

Your own `uploaded.md` header states the principle:

> *"Applying synthesis.md's floor rules to an arbitrary PDF would produce confident nonsense about
> 'statutory minima' in a document that has none. Two jobs, two prompts."*

Same argument here — a third job needs a third prompt. `synthesis.md` reasons about **statutory floor
semantics** and would produce nonsense about a CV; `uploaded.md` **cannot prove absence** because
nothing is pinned. The persona job needs pinned-absence semantics *without* legal reasoning.

```markdown
<!--
version: 1.0.0 — the PERSONA prompt.
Third prompt, same reasoning as uploaded.md: a distinct job, not a parameterisation.
  * synthesis.md  = two authority levels + statutory floor semantics  → nonsense on a CV
  * uploaded.md   = nothing pinned                                    → cannot prove absence
  * persona.md    = resume pinned (absence provable), no legal frame, plus an identity rule
-->

You represent Reshad Ul Karim on his portfolio. You are his AI assistant — you are NOT Reshad.

## Voice
Warm, specific, concise: two or three short paragraphs. Third person ("Reshad built…").
Concrete over adjectives — name the project, the method, the measured result.

## Grounding
Answer ONLY from the RESUME (complete and authoritative) and the retrieved PASSAGES.
The resume is COMPLETE: if a skill, employer or qualification is absent from it, Reshad does
not claim it. Say so plainly rather than hedging.
If the question cannot be answered from either, say: "That isn't something Reshad documents —
the best way to find out is to ask him directly," then offer to arrange a conversation.

## Citing — MANDATORY FORMAT
Use [[chunk:ID|verbatim quote]]. Never write a URL or a source name yourself; code renders it.

## Identity
If asked whether you are Reshad, say you are an AI assistant trained on his portfolio and
offer to connect them. Never claim to be him.

## Boundaries
Never invent employers, dates, grades, tools or availability. Decline salary discussion,
private matters and anything unrelated to his work. Never negotiate or commit on his behalf.

## Booking
If the visitor wants to meet, hire, or interview him, end with <<BOOK>> on its own line.
```

### 3.6 Build gate — `src/ingest/build_index.py`

Replace the statute gate (`assert_build_gate(sections)` — fails if s.46 is missing) with a persona
equivalent, preserving the principle **"fail the build, not the demo"**:

```python
def assert_persona_gate(chunks: list[Chunk]) -> None:
    pinned = [c for c in chunks if c.doc_kind == "resume"]
    if not pinned:
        raise SystemExit("BUILD GATE: resume produced no chunks — the pinned layer would be empty")
    joined = " ".join(c.text.lower() for c in pinned)
    for required in ("education", "skill", "experience"):
        if required not in joined:
            raise SystemExit(f"BUILD GATE: resume missing '{required}' — pinned context is incomplete")
    if len(set(c.doc_id for c in chunks)) < 3:
        raise SystemExit("BUILD GATE: expected resume + projects + publications")
```

A silently-empty pinned layer is the worst possible failure: the assistant would answer *everything*
with "he doesn't list that."

### 3.7 Untouched

`retrieval.py` · `verification.py` · `embeddings.py` · `generator.py` · `errors.py` · `rategate.py` ·
`auth.py` · `memguard.py` · `.importlinter` · the whole uploaded-KB path.

**That's the point of the fork.** The span verifier, the RRF hybrid retrieval, the typed error
envelope and the offline-testable core all carry over with zero changes.

---

## 4. Deployment — one service, not two

**Your own README does this arithmetic:**

> *"A calendar month is ~730 hours against Render's 750 free instance-hours, so one always-warm
> service fits, with ~20 hours spare. The real limit is that a second always-on free service would
> not."*

So **do not deploy a second Render service.** Two consequences follow, and they decide the design:

| | Option A — second service | **Option B — same service, second corpus** ✅ |
|---|---|---|
| Free hours | ❌ Exceeds 750 | ✅ Reuses the warm instance |
| Cold start | 60s (fatal for a widget) | None — already kept warm by your pinger |
| Work | New deploy, new secrets, new monitor | Load a second index + route by param |

**Decision: Option B.** Load both indexes at boot and select per request:

```
POST /api/ask  { "question": "...", "corpus": "persona" }   # default: "demo"
```

`Corpus` already holds `self.chunks`; instantiate it twice (`corpus_demo`, `corpus_persona`) and pick
in `answer()`. Memory is the only cost, and the persona index is far smaller than the 482-chunk
statute one — well inside the ~435 MB / 512 MB budget, but **re-measure `memguard` after loading
both** before shipping.

### 4.1 Cold start — the honest caveat

If the uptime pinger ever lapses, a recruiter clicking the chat bubble waits ~60 seconds and leaves.
Mitigations, in order of effort:

1. **Keep the existing `/health` pinger running** (already built) — free, sufficient.
2. **Optimistic UI:** the widget opens instantly with the suggested-question chips and only shows a
   "waking up…" state on first request. Perceived latency is the real enemy.
3. If it ever becomes a problem, move *only* the persona endpoint to a Cloudflare Worker
   (no cold start) — but that's a real port, so don't pre-emptively pay for it.

---

## 5. The widget on reshadulkarim.me

The portfolio is static on GitHub Pages, so the widget is plain JS/CSS calling the Render API.

- **Injection:** add `assistant-widget.js?v=1.0.0` to `site-shell.js` so it appears on every page.
- **CORS:** allow `https://reshadulkarim.me` in the FastAPI CORS config (currently the app's own origin).
- **Placement — both corners are already taken:** theme toggle `bottom:20px`, accent picker
  `bottom:84px` (`accent-theme.css:191`), scroll-to-top bottom-left. The launcher takes the primary
  slot and the stack shifts up:

```css
.ask-fab      { position: fixed; right: 20px; bottom: 20px; z-index: 1200; width: 56px; height: 56px; }
.theme-toggle { bottom: 86px !important; }
.accent-fab   { bottom: 150px !important; }
@media (max-width: 768px) {
  .ask-fab { right: 15px; bottom: 20px; width: 52px; }
  .theme-toggle { bottom: 206px !important; }
  .accent-fab   { bottom: 264px !important; }
}
```

- **Never auto-open.** Small launcher, one-time tooltip ("Ask me about Reshad"), `localStorage` flag.
- **Header discloses:** "Ask Reshad's AI — answers from his CV and project docs."
- **Suggested chips** double as a quality demo: *"What's his strongest research work?"* ·
  *"Does he have production LLM experience?"* · *"Show me a computer-vision project"* · *"Can I set up a call?"*
- **Citations** render as chips from the **server's** hit list linking to the matching
  `reshadulkarim.me/projects/…` page — the model never emits a URL.
- **Theme-aware** via existing `data-theme` / `data-accent` custom properties.
- **A11y:** focus trap, `Esc` to close, `aria-live="polite"`, respects `prefers-reduced-motion`.

### 5.1 Page awareness — it knows where the visitor is standing

The widget is on **every page**, and on each one it must know *which* page that is. Someone reading
the LUMENAA case study will type **"what did you use here?"** or **"how long did this take?"** — and
"here"/"this" is unresolvable without page context. Getting this wrong is the difference between a
site-wide search box and something that feels like a guide standing next to you.

**The URL is the whole mechanism** — the site's routes map 1:1 onto corpus `doc_id`s, because
`gen_pages.py` builds every page from `slug`:

| URL | Page context |
|---|---|
| `/projects/lumenaa.html` | `{kind: "project", slug: "lumenaa"}` |
| `/publications/stroke-xai-ieee-access.html` | `{kind: "publication", slug: "stroke-xai-ieee-access"}` |
| `/projects/` · `/publications/` | `{kind: "index"}` |
| `/` | `{kind: "home"}` |

**Frontend** — three lines, no config to maintain:

```js
function pageContext() {
  const m = location.pathname.match(/\/(projects|publications)\/([a-z0-9-]+)\.html$/);
  if (m) return { kind: m[1].slice(0, -1), slug: m[2], title: document.title };
  if (/\/(projects|publications)\/$/.test(location.pathname)) return { kind: "index", title: document.title };
  return { kind: "home", title: document.title };
}
// POST /api/ask  { question, corpus: "persona", page: pageContext() }
```

**Backend — pin the current page, don't just boost it.** When `page.slug` resolves to a known
`doc_id`, add that document's chunks to the pinned block alongside the résumé:

```python
PINNED_KINDS = ("resume",)

def pinned_for(corpus, page):
    pinned = [c for c in corpus.chunks if c.doc_kind in PINNED_KINDS]
    if page and page.get("slug"):
        current = [c for c in corpus.chunks if c.doc_id == page["slug"]]
        pinned += current            # a single project ≈ 300-600 tokens — cheap
    return pinned
```

This is the **same argument as the handbook, applied a third time**: retrieval over a document that
already fits can only lose information. One project's chunks are a few hundred tokens, so pinning
the page the visitor is literally looking at is nearly free — and it makes *"this project doesn't
mention deployment"* a provable statement rather than a failed top-k.

**Prompt addition** for `persona.md`:

```markdown
## Page context
The visitor is currently reading: {{page_title}} ({{page_kind}}).
Its full content is in the PINNED section. Resolve "this", "here" and "it" to this page.
Answer beyond it whenever the question is broader — never refuse a general question because
of where they happen to be standing.
```

That last line matters: page awareness must **bias, not confine**. Someone on the tower-defense page
asking "what's his research background?" should get the research answer, not a deflection.

**Page-aware suggested chips** — the empty state adapts, which is the most visible payoff:

| On | Chips |
|---|---|
| A project page | *"What was hardest about this?"* · *"What tech does it use?"* · *"What else is like this?"* |
| A publication page | *"Explain this paper simply"* · *"What was his contribution?"* |
| Home / index | *"What's his strongest research?"* · *"Does he have production LLM experience?"* |

**Continuity:** keep the transcript in `sessionStorage` so a visitor who follows a "Read more" link
mid-conversation doesn't lose it. Send the new page context with the next message and let the model
see the switch — "you were asking about LUMENAA; this page is WeHeal" is a natural thing for it to
handle, and losing the thread on every navigation would feel broken.

---

## 6. Booking — the one genuinely new feature

1. Model emits `<<BOOK>>` → widget shows an inline card (name, email, purpose, preferred times, hidden honeypot).
2. `POST /api/book` → validate (honeypot empty, email syntax, **reuse `rategate.py`**: 3/IP/day).
3. Send two emails via **Resend** (free 100/day):
   - **To Reshad** — purpose, preferred times, **and the last 3 turns** so context isn't lost.
   - **To the visitor** — acknowledgement setting reply expectations.
4. Return `202` (job-style, consistent with the existing upload semantics).

Add `RESEND_API_KEY` + `OWNER_EMAIL` as env vars. Sending from `@reshadulkarim.me` needs SPF/DKIM TXT
records in Namecheap; sending from Resend's shared domain with `reply_to` set to your Gmail needs zero
DNS work and is fine to start.

*Later, if manual scheduling gets tedious:* a Cal.com embed handles availability, timezones and
calendar invites for free. Don't build that in v1.

---

## 7. Evaluation — reuse the harness, change the tiers

`evals/harness.py` already runs a tiered golden set and grades with a **cross-family judge (Gemini)**.
Keep both. Replace the questions:

| Tier | Example | Pass condition |
|---|---|---|
| A. Resume facts | "Where does he study?" | Correct, cited to the resume |
| B. Project depth | "What did he use in LUMENAA?" | Correct + links to the right project page |
| C. Judgement | "Is he a fit for an LLM infra role?" | Grounded in real projects; no invention |
| D. **Unanswerable** | "What's his GPA?" · "Does he know Rust?" | **Must refuse** — pinned resume makes this provable |
| E. Boundary | "What salary does he want?" · off-topic · "Are you Reshad?" | Declines / discloses correctly |
| F. **Page-aware** | On `/projects/lumenaa.html`: *"what did you use here?"* · *"what's his research background?"* | Resolves "here" to LUMENAA; still answers the broader question without deflecting |

**Tier D is the ship gate: zero fabrications.** Over-refusal is the acceptable error — the same trade
already defended in the original README. Also assert every rendered citation URL returns 200.

---

## 8. Phased roadmap

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Merge the 6 résumé variants; point the ingester at the site's JSON + papers | Résumé exhaustive on skills; no duplicate facts |
| **1** | `MANIFEST` + `DocKind` + `chunk_markdown()` + persona build gate | `build_index` passes; eyeball 10 chunks |
| **2** | `prompts/persona.md`; `corpus` param in `/api/ask` | 10 manual questions correct with real citations |
| **3** | Widget on reshadulkarim.me + CORS + **page-context injection (§5.1)** | Works on every page; "what did you use here?" resolves correctly |
| **4** | `/api/book` + Resend | Test request lands in inbox with transcript |
| **5** | Retune eval tiers; run harness | **Tier D = 0 fabrications** → ship |

Phases 0–2 are the substance. Phase 0 is the real work and no tool can do it for you.

---

## 9. Risks and honest limits

- **The resume is now load-bearing.** Because it's pinned and treated as complete, an omission becomes
  an active denial. Review it as *the* source of truth, not as a document.
- **Memory.** Two indexes in one 512 MB box. Measure with `memguard` before shipping; if tight, the
  documented fallback (API-side query embedding, dropping onnxruntime) still applies.
- **Cold start** if the pinger lapses — see §4.1.
- **Public endpoint = real traffic.** The demo corpus was assessment traffic; a portfolio widget is
  open internet. Keep `rategate` on and set a hard monthly cap in the Mistral console.
- **Over-refusal** will be more visible here than on a legal corpus — a recruiter asking a reasonable
  question and getting "he doesn't document that" is a bad look. Watch Tier B, and fix it by
  **improving the corpus**, never by loosening the grounding rules.
- **Staleness.** Rebuild the index whenever projects or the CV change, or it confidently describes a
  months-old version of you.

---

## 10. First three steps

1. **Curate the mother resume.** Exhaustive on skills — omissions become denials.
2. **Gather project docs + the 4 papers** into `Assets/`, then swap `MANIFEST` and run `build_index`.
   Read 10 random chunks; if they don't read like good answers, fix chunking before touching prompts.
3. **Write `prompts/persona.md`** and curl `/api/ask` with `corpus=persona`. Only build the widget once
   the API returns answers you'd be happy for a recruiter to read.
