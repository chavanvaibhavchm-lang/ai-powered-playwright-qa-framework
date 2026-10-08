const fs = require('node:fs');
const path = require('node:path');

const definitions = new Map();
function add(title, steps, expected, options = {}) {
  if (definitions.has(title)) throw new Error(`Duplicate definition: ${title}`);
  definitions.set(title, {
    id: `TC-${String(definitions.size + 1).padStart(3, '0')}`,
    steps,
    expected,
    ...options,
  });
}
const standard = 'standard_user / secret_sauce (public demo credentials)';
const customer = 'First Name: Ada; Last Name: Lovelace; Postal Code: 560001';
const basket = 'Sauce Labs Backpack + Sauce Labs Bike Light';

add(
  'Verify successful login to SauceDemo',
  [
    'Open https://www.saucedemo.com/.',
    'Enter standard_user and secret_sauce; click Login.',
    'Check the destination URL and Products title.',
  ],
  ['URL is https://www.saucedemo.com/inventory.html.', 'Products title is displayed.'],
  { priority: 'Critical', data: standard },
);
add(
  'password is masked and keyboard login works',
  [
    'Open the login screen and inspect the password input type.',
    'Fill the username; press Tab.',
    'Fill the password; press Enter.',
  ],
  [
    'Password input type is password.',
    'Tab focuses the password field.',
    'Enter submits the form and opens inventory.',
  ],
  { data: standard },
);
add(
  'inventory refresh preserves session and logout revokes access',
  [
    'Sign in as standard_user.',
    'Refresh inventory.',
    'Open Menu and select Logout.',
    'Navigate directly to /inventory.html.',
  ],
  [
    'Refresh retains the Products screen.',
    'Logout displays Login.',
    "Direct inventory access displays You can only access '/inventory.html' when you are logged in.",
  ],
);
add(
  'unauthenticated direct inventory navigation is rejected',
  ['Start a fresh browser context without login.', 'Open /inventory.html.'],
  ['Login is visible.', 'An error containing You can only access is shown.'],
  { preconditions: 'Fresh unauthenticated context.' },
);
const invalidLogins = [
  ['wrong username', 'unknown_user', 'secret_sauce', 'Username and password do not match'],
  ['wrong password', 'standard_user', 'incorrect', 'Username and password do not match'],
  ['missing username', '', 'secret_sauce', 'Username is required'],
  ['missing password', 'standard_user', '', 'Password is required'],
  ['both fields empty', '', '', 'Username is required'],
  ['locked account', 'locked_out_user', 'secret_sauce', 'Sorry, this user has been locked out'],
  ['whitespace credentials', 'three spaces', 'three spaces', 'Username and password do not match'],
  [
    'special characters',
    "<script>alert('qa')</script>",
    '!?<>',
    'Username and password do not match',
  ],
  ['long username', 'u repeated 256 times', 'secret_sauce', 'Username and password do not match'],
];
for (const [name, username, password, message] of invalidLogins)
  add(
    `rejects ${name}`,
    [
      'Open login in a fresh context.',
      'Submit the specified username/password.',
      'Check the error and absence of inventory cards.',
      'Dismiss the error using its close button.',
    ],
    [
      `Error contains: ${message}.`,
      'No inventory cards are present.',
      'The dismissed error is removed.',
    ],
    { data: `Username: ${JSON.stringify(username)}; Password: ${JSON.stringify(password)}` },
  );

