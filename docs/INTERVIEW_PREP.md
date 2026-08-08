# Ask Reshad — Interview Prep

Everything you need to explain this project confidently: the architecture, the decisions
you can defend, the real bugs you found and fixed, and the questions most likely to come up.

---

## 1. The 30-second pitch

> "I forked a RAG system I'd already built and measured — one that answers HR-policy
> questions with code-verified citations and a documented zero-fabrication rate — and
> swapped the corpus for my own résumé and portfolio. The interesting part wasn't the fork,
> it was reusing the *architecture*: pin the small authoritative document so its absence is
> provable, retrieve over the large one, verify every citation in code instead of trusting
> the model, and run it as a second corpus in the same service instead of a second
> deployment."

If asked to go one level deeper: it's not a chatbot wrapper — it's a retrieval system with a
code-enforced trust boundary. The model never gets to unilaterally decide an answer is
correct; a verifier checks every quoted span against the actual source text and strips
anything that doesn't match.

---

## 2. Architecture at a glance

One FastAPI service, two corpora, selected per-request:

```
POST /api/ask  { question, corpus: "hr" | "persona", page? }

  corpus="hr"       -> handbook (pinned) + labour act (retrieved top-8)
  corpus="persona"  -> résumé (pinned)   + projects/papers/site (retrieved top-8)
                        + the CURRENT page's chunks, pinned too, if the visitor
                          is standing on a project/publication page
```

Both indexes load at boot into two `Corpus` instances sharing one process — chosen
specifically to stay inside Render's 750 free instance-hours/month rather than running (and
paying for, in cold-start terms) a second always-on service.

| Metric | Value |
|---|---|
| Persona chunks | 330 |
| HR chunks | 482 |
| RSS with both loaded | 133 MB |
| Free-tier ceiling | 512 MB |

---

## 3. The core pattern, applied three times

**Asymmetric retrieval:** if a document is small enough to fit in the prompt whole,
retrieval over it can only *lose* information — so pin it, and its silence becomes a
provable fact instead of an inference from a failed top-k search.

1. **Handbook vs. statute** (original system) — 3,081-token employee handbook pinned whole;
   181-page labour act retrieved. "The handbook doesn't mention maternity leave" is a fact,
   not a guess.
2. **Résumé vs. portfolio** (this fork) — same argument, same payoff: "his resume doesn't
   list Rust" is provable because the whole résumé is in context, every time.
3. **The current page** (new, page-aware widget) — a visitor reading the assistive vision agent case study
   asking "what did you use here?" has zero lexical overlap with the assistive vision agent in the question
   itself — so that project's chunks get pinned alongside the résumé, bypassing retrieval
   for the one document retrieval is least likely to surface reliably.

Noticing "this is the same shape of problem, a third time" — and reusing the exact
mechanism rather than inventing a new one — is the kind of pattern-recognition this
question is actually testing.

---

## 4. Key decisions (and the one-line "why")

**Why not just fine-tune a model on his CV?**
Fine-tuning bakes facts into weights with no way to prove what's absent, needs retraining
on every résumé edit, and can't cite its source. RAG makes "not in the documents" a
checkable claim, not a hope.

**Why code-verified citations instead of trusting the model?**
The model never writes a citation string. It points at a chunk ID and quotes it; code
slices the real source text and checks the quote actually appears there, token by token,
tolerant of a 1-character OCR-style typo but never a changed digit. A fabricated citation
is structurally impossible, not just discouraged.

**Why a cross-family judge (Gemini) for eval, not another Mistral model?**
Models measurably favor their own family's outputs. A Mistral judge grading a Mistral
answerer is insurance that doesn't insure.

**Why a third prompt file instead of parameterizing the existing one?**
The HR prompt reasons about statutory-floor semantics that make no sense applied to a CV;
the uploaded-KB prompt can't prove absence because nothing in it is pinned. Each is a
genuinely different reasoning job — bolting a flag onto one prompt to make it do a second
job is how prompts rot.

**Why per-project `doc_id`, not one big "projects" blob?**
Page-context pinning matches `Chunk.doc_id` against the URL slug directly. One shared
doc_id for all 20 projects would make "pin the page they're standing on" impossible
without a second lookup layer.

**Why an in-memory rate gate instead of Redis?**
Single free-tier instance, no persistent store to begin with. A gate that resets on
restart is a non-event on this box; reaching for infra the deployment target doesn't have
would be solving a problem that isn't there.

