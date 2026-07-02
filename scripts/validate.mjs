#!/usr/bin/env node
/**
 * Validation harness for the dspack specification repository.
 *
 * Default mode (`npm run validate`):
 *   1. schema-compile — every schema in schema/ compiles as a draft 2020-12
 *      JSON Schema under ajv (strict: false, the toolchain convention shared
 *      with dspack-to-a2ui).
 *   2. examples — every examples/*.dspack.json validates against the schema
 *      matching its declared `dspack` version.
 *   3. back-compat — for v0.3 documents, the document with the governance
 *      blocks (intents/rules/examples) removed still validates against the
 *      v0.3 schema (the "v0.2 shape + dspack: 0.3 is valid" guarantee).
 *   4. governance consistency — for v0.3 documents: unique IDs, intent
 *      references resolve, rule component references resolve, rule example
 *      references resolve, and every examples[].surface passes:
 *        S1 — the generic dspack surface schema, and
 *        S2 — the contract vocabulary (component/sub-component IDs, prop
 *             names, enum prop values, declared slot names).
 *      S2 here checks exactly what the v0.3 spec defines for the gate; it
 *      does not check acceptsChildren semantics or non-enum prop types.
 *
 * Negative mode (`npm run validate -- --fixtures negative`):
 *   Runs the same full validation over fixtures/negative/*.dspack.json and
 *   exits 0 iff every fixture is rejected (each must fail schema validation
 *   or a consistency check). A fixture that unexpectedly passes is a harness
 *   defect and fails the run.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = join(ROOT, "schema");
const EXAMPLES_DIR = join(ROOT, "examples");
const NEGATIVE_DIR = join(ROOT, "fixtures", "negative");

const DSPACK_SCHEMAS = {
  "0.1": "dspack.v0.1.schema.json",
  "0.2": "dspack.v0.2.schema.json",
  "0.3": "dspack.v0.3.schema.json",
};
const SURFACE_SCHEMA = "dspack.surface.v0_1.schema.json";

function newAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: true });
  addFormats(ajv);
  return ajv;
}

const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fmtErr = (e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim();

/** Compile every schema; returns { validators, failures }. */
function compileSchemas() {
  const validators = new Map();
  const failures = [];
  const files = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith(".schema.json"));
  for (const file of files) {
    try {
      validators.set(file, newAjv().compile(loadJson(join(SCHEMA_DIR, file))));
    } catch (e) {
      failures.push(`${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { validators, failures };
}

/**
 * Build the vocabulary of a contract:
 *  - components: Map componentId -> { props: Map propName -> descriptor, slots: Set slotName }
 *  - subComponents: Map subComponentId -> parent componentId
 */
function buildVocabulary(doc) {
  const components = new Map();
  const subComponents = new Map();
  for (const [id, entry] of Object.entries(doc.components ?? {})) {
    const props = new Map(Object.entries(entry.props ?? {}));
    const slots = new Set();
    for (const sub of entry.composition?.subComponents ?? []) {
      if (sub.id) subComponents.set(sub.id, id);
      if (sub.slot) slots.add(sub.slot);
    }
    components.set(id, { props, slots });
  }
  return { components, subComponents };
}

/** Allowed values for an enum prop descriptor (bare values or valueDescriptor objects). */
function enumValues(descriptor) {
  if (descriptor.type !== "enum" || !Array.isArray(descriptor.values)) return null;
  return descriptor.values.map((v) => (v && typeof v === "object" ? v.value : v));
}

/** Gate S2: walk a surface tree against a contract vocabulary. Returns error strings. */
function checkVocabulary(surface, vocab) {
  const errors = [];
  const walk = (node, path) => {
    if (!node || typeof node !== "object") return;
    const cid = node.component;
    const isComponent = vocab.components.has(cid);
    const isSub = vocab.subComponents.has(cid);
    if (!isComponent && !isSub) {
      errors.push(`${path}: component '${cid}' is not a component or sub-component of the contract`);
    }
    if (node.props && Object.keys(node.props).length > 0) {
      if (isSub) {
        errors.push(`${path}: sub-component '${cid}' does not declare props in this contract`);
      } else if (isComponent) {
        const { props } = vocab.components.get(cid);
        for (const [name, value] of Object.entries(node.props)) {
          const descriptor = props.get(name);
          if (!descriptor) {
            errors.push(`${path}: prop '${name}' is not declared on component '${cid}'`);
            continue;
          }
          const allowed = enumValues(descriptor);
          if (allowed && !allowed.includes(value)) {
            errors.push(
              `${path}: prop '${name}' on '${cid}' has value ${JSON.stringify(value)}; allowed: ${allowed.map((v) => JSON.stringify(v)).join(", ")}`,
            );
          }
        }
      }
    }
    if (node.slots) {
      const slots = isComponent ? vocab.components.get(cid).slots : new Set();
      for (const [slotName, children] of Object.entries(node.slots)) {
        if (!slots.has(slotName)) {
          errors.push(`${path}: slot '${slotName}' is not declared on component '${cid}'`);
        }
        children.forEach((child, i) => walk(child, `${path}.slots.${slotName}[${i}]`));
      }
    }
    (node.children ?? []).forEach((child, i) => walk(child, `${path}.children[${i}]`));
  };
  walk(surface.root, "$.root");
  return errors;
}

/** Every component/sub-component reference inside a rule, for resolution checks. */
function ruleComponentRefs(rule) {
  const refs = [];
  const push = (kind, ids) => {
    for (const id of ids ?? []) refs.push({ kind, id });
  };
  push("require", rule.require);
  push("forbid", rule.forbid);
  if (rule.component) refs.push({ kind: "component", id: rule.component });
  push("forbiddenDescendants", rule.forbiddenDescendants);
  push("requiredSubComponents", (rule.requiredSubComponents ?? []).map((s) => s.id));
  push("on", (rule.requiredProps ?? []).map((p) => p.on).filter(Boolean));
  push("on", (rule.forbiddenProps ?? []).map((p) => p.on).filter(Boolean));
  return refs;
}

/** Governance consistency checks for a v0.3 document. Returns error strings. */
function checkGovernance(doc, validateSurface) {
  const errors = [];
  const vocab = buildVocabulary(doc);
  const intents = new Set((doc.intents ?? []).map((i) => i.id));
  const exampleIds = new Set((doc.examples ?? []).map((e) => e.id));

  const seen = new Set();
  for (const [block, key] of [
    ["intents", "id"],
    ["rules", "id"],
    ["examples", "id"],
  ]) {
    for (const entry of doc[block] ?? []) {
      const tag = `${block}:${entry[key]}`;
      if (seen.has(tag)) errors.push(`duplicate ${block} id '${entry[key]}'`);
      seen.add(tag);
    }
  }

  for (const rule of doc.rules ?? []) {
    for (const intent of rule.appliesTo?.intents ?? []) {
      if (!intents.has(intent)) errors.push(`${rule.id}: appliesTo intent '${intent}' is not registered in intents[]`);
    }
    for (const { kind, id } of ruleComponentRefs(rule)) {
      const resolvesToComponent = vocab.components.has(id);
      const resolvesToSub = vocab.subComponents.has(id);
      const ok =
        kind === "requiredSubComponents" || kind === "on"
          ? resolvesToSub
          : kind === "component"
            ? resolvesToComponent
            : resolvesToComponent || resolvesToSub;
      if (!ok) errors.push(`${rule.id}: ${kind} reference '${id}' does not resolve in the contract`);
    }
    for (const ex of rule.examples ?? []) {
      if (!exampleIds.has(ex)) errors.push(`${rule.id}: example reference '${ex}' does not resolve`);
    }
  }

  for (const example of doc.examples ?? []) {
    const where = example.id ?? "(example without id)";
    if (example.intent && !intents.has(example.intent)) {
      errors.push(`${where}: intent '${example.intent}' is not registered in intents[]`);
    }
    const surface = example.surface;
    if (!surface) continue;
    // S1 — generic surface schema.
    if (!validateSurface(surface)) {
      for (const e of validateSurface.errors ?? []) errors.push(`${where}: S1 ${fmtErr(e)}`);
      continue; // vocabulary walk needs a well-formed tree
    }
    if (surface.intent !== example.intent) {
      errors.push(`${where}: surface.intent '${surface.intent}' does not match example intent '${example.intent}'`);
    }
    if (surface.system !== doc.name) {
      errors.push(`${where}: surface.system '${surface.system}' does not match contract name '${doc.name}'`);
    }
    // S2 — contract vocabulary.
    for (const e of checkVocabulary(surface, vocab)) errors.push(`${where}: S2 ${e}`);
  }

  return errors;
}

/** Fully validate one dspack document. Returns error strings (empty = valid). */
function validateDocument(doc, validators) {
  const errors = [];
  const version = doc?.dspack;
  const schemaFile = DSPACK_SCHEMAS[version];
  if (!schemaFile) return [`unknown or missing dspack version: ${JSON.stringify(version)}`];
  const validate = validators.get(schemaFile);
  if (!validate) return [`schema ${schemaFile} did not compile`];
  if (!validate(doc)) {
    for (const e of validate.errors ?? []) errors.push(`schema ${fmtErr(e)}`);
    return errors;
  }
  if (version === "0.3") {
    errors.push(...checkGovernance(doc, validators.get(SURFACE_SCHEMA)));
  }
  return errors;
}

function listDocs(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".dspack.json"))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  const negativeMode = args.includes("--fixtures") && args[args.indexOf("--fixtures") + 1] === "negative";

  const { validators, failures } = compileSchemas();
  if (!validators.has(SURFACE_SCHEMA)) failures.push(`${SURFACE_SCHEMA}: missing`);
  if (failures.length) {
    console.error("schema-compile FAIL");
    for (const f of failures) console.error(`  ✖ ${f}`);
    process.exit(1);
  }
  console.log(`schema-compile PASS (${validators.size} schemas)`);

  if (negativeMode) {
    const fixtures = listDocs(NEGATIVE_DIR);
    if (fixtures.length === 0) {
      console.error(`no negative fixtures found in ${NEGATIVE_DIR}`);
      process.exit(1);
    }
    let unexpected = 0;
    for (const path of fixtures) {
      const errors = validateDocument(loadJson(path), validators);
      if (errors.length === 0) {
        console.error(`  ✖ ${basename(path)}: expected to be rejected, but validated cleanly`);
        unexpected++;
      } else {
        console.log(`  ✔ ${basename(path)} rejected: ${errors[0]}`);
      }
    }
    if (unexpected) {
      console.error(`negative-fixtures FAIL (${unexpected} fixture(s) unexpectedly valid)`);
      process.exit(1);
    }
    console.log(`negative-fixtures PASS (${fixtures.length} fixtures all rejected)`);
    return;
  }

  const docs = listDocs(EXAMPLES_DIR);
  if (docs.length === 0) {
    console.error(`no examples found in ${EXAMPLES_DIR}`);
    process.exit(1);
  }
  let failed = 0;
  for (const path of docs) {
    const doc = loadJson(path);
    const errors = validateDocument(doc, validators);

    // Back-compat guarantee: a v0.3 document minus governance blocks stays valid.
    if (doc?.dspack === "0.3" && errors.length === 0) {
      const stripped = { ...doc };
      delete stripped.intents;
      delete stripped.rules;
      delete stripped.examples;
      const strippedErrors = validateDocument(stripped, validators);
      for (const e of strippedErrors) errors.push(`back-compat (governance blocks removed): ${e}`);
    }

    if (errors.length) {
      failed++;
      console.error(`  ✖ ${basename(path)}`);
      for (const e of errors) console.error(`      ${e}`);
    } else {
      console.log(`  ✔ ${basename(path)} (dspack ${doc.dspack})`);
    }
  }
  if (failed) {
    console.error(`examples FAIL (${failed} document(s) invalid)`);
    process.exit(1);
  }
  console.log(`examples PASS (${docs.length} document(s))`);
}

main();