add(
  'catalog contains six complete products with loaded images',
  [
    'Sign in and inspect all six inventory cards.',
    'Extract product names, descriptions and displayed prices.',
    'Wait for each image to load and inspect its natural width.',
  ],
  [
    'Names match test-data/products.ts in initial order.',
    'Each description has more than 20 characters; price is positive.',
    'All images are complete with naturalWidth > 0.',
  ],
  { priority: 'Critical' },
);
add(
  'all four dropdown choices sort actual names and numeric prices',
  [
    'Record all inventory names and numeric prices.',
    'Verify the four option labels/values.',
    'Select az, za, lohi and hilo one at a time using the native dropdown.',
    'After each selection compare all displayed values with the sorted baseline.',
  ],
  [
    'Options are Name (A to Z)/az, Name (Z to A)/za, Price (low to high)/lohi, Price (high to low)/hilo.',
    'Names are in actual ascending/descending order.',
    'Prices are numerically ascending/descending, including equal prices.',
  ],
);
add(
  'every product detail matches its inventory card and back returns',
  [
    'Record inventory name, description and price for every product.',
    'Open each product detail screen in turn.',
    'Compare detail fields with the recorded card.',
    'Click Back to products after each comparison.',
  ],
  [
    'Detail URL includes inventory-item.html?id=<number>.',
    'Name, description and price match the inventory card for all six products.',
    'Back returns to the six-product catalog.',
  ],
);
add(
  'details add/remove stays consistent with inventory and cart',
  [
    'Record Backpack card data and open its details.',
    'Add Backpack and verify badge; remove it and verify badge disappears.',
    'Add it again and return to products.',
    'Check its Remove button, then open cart and compare product data.',
  ],
  [
    'Badge is 1 after add and absent after remove.',
    'Inventory reflects selected state after returning.',
    'Cart contains the same Backpack name, description and price.',
  ],
);
add(
  'lazy catalog loads more product cards when scrolling to its sentinel',
  [
    'Sign in; open Menu > Dynamic Catalog > Lazy Load.',
    'Wait for at least six loaded product-name elements and record count.',
    'Scroll the lazy-load sentinel into view.',
    'Wait for more product-name elements to load.',
  ],
  [
    'URL ends in dynamic-catalog-lazy-load.html.',
    'Loaded product-name count increases beyond the recorded count.',
  ],
);
add(
  'spinner disappears and loaded product content becomes visible',
  [
    'Sign in; open Menu > Dynamic Catalog > Spinner.',
    'Wait for the loading spinner to be removed (up to 20 seconds).',
    'Inspect the loaded catalog container.',
  ],
  [
    'URL ends in dynamic-catalog-spinner.html.',
    'Spinner element is absent.',
    'Loaded content contains Sauce Labs.',
  ],
);
add(
  'slider selects the requested product with a named control',
  [
    'Sign in; open Menu > Dynamic Catalog > Slider.',
    'Click Show Sauce Labs Backpack.',
    'Inspect the displayed product name and price.',
  ],
  ['URL ends in dynamic-catalog-slider.html.', 'Name is Sauce Labs Backpack and price is $29.99.'],
);

add(
  'multiple items retain identity, price and badge after refresh',
  [
    'Record card data; add Backpack and Bike Light.',
    'Open cart and compare both items and quantities.',
    'Refresh cart and compare again.',
    'Remove Backpack; Continue Shopping.',
    'Check Backpack Add to cart, remove Bike Light, then reopen cart.',
  ],
  [
    'Badge is initially 2; cart data matches inventory and quantities are both 1.',
    'Refresh preserves both items.',
    'Removing Backpack changes badge to 1 and its inventory action to Add to cart.',
    'Removing the remaining item clears badge and cart.',
  ],
  { priority: 'Critical', data: basket },
);
add(
  'single item can be removed from the cart',
  ['Add Backpack and check badge.', 'Open cart and remove Backpack.'],
  ['Badge is initially 1.', 'Cart is empty and badge disappears.'],
);
add(
  'empty cart has navigation controls without fabricated empty-cart policy',
  [
    'Sign in without adding products; open cart.',
    'Inspect cart and Checkout button.',
    'Click Continue Shopping.',
  ],
  [
    'Cart contains no items and Checkout is visible.',
    'Continue Shopping returns to all six products.',
  ],
  {
    notes:
      'No assertion that empty-cart checkout must be blocked; the implementation does not specify that policy.',
  },
);

for (const count of [1, 2])
  add(
    `completes ${count}-item checkout with verified arithmetic`,
    [
      'Record displayed product data and add the specified basket.',
      'Open cart; compare selected items; click Checkout.',
      'Enter customer data and Continue.',
      'Compare overview items, subtotal, displayed tax and total.',
      'Finish, then Back Home.',
    ],
    [
      'Cart/overview line items match inventory.',
      'Subtotal equals the sum of displayed prices in integer cents.',
      'Tax is nonnegative; total equals subtotal plus displayed tax, without assuming a tax rate.',
      'Payment and shipping information are nonempty.',
      'Thank you for your order! appears; badge clears; Back Home shows six products.',
    ],
    { priority: 'Critical', data: `${count === 1 ? 'Sauce Labs Backpack' : basket}; ${customer}` },
  );
