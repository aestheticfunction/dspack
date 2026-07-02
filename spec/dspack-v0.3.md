# dspack Specification — v0.3 (delta)

**Status: draft.**

This document specifies dspack v0.3 as a **delta over v0.2**. Everything in the
[v0.2 specification](./dspack-v0.2.md) remains normative and unchanged; v0.3 is strictly
additive. A valid v0.2 document with `"dspack": "0.3"` is a valid v0.3 document.

v0.3 adds the **governance blocks**: three optional top-level properties — `intents`, `rules`,
and `examples` — that make a subset of a design system's institutional knowledge
machine-checkable. v0.2 already records governance as prose (`patterns`, `antiPatterns`,
`whenToUse`, `constraints`, `composition.notes`); v0.3 lets a contract shadow that prose with
deterministic predicates that a linter can evaluate and an agent pipeline can enforce. Prose
remains authoritative for humans; rules are authoritative for tools.

The matching JSON Schema is [`schema/dspack.v0.3.schema.json`](../schema/dspack.v0.3.schema.json).
A companion schema, [`schema/dspack.surface.v0_1.schema.json`](../schema/dspack.surface.v0_1.schema.json),
defines the **dspack surface** document — the artifact rules are evaluated against (§7).

## Table of Contents

- [1. Conformance](#1-conformance)
- [2. File Identification](#2-file-identification)
- [3. The Three Layers](#3-the-three-layers)
- [4. Intents](#4-intents)
- [5. Rules](#5-rules)
- [6. Examples](#6-examples)
- [7. The dspack Surface Format](#7-the-dspack-surface-format)
- [8. Validation Gates](#8-validation-gates)
- [9. Deliberate Ceiling](#9-deliberate-ceiling)

## 1. Conformance

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described
in RFC 2119. Conformance requirements for producers and consumers of v0.2 constructs are
unchanged. This document adds requirements for producers of governance blocks and for
**linters** — tools that evaluate `rules[]` against dspack surface documents.

## 2. File Identification

A v0.3 document declares `"dspack": "0.3"`. All three governance blocks are optional; a
document using none of them is still a v0.3 document. Consumers that understand only v0.2 MUST
ignore unknown top-level properties (per the v0.2 extensibility rules), so v0.3 documents
degrade safely.

## 3. The Three Layers

Three questions about a generated (or authored) UI object are answered by three different
layers, and these layers MUST never collapse:

1. **The schema answers "can this object exist."** JSON Schema validation of shape and
   vocabulary. Deterministic.
2. **The linter answers "is this object correct."** Governance rules evaluated over the
   surface. Deterministic in v0.3 — every rule is a machine-checkable predicate plus a
   human-readable rationale.
3. **The renderer answers "can this render."** A protocol emitter compiles the surface; the
   target's own validation and renderer decide renderability.

In particular: encoding governance into a generation schema (layer 1) would make violations
unobservable and any audit trail vacuous. Generation schemas MUST encode vocabulary and shape
only; correctness belongs to the linter.

## 4. Intents

```json
"intents": [
  {
    "id": "destructive-action",
    "name": "Destructive action",
    "description": "The requested UI performs an irreversible or high-consequence operation.",
    "relatedPatterns": ["destructive-action-confirmation"]
  }
]
```

An **intent** names a kind of UI request. Intents are the scoping vocabulary for rules
(`rules[].appliesTo.intents`) and the selection key for examples (`examples[].intent`). The
intent for a given generation is **declared by the caller**, not inferred by a model; it is
carried in the surface document itself (§7) so downstream tools can evaluate intent-scoped
rules without out-of-band state.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string (`^[a-z][a-z0-9-]*$`) | yes | Unique identifier. |
| `name` | string | no | Display name. |
| `description` | string | yes | What requests this intent covers; written for humans and prompts. |
| `relatedPatterns` | string[] | no | Pattern IDs documenting how to satisfy the intent. |
| `tags` | string[] | no | Free-form tags. |

Rules and examples referencing an intent id that is not registered in `intents[]` make the
document **inconsistent**; validating tools MUST reject it.

## 5. Rules

```json
{
  "id": "rule.destructive-requires-alertdialog",
  "type": "component-choice",
  "severity": "must",
  "appliesTo": { "intents": ["destructive-action"] },
  "require": ["alert-dialog"],
  "forbid": ["dialog"],
  "rationale": "Dialog can be dismissed by clicking the overlay or pressing Escape…",
  "examples": ["ex.delete-account-confirmation"]
}
```

A **rule** is a typed, structured predicate over a dspack surface, plus a mandatory
`rationale`. There is deliberately **no expression language**: each rule `type` selects a
fully specified evaluation algorithm (§5.3), and its fields are plain identifiers and value
lists. This keeps rules deterministic, implementable in any language, authorable by
design-system maintainers, and portable as documents.

Common fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string (`^rule\.[a-z0-9.-]+$`) | yes | Unique, stable identifier. |
| `type` | `component-choice` \| `required-composition` \| `forbidden-composition` | yes | Selects the evaluation algorithm. |
| `severity` | `must` \| `should` | yes | RFC 2119 strength (§5.2). |
| `rationale` | string | yes | Why the rule exists. Surfaced verbatim in findings, repair feedback, and audit reports. |
| `appliesTo.intents` | string[] | no | Intent IDs the rule fires for. **Absent means universal.** |
| `examples` | string[] | no | Example IDs demonstrating compliance. |
| `tags` | string[] | no | Free-form tags. |

All component and sub-component references inside a rule MUST resolve in the contract's
`components` map (including `composition.subComponents` ids); all example references MUST
resolve in `examples[]`. Otherwise the document is inconsistent and MUST be rejected.
Because rule references and gate S2 resolve sub-components by id alone, **sub-component ids
MUST be unique across the document** in contracts that use governance blocks (v0.2's
"should be parent-prefixed" convention makes this natural); a duplicate makes the document
inconsistent and MUST be rejected. Governance objects follow the global v0.2 extensibility
rule: `x-`-prefixed extension properties are permitted on `intents[]`, `rules[]`,
`examples[]` entries and their nested objects, and consumers MUST ignore them.

### 5.1 Applicability

A rule **fires** for a surface when `appliesTo` is absent (universal) or when the surface's
declared `intent` is a member of `appliesTo.intents`. Rules that do not fire produce no
findings of any kind.

### 5.2 Severity: normative terms, tool levels

Contract severity uses RFC 2119 terms — the vocabulary design-system maintainers already use
in `constraints` and `antiPatterns`. Tools map them to reporting levels:

| Contract `severity` | Tool `level` | Effect |
| --- | --- | --- |
| `must` | `error` | Fails the lint; triggers repair in generation pipelines. |
| `should` | `warn` | Reported in findings and audit output; MUST NOT fail the lint or trigger repair in v0.3. |

Findings objects MUST carry **both** fields (`requirement: "must"`, `level: "error"`), so the
contract-facing language and the tool-facing behavior stay distinguishable. Normative language
is contract-facing; severity levels are tool-facing.

### 5.3 Rule Types — Normative Evaluation Semantics

Evaluation operates on the surface tree (§7). "Descendants" means all nodes reachable through
`children` and `slots`, at any depth. A node "matches" a component id when its `component`
field equals that id.

**`component-choice`** — component selection for an intent.
Fields: `require?: string[]`, `forbid?: string[]` (at least one present).
For each id in `require`: at least one node in the surface MUST match it (one finding per
missing id, located at the surface root). For each id in `forbid`: no node in the surface may
match it (one finding per matching node, located at that node).

**`required-composition`** — structure every instance of a component must contain.
Fields: `component: string`, `requiredSubComponents?: {id, min=1}[]`,
`requiredProps?: {on?, prop, oneOf}[]` (at least one of the two present).
For **every** node matching `component`: each `requiredSubComponents` entry MUST have ≥ `min`
matching descendants (one finding per unsatisfied entry, located at the matching node); each
`requiredProps` entry MUST hold — when `on` is absent, the node itself MUST have `props[prop]`
present and equal to a member of `oneOf`; when `on` is given, **every** descendant matching
the sub-component id `on` MUST satisfy the prop constraint, and at least one such descendant
MUST exist.

**`forbidden-composition`** — structure and values no instance of a component may contain.
Fields: `component: string`, `forbiddenDescendants?: string[]`,
`forbiddenProps?: {on?, prop, values}[]` (at least one of the two present).
For **every** node matching `component`: no descendant may match any id in
`forbiddenDescendants` (one finding per offending descendant, located at it); no
`forbiddenProps` entry may hold — when `on` is absent, the node's `props[prop]` MUST NOT be a
member of `values`; when `on` is given, the same check applies to every descendant matching
`on`.

Findings MUST include: rule id, rule type, `requirement`, `level`, a message naming the
violated condition, the rule's `rationale` verbatim, and a location (path from the surface
root plus the offending node's `component` and, when present, `id`).

### 5.4 Unknown Rule Types

A linter encountering a rule whose `type` it does not implement MUST fail loudly — a distinct
error outcome (recommended process exit code: 4), never a silent skip and never a warning.
Skipping unknown rules would misreport a surface as governed when it was not.

### 5.5 Forward Compatibility

Future spec versions add rule types and optional fields **only**; existing types' semantics
are frozen once released. A v0.3 document remains a valid v0.4 document. A v0.4 document
using a new rule type is intentionally **invalid** under the v0.3 schema and MUST trigger the
unknown-rule-type failure in v0.3 linters.

## 6. Examples

```json
{
  "id": "ex.delete-account-confirmation",
  "intent": "destructive-action",
  "prompt": "a screen to delete my account",
  "description": "Card with a destructive entry point; AlertDialog confirmation…",
  "surface": { "dspackSurface": "0.1", "system": "shadcn/ui", "intent": "destructive-action", "root": { … } }
}
```

An **example** is a compilable dspack surface tied to a named intent. Examples serve double
duty: documentation of correct usage, and few-shot exemplars for generation (used verbatim —
the surface format is the generation format, so exemplars are exactly in-distribution). There
is no third example format.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string (`^ex\.[a-z0-9.-]+$`) | yes | Unique identifier. |
| `intent` | string | yes | Intent ID this example demonstrates. |
| `name` / `description` | string | no | Display name / why the example is correct. |
| `prompt` | string | no | Representative user request; the user turn in few-shot blocks. |
| `surface` | object | yes | A dspack surface document (§7). |

Every example's `surface` MUST validate against the surface schema (gate S1), MUST use only
the contract's vocabulary (gate S2), MUST declare the same `intent` as the example entry, and
MUST set `system` to the contract's `name`. Examples SHOULD satisfy the contract's own rules;
tooling MAY enforce this (gate S3 over examples).

## 7. The dspack Surface Format

A **dspack surface** (`.dsurface.json`, schema
[`dspack.surface.v0_1.schema.json`](../schema/dspack.surface.v0_1.schema.json), versioned
independently as `dspackSurface: "0.1"`) is a protocol-neutral, nested component tree in a
contract's vocabulary:

- `system` — the contract's `name`.
- `intent` — the declared intent id (§4), carried in the artifact.
- `root` — a node tree. Each node has `component` (a component id or sub-component id),
  optional `id`, `props`, `text` (for text leaves), ordered `children`, and named `slots`.

The surface is an **intermediate representation**: it is never rendered, never transported,
and always compiled to a protocol (A2UI, json-render, …) by a deterministic emitter. It
deliberately preserves compound composition (sub-component structure) that individual
protocol projections may lose — governance evaluates *before* those documented casualties.
Renderer- or transport-facing features do not belong in this format; proposals to add them
are scope changes requiring an explicit design decision, not incremental additions.

## 8. Validation Gates

Named uniformly across tooling, lint output, and audit reports:

| Gate | Question | Defined by |
| --- | --- | --- |
| **S1** | Is this a well-formed surface? | The generic surface schema. |
| **S2** | Does the surface use only the contract's vocabulary? Component/sub-component ids, prop names on components, enum prop values, and declared slot names. | This spec + the bound contract. |
| **S3** | Does the surface satisfy the contract's rules? | §5. |

S1 and S2 are checks on **any** produced surface — model-generated, hand-authored, or fixture.
A generation pipeline MAY reuse its schema-constrained decoding to implement S2, but MUST
still report S1 and S2 as independent gates over the produced artifact. Emitter-side gates
(e.g. A2UI's schema-compile / catalog-shape / instance-validation checks) are downstream of
this spec and named by the emitter (A1/A2/A3 for the A2UI target).

S2 is deliberately scoped: it does **not** check `acceptsChildren` semantics, non-enum prop
value types, or sub-component nesting order. Those either belong to S3 rules or are not yet
expressible (§9).

## 9. Deliberate Ceiling

v0.3's rule inventory is intentionally small. Known governance needs that the three types
**cannot** express, recorded here so the ceiling is explicit rather than discovered:

- **Ordering constraints** — e.g. "cancel appears before confirm in reading order." Presence
  is checkable (`required-composition`); order is not.
- **Category-based selection** — e.g. "no *interactive* descendants inside a button" as a
  category predicate. v0.3 rules enumerate ids; a category form requires component metadata
  the contract does not yet carry.
- **Cardinality beyond `min`** — no `max`, no exact counts.
- **Token-usage and layout rules.**
- **Soft/heuristic judgments** — out of scope for v0.3 entirely; every v0.3 rule is
  deterministic.

These are v0.4 candidates, to be added as new typed rules (additively, per §5.5) driven by
evidence from real contracts.
