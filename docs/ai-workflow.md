# Local AI scenario workflow

Requirements → local Ollama or deterministic mock → schema validation → deterministic safe repair → quality gate → optional targeted correction → revalidation → human review.

## Run locally

```powershell
npm run ai:suggest
# Install Ollama and download a model yourself once if needed:
ollama pull qwen2.5:1.5b
$env:OLLAMA_MODEL='qwen2.5:1.5b'
$env:OLLAMA_URL='http://127.0.0.1:11434'
npm run ai:suggest:live
```

The default model is `qwen2.5:1.5b`, configurable with `OLLAMA_MODEL`. Only HTTP loopback endpoints are allowed; redirects are refused. Each request uses a 120-second timeout, 4096-token context, 1600-token output budget and temperature zero. No paid API, key, cloud AI or additional dependency is used. These limits do not guarantee a model fits every 8 GB machine.

## Quality and correction

Text comparisons normalize case, whitespace and punctuation without changing saved scenario text. Blocking errors cover duplicate IDs, normalized duplicate scenarios (title, ordered steps, expected result and exact requirement mapping), unknown requirement references, missing expected results and repeated steps without an explicit state change.

Only an adjacent exact-equivalent repeated assertion is automatically removed. It must have no intervening action, state transition or distinct assertion context; repeated actions and assertions across state changes are retained. Duplicate scenarios are consolidated only when every normalized scenario field and the complete requirement mapping match. Differently mapped or uniquely worded scenarios are retained. When equivalent copies differ in priority, the higher-priority supported version is retained. Repairs and removals have before/after audit entries.

Warnings flag vague outcomes, unclear steps, missing setup/cart prerequisites, potentially unrelated objectives and selected behavior absent from linked requirements (coupons, payments, refunds, uploads, pagination, search, email). Warnings do not block. These text heuristics cannot prove business correctness or application support. Review every finding.

A failing gate leaves valid scenarios available for approval and marks only scenarios with blocking errors `needs-fix`. In the PRD UI, each scenario's title, steps and expected result can be edited; each save immediately reruns quality checks, and **Revalidate Scenarios** reruns quality and requirement traceability across the draft. Invalid scenarios cannot be approved for automation. Existing drafts are not replaced by batch regeneration. The UI offers one targeted correction attempt per invalid scenario; it may remove existing steps only and cannot change title, expected result, priority, scenario ID or requirement IDs. If correction is uncertain or fails, the draft remains for human editing.

The existing strict parser contract remains available. The correction workflow uses lossless schema parsing so it never silently deduplicates drafts. Malformed initial JSON/schema output is rejected before correction; generation failures do not replace existing reports. Duplicate initial IDs cannot safely be repaired while preserving identity and therefore remain blocking.

## Inspect reports

All generated files under `.local/` are already Git-ignored:

- `scenario-suggestions.json`: final draft, source and pending approval status.
- `scenario-quality-report.json`: final gate result, issues and approval status.
- `scenario-correction-history.json`: originals, initial findings, targeted attempt inputs, raw responses, candidates, failures or quality results, remaining issues and final status.
- `scenario-repair-audit.json`: before/after records for deterministic assertion repairs.

History may contain sensitive generated text. Small models may truncate output or fail correction. ID preservation does not prove semantic coverage. Unsupported functionality outside the heuristic vocabulary can escape detection.

## Mandatory human approval

Even a passing draft remains `approvalStatus: "pending-human-review"`. Inspect requirements, actual application behavior and all reports. A valid subset may be approved while other scenarios remain needs-fix; the CLI rejects any selected scenario with a blocking quality error. Create a human-authored `.local/approval.json`:

```json
{ "reviewer": "Your name", "scenarioIds": ["S-001"] }
```

Run `npm run ai:approve -- .local/approval.json`. The unchanged approval command requires a reviewer and explicit valid IDs and writes approved data only. The reviewer is responsible for remaining warnings or blocking findings. A human still authors and reviews Playwright tests; nothing generates, modifies or executes tests from suggestions.

## Verify

```powershell
npm run typecheck
npm run test:ai
npm run test:api
npm run test:regression
```

Correction tests use mocked providers and HTTP and require no Ollama. Optional real-model evaluation uses `RUN_LOCAL_AI=1`, `OLLAMA_MODEL` and `npm run test:ai:live`; failures after opt-in are real failures.