add(
  'cancel from information returns to cart and overview returns to inventory',
  [
    'Add Backpack; open cart and Checkout.',
    'Cancel from customer information.',
    'Start Checkout again, fill valid customer data and Continue.',
    'Cancel from overview.',
  ],
  [
    'First Cancel returns to cart with one item.',
    'Overview Cancel returns to inventory and badge remains 1.',
  ],
  { data: customer },
);
add(
  'completed demo order downloads a nonempty PDF artifact',
  [
    'Complete a Backpack checkout with valid customer data.',
    'Click Generate PDF order and capture the download.',
    'Save the file and inspect its filename, first five bytes and size.',
  ],
  [
    'Download reports no failure and filename ends in .pdf.',
    'File starts with %PDF- and exceeds 100 bytes.',
    'The genuine artifact is attached to the test report.',
  ],
  {
    data: customer,
    notes: 'File download/header checks only; PDF text and layout are not certified.',
  },
);
for (const [field, message] of [
  ['firstName', 'First Name is required'],
  ['lastName', 'Last Name is required'],
  ['postalCode', 'Postal Code is required'],
])
  add(
    `missing ${field} blocks checkout`,
    [
      'Sign in, add Backpack, open cart > Checkout.',
      'Fill customer details with only the specified field empty.',
      'Click Continue.',
    ],
    [`Error contains ${message}.`, 'URL remains checkout-step-one.html.'],
    { data: `${customer}; override ${field} with empty string` },
  );
for (const [name, data] of [
  [
    'Unicode and special characters',
    "First Name: Zoë; Last Name: O'Connor-李; Postal Code: SW1A 1AA",
  ],
  ['long nonempty values', 'First Name: A × 256; Last Name: B × 256; Postal Code: P × 256'],
  ['whitespace-only fields (observed demo behavior)', 'Each field contains exactly three spaces'],
])
  add(
    `observes ${name}`,
    [
      'Sign in, add Backpack and open Checkout.',
      'Fill the specified boundary values.',
      'Click Continue.',
    ],
    ['Checkout advances to checkout-step-two.html.'],
    {
      data,
      notes:
        'Documents actual nonempty-field behavior; this is not a claim of robust name/postal validation or a fabricated defect.',
    },
  );

