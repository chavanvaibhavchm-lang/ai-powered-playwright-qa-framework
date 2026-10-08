# Preserved starter examples test cases

2 cases mapped to existing automation. [Catalog index](../README.md).

## TC-078 — has title

| Field                     | Value                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| Requirement               | N/A - starter example                                                 |
| Priority                  | Normal                                                                |
| Preconditions             | Fresh context; external Playwright documentation site reachable.      |
| Test data                 | See case steps and automation source.                                 |
| Automation                | [tests/example.spec.ts](../../tests/example.spec.ts)                  |
| Project                   | examples                                                              |
| Run suite                 | `npm run test:examples`                                               |
| Last saved outcome        | passed                                                                |
| Previous headless outcome | Not part of portfolio baseline                                        |
| Evidence                  | [Saved execution](../../docs/evidence/headed-examples-execution.json) |

Steps:

1. Open https://playwright.dev/.
2. Read the document title.

Expected results:

- Title contains Playwright.

## TC-079 — get started link

| Field                     | Value                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| Requirement               | N/A - starter example                                                 |
| Priority                  | Normal                                                                |
| Preconditions             | Fresh context; external Playwright documentation site reachable.      |
| Test data                 | See case steps and automation source.                                 |
| Automation                | [tests/example.spec.ts](../../tests/example.spec.ts)                  |
| Project                   | examples                                                              |
| Run suite                 | `npm run test:examples`                                               |
| Last saved outcome        | passed                                                                |
| Previous headless outcome | Not part of portfolio baseline                                        |
| Evidence                  | [Saved execution](../../docs/evidence/headed-examples-execution.json) |

Steps:

1. Open https://playwright.dev/.
2. Click the Get started link.
3. Inspect the Installation heading.

Expected results:

- Installation heading is visible.
