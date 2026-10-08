# AI adapter / suggestions test cases

16 cases mapped to existing automation. [Catalog index](../README.md).

## TC-062 — deterministic provider produces schema-validated traceable suggestions

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-01                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | Deterministic mock; no live model/network request.                                          |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use test-data/mock-suggestions.json and the INV-02 test requirement.
2. Call suggest with MockProvider.
3. Compare the parsed response to the mock.

Expected results:

- Schema-validated output equals the mock and references INV-02.

## TC-063 — malformed JSON and markdown code fences are rejected

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Call parseSuggestions with {bad.
2. Call it with otherwise-valid JSON wrapped in markdown code fences.

Expected results:

- Both inputs throw malformed JSON.

## TC-064 — rejects missing scenarios

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | {}                                                                                          |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-065 — rejects empty scenarios

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | {scenarios:[]}                                                                              |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-066 — rejects invalid priority

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | priority: urgent                                                                            |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-067 — rejects unexpected generated code

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | extra code: execute()                                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-068 — rejects empty steps

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | steps: []                                                                                   |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-069 — rejects whitespace title

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | title: five spaces                                                                          |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Use a valid INV-02 requirement and mock scenario.
2. Apply the specified invalid schema mutation and serialize as JSON.
3. Call parseSuggestions.

Expected results:

- Invalid scenario schema is thrown.

## TC-070 — missing, malformed and duplicate requirements fail before calling provider

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Call suggest with no requirements.
2. Call it with id invented and an empty description.
3. Call it with a duplicated INV-02 requirement.

Expected results:

- Errors identify missing requirements, invalid requirement, and duplicate requirement ID.

## TC-071 — unknown requirements and duplicate scenario IDs are rejected

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Parse a scenario referencing FAKE-01 against only INV-02.
2. Parse a list containing the same S-001 scenario twice.

Expected results:

- Unknown requirement reference and Duplicate scenario ID errors are thrown.

## TC-072 — equivalent suggestion titles are deduplicated deterministically

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Provide the mock S-001 scenario plus S-002 with the same requirement IDs and uppercase/padded equivalent title.
2. Parse suggestions.

Expected results:

- Only the original mock scenario remains.

Notes: Title/requirement normalization only; semantic equivalence detection is not claimed.

## TC-073 — approved suggestions require reviewer and explicit valid selection

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-03                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Validate the mock suggestions.
2. Attempt approval with empty reviewer, empty selection, and unknown S-999.
3. Approve with a nonempty reviewer and S-001 in the deterministic adapter test.

Expected results:

- Invalid approvals throw explicit errors.
- Valid selection returns the chosen suggestion data only.

Notes: Unit test for the approval adapter, not actual human approval of live proposals; no test code is generated/executed.

## TC-074 — local adapter sends schema and parses mocked Ollama response

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-01                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Inject a mock fetch transport returning the valid mock JSON response.
2. Call the local provider with model mock-local-model.
3. Inspect request URL, schema, stream flag and result.

Expected results:

- One request targets http://127.0.0.1:11434/api/generate with model name, stream:false and object JSON schema.
- Parsed suggestions equal the mock.

Notes: Transport is mocked; no real Ollama process/model was used.

## TC-075 — adapter rejects HTTP failures, missing response text and nonlocal endpoints

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Inject HTTP 503 response, then a body with no response text.
2. Construct provider with https://paid.example.com.
3. Construct provider with an empty model name.

Expected results:

- Errors identify HTTP 503, missing response text, nonlocal endpoint and missing OLLAMA_MODEL.

Notes: Nonlocal provider construction is rejected; no paid endpoint is contacted.

## TC-076 — excessive output is rejected before JSON parsing

| Field                     | Value                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Requirement               | AI-02                                                                                       |
| Priority                  | Normal                                                                                      |
| Preconditions             | Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise. |
| Test data                 | See case steps and automation source.                                                       |
| Automation                | [tests/ai/scenarios.spec.ts](../../tests/ai/scenarios.spec.ts)                              |
| Project                   | ai                                                                                          |
| Run suite                 | `npm run test:ai`                                                                           |
| Last saved outcome        | passed                                                                                      |
| Previous headless outcome | passed                                                                                      |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                      |

Steps:

1. Pass 100001 characters to parseSuggestions with valid requirements.

Expected results:

- Model output too large is thrown before parsing.

## TC-077 — optional live local Ollama suggestion evaluation

| Field                     | Value                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Requirement               | AI-03                                                                                    |
| Priority                  | Normal                                                                                   |
| Preconditions             | Optional running loopback Ollama with an installed model; never required for default CI. |
| Test data                 | See case steps and automation source.                                                    |
| Automation                | [tests/ai/local-live.spec.ts](../../tests/ai/local-live.spec.ts)                         |
| Project                   | ai                                                                                       |
| Run suite                 | `npm run test:ai:live`                                                                   |
| Last saved outcome        | skipped                                                                                  |
| Previous headless outcome | skipped                                                                                  |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                   |

Steps:

1. Explicitly set RUN_LOCAL_AI=1 and OLLAMA_MODEL to an already-installed local model.
2. Run npm run test:ai:live.
3. Request a schema-constrained suggestion for AUTH-01 and validate output.
4. Attach returned suggestions for human review.

Expected results:

- At least one valid, traceable suggestion is returned when configured.
- Without opt-in/model, the check is explicitly skipped.

Notes: Latest result is skipped; no live LLM output or generated scenario execution is claimed.