add(
  'menu opens, closes, links to About and returns to All Items',
  [
    'Open Menu from inventory.',
    'Inspect About href and Logout visibility.',
    'Close Menu and inspect Logout visibility.',
    'Open cart, then Menu > All Items.',
  ],
  [
    'About href is https://saucelabs.com/.',
    'Logout is visible only while menu is open.',
    'All Items returns to six products.',
  ],
  { notes: 'About destination is checked as a link; the external site is not exercised.' },
);
add(
  'reset clears cart after navigation and refresh',
  [
    'Add Backpack and Bike Light.',
    'Open Menu > Reset App State and close menu.',
    'Refresh inventory and inspect both product actions.',
    'Open cart.',
  ],
  ['Badge clears.', 'Both products expose Add to cart after refresh.', 'Cart is empty.'],
);
add(
  'browser back and forward retain selected product and cart',
  [
    'Open Backpack details and add it.',
    'Use browser Back and inspect inventory.',
    'Use Forward and inspect Backpack details.',
    'Open cart and refresh.',
  ],
  [
    'Back shows six inventory products.',
    'Forward restores Backpack details.',
    'Refreshed cart contains Backpack.',
  ],
);
add(
  'performance persona reaches inventory with a generous timeout',
  [
    'Open login and sign in as performance_glitch_user.',
    'Wait for six inventory cards using the configured generous timeout.',
    'Record login duration in the test report.',
  ],
  ['Six cards become visible.', 'Measured duration is attached as an observation.'],
  {
    data: 'performance_glitch_user / secret_sauce',
    notes:
      '45-second test budget and 20-second inventory assertion timeout; no load test or claimed performance SLA.',
  },
);
add(
  'problem persona cannot retain last name and is blocked at checkout',
  [
    'Sign in as problem_user; add Backpack; open Checkout.',
    'Fill Ada / Lovelace / 560001.',
    'Inspect Last Name, then Continue; save screenshot.',
  ],
  [
    'Defect reproduction: Last Name stays empty.',
    'Continue displays Last Name is required; reproduction screenshot is attached.',
  ],
  {
    data: 'problem_user / secret_sauce',
    notes:
      'Known defect DEF-01. Passing this check means reproduced, not correct product behavior.',
  },
);
add(
  'error persona advances with rejected empty last name',
  [
    'Sign in as error_user; add Backpack; open Checkout.',
    'Fill Ada / Lovelace / 560001 and inspect Last Name.',
    'Continue and save screenshot.',
  ],
  [
    'Defect reproduction: Last Name stays empty.',
    'Despite empty Last Name, overview opens; screenshot is attached.',
  ],
  {
    data: 'error_user / secret_sauce',
    notes: 'Known defect DEF-02; separate from the default gate.',
  },
);
add(
  'visual persona substitutes the backpack image',
  [
    'Sign in as standard_user; record Backpack image src.',
    'Open login and sign in as visual_user.',
    'Compare Backpack image src with the control value.',
    'Attach both source strings.',
  ],
  ['Defect reproduction: sources differ and visual_user source contains sl-404.'],
  {
    data: 'standard_user then visual_user / secret_sauce',
    notes: 'Known defect DEF-03; this is a source comparison, not the visual screenshot suite.',
  },
);
add(
  'small mobile viewport supports login, cart and checkout',
  [
    'Use a fresh 390 × 844 mobile browser context.',
    'Inspect Login in viewport; sign in; inspect sort control in viewport.',
    'Add Backpack, open cart and Checkout.',
    'Enter customer details; Continue; compare arithmetic; Finish.',
    'Check confirmation and horizontal document overflow.',
  ],
  [
    'Login and sort controls are in viewport.',
    'Cart contains one item; total equals displayed subtotal plus tax.',
    'Confirmation is visible; document scrollWidth does not exceed innerWidth.',
  ],
  {
    priority: 'Critical',
    data: `${standard}; ${customer}`,
    preconditions: 'Mobile Chromium project: 390 × 844, touch and mobile enabled.',
  },
);

for (const screen of ['login', 'inventory', 'cart', 'checkout'])
  add(
    `WCAG-oriented audit of ${screen}`,
    [
      'Open login in a fresh context.',
      ...(screen === 'login' ? [] : ['Sign in as standard_user.']),
      ...(['cart', 'checkout'].includes(screen) ? ['Open an empty cart.'] : []),
      ...(screen === 'checkout' ? ['Click Checkout.'] : []),
      'Run axe with wcag2a, wcag2aa, wcag21a and wcag21aa tags.',
      'Attach the full scan JSON and inspect violations.',
    ],
    ['No violations are returned for the selected tags on this scanned page state.'],
    {
      notes:
        'Limited automated audit only; no full accessibility certification or manual assistive-technology coverage.',
    },
  );
add(
  'login controls follow keyboard focus order',
  ['Open login in a fresh context.', 'Press Tab three times, checking focus after each press.'],
  ['Focus order is Username → Password → Login.'],
);
for (const screen of ['login', 'inventory'])
  add(
    `stable ${screen} appearance`,
    [
      `Open ${screen === 'login' ? 'login' : 'login and sign in to inventory'}.`,
      'Use the visual project fixed viewport/locale/timezone/color scheme; wait for fonts and images.',
      'Take a full-page screenshot with animations disabled.',
      'Compare against the existing OS/project-specific baseline with baseline updates disabled.',
    ],
    ['Screenshot matches the reviewed baseline within maxDiffPixels = 100.'],
    {
      notes:
        'The existing Windows baselines were created headlessly. Latest headed run failed both comparisons; inventory actual width was 1425 vs expected 1440. Baselines were not replaced. Earlier headless portfolio comparisons passed.',
    },
  );

const apiData =
  'Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]';
