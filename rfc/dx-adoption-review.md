# RFC: DX & Ecosystem Adoption Review

**Type:** design document (discovery only — nothing here is implemented)
**Scope:** all 9 repos in the aestheticfunction org, reviewed as an ecosystem, from the perspective of an adopter with an existing design system.
**Method:** three exploration passes (documentation audit; adopter-journey + bootstrapping; ergonomics + release engineering), with load-bearing claims spot-checked against source. Facts and recommendations are separated throughout; where evidence is missing, an investigation is recommended instead of a conclusion.

## Context

The platform has reached a stable functional baseline: 6 production scenarios, canonical contract ownership in dspack, and byte synchronization enforced across contract consumers. One known operational drift remains: ds-mcp is pinned to dspack-gen v0.1.1 while v0.1.2 is current. The next constraint on the project is no longer capability — it is that **no complete, maintainer-independent adoption path is currently documented, and this review found no evidence of an external adopter completing the journey.** The machine-discoverable half of a contract is automated (dspack-export), the governance half is well-specified (v0.3/v0.4), and the validation story is strong — but the path between them exists only in the maintainer's head. This review maps that path and proposes an impact-ordered roadmap centered on documentation, onboarding, and bootstrapping rather than new platform capability.

**Ecosystem snapshot (facts):** dspack 0.4.0 (spec, unpublished by design) · dspack-emit 0.3.2 (published) · dspack-gen 0.1.2 (published) · ds-mcp 0.3.1 (published) · dspack-export 0.2.0-alpha.0 (private, unpublished) · dspack-studio 0.1.0 (private app) · aesthetic-function 0.1.0 (private app, last commit 2026-06-12) · .github (org profile) · af-site (private brand site; CANON.md governs canonical copy).

---

## 1. Documentation

### Findings (facts)

**Staleness (verified against source):**

| # | Item | Evidence |
|---|---|---|
| D1 | ds-mcp `docs/README.md:119` says "seven read-only tools"; main `README.md:117` and `docs/architecture.md:16` say eleven. The docs copy also mis-describes tool inputs. | spot-checked |
| D2 | dspack-gen `README.md:54` says "`lint` (S1–S3) and `run` (full pipeline) land in later M1 PRs" — both shipped (same file line 130, CHANGELOG 0.1.0). | spot-checked |
| D3 | dspack `README.md:91` describes dspack-export as React-only; export supports Vue 3 + Vuetify 3. | |
| D4 | `examples/shadcn-ui.dspack.json` is **v0.4** in dspack but **v0.1** in ds-mcp (same filename, different spec version; ds-mcp's v0.4 copy is `shadcn-ui-v04.dspack.json`). A newcomer transposing the path between repos silently gets a different spec. | spot-checked |
| D5 | Astryx pin cited as v0.1.4 in dspack `examples/README.md` and studio AUDIT, v0.1.2 in dspack-gen findings; "Meta's Astryx / facebook/astryx" attribution vs the actual npm package `@astryxdesign/core`. | |
| D6 | ds-mcp advertises v0.4 generation while its vendored dspack-gen core is pinned at v0.1.1 (`374e1cd`); 0.1.2's required-props grammar isn't consumed (see §5 — the pin-drift CI job is red). | spot-checked |
| D7 | Minor: dspack-emit README "A2UI v0.9" vs v0.9.1 wording. | |

**Link graph:** the only ecosystem overview is `aestheticfunction/.github/profile/README.md` — comprehensive and current, but **no repo links to it**. dspack (the natural entry point) does not link dspack-emit or dspack-studio. dspack-studio's README is the only complete hub (links all six siblings) but **no sibling links back to it** — the flagship is unreachable by graph navigation. aesthetic-function's README mentions **no dspack repo at all** (it predates the ecosystem framing); three repos point into it, it points nowhere back. No repo carries an ARCHITECTURE/ECOSYSTEM doc.

**Duplication:** canonical sentences are deliberately duplicated and centrally governed by af-site `CANON.md` ("quote verbatim") — this works. Ungoverned duplication is where drift lives: ds-mcp's security/tool docs exist in 4 places (now divergent, D1); the quick-start is duplicated between dspack and ds-mcp with different curl paths (D4's sharp edge).

### Recommendations

