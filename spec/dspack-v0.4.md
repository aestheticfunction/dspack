# dspack Specification — v0.4 (delta)

**Status: draft.**

This document specifies dspack v0.4 as a **delta over v0.3**. Everything in the
[v0.3 specification](./dspack-v0.3.md) (and, through it, v0.2) remains normative and
unchanged; v0.4 is strictly additive. A valid v0.3 document with `"dspack": "0.4"` is a
valid v0.4 document.

v0.4 lifts two items from v0.3's deliberate ceiling (v0.3 §9), both driven by evidence
from real contracts and measured pipeline runs:

1. **Component categories** — a contract-defined category registry, category membership
   on component and sub-component metadata, and a category-based form of
   `forbidden-composition`. Lifts the "category-based selection" ceiling item: rules like
   *no interactive descendants* no longer enumerate ids, which does not scale past small
   vocabularies.
2. **The `required-props` rule type** — *a component must carry named content directly*.
   Lifts the gap between governance and projection measured at 78/78 gate failures across
   three model families (dspack-gen findings, 2026-07-03): surfaces whose required text
   sat where no rule could require it to be, and where protocol emitters cannot lift it
   from.

The matching JSON Schema is [`schema/dspack.v0.4.schema.json`](../schema/dspack.v0.4.schema.json).
The surface format is unchanged (`dspackSurface: "0.1"`).

## Table of Contents