add(
  'health and deterministic products are independent of SauceDemo',
  [
    'Start an isolated local companion service/database.',
    'GET /health; GET /products; GET /orders.',
  ],
  [
    'Health is 200 with {status:ok, service:independent-companion}.',
    'Products is 200 with Companion Backpack (id 1, 2999 cents) and Companion Bike Light (id 2, 999 cents).',
    'Initial order list is empty.',
  ],
);
add(
  'create, read, update and delete order with calculated cents',
  [
    'POST /orders with valid order data.',
    'Check response schema, totalCents and Location.',
    'GET the created order.',
    'PATCH status to completed.',
    'DELETE the order, then GET it and list orders.',
  ],
  [
    'POST is 201 with a valid ID/status/customer/items/totalCents response and totalCents = 6997.',
    'Location points to /orders/<id>; GET is 200 with the same body.',
    'PATCH is 200 and status is completed.',
    'DELETE is 204, subsequent GET is 404 and list is empty.',
  ],
  { data: apiData },
);
add(
  'SQLite order survives closing and reopening its database',
  [
    'POST a valid order into an isolated database.',
    'Save the returned order; close the service and database.',
    'Reopen the same SQLite file through OrderStore and fetch the order.',
    'Close the reopened database.',
  ],
  ['POST returns 201.', 'Reopened SQLite returns the same persisted order.'],
  { data: apiData },
);
for (const [name, data] of [
  ['empty items', 'items: []'],
  ['zero quantity', 'productId 1, quantity 0'],
  ['fractional quantity', 'productId 1, quantity 1.5'],
  ['excess quantity', 'productId 1, quantity 101'],
  ['unknown product', 'productId 999, quantity 1'],
  ['duplicate product', 'productId 1 appears twice, quantities 1 and 2'],
  ['blank customer', 'firstName contains three spaces'],
  ['unexpected property', 'extra top-level admin: true'],
])
  add(
    `rejects ${name} without persisting an order`,
    [
      'Start an isolated empty local companion database.',
      'POST /orders with valid data modified by the specified invalid input.',
      'Inspect response; GET /orders.',
    ],
    [
      'POST is 400 with an error property.',
      'Order list remains empty; invalid data is not persisted.',
    ],
    { data: `${apiData}; override: ${data}` },
  );
add(
  'malformed JSON, media type, payload size and routes return explicit errors',
  [
    'POST /orders with {broken as application/json.',
    'POST plain text with its default media type.',
    'POST JSON containing a 17000-character value.',
    'GET /unknown; PUT /products.',
  ],
  ['Responses are respectively 400, 415, 413, 404 and 405.'],
);
add(
  'invalid updates and nonexistent order operations do not change persisted state',
  [
    'Create a valid order.',
    'PATCH its status to fake, then GET it.',
    'GET /orders/0.',
    'PATCH and DELETE /orders/999.',
  ],
  [
    'Invalid PATCH is 400 and the existing order is unchanged.',
    'Invalid ID 0 is 400.',
    'Nonexistent PATCH and DELETE are 404.',
  ],
  { data: apiData },
);

add(
  'deterministic provider produces schema-validated traceable suggestions',
  [
    'Use test-data/mock-suggestions.json and the INV-02 test requirement.',
    'Call suggest with MockProvider.',
    'Compare the parsed response to the mock.',
  ],
  ['Schema-validated output equals the mock and references INV-02.'],
  { data: 'Deterministic mock; no live model/network request.' },
);
add(
  'malformed JSON and markdown code fences are rejected',
  [
    'Call parseSuggestions with {bad.',
    'Call it with otherwise-valid JSON wrapped in markdown code fences.',
  ],
  ['Both inputs throw malformed JSON.'],
);
for (const [name, data] of [
  ['missing scenarios', '{}'],
  ['empty scenarios', '{scenarios:[]}'],
  ['invalid priority', 'priority: urgent'],
  ['unexpected generated code', 'extra code: execute()'],
  ['empty steps', 'steps: []'],
  ['whitespace title', 'title: five spaces'],
])
  add(
    `rejects ${name}`,
    [
      'Use a valid INV-02 requirement and mock scenario.',
      'Apply the specified invalid schema mutation and serialize as JSON.',
      'Call parseSuggestions.',
    ],
    ['Invalid scenario schema is thrown.'],
    { data },
  );
