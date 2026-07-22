# RFC: DX-3 Bootstrap Design — boundary, regeneration, standalone validation

**Type:** design document. Nothing here is implemented; accepting it fixes
the boundary and the guarantees, not the code.
**Prerequisite reading:** [dx-adoption-review.md](./dx-adoption-review.md)
(the DX-series RFC, §3 and §6 DX-3) and
[ADOPTING.md](../ADOPTING.md) (the behavioral contract this design must
preserve).
**Primary evidence:** the DX-2 verification walkthrough — the adoption
guide executed end to end from clean checkouts — plus repository facts
cited inline.

## 1. Inputs: observed friction, separated from proposals

| # | Observation (fact) | Source |
|---|---|---|
| F1 | The only way to validate an adopter contract is copying it into a dspack checkout's `examples/` directory; `scripts/validate.mjs` has no file argument. | walkthrough step 10; `scripts/validate.mjs` (`EXAMPLES_DIR` fixed) |
| F2 | dspack-export is unpublished (`private: true`, install from source) and emits `"dspack": "0.2"` hard-coded (`src/emit/assemble.ts:130`); adopters relabel to `0.4` by hand. These were the only mechanical rough edges in an otherwise smooth Phase 1. | walkthrough steps 1–2 |
| F3 | Export output is deterministic, and its metadata stamps: hand-authored sections "are not generated and will be overwritten on regeneration." Destructive-by-default regeneration is documented, not guarded. | export README; generated `metadata` |
| F4 | The workflow that worked in practice — *snapshot → commit → enrich the committed copy → never regenerate over enrichments* — is now the documented behavioral contract (ADOPTING.md Phase 1). | walkthrough; ADOPTING.md step 1 |
| F5 | Output filename derives from `package.json` `name` (placeholder fallback) — surprising, documented, harmless. | walkthrough step 1 |
| F6 | Emit profiles are consumer-authored data against the published dspack-emit package; contracts need no ecosystem-repo changes to be used. (Correction inherited by the roadmap in dx-adoption-review.md's status section.) | DX-2; studio `astryx-profile.ts` |
| F7 | `metadata` legally carries extension keys today: `additionalProperties: true` in the v0.4 schema, with `x-upstream` in the astryx contract as live precedent. | `schema/dspack.v0.4.schema.json` `$defs/metadata`; `examples/astryx.dspack.json` |
| F8 | The spec's versions are strictly additive; a v0.2-shaped document relabeled `"0.4"` validates (proven by the harness's back-compat step and by the walkthrough). | `scripts/validate.mjs` step 3; walkthrough step 10 |

Everything below is proposal, designed against F1–F8.

---

## 2. The three-state boundary

A contract document is in exactly one of three states. The boundary is
**data in the document**, not tool memory, so every tool (and every human)
can read it.

### State A — generated snapshot

What `dspack-export generate` produces: `metadata`, `tokens`, `components`
(names, props, JSDoc-derived descriptions), `frameworkBindings`, `themes`,
`layout` — the machine-discoverable slice and nothing else. Declared
current-spec version (see §5). Deterministic.

### State B — scaffold (visibly incomplete)

State A plus a **bootstrap ledger** the tool writes into `metadata` under
an extension key (F7 makes this schema-legal today, zero spec change):

```json
"metadata": {
  "generatedBy": "dspack-export@<version>",
  "x-bootstrap": {
    "spec": "0.4",
    "generated": {
      "tokens":            "<content-hash>",
      "components":        "<content-hash>",
      "frameworkBindings": "<content-hash>",
      "themes":            "<content-hash>",
      "layout":            "<content-hash>"
    },
    "awaitingAuthorship": ["categories", "intents", "rules", "examples",
                            "patterns", "antiPatterns",
                            "components.*.whenToUse", "components.*.accessibility",
                            "components.*.composition", "components.*.constraints"]
  }
}
```

- `generated` records which sections the tool owns **and a content hash of
  each as generated** — the mechanical basis for every regeneration
  decision in §3. Hashing is over the canonical (deterministic) JSON of
  the section, so "untouched" is byte-checkable.