- [1. Conformance](#1-conformance)
- [2. File Identification](#2-file-identification)
- [3. Component Categories](#3-component-categories)
- [4. Rules](#4-rules)
- [5. Validation Gates](#5-validation-gates)
- [6. Deliberate Ceiling](#6-deliberate-ceiling)

## 1. Conformance

RFC 2119 terms as in v0.3 §1. This document adds requirements for producers of the
`categories` block and for linters implementing the `required-props` type and the
`forbiddenCategories` field.

Per v0.3 §5.4–§5.5, a **v0.3 linter** encountering a `required-props` rule MUST fail
loudly (unknown rule type, recommended exit code 4). This is by design: a v0.4 contract
is not silently half-governed by v0.3 tools.

## 2. File Identification

A v0.4 document declares `"dspack": "0.4"`. All governance blocks and the `categories`
block are optional; consumers that understand only earlier versions MUST ignore unknown
top-level properties, so v0.4 documents degrade safely — with the deliberate exception of
unknown rule types, which fail loudly in older linters as specified above.

## 3. Component Categories

```json
"categories": {
  "interactive": {
    "name": "Interactive",
    "description": "Receives pointer or keyboard activation: buttons, inputs, menu items…"
  },
  "overlay": {
    "name": "Overlay",
    "description": "Renders content in a layer above the page with its own focus and dismiss semantics."
  }
}
```

A **category** is a named role that components and sub-components can declare and rules
can select by. The registry is **contract-defined**: dspack bakes in no taxonomy, and a
category id means exactly what its `description` says it means for this contract.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| *(registry key)* | string (`^[a-z][a-z0-9-]*$`) | — | The category id. |
| `name` | string | no | Display name. |
| `description` | string | yes | What membership means; written for maintainers and reviewers. |

Membership is declared where the component is declared:

- `components.<id>.categories: string[]` — on a component entry.
- `composition.subComponents[].categories: string[]` — on a sub-component descriptor.

A membership array, when present, MUST be non-empty (omit the field rather than declaring
`[]`; the schema enforces `minItems: 1`).

**Referential integrity.** Every category id referenced by a membership list or by a
rule field (§4.2) MUST be registered in `categories`; otherwise the document is
inconsistent and validating tools MUST reject it. Registered categories with no members
or no referencing rules are permitted (a registry may be populated ahead of the rules
that use it).

**Categories are contract metadata, not surface vocabulary.** Surfaces never name
categories; gate S2 is unaffected (§5). Categories exist so rules can select over the
contract's own structure — membership is resolved through the contract at lint time,
never carried in the artifact.

## 4. Rules

The common rule fields, severity model, applicability, findings requirements, and
unknown-type behavior are unchanged (v0.3 §5). v0.4 adds one rule type and one field on
an existing type. Per v0.3 §5.5, the three v0.3 types' semantics are frozen; the
`forbiddenCategories` addition is a new optional field, not a change to existing
fields' semantics.

### 4.1 `required-props` — content every instance of a component must carry directly

```json
{
  "id": "rule.trigger-carries-label",
  "type": "required-props",
  "severity": "must",
  "component": "alert-dialog-trigger",
  "requiredText": true,
  "textScope": "subtree",
  "rationale": "The trigger must present an accessible label…",
  "examples": ["ex.delete-account-confirmation"]
}
```

> **Draft amendment (2026-07-04), on measured evidence.** The first live run of this
> rule type (dspack-gen PR-15, 216 runs) decomposed its findings and showed the
> original for-every-node `within` semantics rejected 67 surfaces whose emission the
> A2UI target accepts (a labeled bearer existed; a textless *sibling* tripped the
> rule). Two changes, while v0.4 is a draft: `requiredText` gains **`textScope`**
> (`self` | `subtree`, default `self`), and `within` scoping is now **∃-quantified**
> (at least one matching node per scope satisfies). Rules SHOULD state exactly the
> precondition of the projection they protect — no stricter, no looser; stricter
> requirements (e.g. "no unlabeled buttons anywhere") are their own rules with their
> own rationales.

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `component` | string | yes | Component **or sub-component** id whose instances are checked. (Shared with §4.3's amended `required-composition`: both anchor on lint-time nodes, where sub-components appear as ordinary nodes.) |
| `within` | string | no | Component or sub-component id scoping the check (see below). |
| `requiredText` | `true` | one of these two | The node MUST carry non-empty text — its own `text` field by default; see `textScope`. |
| `textScope` | `self` \| `subtree` | no (default `self`) | Where `requiredText` looks: `self` = the node's own `text` field only; `subtree` = direct text on the node **or any of its descendants** — for compound wrappers whose documented projections lift a label from within. Only meaningful with `requiredText`. |
| `requiredProps` | `{prop, oneOf?}[]` | one of these two | Props that MUST be present **directly on the node's `props`**; when `oneOf` is given the value MUST be a member. |

**Normative evaluation semantics.** Terms as in v0.3 §5.3 ("descendants", "matches").
Two evaluation modes, distinguished by `within`; in both, the **constraints** (defined
below) are always evaluated against individual nodes matching `component` — never
against the `within` node itself. `within` changes only which nodes are candidates,
how many must satisfy, and where findings land.

- **`within` absent — every instance.** Every node in the surface matching
  `component` is evaluated; each one MUST satisfy the constraints. One finding per
  violating node, located at that node.
- **`within` present — per scope, at least one (∃).** For every node matching
  `within` (a *scope*): at least one descendant matching `component` MUST exist (one
  finding per scope with none, located at the scope node), and at least one of those
  descendants MUST satisfy the constraints (one finding per scope in which every
  candidate violates, located at the scope node). Candidates that violate while a
  sibling satisfies produce no findings. The existence clause mirrors v0.3's
  `requiredProps.on` semantics; the ∃ quantifier is the 2026-07-04 amendment above.

The constraints, evaluated against a candidate node matching `component`:

- `requiredText: true` with `textScope: "self"` (the default) — the node MUST have a
  `text` field that is a non-empty string; text carried by descendants does not
  satisfy it. With `textScope: "subtree"` — the node or at least one of its
  descendants MUST carry a non-empty `text` field.
- Each `requiredProps` entry — the node's own `props[prop]` MUST be present; when
  `oneOf` is present, its value MUST be a member.

**Distinction from `required-composition.requiredProps`** (v0.3 §5.3): that field is
`on`-scoped (checks descendants of the anchoring component) and requires `oneOf`
(value-membership only). `required-props` entries have no `on` — the rule's `component`
IS the target — `oneOf` is optional (presence-only when absent), and `requiredText`
covers the node's own `text` field, which no v0.3 form can reach. `required-props` is
**conditional**: apart from the `within` existence clause, it constrains instances that
exist; use `required-composition` to require that structures exist.

### 4.2 `forbidden-composition` — the `forbiddenCategories` field

```json
{
  "id": "rule.alertdialog-no-nested-overlays",
  "type": "forbidden-composition",
  "severity": "must",
  "component": "alert-dialog",
  "forbiddenCategories": ["overlay"],
  "rationale": "An alert dialog is a single focused interruption…"
}
```

`forbiddenCategories?: string[]` joins `forbiddenDescendants` and `forbiddenProps` (at
least one of the three MUST be present).

**Normative evaluation semantics.** For **every** node matching `component`: no
descendant may match a component or sub-component whose contract entry declares
membership in any id listed in `forbiddenCategories` (one finding per offending
descendant, located at it). Membership is resolved through the contract's `categories`
declarations at lint time. The finding's message MUST name both the concrete offending
component id and the matched category, so repair feedback stays actionable without the
contract in hand.

The anchoring node itself is not a descendant of itself: a component that belongs to a
forbidden category may still anchor the rule (as `alert-dialog` — itself an overlay —
does above).

### 4.3 `required-composition` — the `requiredCategories` field

> **Amendment (2026-08-07), on measured evidence, lifted from §6.** The T1
> representation milestone's Build evaluation (dspack-emit#31) produced
> lint-clean surfaces whose `form-control` nodes carried literal text and no
> interactive control at all — structurally valid, semantically empty form
> composition that every gate passed and the emitter (correctly) refused. The
> invariant "must contain an approved interactive control" is an OR across a
> category's members; `requiredSubComponents` can only AND exact ids, and
> category vocabulary existed only on the forbidden side. §6 anticipated
> exactly this addition "when a real contract needs them, not before" — this
> is that need, with the probe surfaces committed as evidence
> (dspack-emit `eval/t1-build-matrix*.json`).

```json
{
  "id": "rule.form-control-carries-control",
  "type": "required-composition",
  "severity": "must",
  "component": "form-control",
  "requiredCategories": [{ "id": "interactive", "min": 1 }],
  "rationale": "A form-control represents the location of the user-editable control in a field…"
}
```

`requiredCategories?: {id, min=1}[]` joins `requiredSubComponents` and
`requiredProps` (at least one of the three MUST be present). Each entry's `id`
MUST be registered in the document's `categories` — the same consistency check
`forbiddenCategories` carries. With this amendment, `required-composition`'s
`component` also accepts a **sub-component** id (as §4.1's `required-props`
already did): the governed location of a category requirement is very often a
compound's sub-component — `form-control` being the motivating case — and
both types anchor on lint-time nodes, where sub-components appear as ordinary
nodes.

**Normative evaluation semantics.** For **every** node matching `component`:
each `requiredCategories` entry MUST have ≥ `min` descendants whose contract
entry declares membership in category `id` (one finding per violated entry,
located at the matching node). Membership is resolved through the contract's
`categories` declarations at lint time, exactly as in §4.2. The check is
**local to each matching node's descendants** — a member elsewhere in the
surface satisfies nothing. Multiple entries are independently required (AND),
matching `requiredSubComponents`; membership within one category is naturally
OR across that category's components. The finding's message MUST name the
required category and the count found, so repair feedback stays actionable
without the contract in hand.

No boolean expressions, `oneOf` groups, or predicates: a requirement a
category cannot express is a missing category or a different rule, not a
grammar extension.

## 5. Validation Gates

S1, S2, and S3 are unchanged (v0.3 §8). In particular, S2 still checks the **full
contract vocabulary** and knows nothing of categories; category-based selection is S3
territory, resolved through the contract at lint time. Generation schemas continue to
encode vocabulary and shape only (v0.3 §3) — neither categories nor any rule content
belongs in them.

## 6. Deliberate Ceiling

Still not expressible in v0.4, recorded so the ceiling stays explicit:

- **Ordering constraints** — "cancel appears before confirm in reading order."
- **Cardinality beyond `min`** — no `max`, no exact counts.
- **Token-usage and layout rules.**
- **Category-based forms beyond §4.2 and §4.3** — `require`/`forbid` by category
  in `component-choice`. Add them when a real contract needs them, not before.
  (Category-scoped `required-composition` graduated to §4.3 on 2026-08-07, on the
  T1 Build evidence — the first ceiling item to be lifted by measurement.)
- **Soft/heuristic judgments** — out of scope; every v0.4 rule remains deterministic.

Future types arrive additively per v0.3 §5.5; existing types' semantics are frozen.