add(
  'missing, malformed and duplicate requirements fail before calling provider',
  [
    'Call suggest with no requirements.',
    'Call it with id invented and an empty description.',
    'Call it with a duplicated INV-02 requirement.',
  ],
  ['Errors identify missing requirements, invalid requirement, and duplicate requirement ID.'],
);
add(
  'unknown requirements and duplicate scenario IDs are rejected',
  [
    'Parse a scenario referencing FAKE-01 against only INV-02.',
    'Parse a list containing the same S-001 scenario twice.',
  ],
  ['Unknown requirement reference and Duplicate scenario ID errors are thrown.'],
);
add(
  'equivalent suggestion titles are deduplicated deterministically',
  [
    'Provide the mock S-001 scenario plus S-002 with the same requirement IDs and uppercase/padded equivalent title.',
    'Parse suggestions.',
  ],
  ['Only the original mock scenario remains.'],
  { notes: 'Title/requirement normalization only; semantic equivalence detection is not claimed.' },
);
add(
  'approved suggestions require reviewer and explicit valid selection',
  [
    'Validate the mock suggestions.',
    'Attempt approval with empty reviewer, empty selection, and unknown S-999.',
    'Approve with a nonempty reviewer and S-001 in the deterministic adapter test.',
  ],
  [
    'Invalid approvals throw explicit errors.',
    'Valid selection returns the chosen suggestion data only.',
  ],
  {
    notes:
      'Unit test for the approval adapter, not actual human approval of live proposals; no test code is generated/executed.',
  },
);
add(
  'local adapter sends schema and parses mocked Ollama response',
  [
    'Inject a mock fetch transport returning the valid mock JSON response.',
    'Call the local provider with model mock-local-model.',
    'Inspect request URL, schema, stream flag and result.',
  ],
  [
    'One request targets http://127.0.0.1:11434/api/generate with model name, stream:false and object JSON schema.',
    'Parsed suggestions equal the mock.',
  ],
  { notes: 'Transport is mocked; no real Ollama process/model was used.' },
);
add(
  'adapter rejects HTTP failures, missing response text and nonlocal endpoints',
  [
    'Inject HTTP 503 response, then a body with no response text.',
    'Construct provider with https://paid.example.com.',
    'Construct provider with an empty model name.',
  ],
  ['Errors identify HTTP 503, missing response text, nonlocal endpoint and missing OLLAMA_MODEL.'],
  { notes: 'Nonlocal provider construction is rejected; no paid endpoint is contacted.' },
);
add(
  'excessive output is rejected before JSON parsing',
  ['Pass 100001 characters to parseSuggestions with valid requirements.'],
  ['Model output too large is thrown before parsing.'],
);
add(
  'optional live local Ollama suggestion evaluation',
  [
    'Explicitly set RUN_LOCAL_AI=1 and OLLAMA_MODEL to an already-installed local model.',
    'Run npm run test:ai:live.',
    'Request a schema-constrained suggestion for AUTH-01 and validate output.',
    'Attach returned suggestions for human review.',
  ],
  [
    'At least one valid, traceable suggestion is returned when configured.',
    'Without opt-in/model, the check is explicitly skipped.',
  ],
  {
    preconditions:
      'Optional running loopback Ollama with an installed model; never required for default CI.',
    notes:
      'Latest result is skipped; no live LLM output or generated scenario execution is claimed.',
  },
);

add(
  'has title',
  ['Open https://playwright.dev/.', 'Read the document title.'],
  ['Title contains Playwright.'],
  { preconditions: 'Fresh context; external Playwright documentation site reachable.' },
);
add(
  'get started link',
  [
    'Open https://playwright.dev/.',
    'Click the Get started link.',
    'Inspect the Installation heading.',
  ],
  ['Installation heading is visible.'],
  { preconditions: 'Fresh context; external Playwright documentation site reachable.' },
);

