# Authentication test cases

13 cases mapped to existing automation. [Catalog index](../README.md).

## TC-001 — Verify successful login to SauceDemo

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-01                                                                           |
| Priority                  | Critical                                                                          |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | standard_user / secret_sauce (public demo credentials)                            |
| Automation                | [tests/login.spec.ts](../../tests/login.spec.ts)                                  |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open https://www.saucedemo.com/.
2. Enter standard_user and secret_sauce; click Login.
3. Check the destination URL and Products title.

Expected results:

- URL is https://www.saucedemo.com/inventory.html.
- Products title is displayed.

## TC-002 — password is masked and keyboard login works

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-03                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | standard_user / secret_sauce (public demo credentials)                            |
| Automation                | [tests/ui/auth/auth.spec.ts](../../tests/ui/auth/auth.spec.ts)                    |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open the login screen and inspect the password input type.
2. Fill the username; press Tab.
3. Fill the password; press Enter.

Expected results:

- Password input type is password.
- Tab focuses the password field.
- Enter submits the form and opens inventory.

## TC-003 — inventory refresh preserves session and logout revokes access

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | AUTH-03                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/ui/auth/auth.spec.ts](../../tests/ui/auth/auth.spec.ts)                      |
| Project                   | chromium                                                                            |
| Run suite                 | `npm run test:regression`                                                           |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Sign in as standard_user.
2. Refresh inventory.
3. Open Menu and select Logout.
4. Navigate directly to /inventory.html.

Expected results:

- Refresh retains the Products screen.
- Logout displays Login.
- Direct inventory access displays You can only access '/inventory.html' when you are logged in.

## TC-004 — unauthenticated direct inventory navigation is rejected

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | AUTH-03                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh unauthenticated context.                                                      |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/ui/auth/auth.spec.ts](../../tests/ui/auth/auth.spec.ts)                      |
| Project                   | chromium                                                                            |
| Run suite                 | `npm run test:regression`                                                           |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Start a fresh browser context without login.
2. Open /inventory.html.

Expected results:

- Login is visible.
- An error containing You can only access is shown.

## TC-005 — rejects wrong username

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "unknown_user"; Password: "secret_sauce"                                |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username and password do not match.
- No inventory cards are present.
- The dismissed error is removed.

## TC-006 — rejects wrong password

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "standard_user"; Password: "incorrect"                                  |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username and password do not match.
- No inventory cards are present.
- The dismissed error is removed.

## TC-007 — rejects missing username

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: ""; Password: "secret_sauce"                                            |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username is required.
- No inventory cards are present.
- The dismissed error is removed.

## TC-008 — rejects missing password

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "standard_user"; Password: ""                                           |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Password is required.
- No inventory cards are present.
- The dismissed error is removed.

## TC-009 — rejects both fields empty

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: ""; Password: ""                                                        |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username is required.
- No inventory cards are present.
- The dismissed error is removed.

## TC-010 — rejects locked account

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "locked_out_user"; Password: "secret_sauce"                             |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Sorry, this user has been locked out.
- No inventory cards are present.
- The dismissed error is removed.

## TC-011 — rejects whitespace credentials

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "three spaces"; Password: "three spaces"                                |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username and password do not match.
- No inventory cards are present.
- The dismissed error is removed.

## TC-012 — rejects special characters

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "<script>alert('qa')</script>"; Password: "!?<>"                        |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username and password do not match.
- No inventory cards are present.
- The dismissed error is removed.

## TC-013 — rejects long username

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | AUTH-02                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | Username: "u repeated 256 times"; Password: "secret_sauce"                        |
| Automation                | [tests/ui/negative/login.spec.ts](../../tests/ui/negative/login.spec.ts)          |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:regression`                                                         |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login in a fresh context.
2. Submit the specified username/password.
3. Check the error and absence of inventory cards.
4. Dismiss the error using its close button.

Expected results:

- Error contains: Username and password do not match.
- No inventory cards are present.
- The dismissed error is removed.
