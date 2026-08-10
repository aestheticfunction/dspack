# Adopting dspack for an existing design system

You have a design system — components in code, tokens, house rules, opinions
earned the hard way. This guide walks the complete path from that starting
point to a **locally validated dspack contract** that AI agents can query
([ds-mcp](https://github.com/aestheticfunction/ds-mcp)), generate under
([dspack-gen](https://github.com/aestheticfunction/dspack-gen)), and render
from ([dspack-emit](https://github.com/aestheticfunction/dspack-emit)).

Every step is labeled with one of three modes, and the labels are the point:

| Label | Meaning |
|---|---|
| 🤖 **Automated** | A tool does this. Run the command. |
| 👀 **Human review** | A machine produced output; a person confirms it is true. |
| ⚖️ **Design decision** | Nobody can extract this. It encodes a choice your team made. No tool in this ecosystem will pretend otherwise. |

The honest summary up front: the machine-extractable half of a contract
(tokens, component props, bindings, themes, layout) is steps 1–3 and takes
minutes. The valuable half — the governance that makes an agent behave like
someone who has read your guidelines — is steps 4–9, and it is authored, not
extracted. That is by design: rules carry rationales, and rationales are
decisions. ([DESIGN.md](./DESIGN.md) explains why the format draws the line
there.)

## The journey at a glance

| # | Step | Mode |
|---|------|------|
| 1 | [Extract a snapshot from your codebase](#step-1--extract-a-snapshot---automated) | 🤖 Automated |
| 2 | [~~Set the version to the current spec~~](#step-2--set-the-version--retired) — retired; snapshots declare it | 🤖 Automated |
| 3 | [Review the snapshot against reality](#step-3--review-the-snapshot---human-review) | 👀 Human review |
| 4 | [Author component guidance](#step-4--author-component-guidance--) | ⚖️ Design decision |
| 5 | [Define categories and tag components](#step-5--define-categories--) | ⚖️ Design decision |
| 6 | [Record patterns and anti-patterns](#step-6--patterns-and-anti-patterns--) | ⚖️ Design decision |
| 7 | [Name your intents](#step-7--name-your-intents--) | ⚖️ Design decision |
| 8 | [Write rules](#step-8--write-rules--) | ⚖️ Design decision |
| 9 | [Write worked examples and cross-link them](#step-9--worked-examples---machine-validated) | ⚖️ Design decision (machine-validated) |
| 10 | [Validate the contract](#step-10--validate---automated) | 🤖 Automated |
| 11 | [Serve it to agents](#step-11--serve-it-to-agents---automated) | 🤖 Automated |
| 12 | [Generate, lint, and render](#step-12--generate-lint-render---rendering-profile-) | 🤖 Automated (rendering profile: ⚖️) |

Step 1 assumes a React + Tailwind/shadcn or Vue 3 + Vuetify 3 codebase
(what [dspack-export](https://github.com/aestheticfunction/dspack-export)
currently supports). For any other stack, skip to
[Writing the snapshot by hand](#writing-the-snapshot-by-hand) — a valid
document needs only `dspack` and `name`, and the shadcn reference contract
was written entirely by hand.

---

## Phase 1 — the snapshot (minutes)

### Step 1 · Extract a snapshot — 🤖 Automated

```bash
npm install -g @aestheticfunction/dspack-export

cd /path/to/your/design-system
dspack-export init        # detects conventions, writes dspack-export.config.json
dspack-export generate --config dspack-export.config.json
```

(Installing from a source clone — `npm install && npm run build && npm link`
in a checkout — works identically.)

You get a `<name>.dspack.json` (named from your `package.json` name, or a
placeholder if there isn't one) containing everything observable from
source: `components` with props (cva variant enums and defaults on React;
`defineProps`/emits/slots on Vue), `tokens` from CSS custom properties or an
imported DTCG token file, `themes` (dark-mode overrides), `layout`
(breakpoints), `frameworkBindings` (import paths), and `metadata` recording
what generated it. If your tokens live in Figma or Tokens Studio, export them
to a DTCG file and point the config's `tokens` field at it — the import is
file-based; no tool integration or network involved.

Three properties of the output matter later:

- It is **deterministic** — same input, same bytes — so you can commit it and
  diff regenerations.
- It carries a non-semantic `metadata["x-bootstrap"]` **ledger** recording
  which sections the tool generated (with content hashes) and which
  governance surfaces await your authorship. It affects nothing downstream;
  once your contract is fully yours, delete it — after which the tool
  refuses to touch the file at all.
- **Regeneration never destroys your work — guaranteed, not advised.** The
  workflow is: commit the snapshot, then enrich the committed copy. If you
  run `generate` against a file containing anything you authored (or any
  file without the ledger), it refuses, says why, and points you at
  `--out` for writing a fresh snapshot elsewhere to compare by hand.

### Step 2 · Set the version — retired

Nothing to do: snapshots declare the current spec version (`"dspack":
"0.4"`) directly. (This step existed when the tool emitted the older v0.2
shape; the number is kept so later steps keep their names.)

### Step 3 · Review the snapshot — 👀 Human review

Extraction is heuristic; you are the ground truth. Read the generated file
once, end to end, checking:

- **Props**: are enum values and defaults right? cva and docgen catch most
  cases; wrappers and re-exports can confuse them.
- **Descriptions**: they came from your JSDoc. A doc comment written for
  developers is often wrong as agent guidance ("renders a button" tells an
  agent nothing about *when*).
- **Tokens**: tier and naming as your team understands them, not just as CSS
  declared them.
- **What's missing**: components the extractor didn't find, deliberately or
  not. Note them; you can add entries by hand.

Fix what's wrong directly in the file. From here on, the file is yours.

---

## Phase 2 — the governance layer (the real work)

Everything in this phase is a ⚖️ **design decision**. The tooling validates
what you write; it never writes it for you. If a step feels like work only
your team could do — that's the feature. This is the institutional knowledge
("the old card is deprecated", "modals are for destructive confirmations
only") that no artifact records and every new hire absorbs slowly.

**A worked example runs through this phase**: the
[shadcn reference contract](./examples/shadcn-ui.dspack.json) was authored
by hand, incrementally, in this repository's git history — and its arc is
the pattern to copy:

1. `c918aa6` — the contract is born as **vocabulary only** (v0.1: components,
   tokens, bindings). Useful to agents already, zero governance.
2. `44f02e2` — a component (`table`) arrives **with a pattern**:
   `data-table-with-row-actions`, prose guidance about how tables carry
   actions.
3. `805732c` — *"record-collection intent — the data-table pattern's prose
   becomes law"*: the prose pattern is promoted into an **intent**
   (`record-collection`), typed **rules** enforcing what the prose said, and
   a worked **example** the rules point at.
4. `f405fce` — a fix commit linking an example to the rule that referenced
   it. (Cross-linking is easy to forget; step 9 covers it and the validator
   now catches dangling references.)

Prose first, law second. You do not need to write rules on day one — a
contract whose governance is three sentences of `whenToUse` is already ahead
of a README nobody pastes into a prompt.

### Step 4 · Author component guidance — ⚖️

For each component that matters, fill in what the snapshot cannot know:

- `description` — rewritten as guidance, not implementation notes.
- `whenToUse` / `whenNotToUse` — the sentences your design reviews repeat.
- `accessibility` — role, required attributes, keyboard interactions, label
  requirements.
- `composition` — sub-components, what must/may nest where.
- `constraints` — contextual must/should notes with severity.

Field shapes: [spec v0.2](./spec/dspack-v0.2.md); working examples of every
field: the [shadcn contract](./examples/shadcn-ui.dspack.json).

### Step 5 · Define categories — ⚖️

v0.4 lets the contract define its own taxonomy — dspack bakes none in. Add a
top-level `categories` registry (e.g. `interactive`, `overlay`) and tag
components with them; rules can then select by category ("no interactive
descendants inside a button") instead of enumerating components. While here,
tag props with `propRole` (flag/dimension/choice/slot/handler/content/state)
— it tells generation tooling what a prop *is for*. Spec:
[v0.4](./spec/dspack-v0.4.md).

### Step 6 · Patterns and anti-patterns — ⚖️

`patterns` are preferred combinations ("form fields stack vertically with
labels above"); `antiPatterns` are things your team has deliberately ruled
out, each with a `reason`. Anti-patterns punch above their weight: an agent
told *what not to do and why* stops reproducing the mistake your team
retired two years ago. (Id convention: pattern, anti-pattern, component,
and category ids are plain kebab-case — `bare-input-collection`, no
prefix; the schema rejects dots. The `rule.` and `ex.` prefixes belong to
rules and examples only.) These are prose — they are also the raw material
rules get promoted from (see the worked example above).

### Step 7 · Name your intents — ⚖️

An intent is a named kind of surface your system knows how to govern:
`destructive-action`, `record-collection`, `data-collection`. Intents scope
everything downstream — rules apply to intents; examples belong to intents;
callers declare an intent when they ask for generation. Start with the one
or two situations where your team has the strongest opinions.

### Step 8 · Write rules — ⚖️

Rules are typed, deterministic predicates — four types
([spec v0.3 §5](./spec/dspack-v0.3.md), [v0.4 §4](./spec/dspack-v0.4.md)):

| Type | Enforces |
|---|---|
| `component-choice` | which components must / must not appear for an intent |
| `required-composition` | structure every instance of a component must contain |
| `forbidden-composition` | structure and values no instance may contain |
| `required-props` (v0.4) | named props a component must carry directly |

Every rule carries a `rationale` — shown verbatim to whoever (or whatever)
violates it — and a `severity` (`must`/`should`). Write the rationale first;
if you cannot say *why*, it is not yet a rule, it is a habit. Note for
`required-composition`: the required ids must be declared in the contract
(as components or sub-components), and a declared id satisfies nothing by
itself — the rule checks actual descendants at lint time.

### Step 9 · Worked examples — ⚖️ (machine-validated)

An `examples[]` entry embeds a complete **dspack surface** — a small
component tree in your contract's vocabulary
([surface schema](./schema/dspack.surface.v0_1.schema.json)) — showing what
*good* looks like for an intent. They serve double duty: few-shot exemplars
for generation, and living proof your rules are satisfiable.

The minimal skeleton — the surface's four top-level fields are required and
`system` must equal your contract's `name`:

```json
{
  "id": "ex.minimal-signup",
  "intent": "signup-form",
  "description": "The smallest correct signup: framed fields, one primary action.",
  "surface": {
    "dspackSurface": "0.1",
    "system": "your-system-name",
    "intent": "signup-form",
    "root": {
      "component": "card", "id": "signup-card",
      "children": [
        { "component": "input",  "id": "email" },
        { "component": "button", "id": "submit", "text": "Sign up",
          "props": { "variant": "default" } }
      ]
    }
  }
}
```

Two mechanical requirements the validator enforces:

- every example surface must pass **S1** (surface schema) and **S2** (uses
  only your contract's vocabulary — component ids, props, enum values);
- cross-link rules and examples (`rule.examples: ["ex.your-example"]`), and
  every reference must resolve.

### Writing the snapshot by hand

No supported extractor for your stack? Start from
`{ "dspack": "0.4", "name": "your-system" }` and add components and tokens
as you go — every other block is optional, and the phases above apply
unchanged. The [shadcn contract](./examples/shadcn-ui.dspack.json) is the
reference for what each block looks like fully populated.

---

## Phase 3 — validate and use

### Step 10 · Validate — 🤖 Automated

```bash
npx -p @aestheticfunction/dspack-spec dspack-validate --file your-system.dspack.json
```

Or, from a checkout of this repository:

```bash
git clone https://github.com/aestheticfunction/dspack
cd dspack && npm ci
npm run validate -- --file /path/to/your-system.dspack.json
```

Both are the same validator — the published bin is a front-end over this
repository's harness, never a fork. You get, per document: schema
validation for its declared version, back-compat (the additive guarantee),
governance consistency (unique ids; intent, component, and example
references resolve; every example surface passes S1 + S2), and categories
consistency. Fix what it reports; re-run until green.

### Step 11 · Serve it to agents — 🤖 Automated

```bash
npm install -g @aestheticfunction/ds-mcp
ds-mcp --dspack ./your-system.dspack.json
```

Connect Claude Code, Cursor, Claude Desktop, or Copilot
([client setup](https://github.com/aestheticfunction/ds-mcp#readme)) and the
agent can query all eleven tools against your contract — components, tokens,
patterns, anti-patterns — and lint its own output with `validate-ui`. The
generation tools need the v0.3+ governance blocks from Phase 2.

### Step 12 · Generate, lint, render — 🤖 (rendering profile: ⚖️)

Every [dspack-gen](https://github.com/aestheticfunction/dspack-gen) command
takes your contract directly — no registration, no fixtures:

```bash
npm install @aestheticfunction/dspack-gen
npx dspack-gen context --dspack ./your-system.dspack.json --intent your-intent
npx dspack-gen lint    --dspack ./your-system.dspack.json --surface ./some.dsurface.json
npx dspack-gen run     --dspack ./your-system.dspack.json --intent your-intent \
    --prompt "..." --model ollama:your-model
```

`context` prints the compiled `{ system, schema, fewshot }`; `lint` runs the
S1–S3 gates (exit code 2 = a governance rule fired — your Phase 2 work,
executing); `run` is the full generate → lint → repair → emit pipeline.

To **render** governed surfaces through
[dspack-emit](https://github.com/aestheticfunction/dspack-emit) (A2UI or
json-render), your contract needs a **mapping profile** — pure data
describing how your components correspond to the target protocol's. That is
a design-decision-bearing artifact of its own, with its own guide:
[Writing an emit profile](https://github.com/aestheticfunction/dspack-emit/blob/main/docs/PROFILES.md).
You author it in your own codebase against the published package — the
[studio's Astryx profile](https://github.com/aestheticfunction/dspack-studio/blob/main/packages/contracts/src/astryx-profile.ts)
is the reference for exactly that pattern. To see the whole chain assembled,
[dspack-studio](https://github.com/aestheticfunction/dspack-studio) runs it
end to end ([hosted replay](https://studio.aesthetic-function.com)).

---

## Contributing a contract to the ecosystem (optional)

Everything above serves *your* use of dspack and touches no ecosystem
repository. Contributing a contract as a **canonical example** — maintained
in this repo, byte-synced to consumers, exercised by the eval harness — is a
different, heavier path: the contract lands in `examples/` here first
(upstream-first), consumers re-sync their byte copies, dspack-gen grows
pinned fixtures and golden context/violating files, and dspack-emit needs an
in-repo profile with regenerated goldens. Open a discussion first if you
want that; it is maintainer-coordinated and not required for anything in
this guide.

## Where this guide ends

This covers the upstream contract lifecycle: code → snapshot → governed,
validated contract → served/generated/linted. Emit-profile authoring lives
in [dspack-emit's guide](https://github.com/aestheticfunction/dspack-emit/blob/main/docs/PROFILES.md).
Keeping a contract continuously reconciled with design tools is deliberately
out of scope (see [aesthetic-function](https://github.com/aestheticfunction/aesthetic-function),
currently paused). Questions the guide doesn't answer are adoption feedback
the project wants: open an issue or discussion in this repository.
