# spec/

Versioned specification documents for dspack live in this directory.

## Current drafts

- [`dspack-v0.4.md`](./dspack-v0.4.md) — v0.4 specification (current draft, written as a
  delta over v0.3): component categories (contract-defined registry, membership metadata,
  the `forbiddenCategories` rule form), the `required-props` rule type ("this component
  must carry named content directly"), and two amendments: `requiredCategories` (§4.3) and
  S2 sub-component containment (§5.1)
- [`migration-v0.3-to-v0.4.md`](./migration-v0.3-to-v0.4.md) — migration guide (v0.4 is
  strictly additive; includes the worked v0.4 deltas from the shadcn contract)
- [`dspack-v0.3.md`](./dspack-v0.3.md) — v0.3 specification (written as a
  delta over v0.2; remains normative for everything the v0.4 delta does not cover): the
  governance blocks (`intents`, `rules`, `examples`), normative rule
  evaluation semantics, the severity mapping (must→error / should→warn), the dspack surface
  format, and the S1/S2/S3 validation gates
- [`migration-v0.2-to-v0.3.md`](./migration-v0.2-to-v0.3.md) — migration guide (v0.3 is
  strictly additive; includes a worked anti-pattern → rule conversion)
- [`dspack-v0.2.md`](./dspack-v0.2.md) — v0.2 specification (remains normative for everything
  the v0.3/v0.4 deltas do not cover)
- [`dspack-v0.1.md`](./dspack-v0.1.md) — v0.1 specification draft

All drafts may change before stabilization at v1.0.