const suites = {
  authentication: ['Authentication', 'npm run test:regression'],
  inventory: ['Inventory and dynamic catalog', 'npm run test:regression'],
  cart: ['Cart', 'npm run test:regression'],
  checkout: ['Checkout and PDF download', 'npm run test:regression'],
  navigation: ['Menu and navigation', 'npm run test:regression'],
  personas: ['Personas and defect reproduction', 'npm run test:personas'],
  responsive: ['Mobile responsiveness', 'npm run test:smoke'],
  accessibility: ['Accessibility', 'npm run test:accessibility'],
  visual: ['Visual comparisons', 'npm run test:visual'],
  api: ['Independent companion REST / SQLite', 'npm run test:api'],
  ai: ['AI adapter / suggestions', 'npm run test:ai'],
  examples: ['Preserved starter examples', 'npm run test:examples'],
};
function suiteFor(file) {
  if (
    file === 'login.spec.ts' ||
    file.startsWith('ui/auth/') ||
    file === 'ui/negative/login.spec.ts'
  )
    return 'authentication';
  if (file === 'ui/negative/checkout.spec.ts') return 'checkout';
  if (file === 'example.spec.ts') return 'examples';
  const parts = file.split('/');
  return parts[0] === 'ui' ? parts[1] : parts[0];
}
const root = path.resolve(__dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const reports = [
  'docs/evidence/headed-portfolio-execution.json',
  'docs/evidence/headed-examples-execution.json',
].map((file) => ({ file, report: read(file) }));
const headless = read('docs/evidence/portfolio-execution.json');
const cases = [];
for (const { file: evidence, report } of reports)
  for (const entry of report.tests) {
    const title = entry.title.replace(/^\[[^\]]+\]\s*/, '');
    const definition = definitions.get(title);
    if (!definition) throw new Error(`Missing documented steps: ${title}`);
    const suite = suiteFor(entry.file);
    if (!suites[suite]) throw new Error(`Unknown suite: ${entry.file}`);
    const source = `tests/${entry.file}`;
    if (!fs.existsSync(path.join(root, source)))
      throw new Error(`Missing automation source: ${source}`);
    const requirement =
      entry.title.match(/^\[([^\]]+)\]/)?.[1] ??
      (suite === 'examples' ? 'N/A - starter example' : 'AUTH-01');
    const knownDefect = requirement.startsWith('DEF-');
    const baseline = headless.tests.find(
      (test) => test.title === entry.title && test.project === entry.project,
    );
    const status = entry.results.at(-1)?.status ?? entry.status;
    cases.push({
      ...definition,
      title,
      suite,
      requirement,
      priority: definition.priority ?? 'Normal',
      preconditions:
        definition.preconditions ??
        (['api', 'ai'].includes(suite)
          ? suite === 'api'
            ? 'Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.'
            : 'Node runtime; valid INV-02 requirement and deterministic mock data unless stated otherwise.'
          : suite === 'authentication' ||
              suite === 'personas' ||
              suite === 'visual' ||
              suite === 'accessibility'
            ? 'Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.'
            : 'Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable.'),
      data:
        definition.data ??
        (['api', 'ai', 'examples'].includes(suite)
          ? 'See case steps and automation source.'
          : `${standard}; use fixture-isolated state.`),
      automation: {
        file: source,
        title: entry.title,
        project: entry.project,
        command:
          requirement === 'AI-03' && entry.title.includes('optional live')
            ? 'npm run test:ai:live'
            : suites[suite][1],
      },
      latestExecution: {
        mode: 'headed browser projects / Node-only API and AI',
        status,
        interpretation:
          knownDefect && status === 'passed'
            ? 'Known defect reproduced (not correct product behavior)'
            : status,
        startedAt: report.stats.startTime,
        evidence,
      },
      priorHeadlessExecution: baseline
        ? {
            status: baseline.results.at(-1)?.status,
            evidence: 'docs/evidence/portfolio-execution.json',
          }
        : null,
      notes: definition.notes ?? '',
    });
  }
if (
  cases.length !== 79 ||
  new Set(cases.map((test) => test.id)).size !== 79 ||
  definitions.size !== 79
)
  throw new Error('Catalog must map all 79 distinct existing cases exactly once.');
