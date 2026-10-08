# Evidence-based defect reports

Reproduced against the public demo on 2026-10-08. These are intentional training
persona defects, not claims about a production system. They are excluded from
the default quality gate using `@known-defect`.

Run `npm run test:known-defects`. A passing reproduction means the defect was
observed; it does **not** mean the intended product behavior passed.
Raw observations: `evidence/reconnaissance.json`; reproduction outcomes:
`evidence/known-defects-execution.json`. Screenshots/JSON are attached in Allure.

## DEF-01 — problem_user rejects last-name input

Severity: major, checkout blocked. Sign in as `problem_user`, add Backpack,
open cart → Checkout, fill first name Ada, last name Lovelace, postal code 560001.
The last-name value is empty after filling. Continue reports “Last Name is required”
and remains on step one. Standard-user control accepted the same input and
completed checkout. Test: `tests/ui/personas/personas.spec.ts`, DEF-01.
Additional observation: all six inventory images shared a replacement image in
initial reconnaissance; this is recorded evidence, not a separate automated case.

## DEF-02 — error_user ignores rejected last-name value at checkout

Severity: major, validation inconsistent. Repeat the same basket/input with
`error_user`. The last-name input remains empty, yet Continue navigates to
`checkout-step-two.html`. Standard-user missing-last-name validation blocks the
same flow. Test: DEF-02 in the persona suite; screenshot attached on reproduction.

## DEF-03 — visual_user displays replacement Backpack image

Severity: minor visual/product identity defect. Compare Backpack's image source
after login with standard_user and visual_user. Standard points to the actual
backpack asset; visual_user points to the `sl-404` replacement image. Test: DEF-03;
the actual two source strings are attached, not a fabricated screenshot comparison.

## Framework and environment defects corrected

- Empty `LoginPage.ts` previously caused “LoginPage is not a constructor”; replaced
  with a typed page object, then verified successful login.
- Menu actions were initially located as links; captured ARIA showed buttons.
  Corrected locators and all six auth/navigation retests passed.
- Installed Allure exposes `testCaseId`, not `id`; corrected after a real failure.
- Portable Playwright CLI uses a resolved package path rather than an unexported
  `playwright/cli` subpath; npm suite scripts were rerun after correction.
- Windows bundled headed Chromium reported `spawn UNKNOWN`. Installed Chrome
  launched successfully; Windows local config uses it. The underlying OS/binary
  cause was not proven and no browser reinstall was attempted. Headless bundled
  Chromium was separately verified. CI uses the normal bundled browser.

Whitespace checkout values advancing is documented as observed behavior, not
asserted to violate an invented validation contract. Limited accessibility scans
found no selected-tag violations in the executed pages; this is not certification.
