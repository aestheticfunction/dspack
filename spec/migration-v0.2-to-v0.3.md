# Migrating from dspack v0.2 to v0.3

**Short version: change `"dspack": "0.2"` to `"0.3"` and you are done.** v0.3 is strictly
additive; everything else in this guide is about what you can *now add*, not what you must
change.

## What changes

Nothing, structurally. v0.3 adds three optional top-level blocks:

| Block | Purpose |
| --- | --- |
| `intents` | Named kinds of UI requests; the scoping vocabulary for rules and examples. |
| `rules` | Machine-checkable governance: typed, deterministic predicates + rationales. |
| `examples` | Compilable example surfaces per intent; documentation and few-shot exemplars in one artifact. |

No existing field changes meaning, type, or required status. No field is removed.

## Validity guarantees

- **Any valid v0.2 document with `"dspack"` set to `"0.3"` validates against the v0.3
  schema.** This is the same guarantee v0.2 gave v0.1 documents.
- **v0.2 consumers ignore the new blocks.** Per the v0.2 extensibility rules, unknown
  top-level properties are ignored, so a v0.3 file degrades safely in tools that only know
  v0.2 (this repository's validation harness checks the stripped-document guarantee on every
  run).
- **Forward:** a v0.3 document remains valid under future v0.4 schemas; new rule *types*
  arrive additively, and a v0.3 linter encountering one fails loudly rather than skipping it
  (spec §5.4–§5.5).

## Also new in v0.3 (companion artifact, not part of the contract document)

The **dspack surface** format (`schema/dspack.surface.v0_1.schema.json`, spec §7): a
protocol-neutral component tree used as the evaluation target for rules and the payload of
`examples[].surface`. Contracts embed surfaces only inside `examples[].surface`; standalone
`.dsurface.json` files are pipeline artifacts, not contract content.

## What you gain by migrating

Your contract likely already records governance as prose — `antiPatterns`, `constraints`,
`whenToUse`, `composition.notes`. v0.3 lets you shadow the enforceable subset with rules that
a linter can check and a generation pipeline can enforce, while the prose stays authoritative
for humans.

### Worked conversion: anti-pattern → rule

The shadcn/ui example ships this v0.2 anti-pattern (unchanged in v0.3):

```json
{
  "id": "dialog-for-destructive-actions",
  "name": "Using Dialog for Destructive Confirmations",
  "description": "Using the dismissible Dialog component instead of AlertDialog when confirming a destructive or irreversible action.",
  "reason": "Dialog can be dismissed by clicking the overlay or pressing Escape, which means a user can accidentally bypass the confirmation without making a conscious choice. …",
  "severity": "must-not",
  "insteadUse": "destructive-action-confirmation",
  "components": ["dialog", "alert-dialog"]
}
```

Its machine-checkable shadow in v0.3 (now also in the example contract):

```json
{
  "id": "rule.destructive-requires-alertdialog",
  "type": "component-choice",
  "severity": "must",
  "appliesTo": { "intents": ["destructive-action"] },
  "require": ["alert-dialog"],
  "forbid": ["dialog"],
  "rationale": "Dialog can be dismissed by clicking the overlay or pressing Escape, so a user can bypass a destructive confirmation without making a conscious choice. AlertDialog forces an explicit confirm/cancel decision and is announced with greater urgency by screen readers.",
  "examples": ["ex.delete-account-confirmation"]
}
```

What moved where:

| Anti-pattern (prose) | Rule (predicate) |
| --- | --- |
| `description` — the mistake | `forbid: ["dialog"]` + `require: ["alert-dialog"]`, scoped by `appliesTo.intents` |
| `reason` | `rationale` (verbatim in lint findings and repair feedback) |
| `severity: "must-not"` | `severity: "must"` — polarity lives in require/forbid arms, so only `must`/`should` exist on rules |
| `insteadUse` (pattern id) | intent's `relatedPatterns` + the rule's `examples` (a compilable corrected reference) |

The anti-pattern stays in the document: it explains the *why* at reading time; the rule
enforces the *what* at lint time.

### Migration recipe

1. Bump `"dspack"` to `"0.3"` (and `$schema`, if you point at the schema file).
2. Identify the intents your governance actually scopes to (start with one; the example
   contract starts with `destructive-action`).
3. For each `must`/`must-not`-grade constraint or anti-pattern that is *structurally
   checkable* (component presence, required/forbidden composition, prop values), write the
   rule and link a compilable example. Leave the prose in place.
4. Constraints that are not structurally checkable in v0.3 (ordering, category-based,
   token usage — spec §9) stay prose for now; they are v0.4 rule-type candidates.
5. Validate: `npm ci && npm run validate` in this repository checks schema validity, the
   stripped-document back-compat guarantee, cross-reference consistency, and every
   `examples[].surface` against gates S1 and S2.