**Adopt a hub-and-spoke documentation architecture** rather than fixing READMEs one by one:

1. **One canonical overview, one address.** Keep the org profile README as the single ecosystem overview (it is already the best doc in the org). Add a short, standardized "Part of the dspack ecosystem" breadcrumb block to every repo README linking to it. Do not byte-copy the overview into repos — link, don't vendor (docs are not contracts; byte-sync discipline doesn't apply and would add sync toil).
2. **Per-repo README charter.** Each README states, above the fold: what kind of thing this repo is (spec / library / application / snapshot tool), who its audience is, and links to its *direct* neighbors only (dspack always; whatever it consumes/feeds). Full-mesh linking is not needed once the breadcrumb exists. Studio gets backlinks from dspack and the org-profile-adjacent repos ("see it running").
3. **One source per repo.** ds-mcp's `docs/README.md` should stop restating the tool table and defer to the main README (or vice versa). Divergent copies inside a single repo are the worst failure mode observed.
4. **Fix the staleness list (D1–D7)** as a single sweep. D4 deserves a real fix, not a doc note — but a **compatibility-aware** one: before renaming or removing ds-mcp's v0.1 `shadcn-ui.dspack.json`, inventory everything that may depend on the current path (README curl commands and quick-starts, `scripts/` and test fixtures, round-trip gates in dspack-export, any served identifiers or example paths ds-mcp itself references). Where dependencies exist, ship a deprecation path or compatibility alias rather than a hard rename. The required outcome is invariant, not mechanism: **the same unversioned filename must never ambiguously identify incompatible contract versions across repos.**
5. **aesthetic-function needs an honest status line** in its README (see §4 — this is an owner decision, but the README silence is a doc bug regardless of the decision).

Not recommended: a docs site, a docs monorepo, or auto-generated README tooling — no demonstrated need; the corpus is 9 READMEs and a handful of docs dirs.

---

## 2. Developer onboarding — "I have an existing design system. I want to use dspack."

### Findings (facts): the journey as it exists today

The complete path from "my components + tokens" to "a contract the platform can use":

| Step | What | Today | Prior-knowledge required? |
|---|---|---|---|
| 1 | Extract snapshot (tokens, props, bindings, themes, layout) | `dspack-export init` + `generate` — **emits v0.2** (hard-coded, `src/emit/assemble.ts:130`); tool is unpublished (install from source) | Knowing export exists and its scope |
| 2 | Lift snapshot to v0.4 shape | Manual (additive, so valid, but governance blocks must be added by hand) | Knowing v0.2⊂v0.4 |
| 3 | Author component guidance (`description`, `whenToUse`/`whenNotToUse`, `accessibility`, `composition`, `constraints`) | Manual; export explicitly overwrites these on regeneration | Design-system knowledge |
| 4 | Define `categories` taxonomy; tag components; assign `propRole` | Manual | Design decision |
| 5 | Author `patterns` / `antiPatterns` (+ reasons) | Manual | Design decision |
| 6 | Author `intents` | Manual | Design decision |
| 7 | Author `rules` (4 types, rationale, severity, intent scoping) | Manual | Design decision — "the pattern's prose becomes law" |
| 8 | Author `examples` (worked surfaces; must pass S1+S2); cross-link rules↔examples | Manual (a dedicated fix commit in shadcn history shows the linking is easy to miss) | Deep spec knowledge |
| 9 | Validate | `dspack/scripts/validate.mjs` — exists, thorough (incl. negative-fixture replay) | Knowing the harness lives in the spec repo |
| 10 | Register with ds-mcp | `ds-mcp --dspack ./file` — trivially easy | — |
| 11 | Register with dspack-gen | Add pinned fixture + eval matrix cells + golden context/violating fixtures | Deep harness knowledge |
| 12 | Register with dspack-emit | **Hand-write an emit profile** in `src/transform/profiles.ts` (mapping, synthesized primitives, casualty list) + regenerate goldens | Deep emitter knowledge |

No document anywhere walks this journey. The pieces are individually documented (export's scope note, ds-mcp's `--dspack` flag, gen's sync section, emit's profile concept) but the sequence, and the fact that steps 3–8 are *the actual work*, exists only in maintainer knowledge and git history.

### Recommendations: automate / human-review / design-decision split

