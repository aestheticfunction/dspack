# schema/

JSON Schema and related validation artifacts for dspack live in this directory.

## Current schemas

- [`dspack.v0.1.schema.json`](./dspack.v0.1.schema.json) — JSON Schema for dspack v0.1

The schema validates the structure defined in the [v0.1 specification](../spec/dspack-v0.1.md). It enforces required fields, type constraints, and ID naming conventions. It does not validate cross-references between sections (e.g., whether a component ID referenced in a pattern exists in the `components` object).