**Why does the widget's color follow the site's accent theme?**
First built with a fixed brand palette on purpose — then changed, on explicit direction, to
track the visitor's chosen accent instead, since the site already lets people pick
blue/red/orange/mono and a chameleon assistant reads as more integrated than a competing
brand bolted on top.

---

## 5. Bugs found & fixed (the good interview material)

Anyone can say "I built a RAG system." Fewer can walk through the specific, non-obvious
bugs that only showed up under real use — that's what actually demonstrates the system was
tested, not just written.

> **🐛 PDF extraction artifact**
> A skills table extracted as `"LanguagesPython, JavaScript..."` — no space between the
> column label and its value. A completely correct model quote ("Python,
> JavaScript/TypeScript...") could never match the source, because "LanguagesPython" is one
> indivisible token to the verifier. Result: a directly-answerable question ("what languages
> does he know?") was falsely refused. Fixed with a targeted regex, not a rewrite of the
> whole extraction — a "smarter" layout-preserving mode was tried first and rejected because
> it broke a *different* paragraph elsewhere on the same page.

> **🐛 Verifier tokenization asymmetry**
> The source-side tokenizer stripped edge punctuation (`"bsc."` → `"bsc"`); the quote-side
> tokenizer didn't. Both under the 4-character fuzzy-match floor, so an exact match was
> required — and never happened. A completely faithful quote containing `"BSc."` was
> silently discarded on a compound question, producing "not found in the provided documents"
> for something the résumé plainly states. The fix was making both sides tokenize
> identically; the regression test asserts this exact case never breaks again.

> **🐛 Silent production gap**
> The persona index built and tested correctly locally — but the `Dockerfile` only had
> `COPY index/`, never `COPY index_persona/`. The app's own design treats a missing index
> directory as a graceful no-op (logs it, keeps serving the other corpus), so this didn't
> fail the build — it just meant the new feature silently never worked in production. Caught
> by checking the live `/health` endpoint after deploy, not by the test suite.

> **🐛 A fake success**
> The site's pre-existing contact form validated input, showed a 2-second fake spinner, then
> claimed "Message sent!" without ever sending anything, anywhere. Every visitor who used it
> believed it worked. Found by reading the handler, not by clicking the button — a fake
> success looks *identical* to a real one from the outside.

> **🐛 Structured markup leaking into human email**
> The model's `<<BOOK>>` marker (UI instruction syntax, stripped before display) was still
> present in the raw text saved to conversation history — which then got emailed to a real
> inbox as literal, visible `<<BOOK>>` text. A control-plane token leaked into a
> human-facing document because two code paths (display vs. storage) cleaned the same
> string differently.

> **🐛 Scope creep via citation laundering**
> Asked to "write a two-sum function," the model complied — because it cited a real resume
> fact ("Python") first, and the verifier only checks *cited* claims, never the uncited prose
> padded around them. An off-topic request smuggled itself past a citation-based trust
> boundary by attaching one legitimate citation to it. Fixed with an explicit prompt scope
> section *and* a code-level regex pre-filter for classic jailbreak phrasing that
> short-circuits before any model call — cheaper and harder to argue with than a prompt
> instruction alone.

**The throughline:** every one of these was caught by actually running the system against a
real question or a real deploy, not by re-reading the code. That's the habit worth naming
explicitly if asked "how do you find bugs like this."

---

## 6. The numbers, if asked

| | |
|---|---|
| Eval questions scored | 16/16 |
| Recall@5 (Tier B) | 1.00 |
| Refusal precision | 1.00 |
| False-refusal rate | 0.00 |
| Tier-D fabrications | 0 |
| Tests passing | 96 |

Six tiers, modeled directly on the original system's eval design: resume facts, project
depth, judgement calls, must-refuse (absent skills), boundary (salary/off-topic), and
page-aware. Small n (16) — worth saying out loud rather than presenting as more precise
than it is.

---

## 7. Security model — defense in depth, not one gate

- **Scope guardrail (prompt-level):** explicit "what this assistant is FOR" section with a
  worked wrong/right example, by direction kept as guidance rather than a hard rate limit —
  a deliberate UX-over-strictness tradeoff, made explicitly, not by default.
- **Injection pre-filter (code-level):** a regex catching classic jailbreak phrasing ("ignore
  your instructions", "act as...") that short-circuits *before* any embedding search or model
  call — the only layer that actually saves API cost on abuse, rather than just declining
  after paying for it.
- **HTML-escaping in emails:** visitor-supplied name/purpose fields are embedded in HTML sent
  to a real inbox — escaped via `html.escape()` with a test asserting a literal `<script>`
  renders as inert text, not a live tag.
- **Honeypot on both entry points** (widget booking card and the homepage contact form): a
  hidden field a human never sees; a bot filling every field trips it. Reports the *same*
  success response either way — telling a bot it was caught only teaches it to leave the
  field blank next time.
- **CORS scoped to one origin,** gated behind an env var so the pre-existing HR demo's
  behavior is byte-for-byte unchanged for anyone who never sets it.

---

## 8. Honest limits — have these ready

> **⚠️ Prompt-only scope enforcement**
> A sufficiently determined jailbreak can still get past a prompt instruction — that's not a
> hard security boundary, and the current design accepts that tradeoff explicitly in
> exchange for not rate-limiting genuine visitors. Worth saying plainly if asked "could this
> be abused" rather than overselling it.

> **⚠️ Cold start**
> Render's free tier sleeps after 15 minutes idle; a recruiter's first click can wait ~60s.
> Mitigated with an uptime pinger and an optimistic-UI loading state, not eliminated.

> **⚠️ LLM sampling isn't fully deterministic**
> Temperature=0 removes sampling as a variable but doesn't guarantee byte-identical output
> across calls — observed directly: the same question occasionally phrased an answer
> differently enough to change which citations survived verification. Hardened with more
> explicit prompt instructions, not eliminated at the source.

---

## 9. Likely questions

**"Walk me through what happens when someone asks a question."**
Question comes in with a `corpus` param. For persona: the résumé (always) plus the current
page's chunks (if any) get pinned; the portfolio gets retrieved via hybrid BM25+dense
search, fused with reciprocal rank fusion. One Mistral call with the assembled context. The
raw output is never trusted — every `[[chunk:id|quote]]` marker is checked against the
actual source text; unverifiable claims are stripped; if nothing survives, refusal is forced
by code, not chosen by the model.

**"How do you know it doesn't hallucinate?"**
I don't rely on the model telling the truth — I rely on code checking it. Every claim needs
a citation; every citation is checked against real chunk text with a span-matching
algorithm; anything that doesn't verify is deleted before the response ever reaches the
user. The eval run confirms zero Tier-D fabrications, but the guarantee doesn't come from
the eval — it comes from the verification step running on every request, always.

**"What would you do differently at scale?"**
The in-memory rate gate and booking cap would need a real store (Redis) the moment there's
more than one instance, since state stops being shared. The single-process two-corpus
design was the right call for a free-tier personal project; at real scale I'd split the
corpora into separate services so one's load doesn't affect the other's latency budget.

**"What was the hardest bug to track down?"**
The verifier's tokenization asymmetry — it didn't look like a bug at all from the code,
since both sides "obviously" did similar-looking string cleanup. It only surfaced by
actually running a real compound question and noticing the answer came back empty despite
the model clearly having the right facts. That's generally been the pattern: the bugs that
survive code review are the ones where two pieces of code each look correct in isolation but
disagree about a shared assumption.

**"Why does this matter for a portfolio, specifically?"**
The worst thing a personal AI assistant can do is invent a credential. Inheriting a
zero-fabrication architecture from a system that was already measured that way is worth
more than any amount of new prompt-engineering — the corpus is the risky part here, not the
retrieval design, so I spent the effort making the corpus exhaustive instead of reinventing
infrastructure that already worked.

---

## 10. Cheat sheet — numbers to have on the tip of your tongue

- **3x** — the same asymmetric pin/retrieve pattern, reused across handbook→résumé→page-context
- **330 + 482** — persona + HR chunks, one service, 133MB combined RSS
- **0** — Tier-D fabrications across the eval run
- **96** — passing tests, all added alongside the bugs that motivated them
- **6** — real, non-obvious bugs found by running the system, not reading it
- **1 char** — the exact fuzzy-match tolerance in the verifier (OCR typos yes, digit swaps never)

---

*Built as a fork of an existing, previously-measured RAG assistant — the persona corpus,
page-aware widget, booking flow, and every fix above are the delta on top of that inherited
architecture.*