const output = path.join(root, 'test-cases');
fs.mkdirSync(path.join(output, 'suites'), { recursive: true });
fs.writeFileSync(
  path.join(output, 'catalog.json'),
  JSON.stringify(
    {
      scope: 'Existing executed automation, not new coverage or a new test run',
      evidenceSources: reports.map((item) => item.file),
      count: cases.length,
      cases,
    },
    null,
    2,
  ) + '\n',
);
const escape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
for (const [key, [name]] of Object.entries(suites)) {
  const selected = cases
    .filter((test) => test.suite === key)
    .sort((a, b) => a.id.localeCompare(b.id));
  let md = `# ${name} test cases\n\n${selected.length} cases mapped to existing automation. [Catalog index](../README.md).\n\n`;
  for (const test of selected) {
    md += `## ${test.id} — ${test.title}\n\n`;
    md += `| Field | Value |\n| --- | --- |\n| Requirement | ${escape(test.requirement)} |\n| Priority | ${test.priority} |\n| Preconditions | ${escape(test.preconditions)} |\n| Test data | ${escape(test.data)} |\n| Automation | [${test.automation.file}](../../${test.automation.file}) |\n| Project | ${test.automation.project} |\n| Run suite | \`${test.automation.command}\` |\n| Last saved outcome | ${escape(test.latestExecution.interpretation)} |\n| Previous headless outcome | ${test.priorHeadlessExecution?.status ?? 'Not part of portfolio baseline'} |\n| Evidence | [Saved execution](../../${test.latestExecution.evidence}) |\n\n`;
    md +=
      'Steps:\n\n' +
      test.steps.map((step, index) => `${index + 1}. ${step}`).join('\n') +
      '\n\nExpected results:\n\n' +
      test.expected.map((value) => `- ${value}`).join('\n') +
      '\n\n';
    if (test.notes) md += `Notes: ${test.notes}\n\n`;
  }
  fs.writeFileSync(path.join(output, 'suites', `${key}.md`), md);
}
let index =
  '# Executed test-case catalog\n\n79 documented cases from the existing automated suites. Each case includes a unique ID, requirement, priority, preconditions, data, steps, expected results, source link, run command and saved execution outcome. This catalog does not introduce new automation or claim new executions.\n\n';
index += '| Suite | Cases | Detailed cases |\n| --- | ---: | --- |\n';
for (const [key, [name]] of Object.entries(suites))
  index += `| ${name} | ${cases.filter((test) => test.suite === key).length} | [Open](suites/${key}.md) |\n`;
index +=
  '\nLatest saved headed collection: **76 passed, 2 failed, 1 skipped** across 79 cases (portfolio plus starter examples). Three passing checks are known-defect reproductions, not evidence of correct persona behavior. The two visual cases failed against existing headless baselines. Live Ollama was skipped because it was not enabled. Earlier headless portfolio: 76 passed and 1 skipped across its 77 cases. Results are snapshots from 2026-10-08, not evergreen statuses.\n\n';
index +=
  '## Use the catalog\n\n- Open a suite Markdown file for manual-review or execution steps. API/AI cases require a programmatic client or the supplied automation; they are not browser-only manual steps.\n- Use [catalog.json](catalog.json) for structured import or tooling.\n- Use [execution-template.md](execution-template.md) to record a new manual run; leave unexecuted cases as Not run.\n- Requirement IDs refer to [traceability](../docs/requirements-traceability.md). Case IDs are catalog identifiers; automation names and Allure IDs are preserved.\n- Cases that loop over products, sorting modes or malformed inputs remain one case per actual Playwright test. Counts are not inflated by splitting assertions into new tests.\n\n';
index +=
  '## Commands\n\n```powershell\n# Entire portfolio, with reviewed headless visual baselines:\nnpm run test:portfolio\n# Headed portfolio plus preserved starter examples:\nnpm run test:portfolio -- --headed --project=examples\n# API only:\nnpm run test:api\n# Rebuild this documentation from saved evidence (does not run tests):\nnode scripts/build-test-cases.cjs\n```\n\n';
index +=
  'The catalog deliberately excludes invented search, pagination, coupons, payments, uploads and SauceDemo backend/database checks. The companion SQLite/API service is independent. Accessibility and PDF checks have documented limits; Firefox/WebKit are not additional executed cases. AI approval tests exercise adapter validation, not a real human approval or generated-code execution.\n';
fs.writeFileSync(path.join(output, 'README.md'), index);
console.log(
  `Created ${cases.length} complete test cases in test-cases/ across ${Object.keys(suites).length} suite files.`,
);
