/**
 * The dspack validation harness as an importable library.
 *
 * Every check the CLI performs lives here, as pure functions: no filesystem,
 * no process control, no environment — schemas are injected by the caller,
 * so the same code runs under Node (the `dspack-validate` CLI reads
 * schema/*.json and passes them in) and in a browser bundle (a bundler
 * imports the schema JSON and passes it in). scripts/validate.mjs is a
 * front-end over these functions, never a second validator (the one-validator
 * principle, rfc/dx3-bootstrap-design §4); this module is that principle made
 * importable.
 *
 * Scope split, unchanged: this harness validates the DOCUMENT (schema gate,
 * back-compat strip, governance consistency, categories, and S1/S2 over the
 * contract's own examples). S3 rule evaluation over arbitrary surfaces is a
 * consumer concern (dspack-gen's linter).
 */
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/** dspack version -> schema key expected in the injected schema set. */
export const DSPACK_SCHEMAS = {
  "0.1": "dspack.v0.1.schema.json",
  "0.2": "dspack.v0.2.schema.json",
  "0.3": "dspack.v0.3.schema.json",
  "0.4": "dspack.v0.4.schema.json",
};
/** Versions with governance blocks (and, from 0.4, categories) to consistency-check. */
export const GOVERNANCE_VERSIONS = new Set(["0.3", "0.4"]);
export const SURFACE_SCHEMA = "dspack.surface.v0_1.schema.json";

function newAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: true });
  addFormats(ajv);
  return ajv;
}

