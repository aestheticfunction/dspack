# dspack Specification

**Version:** 0.1

**Status:** Draft

This document defines the dspack format version 0.1. dspack is a JSON-based format for representing design system corpora — tokens, components, patterns, anti-patterns, and framework bindings — in a structure that tools and AI coding agents can query.

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
10. [Relationships](#10-relationships)
11. [Extensibility](#11-extensibility)
12. [ID and Naming Conventions](#12-id-and-naming-conventions)
13. [File Extension](#13-file-extension)
14. [Open Questions](#14-open-questions)

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
- For documents conforming to this version of the specification, the value MUST be `"0.1"`.

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

The `metadata` object is explicitly extensible. Consumers MUST ignore properties in `metadata` that they do not recognize. Unlike other objects in the document, custom properties in `metadata` do not require the `x-` prefix defined in [Extensibility](#11-extensibility).

---

## 5. Tokens

The `tokens` object organizes token definitions by category. Each key in the `tokens` object is a **category name** and its value is a **token category object**.

### 5.1 Token Category Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | OPTIONAL | What this category covers. |
| `values` | object | REQUIRED | Map of token name to token entry. |

Each key in `values` is a **token name** and its value is a **token entry object**.

### 5.2 Token Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `value` | string | REQUIRED | The resolved value of the token. |
| `description` | string | OPTIONAL | Semantic meaning of the token — what it represents, not just what it resolves to. |
| `type` | string | OPTIONAL | The value type. See [Token Types](#53-token-types). |
| `deprecated` | boolean | OPTIONAL | Whether this token is deprecated. Defaults to `false` if absent. |
| `aliases` | array of strings | OPTIONAL | Other names by which this token is known. |

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

---

## 6. Components

The `components` object maps **component IDs** to **component entry objects**. Each key is a component ID conforming to the naming conventions defined in [ID and Naming Conventions](#12-id-and-naming-conventions).

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
| `deprecated` | boolean | OPTIONAL | Whether this component is deprecated. Defaults to `false` if absent. |
| `deprecatedMessage` | string | OPTIONAL | What to use instead of this component. |

The `whenToUse` and `whenNotToUse` properties are separate fields rather than a combined structure. This allows consumers to retrieve usage guidance and avoidance guidance independently.

The `tokens` array contains token names (the keys within a token category's `values` object). If the same token name appears in more than one category, the reference is ambiguous. Authors SHOULD use unique token names across categories to avoid this.

The `relatedComponents` array contains component IDs (keys in the top-level `components` object). A consumer SHOULD NOT reject a document if a referenced component ID does not exist in the document; the reference MAY point to a component that is not included in this particular dspack file.

### 6.2 Prop Descriptor

Each key in the `props` object is a prop name, and its value is a **prop descriptor object**.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | REQUIRED | The value type of the prop. |
| `description` | string | OPTIONAL | What this prop controls. |
| `values` | array | OPTIONAL | For `enum` type, the allowed values. |
| `default` | any | OPTIONAL | Default value of the prop. |
| `required` | boolean | OPTIONAL | Whether this prop must be provided. Defaults to `false` if absent. |

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

Prop descriptors describe the API surface of a component at a level sufficient for a consumer to understand how to use the component. They are not a complete type system. A dspack file does not replace TypeScript interfaces, PropTypes, or other framework-specific type definitions.

---

## 7. Patterns

The `patterns` property is an array of **pattern entry objects**. Patterns describe preferred ways of combining components to solve recurring problems.

### 7.1 Pattern Entry Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | REQUIRED | Unique identifier. See [ID and Naming Conventions](#12-id-and-naming-conventions). |
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
| `id` | string | REQUIRED | Unique identifier. See [ID and Naming Conventions](#12-id-and-naming-conventions). |
| `name` | string | REQUIRED | Human-readable name describing what not to do. |
| `description` | string | REQUIRED | What this anti-pattern is. |
| `reason` | string | REQUIRED | Why this approach is ruled out. |
| `insteadUse` | string | OPTIONAL | Pattern ID of the preferred approach. |
| `components` | array of strings | OPTIONAL | Component IDs involved in this anti-pattern. |
| `tags` | array of strings | OPTIONAL | Freeform classification tags. |

The `reason` property is REQUIRED. An anti-pattern without a reason is a prohibition without context. The reason captures the institutional knowledge — why the team decided this approach is problematic — and is often the most valuable information in the entry.

The `insteadUse` property, when present, SHOULD reference the `id` of a pattern in the `patterns` array. This creates a direct link from "do not do this" to "do this instead."

Anti-pattern IDs MUST be unique within the `antiPatterns` array.

---

## 9. Framework Bindings

The `frameworkBindings` object maps **framework identifiers** to **framework binding objects**. Each key is a framework identifier conforming to the naming conventions defined in [ID and Naming Conventions](#12-id-and-naming-conventions).

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

Framework bindings are a top-level section rather than nested inside individual component entries. This keeps component definitions framework-agnostic and avoids repeating framework-wide information (package name, global install command) in every component.

The per-component details under `frameworkBindings[framework].components` are joined to the top-level `components` entries by component ID. A consumer that needs the full picture of a component in a specific framework combines the component entry with the corresponding per-component binding.

---

## 10. Relationships

Relationships between concepts in a dspack document are represented through **ID references** rather than explicit edge objects.

The following relationships are defined:

| From | To | Property | Meaning |
|------|----|----------|---------|
| Component | Token | `component.tokens[]` | The component depends on these tokens. |
| Component | Component | `component.relatedComponents[]` | These components are related. |
| Pattern | Component | `pattern.components[]` | The pattern involves these components. |
| Pattern | Pattern | `pattern.relatedPatterns[]` | These patterns are related. |
| Anti-pattern | Pattern | `antiPattern.insteadUse` | Use this pattern instead. |
| Anti-pattern | Component | `antiPattern.components[]` | These components are involved. |
| Framework binding | Component | `frameworkBindings[fw].components[id]` | Framework-specific details for this component. |

References are by ID string. A conforming consumer SHOULD NOT reject a document if a reference target does not exist in the same document. This allows partial documents where not every referenced entity is included.

---

## 11. Extensibility

dspack uses a reserved-prefix convention for extensibility.

### 11.1 Extension Properties

Any object in a dspack document MAY contain additional properties whose keys begin with `x-` (e.g., `x-figmaNodeId`, `x-internalOwner`, `x-designStatus`).

Conforming consumers MUST ignore `x-`-prefixed properties that they do not recognize.

### 11.2 The Metadata Exception

The `metadata` object is fully extensible without the `x-` prefix. Custom keys in `metadata` do not need the `x-` prefix because `metadata` is explicitly designated as the location for tool-specific and organization-specific information.

### 11.3 Reserved Properties

Top-level properties and properties within spec-defined objects that do not start with `x-` and are not defined by this specification are **reserved** for future versions of the spec. Consumers SHOULD warn when they encounter unrecognized non-`x-` properties but MUST NOT reject the document.

---

## 12. ID and Naming Conventions

All identifiers used as object keys or reference values — component IDs, token names, token category names, pattern IDs, anti-pattern IDs, and framework identifiers — MUST conform to the following rules:

- IDs MUST match the regular expression `^[a-z][a-z0-9-]*$` (lowercase ASCII letter followed by zero or more lowercase letters, digits, or hyphens).
- IDs MUST be unique within their namespace. Component IDs are unique among components, pattern IDs are unique among patterns, anti-pattern IDs are unique among anti-patterns, token names are unique within a single token category, and token category names are unique within the `tokens` object.
- IDs SHOULD be meaningful, readable slugs derived from the entity's name (e.g., `alert-dialog` for "Alert Dialog").

---

## 13. File Extension

The RECOMMENDED file extension for dspack documents is `.dspack.json`. This makes the file identifiable by name while retaining the `.json` suffix for editor support and tooling compatibility.

The file extension is a convention, not a requirement. Consumers MUST identify dspack documents by the presence and value of the `dspack` property, not by file extension.

---

## 14. Open Questions

The following are unresolved design questions acknowledged by this draft. They are non-normative and are recorded here to make open areas of the design explicit rather than leaving ambiguity hidden.

### 14.1 Token References

Version 0.1 requires token values to be resolved (final computed values). A future version may support token-to-token references (e.g., `"value": "{color.primary}"`) to represent alias relationships. The design of such a reference system — including syntax, resolution order, and cycle detection — is deferred.

### 14.2 Compound Components

Some component libraries expose compound components — a primary component with closely related sub-components (e.g., `AlertDialog.Trigger`, `AlertDialog.Content`). Version 0.1 does not define a structured representation for sub-components. Authors MAY describe compound component structure in the component's `description` or `whenToUse` text. A future version may introduce a `subComponents` property or similar mechanism.

### 14.3 Localization

Version 0.1 does not define a mechanism for providing descriptions, guidance, or other prose fields in multiple languages. All string fields are assumed to be in a single language. If localization becomes a requirement, it would likely be addressed through a separate mechanism rather than by duplicating every string field.

### 14.4 Multi-File Documents

Version 0.1 assumes a dspack corpus is a single JSON file. Some design systems may be large enough to benefit from splitting the document across multiple files (e.g., one file per token category or component group). A future version may define conventions for multi-file corpora, including a manifest or index file.

### 14.5 Token Type Taxonomy

The recommended token types listed in [Section 5.3](#53-token-types) are an open set — custom values are permitted. A future version may choose to close this set or define a registry. The current approach favors flexibility over strictness.
