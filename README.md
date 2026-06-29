# dspack

**dspack** is an open JSON specification for representing what a design system knows: tokens, components, patterns, and anti-patterns in one portable artifact that AI agents can query.

Think of it as OpenAPI for design systems.

---

> **Status: v0.2 draft available.**
>
> The current draft is [`spec/dspack-v0.2.md`](./spec/dspack-v0.2.md), with a matching [JSON Schema](./schema/dspack.v0.2.schema.json) and a [shadcn/ui reference example](./examples/shadcn-ui.dspack.json). The [v0.1 spec](./spec/dspack-v0.1.md) and [schema](./schema/dspack.v0.1.schema.json) are preserved for reference. v0.2 is fully backward-compatible — a valid v0.1 document with `"dspack": "0.2"` validates against the v0.2 schema. This is a draft — breaking changes may occur before v1.0. Contributions to the design are welcome at any stage.

---

## dspack in action

One dspack contract, consumed end-to-end by tools that never coordinated — queried over MCP, compiled to an A2UI catalog, and rendered. The spec travels.

https://github.com/user-attachments/assets/510a781b-4214-49b3-b997-9cbecdc36961

---

## Table of Contents

- [dspack in action](#dspack-in-action)
- [What is dspack?](#what-is-dspack)
- [Concepts](#concepts)
- [Implementations](#implementations)
- [Non-goals](#non-goals)
- [Roadmap](#roadmap)
- [How to participate](#how-to-participate)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## What is dspack?

Design systems encode decisions: what a button looks like, how spacing scales, when to use a modal versus a sheet, which patterns have been tried and retired. Most of that knowledge is effectively invisible to the AI agents now writing production code alongside the people who built those systems.

dspack makes that knowledge portable. It defines a format for capturing a design system's vocabulary, including tokens, component contracts, usage patterns, known anti-patterns, and framework-specific bindings, in a single artifact that AI tools can load and query. The format is intentionally simple: it is a document, not a runtime. It describes what a design system knows, not how it renders.

The artifact is meant to be durable. Models, editors, and agent runtimes will keep changing; the need to carry design system knowledge between toolchains is more stable. A file can be versioned, reviewed, diffed, validated, and transported without requiring a particular service to stay online.

The full rationale, including why a file format and the principles the spec is built around, lives in [DESIGN.md](./DESIGN.md).

---

## Concepts

A dspack file is a snapshot of a design system's knowledge at a point in time. It is not a live connection to Figma, Storybook, or any other tool. It organizes the following kinds of information:

- **Tokens.** The named values that anchor a system's visual language, organized by category and classified by abstraction tier (primitive, semantic, or component-scoped), with alias relationships between tiers.
- **Components.** What each component is for, the variants and states it supports, and the API surface it presents, plus lifecycle status, accessibility constraints, composition rules, and machine-readable usage constraints. No implementation code.
- **Patterns.** Preferred ways of combining components to solve recurring problems: the problem addressed, the context, the components involved, and when to prefer the pattern over alternatives.
- **Anti-patterns.** Things the system has deliberately ruled out, with the reason why and a severity level. An agent that knows what *not* to do is less likely to reproduce mistakes a team has already worked through.
- **Framework bindings.** Which frameworks are supported, where packages are published, and per-sub-component import and export information, so consumers can generate correct import statements.
- **Themes.** Named sets of token overrides for alternative visual modes: dark mode, high contrast, compact density.
- **Layout primitives.** Responsive breakpoints, grid configuration, container sizes, and spacing scale parameters.

These concepts relate to one another: components depend on tokens, patterns compose components, anti-patterns explain why a pattern exists, tokens alias other tokens across tiers, and themes override tokens for alternative contexts.

---

## Implementations

### Producing dspack files

[dspack-export](https://github.com/aestheticfunction/dspack-export) (experimental) generates a dspack v0.2 file from a React + Tailwind/shadcn codebase: components and props (including cva variant enums and their defaults), semantic color and radius tokens from CSS custom properties, dark-theme overrides, layout breakpoints, and React import bindings. It is a snapshot generator. Hand-authored sections such as `patterns`, `antiPatterns`, `whenToUse`, `accessibility`, and `constraints` remain yours to write; an exporter can extract facts, but the institutional knowledge that makes a dspack file valuable to agents comes from your team.

dspack files can also simply be written by hand — the [shadcn/ui example](examples/shadcn-ui.dspack.json) in this repository was authored that way. A valid document needs only `dspack` and `name`.

### Consuming dspack files

[ds-mcp](https://github.com/aestheticfunction/ds-mcp) is the reference implementation of dspack. It is a read-only [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that loads a dspack file and exposes your design system as tools AI coding agents can query at coding time. It supports dspack v0.1 and v0.2.

ds-mcp is one way to consume a dspack file, not the only way. The format is independent of MCP, independent of any specific AI agent or orchestration framework, and independent of any particular runtime environment. (On why the reference implementation is deliberately not the center of gravity, see [DESIGN.md](./DESIGN.md).)

If you want to build a dspack reader for a different use case, the format is available under the Apache-2.0 license. Potential directions include:

- Readers for non-MCP agentic frameworks (LangChain, AutoGen, or similar)
- CLI tools for querying or linting dspack files
- IDE plugins that surface design system context directly in the editor
- RAG pipeline integrations that index dspack content alongside codebases
- Implementations in Go, Python, Rust, or other languages

If you are building something that consumes dspack, feel free to open a discussion or mention it in an issue. This repository maintains a record of known implementations as they emerge.

---

## Non-goals

dspack has a defined scope. Understanding what it is not helps clarify what it is.

**dspack is not a code generator.** It describes a design system's vocabulary and contracts; it does not produce component scaffolding, generate CSS, or write implementation files.

**dspack is not a design tool.** It does not replace Figma, Sketch, Penpot, or any other design environment. It is downstream of those tools.

**dspack is not a drift reconciliation system.** It does not watch a codebase for divergence from a design spec, flag components that have fallen out of sync, or push changes from design back into code. That is a distinct problem with distinct requirements. (See the acknowledgments for a project that addresses it.)

**dspack is not a rendering engine.** It describes contracts, intent, and vocabulary, not pixels, computed styles, or DOM structure.

**dspack is not framework-specific.** A single dspack file can describe a design system that ships implementations across multiple frameworks.

**dspack is not tied to any design tool's export format.** It may ingest or reference those formats, but it has its own schema and versioning.

**dspack is not a substitute for design system governance.** It can record decisions; it does not make them.

**dspack is not a guarantee of implementation quality.** The format can improve the conditions under which agents operate, but it does not remove the need for review, testing, and judgment.

---

## Roadmap

The following milestones represent the current intended direction. They are not scheduled. The priority is getting the spec right, not getting it done quickly.

| Milestone | Description |
|-----------|-------------|
| **Schema design conversation** | Structured discussion to establish core vocabulary, structural constraints, and extensibility model for v0.1 |
| **v0.1 spec draft** | First complete draft of the dspack specification — _[available](./spec/dspack-v0.1.md)_ |
| **shadcn/ui example dspack** | A reference dspack file for the [shadcn/ui](https://ui.shadcn.com) component library — _[available](./examples/shadcn-ui.dspack.json)_ |
| **v0.2 spec draft** | Adds structured generation constraints: lifecycle status, accessibility, composition rules, contextual constraints, variant semantics, token hierarchy, themes, layout primitives, and anti-pattern severity — _[available](./spec/dspack-v0.2.md)_ |
| **ds-mcp v0 release** | First release of the reference implementation, validated against the v0.2 spec — _[available](https://github.com/aestheticfunction/ds-mcp)_ |
| **Community RFCs** | Open RFC process for proposing additions and changes to the spec |
| **v1.0 spec stabilization** | First stable, versioned release of the specification; breaking changes require a formal process after this point |

Community feedback will influence the order and scope of these milestones. The roadmap is best understood as a set of feedback loops rather than a strict waterfall: drafting the spec informs what a reference example should contain, and attempting a real example exposes whether the draft is missing concepts or forcing awkward abstractions.

---

## How to participate

### Issues

GitHub Issues are the preferred place for concrete, specific input:

- **Spec questions** — if something about the intended behavior or scope of the format is unclear, open a spec question issue. Questions about intent help sharpen the draft.
- **Ambiguity reports** — reports of spec language that is unclear or could be interpreted multiple ways are high-value contributions. A spec with documented ambiguities is better than one with undocumented ones.
- **Breaking change proposals** — proposals for changes that would be incompatible with prior versions of the spec. These require more context and deliberation than other issues.

Issue templates are provided for each of these. Labels for routing issues are configured in the repository settings; if a label is missing when you open an issue, it will be added during triage.

### Discussions

GitHub Discussions are open for broader conversation: use cases you are trying to cover, design system patterns the spec should be able to represent, experience reports from working with AI agents and existing design systems, or anything that does not fit neatly into an issue.

If you are unsure whether something should be an issue or a discussion, start with a discussion when the topic is exploratory and an issue when the topic describes a concrete problem to resolve. There is no penalty for getting that wrong in an early-stage repository; the goal is to keep useful information visible and actionable.

### The RFC process

For substantive proposals — new top-level concepts, structural changes, or anything requiring updates to existing dspack files — the process is lightweight:

1. **Open a GitHub Discussion** describing the problem and your proposed approach. The goal at this stage is to validate that the problem is real and that the direction makes sense before investing in a full proposal.
2. **Iterate in the discussion** until the proposal is reasonably stable. Gather input, refine the approach, identify edge cases.
3. **Open a pull request** adding a document to the `rfc/` directory. The template and conventions for RFC documents are described in [`rfc/README.md`](./rfc/README.md).
4. **Review happens in the PR.** An RFC is accepted when it merges; it is rejected when the PR is closed without merging.

There is no formal RFC numbering scheme at this stage. The repository is still early enough that over-formalizing the process would create more ceremony than clarity.

### Who should contribute

You do not need to be a software engineer to contribute to this spec. Design system practitioners of all kinds — designers, content strategists, product managers, accessibility specialists — are invited to participate. The spec should reflect how design systems actually work in organizations, not just how they are implemented in code.

That invitation also extends to people who do not expect to use ds-mcp themselves. dspack is intended to stand as a general-purpose specification. If your interest is in documentation workflows, schema validation, internal tooling, package metadata, or some future implementation that has not been written yet, your perspective still helps shape the format.

### Good early contributions

The most helpful inputs at this stage are usually:

- examples of design system knowledge that is hard to express with current tooling
- cases where agents consistently make the wrong design-system decision
- distinctions a spec would need to preserve for your organization to trust the artifact
- notes about interoperability constraints if you maintain design systems across multiple frameworks or platforms
- questions that expose unclear assumptions in the current draft

Concrete examples of real design-system problems are often more valuable than abstract debates about ideal structure.

### What this repository contains

- versioned specification documents in `spec/`
- schema and validation artifacts in `schema/`
- example dspack files in `examples/`
- design proposals and change records in `rfc/`

---

## Acknowledgments

dspack was created by [Ryan Dombrowski](https://github.com/ryandmonk) ([LinkedIn](https://www.linkedin.com/in/ryan-dombrowski)), who also builds [Aesthetic Function](https://github.com/aestheticfunction), a reconciliation engine that keeps design systems aligned across Figma, code, and documentation.

---

## License

Copyright 2026 Aesthetic Function, LLC.

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text.
