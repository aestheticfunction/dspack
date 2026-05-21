# dspack

**dspack** is a JSON-based format for representing design system corpora — tokens, components, patterns, and anti-patterns — in a structure that AI coding agents can query.

---

> **Status: Pre-draft · v0.1 spec in development.**
>
> The specification document does not yet exist. This repository is where the spec will be designed and maintained. Contributions to the design are welcome at any stage.

---

## Table of Contents

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

Design systems encode decisions. They define what a button looks like, how spacing scales across breakpoints, when to use a modal versus a sheet, what constitutes an error state, and which patterns have been tried, refined, and sometimes retired. That knowledge is real and valuable — it represents years of iteration, testing, and organizational consensus.

Most of it is effectively invisible to the AI agents now writing production code alongside the people who built those systems.

The problem is not that the information does not exist. It does — in Figma libraries, Storybook instances, ADRs, Confluence pages, token files, and the institutional memory of the teams involved. The problem is that none of it is in a form that a coding agent can load, query, or reason over at the moment it is generating code. An agent writing a new feature has access to training data and whatever context fits in its context window. It does not have access to the fact that your team deprecated the old card component in favor of a new one, or that modals should only be used for destructive confirmations, or that your spacing scale uses an 8px base. It will guess, or interpolate from what it knows about popular open-source systems, which may or may not resemble yours.

dspack is an attempt to make that knowledge portable. It defines a format for capturing a design system's vocabulary — tokens, component contracts, usage patterns, known anti-patterns, and framework-specific bindings — in a single artifact that AI tools can load and query. The format is intentionally simple: it is a document, not a runtime. It describes what a design system knows, not how it renders. An implementation that reads a dspack file can surface the right component names, the right usage guidance, and the right caveats at the moment an agent is making decisions — reducing the gap between how your system works and what the agent produces.

One implication of that framing is worth stating clearly: dspack is meant to be durable. Models, editors, agent runtimes, and orchestration layers will continue to change. The underlying need is more stable. Teams need a way to express design system knowledge in a form that can be carried from one toolchain to another without rewriting that knowledge every time the surrounding ecosystem shifts. The artifact should outlast any single implementation.

Another implication is that dspack is not limited to mature, perfectly documented systems. Many real design systems are partial, uneven, or in transition. They have strong component libraries but inconsistent pattern guidance, or robust token sets but weak documentation around anti-patterns. A useful format needs to be able to represent systems as they are, not only as teams wish they were. The spec work in this repository is intended to reflect that reality.

### Why a file format?

The answer is mostly operational. A file can be versioned, reviewed, diffed, validated, archived, generated, and transported between systems without requiring a particular service to stay online. Teams can commit it to the same repository as their docs, publish it in a package, or generate it from internal sources. It is easier to reason about a format that can exist as an artifact than one defined primarily by a live API.

That choice also makes room for different authoring models. Some teams may maintain dspack files by hand as curated spec artifacts. Others may generate them from token stores, component metadata, or internal design system registries. Others may do both: generate a baseline, then enrich it with guidance that only exists in prose today. The format should support those workflows without assuming one canonical pipeline.

### The problem behind the project

Design systems already solve a coordination problem for humans. They provide a shared vocabulary across product, design, and engineering so people can make faster, more consistent decisions. AI-assisted software development introduces the same coordination problem again, but with a different consumer. Agents need structured access to the same vocabulary if they are going to produce code that aligns with the system instead of merely approximating it.

Without that context, agents tend to optimize for plausibility rather than local correctness. They can produce something that looks like a modern card component, but not *your* card component. They can produce a token name that seems sensible, but not the token name your team actually standardized on. They can infer a pattern from surrounding code, but they cannot know whether the pattern is preferred, tolerated, or actively discouraged unless that information is made available in a form they can consult.

---

## Design goals

The detailed spec is still to come, but the repository is being set up around a few stable goals.

### Portable

The format should be usable by different implementations, in different languages, under different AI integration models. A dspack file should not require MCP, a specific vendor, or a particular editor to be useful.

### Reviewable

Because the artifact is expected to live in source control, it should lend itself to human review. Teams should be able to discuss changes in pull requests, compare versions, and understand what changed between releases.

### Expressive enough for practice

The format needs to capture more than tokens and component names. Real design systems also include usage constraints, contextual guidance, and decisions about what not to do. If the format only covers the easy parts, it will leave out some of the most valuable knowledge.

### Conservative about scope

The temptation with a new format is to absorb adjacent concerns until it becomes difficult to define. This repository is intentionally resisting that. The spec should solve the problem of representing design system knowledge for machine consumption. Problems adjacent to that goal may matter, but they do not automatically belong in the format.

---

## Concepts

The spec is not yet written. The following describes the intended shape of a dspack file at a high level. Field names, structural details, and validation rules are the subject of the design conversation this repository exists to host.

A dspack file is a snapshot of a design system's knowledge at a point in time. It is not a live connection to Figma, Storybook, or any other tool. It is a document — created by hand, generated by a tool, or some combination — that captures what the system knows and makes that knowledge available to other tools.

