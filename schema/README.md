# schema/

JSON Schema and related validation artifacts for dspack live in this directory.

## Current schemas

- [`dspack.v0.3.schema.json`](./dspack.v0.3.schema.json) — JSON Schema for dspack v0.3
  (current draft; adds the governance blocks: `intents`, `rules`, `examples`)
- [`dspack.surface.v0_1.schema.json`](./dspack.surface.v0_1.schema.json) — JSON Schema for
  the dspack **surface** document (v0.1), the protocol-neutral component tree that governance
  rules are evaluated against and that `examples[].surface` embeds
- [`dspack.v0.2.schema.json`](./dspack.v0.2.schema.json) — JSON Schema for dspack v0.2
- [`dspack.v0.1.schema.json`](./dspack.v0.1.schema.json) — JSON Schema for dspack v0.1

Each dspack schema validates the structure defined in the matching specification under
[`spec/`](../spec). Schemas enforce required fields, type constraints, and ID naming
conventions; they do **not** validate cross-references between sections (e.g., whether a
component ID referenced in a rule exists in `components`).

Cross-reference consistency — plus validation of every `examples[].surface` against the
surface schema (gate S1) and the contract vocabulary (gate S2) — is checked by the
repository's validation harness:

```bash
npm ci
npm run validate                        # schemas compile; examples valid; consistency + S1/S2
npm run validate -- --fixtures negative # every fixtures/negative/* must be rejected
```
