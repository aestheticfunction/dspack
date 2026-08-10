# examples/

Example dspack files live in this directory. Examples are intended to help implementers and readers understand how the specification is applied in practice.

## Current examples

- [`shadcn-ui.dspack.json`](./shadcn-ui.dspack.json) — a reference dspack file for the [shadcn/ui](https://ui.shadcn.com) component library
- [`astryx.dspack.json`](./astryx.dspack.json) — a governed slice of Meta's [Astryx](https://github.com/facebook/astryx) design system (pinned v0.1.4; published on npm under the `@astryxdesign` scope): 12 components, categories mirroring Astryx's own docs taxonomy, and 14 rules converted from the repository's structured `*.doc.mjs` guidance and the studio's example-expansion governance, each rule with a provenance link (`x-source`). Notable: Astryx components are props-based (labels are required string props; tables and menus are data-driven array props) — a deliberately different idiom from shadcn's compound composition

The shadcn/ui example demonstrates the corpus concepts (tokens, components, patterns, anti-patterns, framework bindings), the v0.3 governance blocks (intents, rules, examples), and the v0.4 additions: 7 component categories, 26 `required-props` rules, 2 category-based `forbidden-composition` rules, and a `requiredCategories` rule (`rule.form-control-carries-control`). It validates against the [v0.4 JSON Schema](../schema/dspack.v0.4.schema.json).
