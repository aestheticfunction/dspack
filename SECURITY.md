# Security Policy

## Scope

This repository contains an open specification and supporting example material. It does not contain production runtime code. Security concerns in this repository will usually fall into one of two categories:

- Spec language that could plausibly encourage insecure or unsafe behavior in downstream implementations
- Example files or supporting materials that are malformed, misleading, or intentionally crafted to trigger unsafe behavior in tools that consume them

If you believe you have found an issue in one of these categories, please report it.

## Reporting a concern

For concerns that could cause harm if disclosed publicly, please email security@aestheticfunction.com with:

- A short description of the issue
- The affected file or section
- Why you believe the issue has security implications
- Any steps required to reproduce or evaluate the concern
- Any suggested mitigation, if you have one

Please do not open a public issue for sensitive reports.

For non-sensitive issues, such as unclear spec language that could lead to inconsistent implementations but does not create a clear security risk, open a public GitHub issue using the appropriate template.

## What to expect

We will acknowledge receipt of a sensitive report as soon as practical, assess the impact, and determine whether the issue is best handled as:

- a clarification to the specification
- a correction or removal of an example file
- implementation guidance for downstream tools
- a public discussion after any immediate risk has been addressed

Because this repository is a specification rather than an implementation, remediation may involve changes to wording, examples, or guidance rather than a software patch.

## Coordinated disclosure

If a concern affects downstream implementations, we may coordinate disclosure with maintainers of known dspack tooling before discussing the issue publicly.
