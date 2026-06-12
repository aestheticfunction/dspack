# dspack: Design Philosophy

This document carries the long-form rationale behind dspack: why it exists, why it is a file format, and the principles the spec is built around. For the format itself, see the [README](./README.md) and the [current spec draft](./spec/dspack-v0.2.md).

---

## The problem behind the project

Design systems already solve a coordination problem for humans. They provide a shared vocabulary across product, design, and engineering so people can make faster, more consistent decisions. AI-assisted software development introduces the same coordination problem again, but with a different consumer. Agents need structured access to the same vocabulary if they are going to produce code that aligns with the system instead of merely approximating it.

Without that context, agents tend to optimize for plausibility rather than local correctness. They can produce something that looks like a modern card component, but not *your* card component. They can produce a token name that seems sensible, but not the token name your team actually standardized on. They can infer a pattern from surrounding code, but they cannot know whether the pattern is preferred, tolerated, or actively discouraged unless that information is made available in a form they can consult.

## Making knowledge portable

Design systems encode decisions. They define what a button looks like, how spacing scales across breakpoints, when to use a modal versus a sheet, what constitutes an error state, and which patterns have been tried, refined, and sometimes retired. That knowledge is real and valuable — it represents years of iteration, testing, and organizational consensus.

Most of it is effectively invisible to the AI agents now writing production code alongside the people who built those systems.

The problem is not that the information does not exist. It does — in Figma libraries, Storybook instances, ADRs, Confluence pages, token files, and the institutional memory of the teams involved. The problem is that none of it is in a form that a coding agent can load, query, or reason over at the moment it is generating code. An agent writing a new feature has access to training data and whatever context fits in its context window. It does not have access to the fact that your team deprecated the old card component in favor of a new one, or that modals should only be used for destructive confirmations, or that your spacing scale uses an 8px base. It will guess, or interpolate from what it knows about popular open-source systems, which may or may not resemble yours.

dspack is an attempt to make that knowledge portable. It defines a format for capturing a design system's vocabulary — tokens, component contracts, usage patterns, known anti-patterns, and framework-specific bindings — in a single artifact that AI tools can load and query. The format is intentionally simple: it is a document, not a runtime. It describes what a design system knows, not how it renders. An implementation that reads a dspack file can surface the right component names, the right usage guidance, and the right caveats at the moment an agent is making decisions — reducing the gap between how your system works and what the agent produces.

One implication of that framing is worth stating clearly: dspack is meant to be durable. Models, editors, agent runtimes, and orchestration layers will continue to change. The underlying need is more stable. Teams need a way to express design system knowledge in a form that can be carried from one toolchain to another without rewriting that knowledge every time the surrounding ecosystem shifts. The artifact should outlast any single implementation.

Another implication is that dspack is not limited to mature, perfectly documented systems. Many real design systems are partial, uneven, or in transition. They have strong component libraries but inconsistent pattern guidance, or robust token sets but weak documentation around anti-patterns. A useful format needs to be able to represent systems as they are, not only as teams wish they were. The spec work in this repository is intended to reflect that reality.

## Why a file format?

The answer is mostly operational. A file can be versioned, reviewed, diffed, validated, archived, generated, and transported between systems without requiring a particular service to stay online. Teams can commit it to the same repository as their docs, publish it in a package, or generate it from internal sources. It is easier to reason about a format that can exist as an artifact than one defined primarily by a live API.

That choice also makes room for different authoring models. Some teams may maintain dspack files by hand as curated spec artifacts. Others may generate them from token stores, component metadata, or internal design system registries. Others may do both: generate a baseline, then enrich it with guidance that only exists in prose today. The format should support those workflows without assuming one canonical pipeline.

## Design goals

The spec is now a published draft, and it continues to evolve around a few stable goals.

### Portable

The format should be usable by different implementations, in different languages, under different AI integration models. A dspack file should not require MCP, a specific vendor, or a particular editor to be useful.

### Reviewable

Because the artifact is expected to live in source control, it should lend itself to human review. Teams should be able to discuss changes in pull requests, compare versions, and understand what changed between releases.

### Expressive enough for practice

The format needs to capture more than tokens and component names. Real design systems also include usage constraints, contextual guidance, and decisions about what not to do. If the format only covers the easy parts, it will leave out some of the most valuable knowledge.

### Conservative about scope

The temptation with a new format is to absorb adjacent concerns until it becomes difficult to define. This repository is intentionally resisting that. The spec should solve the problem of representing design system knowledge for machine consumption. Problems adjacent to that goal may matter, but they do not automatically belong in the format.

## What a dspack file is not expected to capture exhaustively

Not every useful design system artifact belongs in dspack. The format may reference or summarize upstream sources, but it is not intended to replace all existing documentation. Long-form rationale, exhaustive visual history, internal meeting notes, and design-tool-specific data may remain outside the dspack artifact even when they inform it.

This matters because a good spec for an exchange format is usually selective. It chooses the information that should travel well across tools and contexts. It does not try to absorb every piece of source material into itself.

## Reference implementation, not center of gravity

[ds-mcp](https://github.com/aestheticfunction/ds-mcp) is intentionally described as the reference implementation, not the definition of the project. The spec should be understandable on its own terms and implementable by people who are not interested in MCP at all. A healthy specification has more than one implementation path.

That distinction is important early. Reference implementations are useful because they force a spec to make concrete decisions and expose what is underspecified. They are less useful if the ecosystem begins to assume that the implementation *is* the spec. This repository will try to keep those boundaries clear as the work develops.

## Implementation diversity is a goal

If you maintain a design system in a Python-heavy organization, a Go-based internal platform, or a custom AI gateway that has nothing to do with MCP, your use case is still in scope for dspack. Additional implementations are not side projects around the edges of the format; they are part of validating that the format is actually portable.