At a high level, a dspack file is expected to organize the following kinds of information:

### Tokens

The named values that anchor a system's visual language: color roles, type scales, spacing units, border radii, shadow definitions, motion curves, and similar primitives. Tokens are the vocabulary everything else is built from. In a dspack file, tokens are not raw hex values or pixel measurements in isolation — they carry semantic meaning. A token named for a feedback error color means something different from the raw hex value it resolves to, even when they are equivalent at a given moment.

### Components

The building blocks the system exposes for use. A component entry describes what a component is for, the variants and states it supports, and the API surface it presents. It does not include implementation code. The goal is to give a consuming agent enough information to use the component correctly — to choose the right variant for a given context, to understand what props are required versus optional, and to know which components are appropriate for a given use case.

### Patterns

Preferred ways of combining components to solve recurring problems. A pattern entry captures intent: the problem it addresses, the context in which it applies, the components involved, and any guidance on when to prefer it over alternatives. Patterns are the second layer of a design system's vocabulary — above individual components, below complete page designs.

### Anti-patterns

Things the system has deliberately ruled out, with the reason why. This is often the most perishable knowledge in a design system. When a team decides that a particular approach is problematic — because it creates accessibility issues, because it confuses users, because it leads to maintenance problems — that decision frequently goes unrecorded. dspack treats anti-patterns as first-class entries. An AI agent that knows what *not* to do is less likely to reproduce the mistakes a team has already worked through.

### Framework bindings

A design system often ships implementations in multiple frameworks. dspack can record which frameworks are supported, where their packages are published, and any framework-specific guidance that does not apply universally. Framework bindings allow a dspack file to be useful across a polyglot organization without requiring separate files for each framework.

### Relationships between concepts

These concepts are useful on their own, but part of the value of dspack is in how they relate to one another. Components depend on tokens. Patterns compose components. Anti-patterns often explain why a pattern exists or why a component should not be used in a particular way. Framework bindings connect abstract design system guidance to concrete implementation surfaces.

The spec will eventually need to define how those relationships are represented, but this repository is not making those decisions yet. At this stage, the important point is that a design system is more than a flat list of parts. The format is being developed with that connected structure in mind.

### What a dspack file is not expected to capture exhaustively

Not every useful design system artifact belongs in dspack. The format may reference or summarize upstream sources, but it is not intended to replace all existing documentation. Long-form rationale, exhaustive visual history, internal meeting notes, and design-tool-specific data may remain outside the dspack artifact even when they inform it.

This matters because a good spec for an exchange format is usually selective. It chooses the information that should travel well across tools and contexts. It does not try to absorb every piece of source material into itself.

---

## Implementations

