# Contributing to dspack

dspack is an open specification for representing design system corpora in a format AI coding agents can query. Contributions to the spec design — from practitioners, engineers, designers, and researchers — are welcome at every stage of development, including this early pre-draft phase.

## Who should contribute

You do not need to be a software engineer to participate. If you work with design systems — as a designer, product manager, content strategist, accessibility specialist, or in any other role — your perspective on what this format should represent is relevant. The spec should describe how design systems actually work in organizations, not just how they are implemented in code.

## Ways to contribute

### Opening issues

Three issue templates are provided:

- **Spec question** — for questions about what the format is intended to capture or how it is intended to work. Even before the spec is written, questions about intent help shape the design.
- **Ambiguity report** — for reporting language in the spec that is unclear or could be interpreted multiple ways. Ambiguity reports are high-value contributions at any stage.
- **Breaking change proposal** — for proposing changes that would be incompatible with prior versions of the spec. These require more context and deliberation than other issues.

Labels for routing issues are configured in the repository settings. If a label is missing when you open an issue, it will be added during triage.

### Participating in discussions

GitHub Discussions are open for broader conversation. Use cases you are trying to cover, design system patterns you think the format should represent, experience reports from working with AI agents and design systems, or anything that does not fit neatly into an issue — all of it is appropriate for Discussions.

### Proposing changes via RFC

For substantive proposals — new top-level concepts, structural changes, or anything requiring changes to existing dspack files — the RFC process is:

1. **Open a GitHub Discussion** describing the problem you are trying to solve and your initial thinking on how dspack might address it. The goal at this stage is to validate the problem and direction before investing in a full proposal.
2. **Iterate in the discussion** until the proposal is reasonably stable. Gather input, identify edge cases, and refine the approach.
3. **Open a pull request** adding a document to the `rfc/` directory. See [`rfc/README.md`](./rfc/README.md) for the expected structure of an RFC document.
4. **Review happens in the PR.** An RFC is accepted when the PR merges; it is rejected when the PR is closed without merging.

There is no formal RFC numbering or status tracking at this stage.

### Submitting pull requests

Pull requests are appropriate for:

- Corrections to existing spec text (typos, grammar, factual errors)
- RFC documents (following the process above)
- Improvements to placeholder documentation in `spec/`, `schema/`, `examples/`, or `rfc/`
- Example dspack files in `examples/`

Pull requests that propose spec changes outside the RFC process may be redirected to a Discussion.

### Reporting known implementations

If you build a tool that reads or produces dspack files, open a Discussion or issue so it can be noted in the repository. dspack is a format — an ecosystem of implementations is the goal.

## Code of conduct

Participation in this project is governed by the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## License

By contributing to this repository, you agree that your contributions will be licensed under the Apache-2.0 license.
