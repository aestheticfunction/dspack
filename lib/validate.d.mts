/**
 * Types for the importable validation harness (lib/validate.mjs).
 * Import path (no exports map, by design — every published file stays
 * reachable): "@aestheticfunction/dspack-spec/lib/validate.mjs".
 */

export declare const DSPACK_SCHEMAS: Record<string, string>;
export declare const GOVERNANCE_VERSIONS: Set<string>;
export declare const SURFACE_SCHEMA: string;

/** ajv validate function shape (kept structural to avoid an ajv type dependency). */
export interface SchemaValidator {
  (data: unknown): boolean;
  errors?: Array<{ instancePath?: string; message?: string }> | null;
}

export type ValidatorMap = Map<string, SchemaValidator>;

export interface CompiledSchemaSet {
  validators: ValidatorMap;
  failures: string[];
}

/** Compile an injected schema set: { [schemaFileName]: schemaJson }. */
export declare function compileSchemaSet(schemas: Record<string, unknown>): CompiledSchemaSet;

export interface Vocabulary {
  components: Map<string, { props: Map<string, unknown>; slots: Set<string> }>;
  subComponents: Map<string, string>;
  duplicateSubIds: Set<string>;
}

export declare function buildVocabulary(doc: Record<string, unknown>): Vocabulary;

/** Gate S2: walk a surface tree against a contract vocabulary. Returns error strings. */
export declare function checkVocabulary(surface: Record<string, unknown>, vocab: Vocabulary): string[];

export declare function checkCategories(doc: Record<string, unknown>): string[];

export declare function checkGovernance(doc: Record<string, unknown>, validateSurface: SchemaValidator): string[];

/** The back-compat strip: a governance-version document minus its additive blocks. */
export declare function stripAdditiveBlocks(doc: Record<string, unknown>): Record<string, unknown>;

/** Fully validate one dspack document. Returns error strings (empty = valid). */
export declare function validateDocument(doc: unknown, validators: ValidatorMap): string[];

export interface DocumentReport {
  valid: boolean;
  version: string | undefined;
  errors: string[];
}

export declare function documentReport(doc: unknown, validators: ValidatorMap): DocumentReport;
