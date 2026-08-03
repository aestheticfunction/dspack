#!/usr/bin/env node
/**
 * Validation harness CLI for the dspack specification repository.
 *
 * Every check lives in lib/validate.mjs (pure functions, schemas injected);
 * this file is the filesystem-and-process front-end over that one
 * implementation — a distribution of the harness, never a fork
 * (rfc/dx3-bootstrap-design §4). Programmatic consumers import
 * "@aestheticfunction/dspack-spec/lib/validate.mjs" and get the identical
 * checks, wording included.
 *
 * Default mode (`npm run validate`):
 *   1. schema-compile — every schema in schema/ compiles as a draft 2020-12
 *      JSON Schema under ajv (strict: false, the toolchain convention shared
 *      with dspack-emit).
 *   2. examples — every examples/*.dspack.json validates against the schema
 *      matching its declared `dspack` version.
 *   3. back-compat — for v0.3+ documents, the document with that version's
 *      additive blocks removed still validates against its own schema (the
 *      "v0.2 shape + a newer dspack version is valid" guarantee).
 *   4. governance consistency — for v0.3+ documents: unique IDs, reference
 *      resolution, and S1/S2 over every examples[].surface.
 *   5. categories consistency — for v0.4 documents.
 *
 * Negative mode (`npm run validate -- --fixtures negative`):
 *   Runs the same full validation over fixtures/negative/*.dspack.json and
 *   exits 0 iff every fixture is rejected. A fixture that unexpectedly
 *   passes is a harness defect and fails the run.
 *
 * File mode (`npm run validate -- --file <path> [<path>...]`, also the
 * `dspack-validate` bin): the identical validation over the named
 * document(s) instead of examples/.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOVERNANCE_VERSIONS,
  SURFACE_SCHEMA,
  compileSchemaSet,
  stripAdditiveBlocks,
  validateDocument,
} from "../lib/validate.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = join(ROOT, "schema");
const EXAMPLES_DIR = join(ROOT, "examples");
const NEGATIVE_DIR = join(ROOT, "fixtures", "negative");

const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Read every schema/*.schema.json and compile through the lib. */
function compileSchemas() {
  const schemas = {};
  for (const file of readdirSync(SCHEMA_DIR).filter((f) => f.endsWith(".schema.json"))) {
    schemas[file] = loadJson(join(SCHEMA_DIR, file));
  }
  return compileSchemaSet(schemas);
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
  // --file <path> [<path>...]: every argument after the flag that does not
  // start with "-" names a document to validate.
  let fileArgs = null;
  const fileFlag = args.indexOf("--file");
  if (fileFlag !== -1) {
    fileArgs = [];
    for (let i = fileFlag + 1; i < args.length && !args[i].startsWith("-"); i++) fileArgs.push(args[i]);
    if (fileArgs.length === 0) {
      console.error("usage: validate --file <path.dspack.json> [<path>...]");
      process.exit(1);
    }
  }

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

  const docs = fileArgs ?? listDocs(EXAMPLES_DIR);
  if (docs.length === 0) {
    console.error(`no examples found in ${EXAMPLES_DIR}`);
    process.exit(1);
  }
  let failed = 0;
  for (const path of docs) {
    const doc = loadJson(path);
    const errors = validateDocument(doc, validators);

    // Back-compat guarantee (lib strips the version's additive blocks; for
    // 0.4 that includes categories — registry and membership fields).
    if (GOVERNANCE_VERSIONS.has(doc?.dspack) && errors.length === 0) {
      const strippedErrors = validateDocument(stripAdditiveBlocks(doc), validators);
      for (const e of strippedErrors) errors.push(`back-compat (version's additive blocks removed): ${e}`);
    }

    if (errors.length) {
      failed++;
      console.error(`  ✖ ${basename(path)}`);
      for (const e of errors) console.error(`      ${e}`);
    } else {
      console.log(`  ✔ ${basename(path)} (dspack ${doc.dspack})`);
    }
  }
  const label = fileArgs ? "documents" : "examples";
  if (failed) {
    console.error(`${label} FAIL (${failed} document(s) invalid)`);
    process.exit(1);
  }
  console.log(`${label} PASS (${docs.length} document(s))`);
}

main();
