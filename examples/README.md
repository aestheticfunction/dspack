# examples/

Example dspack files live in this directory. Examples are intended to help implementers and readers understand how the specification is applied in practice.

## Current examples

- [`shadcn-ui.dspack.json`](./shadcn-ui.dspack.json) — a reference dspack file for the [shadcn/ui](https://ui.shadcn.com) component library

The shadcn/ui example demonstrates the corpus concepts (tokens, components, patterns, anti-patterns, framework bindings), the v0.3 governance blocks (intents, rules, examples), and the v0.4 additions (component categories, a `required-props` rule, a category-based `forbidden-composition` rule). It validates against the [v0.4 JSON Schema](../schema/dspack.v0.4.schema.json).
