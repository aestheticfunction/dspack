# examples/

Example dspack files live in this directory. Examples are intended to help implementers and readers understand how the specification is applied in practice.

## Current examples

- [`shadcn-ui.dspack.json`](./shadcn-ui.dspack.json) — a reference dspack file for the [shadcn/ui](https://ui.shadcn.com) component library
- [`astryx.dspack.json`](./astryx.dspack.json) — a governed slice of Meta's [Astryx](https://github.com/facebook/astryx) design system (pinned v0.1.2): 9 components, categories mirroring Astryx's own docs taxonomy, and 6 rules converted from the repository's structured `*.doc.mjs` guidance, each with a provenance link (`x-source`). Notable: Astryx components are props-based (labels are required string props; tables and menus are data-driven array props) — a deliberately different idiom from shadcn's compound composition

The shadcn/ui example demonstrates the corpus concepts (tokens, components, patterns, anti-patterns, framework bindings), the v0.3 governance blocks (intents, rules, examples), and the v0.4 additions (component categories, a `required-props` rule, a category-based `forbidden-composition` rule). It validates against the [v0.4 JSON Schema](../schema/dspack.v0.4.schema.json).