[ds-mcp](https://github.com/aestheticfunction/ds-mcp) is the reference implementation of dspack. It is a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that reads a dspack file and exposes its contents as tools that MCP-compatible AI agents — including Claude, Cursor, and GitHub Copilot — can call at inference time. When an agent is generating code, it can query the dspack file through ds-mcp to retrieve the correct token names, find the right component for a given context, or check whether a pattern applies.

ds-mcp is one way to consume a dspack file. It is not the only way, and dspack is not defined by or dependent on it. The format is independent of MCP, independent of any specific AI agent or orchestration framework, and independent of any particular runtime environment.

If you want to build a dspack reader for a different use case, the format is available under the Apache-2.0 license. Potential directions include:

- Readers for non-MCP agentic frameworks (LangChain, AutoGen, or similar)
- CLI tools for querying or linting dspack files
- IDE plugins that surface design system context directly in the editor
- RAG pipeline integrations that index dspack content alongside codebases
- Implementations in Go, Python, Rust, or other languages

If you are building something that consumes dspack, feel free to open a discussion or mention it in an issue. This repository maintains a record of known implementations as they emerge.

### Reference implementation, not center of gravity

ds-mcp is intentionally described here as the reference implementation, not the definition of the project. The spec should be understandable on its own terms and implementable by people who are not interested in MCP at all. A healthy specification has more than one implementation path.

That distinction is important early. Reference implementations are useful because they force a spec to make concrete decisions and expose what is underspecified. They are less useful if the ecosystem begins to assume that the implementation *is* the spec. This repository will try to keep those boundaries clear as the work develops.

### Implementation diversity is a goal

If you maintain a design system in a Python-heavy organization, a Go-based internal platform, or a custom AI gateway that has nothing to do with MCP, your use case is still in scope for dspack. Additional implementations are not side projects around the edges of the format; they are part of validating that the format is actually portable.

---

## Non-goals

dspack has a defined scope. Understanding what it is not helps clarify what it is.

**dspack is not a code generator.** It describes a design system's vocabulary and contracts; it does not produce component scaffolding, generate CSS, or write implementation files. Code generation may be something a consuming tool does with dspack content, but it is not part of the format.

**dspack is not a design tool.** It does not replace Figma, Sketch, Penpot, or any other design environment. It is downstream of those tools — it can represent knowledge that originates there — but it does not create, edit, or display designs.

**dspack is not a drift reconciliation system.** It does not watch a codebase for divergence from a design spec, flag components that have fallen out of sync, or push changes from design back into code. That is a distinct problem with distinct requirements. (See the acknowledgments for a project that addresses it.)

**dspack is not a rendering engine.** The format has nothing to say about how components look or behave at runtime. It describes contracts, intent, and vocabulary — not pixels, not computed styles, not DOM structure.

**dspack is not framework-specific.** The format is not defined in terms of React, Vue, Angular, Web Components, or any other implementation technology. A single dspack file can describe a design system that ships implementations across multiple frameworks.

**dspack is not tied to any design tool's export format.** It is not a Figma plugin output, a Storybook export, or a token file format. It may ingest or reference those formats, but it is its own thing, with its own schema and versioning.

**dspack is not a substitute for design system governance.** The existence of a structured artifact does not resolve disagreements about naming, component ownership, deprecation policy, or accessibility standards. It can record decisions; it does not make them.

**dspack is not a guarantee of implementation quality.** A poor consumer can misuse a good file, and a weak file can limit a good consumer. The format can improve the conditions under which agents operate, but it does not remove the need for review, testing, and judgment.

---

## Roadmap

The following milestones represent the current intended direction. They are not scheduled. The priority is getting the spec right, not getting it done quickly.

| Milestone | Description |
|-----------|-------------|
| **Schema design conversation** | Structured discussion to establish core vocabulary, structural constraints, and extensibility model for v0.1 |
| **v0.1 spec draft** | First complete draft of the dspack specification, published in `spec/` |
| **shadcn/ui example dspack** | A reference dspack file for the [shadcn/ui](https://ui.shadcn.com) component library, for testing implementations and demonstrating the format |
| **ds-mcp v0 release** | First release of the reference implementation, validated against the v0.1 spec |
| **Community RFCs** | Open RFC process for proposing additions and changes to the spec |
| **v1.0 spec stabilization** | First stable, versioned release of the specification; breaking changes require a formal process after this point |

Community feedback will influence the order and scope of these milestones.

Some of these milestones depend on each other in obvious ways. Others are intended to provide pressure in both directions. For example, drafting the spec informs what a reference example should contain, but attempting a real example also exposes whether the draft is missing concepts or forcing awkward abstractions. The roadmap is best understood as a set of feedback loops rather than a strict waterfall.

The roadmap is also intentionally modest. There is no promise of broad ecosystem alignment by a certain date, and no attempt to define success purely by implementation count. A stable specification that accurately represents the problem is more useful than a fast-moving one that accumulates loosely defined concepts.

---

## How to participate

### Issues

GitHub Issues are the preferred place for concrete, specific input:

- **Spec questions** — if something about the intended behavior or scope of the format is unclear, open a spec question issue. Even before the spec is written, questions about intent help shape the design.
- **Ambiguity reports** — once the spec exists, reports of language that is unclear or could be interpreted multiple ways are high-value contributions. A spec with documented ambiguities is better than one with undocumented ones.
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

There is no formal RFC numbering scheme at this stage.

That lightweight process is deliberate. The repository is still early enough that over-formalizing the process would create more ceremony than clarity. If the volume of proposals grows or the project reaches a point where multiple active drafts need clearer tracking, the process can become more structured later.

### Who should contribute

You do not need to be a software engineer to contribute to this spec. Design system practitioners of all kinds — designers, content strategists, product managers, accessibility specialists — are invited to participate. The spec should reflect how design systems actually work in organizations, not just how they are implemented in code. If you work with design systems and have opinions about what this format should be able to represent, those opinions are relevant here.

That invitation also extends to people who do not expect to use ds-mcp themselves. dspack is intended to stand as a general-purpose specification. If your interest is in documentation workflows, schema validation, internal tooling, package metadata, or some future implementation that has not been written yet, your perspective still helps shape the format.

### Good early contributions

In a pre-draft repository, some forms of contribution are more useful than others. The most helpful early inputs are usually:

- examples of design system knowledge that is hard to express with current tooling
- cases where agents consistently make the wrong design-system decision
- distinctions a spec would need to preserve for your organization to trust the artifact
- notes about interoperability constraints if you maintain design systems across multiple frameworks or platforms
- questions that expose unclear assumptions in the repository's current framing

At this stage, concrete examples of real design-system problems are often more valuable than abstract debates about ideal structure.

### What this repository will do over time

As the work progresses, the repository will accumulate four main kinds of material:

- versioned specification documents in `spec/`
- schema and validation artifacts in `schema/`
- example dspack files in `examples/`
- design proposals and change records in `rfc/`

This initial setup is intentionally lighter than that future state. The point right now is to establish the repository as the stable home for the spec work before the draft text arrives.

---

## Acknowledgments

dspack was created by [Ryan Dombrowski](https://github.com/ryandmonk) ([LinkedIn](https://www.linkedin.com/in/ryan-dombrowski)), who also builds [Aesthetic Function](https://github.com/aestheticfunction) — a separate project focused on continuous reconciliation between code and design.

---

## License

Copyright 2026 Ryan Dombrowski.

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text.
