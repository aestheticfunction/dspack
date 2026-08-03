#!/usr/bin/env node
/**
 * Library-boundary gate for lib/validate.mjs.
 *
 * Two properties, both load-bearing for the importable harness:
 *
 * 1. PURITY — the lib imports only ajv/ajv-formats: no node:* modules, no
 *    filesystem, no process control. This is what lets the identical checks
 *    run in a browser bundle (the studio composer) and inside ds-mcp's
 *    no-network boundary.
 *
 * 2. NON-VACUITY THROUGH THE IMPORT SURFACE — the same corpus CI runs
 *    through the CLI is run here through the lib import directly: every
 *    examples/*.dspack.json validates (including the back-compat strip),
 *    and every fixtures/negative/*.dspack.json is rejected. If extraction
 *    ever drifted a check, this gate and the CLI would disagree loudly.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOVERNANCE_VERSIONS,
  SURFACE_SCHEMA,
  compileSchemaSet,
  documentReport,
  stripAdditiveBlocks,
  validateDocument,
} from "../lib/validate.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));
const list = (dir) => readdirSync(dir).filter((f) => f.endsWith(".dspack.json")).map((f) => join(dir, f));

let failures = 0;
const fail = (msg) => {
  console.error(`  ✖ ${msg}`);
  failures++;
};

// 1. Purity: static import scan of the lib source.
const libSource = readFileSync(join(ROOT, "lib", "validate.mjs"), "utf8");
const imports = [...libSource.matchAll(/from\s+"([^"]+)"|import\s*\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1] ?? m[2]);
const allowed = new Set(["ajv/dist/2020.js", "ajv-formats"]);
for (const specifier of imports) {
  if (!allowed.has(specifier)) fail(`lib/validate.mjs imports '${specifier}' (allowed: ajv, ajv-formats only)`);
}
if (imports.length === 0) fail("lib/validate.mjs has no imports at all (scan defect?)");

// 2. Non-vacuity through the import surface.
const schemas = {};
for (const file of readdirSync(join(ROOT, "schema")).filter((f) => f.endsWith(".schema.json"))) {
  schemas[file] = load(join(ROOT, "schema", file));
}
const { validators, failures: compileFailures } = compileSchemaSet(schemas);
for (const f of compileFailures) fail(`schema compile through lib: ${f}`);
if (!validators.has(SURFACE_SCHEMA)) fail(`${SURFACE_SCHEMA} missing from compiled set`);

for (const path of list(join(ROOT, "examples"))) {
  const doc = load(path);
  const report = documentReport(doc, validators);
  if (!report.valid) {
    fail(`${basename(path)} rejected by the lib: ${report.errors[0]}`);
    continue;
  }
  if (GOVERNANCE_VERSIONS.has(doc.dspack)) {
    const strippedErrors = validateDocument(stripAdditiveBlocks(doc), validators);
    if (strippedErrors.length) fail(`${basename(path)} back-compat strip rejected: ${strippedErrors[0]}`);
  }
}

const negatives = list(join(ROOT, "fixtures", "negative"));
if (negatives.length === 0) fail("no negative fixtures found");
for (const path of negatives) {
  const report = documentReport(load(path), validators);
  if (report.valid) fail(`${basename(path)} unexpectedly valid through the lib`);
}

if (failures) {
  console.error(`lib-boundary FAIL (${failures} finding(s))`);
  process.exit(1);
}
console.log(
  `lib-boundary PASS (pure imports; ${list(join(ROOT, "examples")).length} examples accepted, ${negatives.length} negatives rejected through the import surface)`,
);