const fmtErr = (e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim();

/**
 * Compile an injected schema set: { [name]: schemaJson }. Returns
 * { validators: Map name -> ajv validate fn, failures: string[] }.
 * Names are the schema/*.json filenames (DSPACK_SCHEMAS values plus
 * SURFACE_SCHEMA); a name the caller omits simply cannot validate that
 * version, and validateDocument reports it.
 */
export function compileSchemaSet(schemas) {
  const validators = new Map();
  const failures = [];
  for (const [name, schema] of Object.entries(schemas)) {
    try {
      validators.set(name, newAjv().compile(schema));
    } catch (e) {
      failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { validators, failures };
}

/**
 * Build the vocabulary of a contract:
 *  - components: Map componentId -> { props: Map propName -> descriptor, slots: Set slotName }
 *  - subComponents: Map subComponentId -> parent componentId
 *  - duplicateSubIds: sub-component IDs declared by more than one component.
 *    Duplicates would make S2 checks and rule reference resolution depend on
 *    object iteration order, so callers MUST surface them as consistency
 *    errors (spec §5: sub-component IDs must be unique document-wide).
 */
export function buildVocabulary(doc) {
  const components = new Map();
  const subComponents = new Map();
  const duplicateSubIds = new Set();
  for (const [id, entry] of Object.entries(doc.components ?? {})) {
    const props = new Map(Object.entries(entry.props ?? {}));
    const slots = new Set();
    for (const sub of entry.composition?.subComponents ?? []) {
      if (sub.id) {
        if (subComponents.has(sub.id) && subComponents.get(sub.id) !== id) duplicateSubIds.add(sub.id);
        subComponents.set(sub.id, id);
      }
      if (sub.slot) slots.add(sub.slot);
    }
    components.set(id, { props, slots });
  }
  return { components, subComponents, duplicateSubIds };
}

/** Allowed values for an enum prop descriptor (bare values or valueDescriptor objects). */
function enumValues(descriptor) {
  if (descriptor.type !== "enum" || !Array.isArray(descriptor.values)) return null;
  return descriptor.values.map((v) => (v && typeof v === "object" ? v.value : v));
}

/** Gate S2: walk a surface tree against a contract vocabulary. Returns error strings. */
export function checkVocabulary(surface, vocab) {
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
  // required-props (v0.4) is the one type whose `component` accepts a
  // sub-component id (spec v0.4 §4.1); `within` accepts either kind.
  if (rule.component) {
    refs.push({ kind: rule.type === "required-props" ? "componentOrSub" : "component", id: rule.component });
  }
  if (rule.within) refs.push({ kind: "componentOrSub", id: rule.within });
  push("forbiddenDescendants", rule.forbiddenDescendants);
  push("requiredSubComponents", (rule.requiredSubComponents ?? []).map((s) => s.id));
  // `on` entries exist only on required-composition/forbidden-composition
  // requiredProps/forbiddenProps; required-props (v0.4) entries have no `on`.
  if (rule.type !== "required-props") {
    push("on", (rule.requiredProps ?? []).map((p) => p.on).filter(Boolean));
  }
  push("on", (rule.forbiddenProps ?? []).map((p) => p.on).filter(Boolean));
  return refs;
}

/** Category consistency checks for a v0.4 document. Returns error strings. */
export function checkCategories(doc) {
  const errors = [];
  const registry = new Set(Object.keys(doc.categories ?? {}));
  const checkMember = (where, ids) => {
    for (const id of ids ?? []) {
      if (!registry.has(id)) errors.push(`${where}: category '${id}' is not registered in categories`);
    }
  };
  for (const [cid, entry] of Object.entries(doc.components ?? {})) {
    checkMember(`components.${cid}`, entry.categories);
    for (const sub of entry.composition?.subComponents ?? []) {
      checkMember(`components.${cid} sub-component '${sub.id}'`, sub.categories);
    }
  }
  for (const rule of doc.rules ?? []) {
    checkMember(rule.id ?? "(rule without id)", rule.forbiddenCategories);
    checkMember(
      rule.id ?? "(rule without id)",
      (rule.requiredCategories ?? []).map((r) => r.id),
    );
  }
  return errors;
}

/** Governance consistency checks for a v0.3+ document. Returns error strings. */
export function checkGovernance(doc, validateSurface) {
  const errors = [];
  // Spec §5 scopes governance consistency (incl. sub-component id uniqueness)
  // to contracts that USE governance blocks — a pure v0.2-shaped document with
  // "dspack": "0.3" must keep the strictly-additive guarantee.
  if (!doc.intents && !doc.rules && !doc.examples) return errors;
  const vocab = buildVocabulary(doc);
  // Fail loudly on ambiguous vocabulary before any check that depends on it.
  for (const id of vocab.duplicateSubIds) {
    const parents = Object.entries(doc.components ?? {})
      .filter(([, entry]) => (entry.composition?.subComponents ?? []).some((s) => s.id === id))
      .map(([componentId]) => componentId);
    errors.push(
      `sub-component id '${id}' is declared by multiple components (${parents.join(", ")}); ` +
        `sub-component ids must be unique document-wide for deterministic S2 and rule resolution`,
    );
  }
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
      // `requiredSubComponents` entries match descendant NODES by component id
      // at lint time (spec §5), so the id may be declared as a top-level
      // component or as a composition sub-component. Resolution here only
      // guards the vocabulary; satisfaction (matching descendants beneath each
      // governed node) is the S3 gate's concern, not this harness's.
      // `on` remains sub-component-only (spec §5: "the sub-component id `on`").
      const ok =
        kind === "on"
          ? resolvesToSub
          : kind === "component"
            ? resolvesToComponent
            : resolvesToComponent || resolvesToSub; // requiredSubComponents, componentOrSub, require, forbid, forbiddenDescendants
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

/**
 * Remove a governance-version document's additive blocks: the back-compat
 * guarantee is that the remaining core shape still validates ("v0.2 shape +
 * a newer dspack version is valid", per each version's strictly-additive
 * promise). For 0.4 that also strips categories (the registry AND the
 * membership fields).
 */
export function stripAdditiveBlocks(doc) {
  const stripped = { ...doc };
  delete stripped.intents;
  delete stripped.rules;
  delete stripped.examples;
  if (doc.dspack === "0.4") {
    delete stripped.categories;
    stripped.components = Object.fromEntries(
      Object.entries(doc.components ?? {}).map(([id, entry]) => {
        const e = { ...entry };
        delete e.categories;
        if (e.composition?.subComponents) {
          e.composition = {
            ...e.composition,
            subComponents: e.composition.subComponents.map(({ categories, ...sub }) => sub),
          };
        }
        return [id, e];
      }),
    );
  }
  return stripped;
}

/** Fully validate one dspack document. Returns error strings (empty = valid). */
export function validateDocument(doc, validators) {
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
  if (GOVERNANCE_VERSIONS.has(version)) {
    errors.push(...checkGovernance(doc, validators.get(SURFACE_SCHEMA)));
  }
  if (version === "0.4") {
    errors.push(...checkCategories(doc));
  }
  return errors;
}

/**
 * Convenience wrapper for hosts (the studio composer, editors): compile once
 * via compileSchemaSet, then report per document. `errors` are the same
 * strings validateDocument produces — paths are embedded in the text, and
 * the wording is shared with the CLI by construction.
 */
export function documentReport(doc, validators) {
  const errors = validateDocument(doc, validators);
  return { valid: errors.length === 0, version: doc?.dspack, errors };
}
