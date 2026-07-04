# Migrating from dspack v0.3 to v0.4

**Short version: change `"dspack": "0.3"` to `"0.4"` and you are done.** v0.4 is strictly
additive; everything else in this guide is about what you can *now add*, not what you must
change.

## What changes

Nothing, structurally. v0.4 adds:

| Addition | Where | Purpose |
| --- | --- | --- |
| `categories` | new optional top-level block | Contract-defined category registry: named roles components can declare and rules can select by. |
| `categories: string[]` | component entries and sub-component descriptors | Membership in registered categories. |
| `required-props` | new rule type | "This component must carry named content **directly**" — direct text (`requiredText`) or directly-present props. |
| `forbiddenCategories` | new optional field on `forbidden-composition` | Forbid descendants by category instead of enumerating ids. |

No existing field changes meaning, type, or required status. No field is removed. The
three v0.3 rule types' semantics are frozen (v0.3 §5.5); enumerated
`forbiddenDescendants` rules remain valid and unchanged alongside the category form.

## Validity guarantees

- **Any valid v0.3 document with `"dspack"` set to `"0.4"` validates against the v0.4
  schema.** The same guarantee every version has given its predecessor.
- **Older consumers ignore the new blocks** — with one deliberate exception: a v0.3
  linter encountering a `required-props` rule MUST fail loudly (unknown rule type,
  v0.3 §5.4). A v0.4 contract is never silently half-governed by v0.3 tools; upgrade the
  linter or keep the contract at v0.3.
- **Forward:** a v0.4 document remains valid under future schemas; new rule types arrive
  additively.

## Worked example: the v0.4 shadcn contract deltas

The repository's [`examples/shadcn-ui.dspack.json`](../examples/shadcn-ui.dspack.json)
shows all three additions in use.

**A registry of two categories, populated where the metadata already lived** (the
`tags` fields sketched the taxonomy; categories make it referenceable by rules):

```json
"categories": {
  "interactive": { "name": "Interactive", "description": "Receives pointer or keyboard activation…" },
  "overlay":     { "name": "Overlay",     "description": "Renders content in a layer above the page…" }
}
```

with memberships such as `button.categories: ["interactive"]`,
`dropdown-menu.categories: ["interactive", "overlay"]`, and — on sub-component
descriptors — `alert-dialog-trigger.categories: ["interactive"]`.

**A `required-props` rule closing a measured gap.** Three model families produced
governance-clean surfaces whose trigger-button label sat in a nested child (or nowhere),
which no v0.3 rule could require and no protocol projection could lift — 78/78 of the
eval's emitter-gate failures shared that one signature. The rule that makes it a lintable,
repairable finding:

```json
{
  "id": "rule.trigger-carries-label",
  "type": "required-props",
  "severity": "must",
  "component": "alert-dialog-trigger",
  "requiredText": true,
  "textScope": "subtree",
  "rationale": "The trigger must present an accessible label…"
}
```

*(Amended 2026-07-04 while v0.4 is a draft: the rule originally anchored on `button`
`within` the trigger with for-every-button semantics; the first live run showed that
form rejected surfaces whose emission succeeds — a labeled bearer plus a textless
sibling. The amended form states exactly the projection's precondition: label text
somewhere under the trigger. See spec §4.1's amendment note.)*

**A category-based `forbidden-composition` rule** that would otherwise enumerate ids and
silently rot as the vocabulary grows:

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

## What to check after migrating

1. `npm run validate` (or your equivalent): category references — memberships and rule
   fields — must resolve in the registry; `required-props` `component`/`within` must
   resolve in the vocabulary. These are consistency checks, not schema checks.
2. Your linter implements `required-props` and `forbiddenCategories` before any contract
   using them goes live — otherwise every lint fails loudly, by design.
3. Existing rules: consider whether enumerated `forbiddenDescendants` lists should
   *stay* enumerated. Migrating an in-production rule to the category form changes which
   nodes it matches (categories usually cover more ids); treat that as a governed change
   to measure, not a mechanical rewrite.
