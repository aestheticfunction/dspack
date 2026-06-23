# dspack Specification

**Version:** 0.2

**Status:** Draft

This document defines the dspack format version 0.2. dspack is a JSON-based format for representing design system corpora — tokens, components, patterns, anti-patterns, framework bindings, themes, and layout primitives — in a structure that tools and AI coding agents can query.

Version 0.2 is an additive, backward-compatible update to [version 0.1](./dspack-v0.1.md). A valid v0.1 document with `"dspack": "0.2"` is a valid v0.2 document. The additions in this version focus on **generation readiness**: where v0.1 helps consumers identify the right design-system objects, v0.2 adds structured constraints so consumers can use them correctly — producing accessible, context-appropriate, design-system-aligned code rather than merely selecting plausible components.

This is a draft specification. It is not yet stable. Breaking changes may occur in future versions without a formal deprecation process. The spec will be stabilized at version 1.0.

---

## Table of Contents

1. [Conformance](#1-conformance)
2. [File Identification](#2-file-identification)
3. [Document Structure](#3-document-structure)
4. [Metadata](#4-metadata)
5. [Tokens](#5-tokens)
6. [Components](#6-components)
7. [Patterns](#7-patterns)
8. [Anti-Patterns](#8-anti-patterns)
9. [Framework Bindings](#9-framework-bindings)
10. [Themes](#10-themes)
11. [Layout](#11-layout)
12. [Relationships](#12-relationships)
13. [Extensibility](#13-extensibility)
14. [ID and Naming Conventions](#14-id-and-naming-conventions)
15. [File Extension](#15-file-extension)
16. [Open Questions](#16-open-questions)

---

## 1. Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

A **conforming dspack document** is a JSON document that satisfies all MUST-level requirements defined in this specification.

A **conforming consumer** is a program that can parse any conforming dspack document without error. Conforming consumers MUST ignore properties they do not recognize rather than rejecting the document.

---

## 2. File Identification

A dspack document is identified by the presence and value of the `dspack` property at the top level of the JSON document.

- The `dspack` property MUST be present.
- The `dspack` property MUST be a string.
- For documents conforming to this version of the specification, the value MUST be `"0.2"`.

Consumers MUST check the `dspack` property before parsing the rest of the document. A consumer that does not recognize the major version (the portion before the first `.`) MUST reject the document. A consumer MAY accept a document with a higher minor version than it recognizes, ignoring any properties it does not understand.

---

## 3. Document Structure

A dspack document is a single JSON object. The top-level properties are:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `dspack` | string | REQUIRED | Spec version. See [File Identification](#2-file-identification). |
| `name` | string | REQUIRED | Human-readable name of the design system. |
| `$schema` | string | OPTIONAL | URI reference to a JSON Schema for editor validation. Consumers MUST NOT require this property. |
| `description` | string | OPTIONAL | Brief description of the design system's purpose and scope. |
| `version` | string | OPTIONAL | Version of the design system content (not the spec). Semver is RECOMMENDED but not required. |
| `metadata` | object | OPTIONAL | Extensible metadata. See [Metadata](#4-metadata). |
| `tokens` | object | OPTIONAL | Token definitions organized by category. See [Tokens](#5-tokens). |
| `components` | object | OPTIONAL | Component definitions keyed by component ID. See [Components](#6-components). |
| `patterns` | array | OPTIONAL | Pattern entries. See [Patterns](#7-patterns). |
| `antiPatterns` | array | OPTIONAL | Anti-pattern entries. See [Anti-Patterns](#8-anti-patterns). |
| `frameworkBindings` | object | OPTIONAL | Framework-specific information. See [Framework Bindings](#9-framework-bindings). |
| `themes` | object | OPTIONAL | Named sets of token overrides. See [Themes](#10-themes). |
| `layout` | object | OPTIONAL | Layout system primitives. See [Layout](#11-layout). |

All top-level properties other than `dspack` and `name` are OPTIONAL. A valid dspack document MAY contain only the `dspack` version and a `name`. This allows the format to represent design systems that are partial, in transition, or that document only some aspects of their knowledge.

A conforming consumer MUST NOT reject a document because an optional section is absent.

---

## 4. Metadata

The `metadata` object carries information about the dspack file itself, as opposed to the design system it describes.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `generatedBy` | string | OPTIONAL | Tool or process that created the file. |
| `generatedAt` | string | OPTIONAL | ISO 8601 datetime when the file was generated. |
| `source` | string | OPTIONAL | URL or description of the upstream source. |
| `license` | string | OPTIONAL | SPDX license identifier or freeform description. |

The `metadata` object is explicitly extensible. Consumers MUST ignore properties in `metadata` that they do not recognize. Unlike other objects in the document, custom properties in `metadata` do not require the `x-` prefix defined in [Extensibility](#13-extensibility).

---

## 5. Tokens

The `tokens` object organizes token definitions by category. Each key in the `tokens` object is a **category name** and its value is a **token category object**.

### 5.1 Token Category Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | OPTIONAL | What this category covers. |
| `tier` | string | OPTIONAL | Default abstraction level for tokens in this category. See [Token Tiers](#54-token-tiers). Individual token entries MAY override this value. |
| `values` | object | REQUIRED | Map of token name to token entry. |

Each key in `values` is a **token name** and its value is a **token entry object**.

### 5.2 Token Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `value` | string | REQUIRED | The resolved value of the token. |
| `description` | string | OPTIONAL | Semantic meaning of the token — what it represents, not just what it resolves to. |
| `type` | string | OPTIONAL | The value type. See [Token Types](#53-token-types). |
| `deprecated` | boolean | OPTIONAL | Whether this token is deprecated. Defaults to `false` if absent. See also [Status](#55-status). |
| `aliases` | array of strings | OPTIONAL | Other names by which this token is known. |
| `status` | string or status object | OPTIONAL | Lifecycle stage of this token. See [Status](#55-status). |
| `aliasOf` | string or alias reference object | OPTIONAL | Token that this token aliases. See [Token Aliases](#56-token-aliases). |
| `tier` | string | OPTIONAL | Abstraction level of this token, overriding the category default. See [Token Tiers](#54-token-tiers). |

The `value` property MUST be a string, even for values that could be represented as numbers. This preserves units, notation, and format (e.g., `"0.25rem"`, `"hsl(222.2, 47.4%, 11.2%)"`, `"400"`).

Token values are **resolved** — they represent the final computed value of the token, not a reference to another token or a build-system variable. A dspack file is a snapshot of a design system's knowledge at a point in time. Token resolution pipelines are outside the scope of this specification.

### 5.3 Token Types

The `type` property indicates what kind of value the token represents. The following values are RECOMMENDED:

- `color` — a color value in any notation (hex, rgb, hsl, oklch, etc.)
- `dimension` — a size or distance value with a unit (e.g., `"0.25rem"`, `"4px"`)
- `fontFamily` — a font family name or stack
- `fontWeight` — a font weight value
- `fontSize` — a font size value with a unit
- `lineHeight` — a line height value
- `letterSpacing` — a letter spacing value
- `duration` — a time duration (e.g., `"150ms"`, `"0.2s"`)
- `cubicBezier` — a cubic bezier easing curve
- `shadow` — a shadow definition
- `borderRadius` — a border radius value
- `opacity` — an opacity value
- `number` — a unitless numeric value
- `string` — an arbitrary string value

This list is not exhaustive. Custom type values are permitted. Consumers that encounter an unrecognized type MUST NOT reject the token entry.

### 5.4 Token Tiers

The `tier` property classifies tokens by their level of abstraction within the token hierarchy. The following values are defined:

- `primitive` — a raw value token at the lowest level of abstraction (e.g., `blue-500`, `16px`). Primitive tokens carry no semantic meaning beyond their value.
- `semantic` — a token with contextual meaning that typically aliases a primitive (e.g., `primary`, `body-font-size`). Semantic tokens are the preferred level for consumers to reference in generated code.
- `component` — a token scoped to a specific component's needs (e.g., `button-padding`, `card-border-radius`). Component tokens may alias semantic tokens.

If `tier` is absent from both the token entry and the containing category, consumers MUST NOT assume any particular abstraction level.

The `tier` property MAY be set on a token category object (applying to all tokens in that category by default) or on individual token entries (overriding the category default).

### 5.5 Status

The `status` property describes the lifecycle stage of a component or token. It replaces the semantic role of the `deprecated` boolean and `deprecatedMessage` string with a richer vocabulary.

`status` accepts two forms:

**Simple form** (a string):

```json
"status": "stable"
```

**Object form** (for per-platform granularity):

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `default` | string | REQUIRED | Default lifecycle stage when no platform-specific override applies. |
| `platforms` | object | OPTIONAL | Map of platform or framework ID to platform status object. |

**Platform status object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `stage` | string | REQUIRED | Lifecycle stage for this platform. |
| `since` | string | OPTIONAL | Version of the design system content at which this stage took effect. |
| `migrateTo` | string | OPTIONAL | Component ID or token name of the recommended replacement. Relevant when `stage` is `deprecated`. |
| `note` | string | OPTIONAL | Prose migration guidance or context for this platform's status. |

The following lifecycle stages are defined (ordered by maturity):

- `draft` — not ready for production use. The API may change without notice.
- `experimental` — usable but not yet committed. Expect possible breaking changes.
- `stable` — recommended for production use.
- `deprecated` — scheduled for removal. Consumers SHOULD use the alternative indicated by `migrateTo`.

If `status` is absent, consumers SHOULD treat the entity as stable unless `deprecated: true` is set.

**Interaction with `deprecated` and `deprecatedMessage`:** When `status` is present, it takes precedence. When `status` is absent, `deprecated: true` is equivalent to `"status": "deprecated"` and `deprecatedMessage` provides the migration note. Authors SHOULD NOT set both `status` and `deprecated` on the same entry. If both are present and conflict, `status` takes precedence.

### 5.6 Token Aliases

The `aliasOf` property captures the relationship between a token and the token it aliases. This is a **relationship annotation** — the `value` field still holds the resolved string. `aliasOf` tells consumers which lower-level token a semantic or component-level token is derived from, enabling them to reason about the token hierarchy.

`aliasOf` accepts two forms:

**Simple form** (a token name string):

```json
"aliasOf": "blue-500"
```

The simple form references a token by name. If the referenced token name is unique across all categories in the document, the reference is unambiguous. Authors SHOULD prefer the simple form when token names are unique.

**Object form** (for disambiguation across categories):

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `category` | string | REQUIRED | Token category name containing the referenced token. |
| `token` | string | REQUIRED | Token name within that category. |

```json
"aliasOf": {
  "category": "color-primitives",
  "token": "blue-500"
}
```

The object form SHOULD be used when there is any possibility of token name ambiguity across categories.

A consumer SHOULD NOT reject a document if the `aliasOf` target does not exist in the document. The reference MAY point to a token in an external source not included in this particular dspack file.

---

## 6. Components

The `components` object maps **component IDs** to **component entry objects**. Each key is a component ID conforming to the naming conventions defined in [ID and Naming Conventions](#14-id-and-naming-conventions).

### 6.1 Component Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | REQUIRED | Human-readable display name. |
| `description` | string | REQUIRED | What the component is for. |
| `whenToUse` | string | OPTIONAL | Guidance on when to use this component. |
| `whenNotToUse` | string | OPTIONAL | Guidance on when to choose a different component. |
| `props` | object | OPTIONAL | Map of prop name to prop descriptor. See [Prop Descriptors](#62-prop-descriptor). |
| `tokens` | array of strings | OPTIONAL | Token names this component depends on. |
| `relatedComponents` | array of strings | OPTIONAL | Component IDs of related components. |
| `tags` | array of strings | OPTIONAL | Freeform classification tags. |
| `deprecated` | boolean | OPTIONAL | Whether this component is deprecated. Defaults to `false` if absent. See also [Status](#55-status). |
| `deprecatedMessage` | string | OPTIONAL | What to use instead of this component. |
| `status` | string or status object | OPTIONAL | Lifecycle stage of this component. See [Status](#55-status). |
| `accessibility` | object | OPTIONAL | Accessibility constraints and expectations. See [Accessibility](#64-accessibility). |
| `composition` | object | OPTIONAL | Rules governing how this component composes with other components. See [Composition](#65-composition). |
| `constraints` | array | OPTIONAL | Structured usage constraints. See [Constraints](#66-constraints). |

The `whenToUse` and `whenNotToUse` properties are separate fields rather than a combined structure. This allows consumers to retrieve usage guidance and avoidance guidance independently.

The `tokens` array contains token names (the keys within a token category's `values` object). If the same token name appears in more than one category, the reference is ambiguous. Authors SHOULD use unique token names across categories to avoid this.

The `relatedComponents` array contains component IDs (keys in the top-level `components` object). A consumer SHOULD NOT reject a document if a referenced component ID does not exist in the document; the reference MAY point to a component that is not included in this particular dspack file.

### 6.2 Prop Descriptor

Each key in the `props` object is a prop name, and its value is a **prop descriptor object**.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | REQUIRED | The value type of the prop. |
| `description` | string | OPTIONAL | What this prop controls. |
| `values` | array | OPTIONAL | For `enum` type, the allowed values. Items MAY be bare values (strings, numbers, booleans) or [value descriptor objects](#63-value-descriptors). |
| `default` | any | OPTIONAL | Default value of the prop. |
| `required` | boolean | OPTIONAL | Whether this prop must be provided. Defaults to `false` if absent. |
| `propRole` | string | OPTIONAL | Semantic role of this prop. See below. |

The following `type` values are RECOMMENDED for prop descriptors:

- `string` — a text value
- `number` — a numeric value
- `boolean` — a true/false value
- `enum` — one of a fixed set of values (listed in `values`)
- `object` — a structured value
- `array` — a list value
- `node` — a renderable child (framework-dependent concept)
- `function` — a callback

Custom type values are permitted.

**Prop roles.** The `propRole` property classifies what a prop does semantically, helping consumers categorize props without parsing descriptions. The following values are defined:

- `flag` — a boolean toggle. The prop is either on or off.
- `dimension` — pick one from a set that represents a design dimension (size, spacing, density). Consumers SHOULD present these as the axes the user must choose along.
- `choice` — pick one from a set that is not a design dimension (variant, color scheme). Consumers MAY treat these as visual options.
- `slot` — a renderable child slot.
- `handler` — an event callback.
- `content` — a content value (label text, placeholder).
- `state` — controls component state (open, checked, value).

`propRole` is OPTIONAL and purely advisory. If absent, consumers MAY infer the role from `type`.

Prop descriptors describe the API surface of a component at a level sufficient for a consumer to understand how to use the component. They are not a complete type system. A dspack file does not replace TypeScript interfaces, PropTypes, or other framework-specific type definitions.

### 6.3 Value Descriptors

When a prop has `type: "enum"`, the `values` array lists the allowed values. Each item in the array MAY be either a **bare value** (a string, number, or boolean) or a **value descriptor object**.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `value` | any | REQUIRED | The actual enum value. |
| `description` | string | OPTIONAL | When to choose this value. |
| `deprecated` | boolean | OPTIONAL | Whether this specific value is deprecated. Defaults to `false`. |

Bare values and value descriptor objects MAY be mixed in the same array. The following are all valid:

```json
"values": ["sm", "md", "lg"]
```

```json
"values": [
  { "value": "sm", "description": "Compact size for dense UIs." },
  { "value": "md", "description": "Standard size for most contexts." },
  { "value": "lg", "description": "Large size for prominent elements." }
]
```

```json
"values": [
  "sm",
  { "value": "md", "description": "Standard size." },
  "lg"
]
```

Consumers that encounter a bare value SHOULD treat it as equivalent to a value descriptor with only the `value` property set.

### 6.4 Accessibility

The `accessibility` object describes the minimum accessibility constraints and expectations for a component. This is operational information — the minimum a consumer needs to generate accessible markup — not an exhaustive WCAG audit.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `role` | string | OPTIONAL | The WAI-ARIA role this component fulfills (e.g., `dialog`, `alertdialog`, `button`, `menu`). |
| `requiredAttributes` | array | OPTIONAL | HTML or ARIA attributes that MUST be present for correct accessible usage. Array of attribute descriptor objects. |
| `keyboardInteractions` | array | OPTIONAL | Expected keyboard behaviors. Array of keyboard interaction objects. |
| `contrastRequirement` | string | OPTIONAL | Minimum contrast ratio or WCAG level (e.g., `"4.5:1"`, `"AA"`, `"AAA"`). |
| `focusManagement` | string | OPTIONAL | Prose description of focus behavior expectations — where focus moves on open/close, trap behavior, initial focus target. |
| `labelRequirement` | string | OPTIONAL | How the component must be labeled. See below. |
| `notes` | string | OPTIONAL | Additional accessibility guidance in prose. |

**Label requirement values:**

- `required-visible` — the component MUST have a visible text label. Consumers MUST generate a visible label element.
- `required-accessible-name` — the component MUST have an accessible name, which MAY be provided by visible text, `aria-label`, or `aria-labelledby`. Use this when the component accepts multiple labeling strategies (e.g., a button may have visible text or be icon-only with `aria-label`).
- `required-aria` — the component MUST have an accessible name provided via `aria-label` or `aria-labelledby`, not via visible text. Use this when the component cannot or should not display a visible label.
- `optional` — labeling is recommended but not required.
- `none` — the component does not need a label (e.g., decorative elements).

**Attribute descriptor object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `attribute` | string | REQUIRED | The attribute name — ARIA attributes (e.g., `aria-label`, `aria-describedby`) or HTML attributes required for accessibility (e.g., `id` for label association, `type` for form semantics). |
| `description` | string | OPTIONAL | When and how to provide this attribute. |
| `condition` | string | OPTIONAL | Condition under which this attribute is required (e.g., `"when no visible label is present"`). |

**Keyboard interaction object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | string | REQUIRED | The key or key combination (e.g., `Enter`, `Space`, `Escape`, `Arrow Down`). |
| `description` | string | REQUIRED | What this key does in the context of this component. |

### 6.5 Composition

The `composition` object describes how a component composes with other components — its sub-components, structural requirements, and nesting constraints. This enables consumers to generate structurally correct compound component trees rather than guessing at hierarchy.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `subComponents` | array | OPTIONAL | Sub-components that belong to this compound component. Array of sub-component descriptors. |
| `requiredChildren` | array of strings | OPTIONAL | Component IDs or sub-component IDs that MUST appear as descendants when this component is used. |
| `allowedChildren` | array of strings | OPTIONAL | Component IDs or sub-component IDs that MAY appear as direct children. If present, only listed IDs are permitted; if absent, no restriction is imposed. |
| `requiredParent` | string | OPTIONAL | Component ID or sub-component ID that MUST be an ancestor of this component. |
| `allowedParents` | array of strings | OPTIONAL | Component IDs or sub-component IDs that MAY be the parent of this component. If present, only listed IDs are permitted; if absent, no restriction is imposed. |
| `requiredSiblings` | array of strings | OPTIONAL | Component IDs or sub-component IDs that MUST also be present among siblings when this component is used. |
| `notes` | string | OPTIONAL | Prose description of composition constraints not captured by the structured fields. |

The `requiredChildren`, `allowedChildren`, `requiredParent`, `allowedParents`, and `requiredSiblings` properties MAY reference either top-level component IDs (keys in the `components` object) or inline sub-component IDs (defined in a component's `composition.subComponents` array). All IDs in composition references exist in a single flat namespace. Authors SHOULD use parent-prefixed sub-component IDs to avoid ambiguity (e.g., `alert-dialog-trigger` rather than `trigger`).

**Sub-component descriptor:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | REQUIRED | Identifier for the sub-component. MUST be parent-prefixed and conform to ID conventions (e.g., `alert-dialog-trigger`, `card-header`). |
| `name` | string | REQUIRED | Human-readable display name (e.g., `AlertDialogTrigger`). |
| `description` | string | OPTIONAL | What this sub-component is for. |
| `required` | boolean | OPTIONAL | Whether this sub-component MUST be present when the parent is used. Defaults to `false`. |
| `slot` | string | OPTIONAL | Named slot this sub-component fills (e.g., `header`, `footer`, `trigger`, `content`). |
| `acceptsChildren` | string | OPTIONAL | What this sub-component expects as children: `any`, `text`, `components`, `none`. |

Sub-components are defined inline within the parent component's `composition` block, not as separate entries in the top-level `components` object. The top-level `components` map represents the set of independently usable components. Sub-components are structural parts of a compound component.

If a sub-component is also usable independently (outside its parent context), it SHOULD have its own top-level `components` entry in addition to appearing in the parent's `subComponents` array.

### 6.6 Constraints

The `constraints` array provides structured, machine-readable usage constraints as a complement to the prose `whenToUse` and `whenNotToUse` fields.

Each entry is a **constraint object**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `context` | string | REQUIRED | The situation or condition this constraint applies to. |
| `rule` | string | REQUIRED | What to do or not do in this context. |
| `severity` | string | REQUIRED | RFC 2119 strength of the constraint. One of `must`, `should`, `should-not`, `must-not`. |

**Severity values:**

- `must` — the constraint MUST be followed. Violation is a defect. Consumers MUST generate code that satisfies this constraint.
- `should` — the constraint SHOULD be followed. Deviation is acceptable with justification.
- `should-not` — the approach SHOULD NOT be taken. Deviation is acceptable with justification.
- `must-not` — the approach MUST NOT be taken. Violation is a defect. Consumers MUST NOT generate code that violates this constraint.

The `whenToUse` and `whenNotToUse` prose fields remain available for cases where structured constraints are impractical. When both prose fields and `constraints` are present, they SHOULD be consistent. Consumers MAY use `constraints` for programmatic decision-making and the prose fields for human-readable explanations.

---

## 7. Patterns

The `patterns` property is an array of **pattern entry objects**. Patterns describe preferred ways of combining components to solve recurring problems.

### 7.1 Pattern Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | REQUIRED | Unique identifier. See [ID and Naming Conventions](#14-id-and-naming-conventions). |
| `name` | string | REQUIRED | Human-readable name. |
| `description` | string | REQUIRED | What problem this pattern addresses. |
| `intent` | string | OPTIONAL | The underlying design goal or UX objective. |
| `context` | string | OPTIONAL | When this pattern applies — the conditions or use cases. |
| `components` | array of strings | OPTIONAL | Component IDs involved in this pattern. |
| `guidance` | string | OPTIONAL | Prose guidance on how to apply the pattern correctly. |
| `relatedPatterns` | array of strings | OPTIONAL | Pattern IDs of related patterns. |
| `tags` | array of strings | OPTIONAL | Freeform classification tags. |

Pattern IDs MUST be unique within the `patterns` array. A conforming consumer SHOULD NOT reject a document if a `components` reference or `relatedPatterns` reference does not match an entry in the document.

The `guidance` property is a prose string, not a structured set of steps. Pattern guidance is inherently contextual and does not lend itself to a rigid structure.

---

## 8. Anti-Patterns

The `antiPatterns` property is an array of **anti-pattern entry objects**. Anti-patterns describe approaches that the design system has deliberately ruled out.

### 8.1 Anti-Pattern Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | REQUIRED | Unique identifier. See [ID and Naming Conventions](#14-id-and-naming-conventions). |
| `name` | string | REQUIRED | Human-readable name describing what not to do. |
| `description` | string | REQUIRED | What this anti-pattern is. |
| `reason` | string | REQUIRED | Why this approach is ruled out. |
| `severity` | string | OPTIONAL | Strength of the prohibition. Defaults to `should-not` if absent. |
| `insteadUse` | string | OPTIONAL | Pattern ID of the preferred approach. |
| `components` | array of strings | OPTIONAL | Component IDs involved in this anti-pattern. |
| `tags` | array of strings | OPTIONAL | Freeform classification tags. |

The `reason` property is REQUIRED. An anti-pattern without a reason is a prohibition without context. The reason captures the institutional knowledge — why the team decided this approach is problematic — and is often the most valuable information in the entry.

**Anti-pattern severity values:**

- `must-not` — this approach MUST NOT be used. Violation is a defect. Consumers MUST NOT generate code that matches this anti-pattern.
- `should-not` — this approach SHOULD NOT be used. Strong recommendation against. Consumers SHOULD avoid generating code that matches this anti-pattern and SHOULD warn when asked to.
- `discouraged` — this approach is discouraged but tolerated in specific circumstances. Consumers SHOULD prefer alternatives but MAY use this approach when the alternatives are impractical.

If `severity` is absent, consumers SHOULD treat the anti-pattern as `should-not`.

The `insteadUse` property, when present, SHOULD reference the `id` of a pattern in the `patterns` array. This creates a direct link from "do not do this" to "do this instead."

Anti-pattern IDs MUST be unique within the `antiPatterns` array.

---

## 9. Framework Bindings

The `frameworkBindings` object maps **framework identifiers** to **framework binding objects**. Each key is a framework identifier conforming to the naming conventions defined in [ID and Naming Conventions](#14-id-and-naming-conventions).

### 9.1 Framework Binding Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | REQUIRED | Human-readable framework name. |
| `package` | string | OPTIONAL | Primary package name. |
| `installCommand` | string | OPTIONAL | How to install the framework binding. |
| `description` | string | OPTIONAL | What this binding provides. |
| `guidance` | string | OPTIONAL | Framework-wide guidance. |
| `components` | object | OPTIONAL | Per-component framework details. See [Per-Component Binding](#92-per-component-binding). |

### 9.2 Per-Component Binding

Each key in the `components` object within a framework binding is a component ID (matching a key in the top-level `components` object), and its value is a **component binding object**.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `importPath` | string | OPTIONAL | Where to import the component. |
| `installCommand` | string | OPTIONAL | Component-specific install command. |
| `exportName` | string | OPTIONAL | Named export if different from the component name. |
| `guidance` | string | OPTIONAL | Framework-specific usage guidance for this component. |
| `subComponents` | object | OPTIONAL | Map of sub-component ID to sub-component binding object. See below. |

**Sub-component binding object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `exportName` | string | OPTIONAL | Named export for this sub-component. |
| `importPath` | string | OPTIONAL | Import path if different from the parent component's import path. |

The `subComponents` property within a component binding provides framework-specific import and export information for each sub-component defined in the component's `composition.subComponents` array. Sub-component binding keys MUST match sub-component IDs.

Framework bindings are a top-level section rather than nested inside individual component entries. This keeps component definitions framework-agnostic and avoids repeating framework-wide information (package name, global install command) in every component.

The per-component details under `frameworkBindings[framework].components` are joined to the top-level `components` entries by component ID. A consumer that needs the full picture of a component in a specific framework combines the component entry with the corresponding per-component binding.

---

## 10. Themes

The `themes` object provides named sets of token overrides representing alternative visual modes (e.g., dark mode, high contrast, compact density).

Each key in the `themes` object is a **theme ID** conforming to [ID and Naming Conventions](#14-id-and-naming-conventions), and its value is a **theme entry object**.

### 10.1 Theme Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | REQUIRED | Human-readable theme name (e.g., "Dark", "High Contrast"). |
| `description` | string | OPTIONAL | What this theme is for. |
| `overrides` | object | REQUIRED | Map of token reference to override value. |

The `overrides` object maps token references to resolved override values (strings). Keys in the `overrides` object use **dot-separated path notation**: `category.tokenName` (e.g., `color.background`, `color.foreground`, `spacing.sp-4`). This notation unambiguously identifies a token by its category and name.

Override values are resolved strings, following the same conventions as token `value` properties.

Consumers MAY use theme overrides to adjust their output for a specific visual context. A theme entry does not redefine the full token set — it only contains the tokens that change in that theme.

---

## 11. Layout

The `layout` object describes layout system primitives — the structural rules that govern responsive behavior, grid systems, container sizes, and spacing scales. These are system-level concerns that exist above individual tokens and below page-specific layout decisions.

The `layout` section describes primitives, not page layout rules. It is not a rendering engine or a layout specification language. Consumers MAY use this information to generate responsive code that aligns with the design system's structural conventions.

### 11.1 Layout Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `breakpoints` | object | OPTIONAL | Named responsive breakpoints. Map of breakpoint name to breakpoint object. |
| `grid` | object | OPTIONAL | Grid system parameters. |
| `containers` | object | OPTIONAL | Named container width configurations. Map of container name to container object. |
| `spacingScale` | object | OPTIONAL | The spacing scale as a system, with base unit and rationale. |

### 11.2 Breakpoint Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `minWidth` | string | REQUIRED | Minimum viewport width for this breakpoint (e.g., `"640px"`). |
| `description` | string | OPTIONAL | What this breakpoint targets (e.g., "Small tablets and large phones"). |

Breakpoint names follow framework conventions and are NOT constrained to the `^[a-z][a-z0-9-]*$` pattern. Values such as `2xl` are permitted. This is a documented exception to the general ID convention in [Section 14](#14-id-and-naming-conventions).

### 11.3 Grid Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `columns` | number | OPTIONAL | Number of columns in the grid system (e.g., `12`). |
| `gutter` | string | OPTIONAL | Default gutter width between columns (e.g., `"1rem"`). |
| `margin` | string | OPTIONAL | Default outer margin of the grid container. |
| `description` | string | OPTIONAL | Guidance on grid usage. |

### 11.4 Container Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `maxWidth` | string | REQUIRED | Maximum width of this container (e.g., `"1280px"`). |
| `description` | string | OPTIONAL | When to use this container size. |

### 11.5 Spacing Scale Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `baseUnit` | string | OPTIONAL | The fundamental unit (e.g., `"4px"`, `"0.25rem"`). |
| `description` | string | OPTIONAL | How the scale is constructed (e.g., "Multiples of 4px"). |

The spacing scale complements the tokens in a `spacing` category by describing the system-level rationale and base unit. Individual spacing values are represented as tokens.

---

## 12. Relationships

Relationships between concepts in a dspack document are represented through **ID references** rather than explicit edge objects.

The following relationships are defined:

| From | To | Property | Meaning |
|------|----|----------|---------|
| Component | Token | `component.tokens[]` | The component depends on these tokens. |
| Component | Component | `component.relatedComponents[]` | These components are related. |
| Component | Sub-component | `component.composition.subComponents[]` | The component contains these sub-components. |
| Pattern | Component | `pattern.components[]` | The pattern involves these components. |
| Pattern | Pattern | `pattern.relatedPatterns[]` | These patterns are related. |
| Anti-pattern | Pattern | `antiPattern.insteadUse` | Use this pattern instead. |
| Anti-pattern | Component | `antiPattern.components[]` | These components are involved. |
| Framework binding | Component | `frameworkBindings[fw].components[id]` | Framework-specific details for this component. |
| Token | Token | `token.aliasOf` | This token aliases another token. |
| Theme | Token | `themes[id].overrides` | This theme overrides these token values. |

References are by ID string. A conforming consumer SHOULD NOT reject a document if a reference target does not exist in the same document. This allows partial documents where not every referenced entity is included.

---

## 13. Extensibility

dspack uses a reserved-prefix convention for extensibility.

### 13.1 Extension Properties

Any object in a dspack document MAY contain additional properties whose keys begin with `x-` (e.g., `x-figmaNodeId`, `x-internalOwner`, `x-designStatus`).

Conforming consumers MUST ignore `x-`-prefixed properties that they do not recognize.

### 13.2 The Metadata Exception

The `metadata` object is fully extensible without the `x-` prefix. Custom keys in `metadata` do not need the `x-` prefix because `metadata` is explicitly designated as the location for tool-specific and organization-specific information.

### 13.3 Reserved Properties

Top-level properties and properties within spec-defined objects that do not start with `x-` and are not defined by this specification are **reserved** for future versions of the spec. Consumers SHOULD warn when they encounter unrecognized non-`x-` properties but MUST NOT reject the document.

---

## 14. ID and Naming Conventions

All identifiers used as object keys or reference values — component IDs, token names, token category names, pattern IDs, anti-pattern IDs, framework identifiers, theme IDs, and sub-component IDs — MUST conform to the following rules:

- IDs MUST match the regular expression `^[a-z][a-z0-9-]*$` (lowercase ASCII letter followed by zero or more lowercase letters, digits, or hyphens).
- IDs MUST be unique within their namespace. Component IDs are unique among components, pattern IDs are unique among patterns, anti-pattern IDs are unique among anti-patterns, token names are unique within a single token category, token category names are unique within the `tokens` object, theme IDs are unique within `themes`, and sub-component IDs are unique within their parent's `subComponents` array.
- IDs SHOULD be meaningful, readable slugs derived from the entity's name (e.g., `alert-dialog` for "Alert Dialog").
- Sub-component IDs SHOULD be prefixed with their parent component's ID to ensure global readability and avoid ambiguity (e.g., `alert-dialog-trigger`, `card-header`).

**Exception:** Breakpoint names in the `layout.breakpoints` object are NOT constrained to the `^[a-z][a-z0-9-]*$` pattern. This accommodates framework-conventional names such as `2xl`. See [Layout](#11-layout).

---

## 15. File Extension

The RECOMMENDED file extension for dspack documents is `.dspack.json`. This makes the file identifiable by name while retaining the `.json` suffix for editor support and tooling compatibility.

The file extension is a convention, not a requirement. Consumers MUST identify dspack documents by the presence and value of the `dspack` property, not by file extension.

---

## 16. Open Questions

The following are unresolved design questions acknowledged by this draft. They are non-normative and are recorded here to make open areas of the design explicit rather than leaving ambiguity hidden.

### 16.1 Token Reference Resolution

Version 0.2 introduces the `aliasOf` property to capture alias relationships between tokens, but token values remain resolved (final computed values). A future version may support token-to-token reference syntax within `value` fields (e.g., `"value": "{color.primary}"`) to enable unresolved, build-time token graphs. The design of such a reference system — including syntax, resolution order, and cycle detection — is deferred.

### 16.2 Localization

Version 0.2 does not define a mechanism for providing descriptions, guidance, or other prose fields in multiple languages. All string fields are assumed to be in a single language. If localization becomes a requirement, it would likely be addressed through a separate mechanism rather than by duplicating every string field.

### 16.3 Multi-File Documents

Version 0.2 assumes a dspack corpus is a single JSON file. Some design systems may be large enough to benefit from splitting the document across multiple files (e.g., one file per token category or component group). A future version may define conventions for multi-file corpora, including a manifest or index file.

### 16.4 Token Type Taxonomy

The recommended token types listed in [Section 5.3](#53-token-types) are an open set — custom values are permitted. The `tier` property added in version 0.2 classifies tokens by abstraction level, but the question of whether to close the token type set or define a registry remains open.

The W3C Design Tokens Community Group (DTCG) Format Module 2025.10 defines a related type vocabulary. Eight of dspack's recommended types (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `shadow`) align with DTCG by name and semantics. dspack additionally recommends six finer-grained types (`fontSize`, `lineHeight`, `letterSpacing`, `borderRadius`, `opacity`, `string`) that carry more semantic signal for code generation; DTCG subsumes most of these under `dimension` or `number`. A future version may formalize the mapping between the two vocabularies while preserving dspack's finer-grained types where they benefit generation accuracy.

### 16.5 Code Examples in Patterns

Patterns currently have prose `guidance`. A future version may support structured code examples — template snippets per framework — within patterns or composition rules, enabling consumers to generate code from pattern templates rather than from prose interpretation.

### 16.6 Conditional Composition

The composition rules in version 0.2 are static: required children, allowed parents, and required siblings apply unconditionally. A future version may introduce conditional composition rules (e.g., "AlertDialogAction requires the destructive variant WHEN the action is destructive") to capture context-dependent structural constraints.

### 16.7 Token Scoping to Components

The `component` tier in [Section 5.4](#54-token-tiers) is a classification label, not a scoping mechanism. A future version may allow tokens to be explicitly scoped to specific components, enabling consumers to reason about which tokens are private to a component versus shared across the system.