- **Can be automated:** steps 1–2 (export should emit the current spec shape directly — see §3, subject to the DX-3 boundary design); step 10 (already trivial); the mechanical parts of 11–12 (fixture placement, golden regeneration are scripted today — what's missing is documentation, not tooling). Step 9 scaffolding (a valid, visibly incomplete contract skeleton) is plausible but its shape is a DX-3 design question, not a settled feature.
- **Should remain human review:** correctness of extracted props/tokens (docgen is heuristic), descriptions and accessibility constraints drafted from source signals (JSDoc, ARIA) — machine-draftable, human-confirmed.
- **Should remain explicit design decisions (never inferred):** categories taxonomy, intents, rules and their rationales, patterns/antiPatterns, worked examples. This is the platform's core honesty claim — DESIGN.md already frames it this way ("guidance that only exists in prose today"). Tooling that pretended to infer governance would be inventing policy and should not be built.
- **Highest-impact single artifact: an adoption guide** (working title `ADOPTING.md`, living in dspack per upstream-first ownership) that walks the 12 steps, states the automate/review/decide split explicitly, and uses the shadcn contract's git history as the worked example of governance authoring. Emit-profile authoring (step 12) gets its own guide in dspack-emit, linked from the main one.
- **Fact worth stating plainly:** there is currently no evidence of any external adopter. The guide and bootstrap parity (§3) are the prerequisites to finding out where the journey actually breaks; deeper automation before that evidence exists would be speculative.

---

## 3. Contract bootstrapping — the role of dspack-export

### Findings (facts)

- Export is **snapshot-only by design**: populates `metadata`, `tokens`, `components` (names/props/JSDoc descriptions), `frameworkBindings`, `themes`, `layout`. It stamps every output: hand-authored sections "are not generated and will be overwritten on regeneration."
- It emits **v0.2** while the canonical contracts are v0.4 — a two-revision gap (additive, so outputs still validate, but adopters start two governance revisions behind).
- It is `0.2.0-alpha.0`, `private: true`, unpublished, last functional change ~Jun 2026 — the stalest active repo after aesthetic-function.
- Extraction sources that exist: react-docgen-typescript + cva + AST (React), full Vue 3 adapter, DTCG token files, CSS custom properties (Tailwind v3/v4), breakpoints. Deterministic, golden-tested, with a round-trip gate against ds-mcp.
- Sources that do **not** exist: Storybook (one aspirational comment), direct Figma API (only indirect via a user-exported DTCG file), any governance extraction (deliberately).
- The machine-discoverable slice of a v0.4 contract is *exactly* the slice export produces. The boundary between export's output and hand-authored governance is the same boundary as v0.2 vs v0.3/v0.4.

### Recommendation: its long-term purpose is **bootstrapping**

Evaluated against the alternatives:

- **Exporting** (current name/framing) undersells it — "export" implies the codebase is the system of record forever; the actual observed use is producing the *starting point* for a governed contract.
- **Migration** implies contract→contract transformation; nothing needs that (spec versions are additive; the validate harness already proves back-compat).
- **Synchronization / drift detection** should be explicitly rejected for this tool: it is aesthetic-function's stated mission, studio already has a purpose-built drift check, and export's own overwrite semantics make it structurally wrong for re-running over an enriched contract. Adding sync would also violate the minimal-governance principle by blurring who owns the contract.
- **Bootstrapping** matches its architecture (one-shot, deterministic, honest about what it can't know) and matches the adoption journey: it is step 1 of 12.

Concrete implications (design, not implementation):

1. **Emit the current spec shape** (v0.4 today) for the sections export already populates, so adopters no longer start two governance revisions behind. How the *unpopulated* governance surface is represented is a design question the bootstrap milestone must answer first, not a foregone conclusion — see the three-state boundary in DX-3. This RFC deliberately does not settle whether that means emitted stub blocks, a scaffold manifest, or documentation-only delineation.
2. **Regeneration must refuse to overwrite human-authored governance by default.** The current documented behavior ("will be overwritten on regeneration") is acceptable only for a one-shot snapshot; the moment the tool is positioned as the start of an authored contract's life, destructive-by-default regeneration is a data-loss footgun. Separate *snapshot* (fresh extraction) and *bootstrap* (start a contract) operations are worth considering, but the command design should not be settled in this RFC — current repository evidence (a single-command CLI with no enriched-contract users yet) does not support committing to one.
3. **Publish it.** An unpublished, install-from-source alpha is a dead end for the one tool that starts the adoption journey.
4. **Reposition the README** around the journey: "produces the discoverable half of a contract; the adoption guide covers the rest."
5. **Decide later, with evidence:** whether a preserve-on-regenerate *merge* mode (beyond the refuse-by-default guard above) is needed. It only matters once a real adopter regenerates after enriching — recommend waiting for that demand rather than designing a merge algorithm now.

### Bootstrap sources compared

| Source | Discovers | Status | Assessment |
|---|---|---|---|
| Repo inspection (docgen/cva/AST/Vue) | Props, enums, defaults, bindings, sub-component structure | **Exists, strongest** | Code is ground truth for a code design system. Keep as primary. |
| DTCG token files | Tokens, themes | **Exists** | Also the neutral bridge *from* Figma/Tokens Studio/Style Dictionary — one format, many upstreams. |
| CSS custom properties | Tokens, dark themes | **Exists** | Complements DTCG for systems without token files. |
| Storybook | Candidate usage examples (stories are real composed surfaces), argTypes, prose docs | Absent | **Most promising uninvestigated source** — stories could seed *candidate* worked examples and whenToUse drafts, flagged for human confirmation. Recommend a time-boxed investigation, not a commitment: the open question is whether story→surface translation is tractable without a per-DS mapping (which is the emit-profile problem in reverse). |
| Figma API / MCP (e.g. figma-console-mcp: variables, component metadata, styles) | Tokens (duplicate of DTCG path), component inventory, variants | Absent | For an *existing code* design system, Figma is upstream design intent, not ground truth — extracted props can conflict with shipped code. The DTCG file path already captures Figma's token value without an API dependency. Direct integration is only justified for design-first adopters (Figma-only systems with no code yet) — a different persona with no demonstrated demand. **Recommend: no integration now; note the persona in the adoption guide; revisit on demand.** |
| Runtime/ARIA inspection | Accessibility drafts | Absent | Marginal; JSDoc+ARIA static signals likely sufficient for drafts. Not worth building yet. |

**The honesty boundary (restated as the design principle for all bootstrap tooling):**
- *Discoverable vocabulary:* token names/values/types, component names, props/enums/defaults, bindings, themes, breakpoints, sub-component structure.
- *Machine-draftable but human-confirmed:* descriptions, propRole tagging, accessibility constraints, candidate examples (if Storybook investigation pans out), theme/tier classification.
- *Never honestly inferable:* categories taxonomy, intents, rules + rationales, patterns/antiPatterns, severity choices, which examples become law. These encode decisions ("your team deprecated the old card") that exist in no artifact. Any tool claiming to extract them is fabricating governance.

---

## 4. Repository ergonomics

### Findings (facts)

- Library/app/spec identity is clear from structure once you're inside a repo (bin/exports/dist vs apps/); the problem is *between* repos: no entry-point routing (§1), and two repos whose status is ambiguous:
  - **aesthetic-function**: dormant 6 weeks while everything else moved; README never mentions dspack; positioned by three inbound links as the reconciliation half of the story. Ambiguity: is it superseded, paused, or a future pillar?
  - **dspack-export**: private alpha, v0.2 emitter, last functional change Jun 2026 — yet it is the designated first step of adoption.
- Tooling inconsistencies: npm (5 repos) vs pnpm (studio 10.25, AF 9.14); sync check is `npm run check:sync` in three repos but a bare script (no npm alias) in ds-mcp; script verbs otherwise diverge per repo (defensible — the repos do different things).
- dspack-gen's root carries ~10 `out-candidate-*` model-run dirs plus `spike/`, `out-postfix/` etc. — eval dataset exhaust in the top-level listing of a published library.
- Not a monorepo, deliberately: "no shared types/utils package" is written into every sync-script header; byte-copy + drift gates are the chosen substitute.

### Recommendations (only where friction is material)

1. The wayfinding fixes in §1 (breadcrumb + charter blocks) are the ergonomics fix — routing is a docs problem here, not a repo-layout problem.
2. **Decide aesthetic-function's status explicitly** (owner decision; the review's job is to force the question): (a) active pillar → its README joins the ecosystem and links siblings; (b) paused → one status line saying so and what would resume it; (c) superseded → archive on GitHub. Any of the three beats the current silence. Same decision, smaller stakes, for the `dspack-a2ui-demo` remnants if any exist publicly.
3. **ds-mcp gets a `check:sync` npm script** (parity with the other three consumers; trivial).
4. **Move dspack-gen's model-run output dirs** under one ignored/archived path so the repo's top level reads as a library. Cosmetic but it's the first screen an evaluator sees.
5. **Do not consolidate into a monorepo.** The byte-copy design is explicit, documented, and its costs are real but automatable (§5). Recommending a monorepo would relitigate a decision the sync-script headers show was made knowingly — and upstream-first ownership across separately-versioned public repos is part of the platform's story.

---

## 5. Release engineering

### Findings (facts)

- **Publish automation is uneven:** dspack-gen and ds-mcp have byte-sibling tag-triggered OIDC trusted-publish workflows (node 24, tag==version guard — hardened by a real E404 incident memorialized in comments and PR #41). **dspack-emit is published but has no release workflow and no CHANGELOG** — 0.3.2 shipped inside a feature PR, published by hand.
- **Node drift in copy-pasted CI:** 20 (four repos) / 22 (studio) / 24 (release workflows, deliberately). No shared workflow templates exist (`.github` repo has only `profile/`).
- **Live drift right now:** ds-mcp's `core-pin-drift` job (report-only) is red — pin at gen v0.1.1 while 0.1.2 changed `core/compiler.ts` (required-props grammar). The documented remedy is the manual re-pin → rebuild → golden-verify → republish ritual (previously executed at least three times: ds-mcp PRs #13, #14, #21).
- **Propagation cost of one contract change is 5–6 coordinated PRs across 5 repos** (measured on the v2.3.0 record-collection chain of 2026-07-22: dspack #23 → gen #45 (+goldens) → ds-mcp sync → studio #23 → emit #21 (+publish) → studio #24 (consume)). Each leg is guarded by a green `check:sync`, and the ordering protocol is written down — the mechanism is sound; the toil is the finding.
- **Pin-style inconsistency:** caret (gen→emit), exact (studio-contracts→emit, all @astryxdesign/@a2ui), 40-char git pin (ds-mcp→gen), and a likely-oversight mismatch inside studio (`apps/agent` ^0.1.2 vs `apps/web` ^0.1.1). External pins trail published versions (@astryxdesign/core 0.1.4 pinned vs 0.1.7 published; @a2ui/web_core 0.10.3 vs 0.10.5) — possibly deliberate, undocumented either way.

### Recommendations

1. **Immediate maintenance (do first, independent of any milestone):** re-pin ds-mcp to gen v0.1.2, rebuild, verify golden context, republish. The red report-only job is the system working; leaving it red normalizes ignoring it.
2. **Give dspack-emit the same release workflow** the other two published packages have (the pattern is proven; this is copy, not design) plus a CHANGELOG.
3. **Standardize CI node versions** — test on what release publishes with, or document the 20/24 split once, org-wide.
4. **Extract the shared workflow patterns** into `aestheticfunction/.github` as GitHub reusable workflows or workflow-templates (test + tag-release). This is not a speculative abstraction: five near-identical files with recorded drift and one recorded incident is demonstrated need. Keep per-repo gate scripts as-is — only the scaffolding is shared.
5. **Write the pin policy down** (one paragraph, org profile or dspack CONTRIBUTING): when exact, when caret, when git-pin; fix the studio-internal mismatch; state whether @astryxdesign/@a2ui pins are frozen deliberately (if yes, say why; if no, schedule the bump).
6. **Sync fan-out automation — investigate before building.** The byte-copy invariant should stay; the toil is the 4 downstream *sync PRs* being opened by hand. Candidate mechanism: a `repository_dispatch` from dspack on `examples/*` changes that runs each consumer's `check:sync --write` and opens the PR (goldens still regenerated and reviewed by a human — the gen leg genuinely needs judgment when goldens change). Recommend a short design spike measured against the next real contract change, not a build commitment: the chain has run ~3 times; automation pays off only if contract-change frequency stays at this level or grows with adopters.

---

## 6. Prioritized roadmap

Ordered by adoption impact, not effort. New series (the P-series milestone framing ended with the studio launch; these are **DX-series** milestones). Facts above; everything below is recommendation.

### DX-0 · Ops debt (immediate, no milestone ceremony)

1. Update ds-mcp's vendored dspack-gen core from v0.1.1 to the exact v0.1.2 source revision, rebuild generated artifacts, verify golden context output, run the full applicable test and drift suites, release the next valid ds-mcp patch version through trusted publishing, and verify the published tarball.
2. Resolve the dspack-studio internal dspack-gen version mismatch (`apps/agent` ^0.1.2 vs `apps/web` ^0.1.1), confirming first whether the differing pins are accidental or intentionally isolated by application.

These are narrowly scoped maintenance changes — not combined with DX-1 documentation work unless repository mechanics require it. **Completion criterion: every operational synchronization and pin-drift signal is green.**

### DX-1 · Truth & wayfinding (highest impact per unit effort)
Fix staleness D1–D7 (D4 via the compatibility-aware path in §1). Add the ecosystem breadcrumb to every README → org profile. Add charter lines (kind/audience/neighbors) per README; backlink studio from siblings; single-source ds-mcp's docs. aesthetic-function status decision + status line. *Why first: cheapest milestone, and every later milestone's docs land on this architecture.*

**Definition of done (verified, not asserted):**
- From every public repository's README, the ecosystem overview is reachable in one click.
- Every README's charter (kind / audience / neighbors) is accurate against the repo's actual package.json and structure.
- D1–D7 are each resolved with a pointable diff.
- Example-contract naming is compatibility-safe: no unversioned filename resolves to incompatible contract versions across repos, and every pre-existing dependent path (curl commands, scripts, tests, round-trip gates) still works or has an explicit deprecation notice.
- Every link and quick-start command in touched READMEs is executed as written from a clean environment and succeeds.

### DX-2 · The adoption guide
`ADOPTING.md` in dspack (upstream-first): the 12-step journey, the automate/review/decide table, shadcn-history as the governance-authoring worked example; emit-profile guide in dspack-emit; ds-mcp/export/gen READMEs link into it at their steps. *Why second: governance authoring can't be automated even in principle, so the guide — not tooling — is the adoption unlock. Also the cheapest way to discover which steps actually hurt.*

**Definition of done (verified, not asserted):**
- A technically competent newcomer (no prior project knowledge) can follow **one canonical path** from an existing code design system to a **locally validated contract** (passes `dspack/scripts/validate.mjs`) starting from clean checkouts, using only the guide.
- At every step, the guide explicitly labels which of three modes applies: automated step, human review of machine output, or explicit design decision — with no unlabeled gaps between steps.
- The walkthrough is executed end-to-end at least once by someone (or a fresh session) without access to maintainer memory, and every point where the guide had to be supplemented is folded back in before the milestone closes.

### DX-3 · Bootstrap parity (dspack-export becomes the bootstrapper)
**First, a design deliverable:** specify and verify the boundary between three contract states — (a) *generated vocabulary* (the machine-discoverable sections export owns), (b) a *visibly incomplete contract scaffold* (a valid document that self-identifies which governance surfaces are unauthored), and (c) a *reviewed, governance-complete contract* (human-owned; the tool never writes here). Only then implement against that boundary: emit current-spec (v0.4) vocabulary; make **regeneration refuse to overwrite human-authored governance by default**; publish to npm; reposition README as journey-step-1; extend the round-trip gate to a gen-context smoke. Separate snapshot vs bootstrap operations may fall out of the boundary design, but the command design is not settled by this RFC. Explicitly out of scope: merge-on-regenerate algorithms, Storybook, Figma. *Why third: it's the only code milestone with demonstrated need, and DX-2 defines exactly what its output must hand off to.*

### DX-4 · Release hygiene
emit release workflow + CHANGELOG; shared reusable workflows in `.github`; node-version alignment; pin policy paragraph; `check:sync` script parity in ds-mcp; tidy dspack-gen root output dirs. *Grouped because each item is small and they share the same review surface.*

### DX-5 · Investigations (time-boxed spikes, explicitly not commitments)
(a) Sync fan-out automation design spike, measured against the next real contract change. (b) Storybook → candidate-examples feasibility (the one bootstrap source that could draft governance *inputs* honestly, i.e. as human-confirmed candidates). (c) Figma-direct persona: only if a design-first (no-code) adopter materializes. Each produces a written verdict — build, drop, or wait — with evidence.

**Deferred by principle:** generator/emitter capability work (no demonstrated need beyond current parity), monorepo consolidation (relitigates a documented decision), governance inference of any kind (violates the honesty boundary), docs site (corpus too small).

---

## Status & next steps

This RFC is a design document; accepting it commits the org to the DX-series ordering and the design constraints above, not to any implementation. It lands via a documentation-only PR containing this file and nothing else — no DX-0 or roadmap item is implemented as part of it.

Owner decisions this RFC leaves open: aesthetic-function's status (§4.2); whether the @astryxdesign/@a2ui pins are deliberately frozen (§5.5); the pin policy itself (§5.5); and sign-off on the DX-3 three-state boundary design before any bootstrap implementation.

**Verification:** every fact in §§1–5 carries a file/line or PR reference; the five highest-leverage claims (the v0.2 hard-code, the tool-count contradiction, the stale M1 sentence, the git pin, the filename collision) were independently re-verified in source during this review.

---

## Implementation status (updated 2026-07-22)

| Milestone | Status |
|---|---|
| DX-0 · Ops debt | ✅ Complete — ds-mcp 0.3.2 released on the exact dspack-gen v0.1.2 tag commit; studio range mismatch resolved (stale drift, not isolation); all synchronization and pin-drift signals green. |
| DX-1 · Truth & wayfinding | ✅ Complete — D1–D7 resolved (D4 via compatibility-aware rename); breadcrumb + charter in every public README; studio backlinked; ds-mcp docs single-sourced; owner decision recorded: **aesthetic-function is paused**. All links and quick-starts executed from clean environments. |
| DX-2 · The adoption guide | ✅ Complete — [`ADOPTING.md`](../ADOPTING.md) (12 steps, each labeled automated / human review / design decision) and [dspack-emit `docs/PROFILES.md`](https://github.com/aestheticfunction/dspack-emit/blob/main/docs/PROFILES.md); verified by executing the guide end to end from clean checkouts, with the walkthrough's clarifications folded back before completion. |
| DX-3 · Bootstrap parity | ▶ Next — **design first, then code**, per this RFC's DX-3 definition. |

### Correction the roadmap inherits (from DX-2)

This RFC's §2 step 12 and §6 assumed rendering a new design system requires
hand-editing `dspack-emit/src/transform/profiles.ts`. DX-2 established that
is wrong for adopters: **profiles are pure data authored in the consumer's
own codebase against the published package** (dspack-studio's
`astryx-profile.ts` does exactly this). The in-repo profile is only for
ecosystem-canonical contracts. `ADOPTING.md` and `PROFILES.md` are the
canonical description of the adoption journey from here; where this RFC's
§2 table and those guides disagree, the guides win.

### DX-3 design inputs from the DX-2 walkthrough

Evidence, not implementation. The first DX-3 deliverable is a design that
addresses these; none of them is to be coded before that design exists.

1. **No standalone validation entry point** (evidence-backed): the only way
   to validate an adopter contract is copying it into a dspack checkout's
   `examples/` directory (`ADOPTING.md` step 10 documents this honestly).
   The design must decide how validation is surfaced independently of a
   checkout — options (published harness, `validate --file` flag, separate
   CLI) are deliberately **not** chosen here.
2. **dspack-export's unpublished, v0.2-emitting state is the primary
   bootstrap bottleneck** (confirmed in practice): install-from-source and
   the manual version relabel were the only mechanical rough edges in an
   otherwise smooth Phase 1.
3. **Output naming surprise** (documented, not solved): the output filename
   derives from `package.json`'s `name` with a placeholder fallback.
   Recorded for the DX-3 design; deliberately not patched ahead of it.
4. **Preservation invariant** (positive finding): the validated workflow —
   *snapshot → commit → enrich the committed copy → never regenerate over
   enrichments* — is now the documented behavioral contract in
   `ADOPTING.md`. Any DX-3 regeneration design (including the
   refuse-by-default overwrite guard this RFC already requires) must
   preserve exactly this shape; the three-state boundary (generated
   vocabulary / visibly incomplete scaffold / governance-complete) is
   designed against it.