- `awaitingAuthorship` is the visible incompleteness: a fixed list naming
  the governance surfaces a human has not yet written. It is a statement
  *about* the document, not fake content — **no empty governance blocks
  are emitted**. (Rejected alternative: emitting empty `rules: []` etc.
  conflates "unauthored" with "deliberately none" — a team with zero
  anti-patterns is a legitimate governance-complete state, and empty
  arrays cannot carry that distinction.)
- Humans delete entries from `awaitingAuthorship` as they author those
  surfaces. Tools never police that list; it is a checklist for people,
  rendered meaningful by the validator's existing consistency checks.

### State C — governance-complete (human-owned)

**Defined by an act, not a marker: deleting `x-bootstrap`.** A document
without a ledger is human-owned in its entirety; the bootstrap tool
refuses to touch it (§3). There is deliberately no "complete" flag, no
sign-off field, and no tool-enforced review state — validation green plus
the team's own review process is what "complete" means, per the
minimal-governance principle. Graduation is one deleted key.

(Rejected alternative: a `status: complete` marker — it would invite tools
to gate on editorial judgment the ecosystem has no business mechanizing.)

### Ownership rule (the boundary in one sentence)

The tool owns exactly the sections named in `x-bootstrap.generated`,
*only while their hashes match*; everything else — including a generated
section the moment a human edits it — is human-owned, and the ledger is
the instrument that makes the handoff detectable.

---

## 3. Regeneration semantics

Preservation guarantee first, mechanism second. The guarantee, inherited
from F4 and stated as the invariant any implementation must satisfy:

> **Regeneration never destroys human-authored content. When in doubt, it
> refuses and says why.**

Decision table for `dspack-export generate` when the output file exists:

| Existing file | Behavior |
|---|---|
| No `x-bootstrap` ledger | **Refuse, always.** The document is human-owned (State C, or predates the ledger). Message points at the ADOPTING.md workflow and at `--out` for writing a fresh snapshot elsewhere. No flag overrides this. |
| Ledger present; every `generated` hash matches; no sections beyond the generated set | Pure State A/B snapshot, untouched. Regenerate in place; rewrite ledger hashes. |
| Ledger present; hashes match; **human-authored sections present** (governance blocks, guidance fields) | **Refuse.** The correct move is a fresh snapshot to a new path (`--out`) and a human-driven comparison. Merge is not designed here (see §7). |
| Ledger present; any `generated` hash differs | **Refuse.** A human edited inside tool territory; regenerating would destroy that edit. Name the mismatched sections. |

Consequences:

- The ADOPTING.md discipline ("commit, then enrich; don't regenerate over
  enrichments") stops being advice and becomes enforced behavior — the
  documented warning ("will be overwritten") is replaced by a guarantee
  ("will refuse"). This is a strict strengthening of the behavioral
  contract, and the only ADOPTING.md edit implementation will require
  (see §6).
- There is deliberately **no `--force`** in this design. Overwriting a
  refused file is expressible with `rm`/`--out`; a force flag would be an
  invitation to script away the invariant.
- `--out <path>` (new) makes the refusal paths ergonomic and resolves F5
  as a side effect: default naming stays as-is (documented), `--out`
  overrides it. Nothing else about naming changes.

---

## 4. The standalone validation surface

**Principle: one validator.** `scripts/validate.mjs` is the semantics
owner — it carries the schema checks, back-compat, governance consistency
(S1/S2 over embedded examples), categories consistency, and the
negative-fixture replay that proves all of it non-vacuous. The design
rejects any second implementation of those semantics (in export, ds-mcp,
or elsewhere): validators drift, and this one is guarded by fixtures.

Surface it in two stages, same code path throughout:

1. **`--file` mode** (in-repo): `npm run validate -- --file <path...>`
   validates the named document(s) with exactly the checks the examples
   get. Zero new semantics; the CI harness and the adopter run the same
   function. This alone dissolves F1's copy-into-checkout ritual for
   anyone willing to clone.
2. **A published thin CLI** (`dspack-validate`) wrapping the same module,
   so validation needs no checkout at all: `npx dspack-validate
   your-system.dspack.json`. This requires publishing from the dspack
   repository for the first time — an owner decision (§8), because the
   repo's charter currently says "not an npm package." The CLI ships the
   schemas it validates against; its version tracks the spec version.

Relationship contract: the published CLI is a *distribution* of the
harness, never a fork. If the two can disagree, the design is being
violated. (ds-mcp's `validate-ui` and dspack-gen's `lint` are unaffected —
they check *surfaces* at generation time; this surface checks *contract
documents* at authoring time. Different artifact, same upstream
ownership.)

---

## 5. dspack-export: today's workflow → the bootstrap tool

Scope of the transition (implementation milestone, once this design is
approved). Everything here preserves the ADOPTING.md behavioral contract;
the checklist below is the acceptance test for that claim.

1. **Emit the current spec version** — replace the hard-coded `'0.2'`
   (F2) with a per-release pinned spec version, declared in output
   `metadata` and the ledger. The manual relabel (ADOPTING.md step 2)
   disappears. Safe by F8 (additivity), and the populated sections are
   unchanged — export writes no governance, same as today.
2. **Write the `x-bootstrap` ledger** (§2) and **implement the refusal
   table** (§3). This is the boundary landing in code.
3. **Publish to npm** (`@aestheticfunction/dspack-export`) — F2 names
   install-from-source as half the bottleneck; a bootstrap tool that
   starts the journey cannot stay a source checkout. Owner decision on
   timing/scope-name in §8.
4. **`--out`** as specified in §3. No other CLI redesign; snapshot and
   bootstrap remain one command whose *behavior* differs by the states in
   §2 — the DX-series RFC's "separate snapshot vs bootstrap operations"
   question resolves as **no**: the decision table makes one command
   unambiguous, and a second verb would add surface without adding
   safety.

**Behavioral-contract preservation checklist** (each must still hold after
implementation, verified by re-running the DX-2 walkthrough):

- [ ] Deterministic output — same input, same bytes (ledger hashes
      included).
- [ ] Populated sections exactly as documented in ADOPTING.md step 1; no
      governance content emitted, ever.
- [ ] Snapshot → commit → enrich remains the workflow; regeneration over
      enrichments now *refuses* instead of warning (the one ADOPTING.md
      edit: step 1's caution paragraph becomes a guarantee statement).
- [ ] ADOPTING.md step 2 (manual relabel) deleted; step numbering
      otherwise intact.
- [ ] A document that validated before the transition validates after it
      (ledger is additive metadata; F7).

## 6. Documentation deltas this design will cause

Named now so they are scoped, not discovered: ADOPTING.md step 1
(warning→guarantee, npm install replaces clone), step 2 (deleted), step 10
(replace the copy-into-checkout mechanics with `--file`/`dspack-validate`
once each ships). PROFILES.md: untouched. The guides remain canonical
(per the tracker's correction note); this RFC defers to them on workflow
description.

## 7. Explicitly out of scope (unchanged from the DX-series RFC, plus one)

- **Merge-on-regenerate** — still deferred until a real adopter
  regenerates after enriching and the refusal path proves insufficient.
  The §3 table is designed so merge can be added later without changing
  any existing guarantee.
- **Machine-drafted guidance** (descriptions/propRole/accessibility as
  `draft`-flagged ledger entries), **Storybook ingestion**, **Figma
  integration** — all remain investigation-gated (DX-5 territory).
- **Renaming dspack-export** — the purpose is bootstrapping; the name says
  export. Repositioning is done in docs; a repo/package rename is a
  branding decision with migration cost and no adopter evidence demanding
  it. Deferred, explicitly.

## 8. Owner decisions required before implementation

1. **Boundary sign-off** — §2's ledger mechanism (`x-bootstrap`,
   hash-based ownership, deletion-as-graduation) and §3's refusal table,
   including the deliberate absence of `--force` and of any
   "complete" marker.
2. **dspack repo publishes a CLI** (§4 stage 2) — reverses the repo's
   "not an npm package" charter line. Stage 1 (`--file`) needs no
   decision and can land with implementation regardless.
3. **dspack-export npm publication** — name (`@aestheticfunction/dspack-export`
   as-is?), and whether it ships before or with the version-emission
   change (recommendation: with it — publishing the v0.2-emitting tool
   would immediately create the relabel friction for a wider audience).
4. **Ledger key stewardship** — `x-bootstrap` stays tool-owned metadata
   (recommendation), or gets a note in the spec's extension conventions.
   Recommendation is tool-owned: the spec stays silent on tool workflow,
   per minimal governance.

Pin policy and the external-dependency freeze remain open from the
DX-series RFC and are not needed by this design.
