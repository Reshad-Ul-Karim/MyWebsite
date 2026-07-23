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

### 2.1 Pinned layer — the mother resume

One file, `Assets/resume-master.pdf` (or `.md`). This is the **authoritative** document; everything
the assistant asserts about identity, education, skills and timeline comes from here.

Write/curate it so every line is quotable as fact. Recommended coverage:

- Identity, location, contact rules · Education (BRAC University, dates, focus)
- Full experience timeline with dates · Complete skills inventory (**be exhaustive — omissions become
  "he doesn't know X"**) · Awards · Publications summary · What he's looking for

> **The exhaustiveness point matters.** Because the resume is pinned and treated as complete, anything
> missing from it will be actively denied. That's the desired behaviour — but it means a skill you
> forgot to list is a skill the assistant will say you don't have.

### 2.2 Retrieved layer — project docs + publications

| Source | Files | Notes |
|---|---|---|
| Project documentation | Per-project `.md` / reports | Richest material; already partly written in `MyWebsite/data/projects.json` |
| Publication PDFs | 4 papers (IEEE Access, ICEACE ×2, JCSSE) | Text-based → **no OCR needed** |
| Optional | `docs/PROJECT_DESCRIPTIONS.md` from the site repo | Already-polished prose |

**Two build-time wins over the original corpus:**
1. **No OCR.** These PDFs have real text layers, so `src/ingest/ocr.py` is skipped entirely — the
   ~98-second tesseract stage disappears.
2. **No 2-up de-interleaving.** No landscape spreads, so `extract.py`'s x-midline clip is unused.

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

**Tier D is the ship gate: zero fabrications.** Over-refusal is the acceptable error — the same trade
already defended in the original README. Also assert every rendered citation URL returns 200.

---

## 8. Phased roadmap

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Curate the mother resume; gather project docs + 4 papers | Resume is exhaustive on skills |
| **1** | `MANIFEST` + `DocKind` + `chunk_markdown()` + persona build gate | `build_index` passes; eyeball 10 chunks |
| **2** | `prompts/persona.md`; `corpus` param in `/api/ask` | 10 manual questions correct with real citations |
| **3** | Widget on reshadulkarim.me + CORS | Mobile clean; no FAB overlap; theme-aware |
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
