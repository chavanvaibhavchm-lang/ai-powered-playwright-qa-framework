/* global document, fetch, localStorage */
const el = (id) => document.getElementById(id);
let token,
  session,
  requirements = [],
  busy = false,
  scenarioReviewDirty = false,
  automation = { scenarios: [], candidates: [] };
function buttons() {
  el('upload').disabled = busy || !token;
  el('extract').disabled = busy || !session;
  el('save').disabled = busy || !requirements.length;
  el('generate').disabled =
    busy || automation.scenarios.length > 0 || !requirements.some((r) => r.status === 'approved');
  const duplicateRecovery =
    automation.scenarios.length > 0 &&
    automation.scenarios.every((s) => ['pending', 'needs-fix'].includes(s.status)) &&
    automation.quality?.issues.some((i) => i.message === 'Duplicate scenario content');
  el('deduplicate-scenarios').hidden = !duplicateRecovery;
  el('deduplicate-scenarios').disabled = busy || scenarioReviewDirty || !duplicateRecovery;
  el('save-scenarios').disabled = busy || !automation.scenarios.length;
  el('revalidate-scenarios').disabled = busy || !automation.scenarios.length;
  el('save-application').disabled = busy || !session;
  el('inspect-application').disabled = busy || !automation.config;
  el('generate-code').disabled =
    busy ||
    scenarioReviewDirty ||
    !automation.inspection ||
    !automation.scenarios.some(
      (s) =>
        s.status === 'approved' &&
        !automation.quality?.issues.some((i) => i.scenarioId === s.id && i.severity === 'error'),
    );
  el('generation-help').textContent = !automation.scenarios.length
    ? 'Generate scenarios first.'
    : scenarioReviewDirty
      ? 'Click Save Scenario Approvals before generating automation.'
      : !automation.scenarios.some((s) => s.status === 'approved')
        ? 'Approve at least one scenario and click Save Scenario Approvals.'
        : !automation.inspection
          ? 'Save the application configuration and click Inspect Application first.'
          : 'Ready to generate tests from saved approved scenarios and verified UI evidence.';
  if (!busy && automation.inspection && !scenarioReviewDirty) {
    const approved = automation.scenarios.filter((s) => s.status === 'approved');
    const readiness = automation.traceability?.scenarioReadiness;
    if (approved.length && readiness) {
      const ready = readiness.filter(
        (r) => r.status === 'ready' && approved.some((s) => s.id === r.scenarioId),
      ).length;
      el('generation-help').textContent =
        ready +
        ' of ' +
        approved.length +
        ' approved scenarios have current-page evidence. Review the specific blockers under each scenario. Insufficient scenarios will be recorded as blocked without an AI call.';
    }
  }
  el('run-approved').disabled = busy || !automation.candidates.some((c) => c.status === 'approved');
  document.querySelectorAll('.code-decision').forEach((b) => (b.disabled = busy));
}
async function api(path, data, headers = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'x-prd-token': token, ...headers },
    body: data,
  });
  el('revalidate-scenarios').onclick = () =>
    task('Revalidating every scenario and requirement trace…', async () => {
      await api('/api/scenario-revalidate', JSON.stringify({ id: session }));
      await refreshAutomation();
      el('message').textContent = 'Scenarios revalidated; invalid drafts remain needs-fix.';
    });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}
async function task(message, action, statusId = 'message') {
  if (busy) return;
  busy = true;
  const generating = statusId === 'generation-message';
  if (generating) {
    el('generation-loader').hidden = false;
    el('generate-code').textContent = 'Generating…';
    el('code-review').setAttribute('aria-busy', 'true');
  }
  buttons();
  el('message').className = '';
  el('message').textContent = message;
  el(statusId).className = 'task-status working';
  el(statusId).textContent = message;
  document.querySelectorAll('textarea,select,input').forEach((node) => (node.disabled = true));
  try {
    await action();
  } catch (error) {
    el('message').className = 'error';
    el('message').textContent = error.message;
  } finally {
    if (generating) {
      el('generation-loader').hidden = true;
      el('generate-code').textContent = 'Generate Automation Tests';
      el('code-review').setAttribute('aria-busy', 'false');
    }
    if (statusId !== 'message') {
      el(statusId).textContent = el('message').textContent;
      el(statusId).className =
        'task-status ' + (el('message').className === 'error' ? 'error' : 'success');
    }
    busy = false;
    document.querySelectorAll('textarea,select,input').forEach((node) => (node.disabled = false));
    buttons();
  }
}
function table() {
  el('requirements').replaceChildren();
  for (const requirement of requirements) {
    const tr = document.createElement('tr');
    for (let i = 0; i < 5; i++) tr.append(document.createElement('td'));
    tr.children[0].textContent = requirement.id;
    const editor = document.createElement('textarea');
    editor.value = requirement.description;
    editor.setAttribute('aria-label', requirement.id + ' description');
    editor.oninput = () => {
      requirement.description = editor.value;
      requirement.status = 'pending';
      if (requirement.evidenceStatus !== 'unresolved') {
        requirement.evidenceStatus = 'needs-review';
        requirement.evidenceWarning =
          'Edited description: compare every condition and outcome with the original quote before approving.';
        tr.children[3].textContent = [
          requirement.ambiguityWarning,
          requirement.evidenceStatus,
          requirement.evidenceWarning,
        ]
          .filter(Boolean)
          .join(' — ');
      }
      select.value = 'pending';
      buttons();
    };
    tr.children[1].append(editor);
    tr.children[2].textContent =
      requirement.sourceReference + (requirement.sourceId ? ' [' + requirement.sourceId + ']' : '');
    const quote = document.createElement('small');
    quote.textContent = requirement.evidence;
    tr.children[2].append(quote);
    tr.children[3].textContent =
      [requirement.ambiguityWarning, requirement.evidenceStatus, requirement.evidenceWarning]
        .filter(Boolean)
        .join(' — ') || 'None';
    const targetSelect = document.createElement('select');
    targetSelect.setAttribute('aria-label', requirement.id + ' requirement target');
    for (const value of ['application', 'framework']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent =
        value === 'application' ? 'Application under test' : 'Framework/internal';
      targetSelect.append(option);
    }
    targetSelect.value = requirement.target ?? 'application';
    targetSelect.onchange = () => {
      requirement.target = targetSelect.value;
      requirement.status = 'pending';
      select.value = 'pending';
      buttons();
    };
    tr.children[3].append(targetSelect);
    const select = document.createElement('select');
    select.setAttribute('aria-label', requirement.id + ' review');
    for (const value of ['pending', 'approved', 'rejected']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      if (value === 'approved' && requirement.evidenceStatus === 'unresolved')
        option.disabled = true;
      select.append(option);
    }
    select.value = requirement.status;
    select.onchange = () => {
      requirement.status = select.value;
      buttons();
    };
    tr.children[4].append(select);
    el('requirements').append(tr);
  }
}
el('upload').onclick = () =>
  task('Uploading and reading document…', async () => {
    const file = el('file').files[0];
    if (!file) throw new Error('Choose a PRD file');
    if (!file.size || file.size > 10 * 1024 * 1024)
      throw new Error('File must be nonempty and at most 10 MB');
    const result = await api('/api/upload', file, {
      'x-filename': encodeURIComponent(file.name),
      'content-type': 'application/octet-stream',
    });
    session = result.id;
    localStorage.setItem('prd-project', session);
    automation = { scenarios: [], candidates: [] };
    renderAutomation();
    requirements = [];
    table();
    el('output').textContent = '';
    el('message').textContent = result.filename + ' uploaded (' + result.chunks + ' chunks).';
  });
el('extract').onclick = () =>
  task('Extracting with local Ollama… Large documents may take several minutes.', async () => {
    const result = await api('/api/extract', JSON.stringify({ id: session }));
    requirements = result.requirements;
    table();
    el('output').textContent = '';
    el('message').textContent =
      requirements.length + ' requirements extracted. Edit and approve the requirements to use.';
    await refreshAutomation();
  });
el('save').onclick = () =>
  task('Saving review…', async () => {
    await api(
      '/api/review',
      JSON.stringify({
        id: session,
        requirements: requirements.map(({ id, description, status, target }) => ({
          id,
          description,
          status,
          target,
        })),
      }),
    );
    await refreshAutomation();
    requirements = automation.requirements;
    table();
    el('message').textContent = 'Requirement review saved locally.';
  });
el('generate').onclick = () =>
  task('Saving review and generating scenarios with local Ollama…', async () => {
    await api(
      '/api/review',
      JSON.stringify({
        id: session,
        requirements: requirements.map(({ id, description, status }) => ({
          id,
          description,
          status,
        })),
      }),
    );
    const result = await api('/api/generate', JSON.stringify({ id: session }));
    el('output').textContent = JSON.stringify(result, null, 2);
    el('message').textContent = scenarioResultMessage(result);
    await refreshAutomation();
  });
function scenarioResultMessage(result) {
  const failures = result.quality.issues.filter((i) => i.severity === 'error');
  const removed = result.duplicateRemovals?.length || 0;
  const warnings = result.quality.issues.filter((i) => i.severity === 'warning').length;
  return (
    'Saved pending human review. Quality gate: ' +
    (result.quality.passed
      ? 'PASSED' + (warnings ? ' (' + warnings + ' warnings to review)' : '')
      : 'FAILED: ' + failures.map((i) => i.scenarioId + ' — ' + i.message).join('; ')) +
    (removed
      ? '. Removed ' + removed + ' exact duplicate(s); originals saved in the merge audit'
      : '') +
    '. Files: ' +
    result.outputDirectory
  );
}
el('deduplicate-scenarios').onclick = () =>
  task('Removing exact duplicate drafts and rechecking quality…', async () => {
    const result = await api('/api/scenario-deduplicate', JSON.stringify({ id: session }));
    await refreshAutomation();
    el('message').textContent = scenarioResultMessage(result);
  });
fetch('/api/config')
  .then((r) => r.json())
  .then((config) => {
    token = config.token;
    const saved = localStorage.getItem('prd-project');
    if (saved)
      task('Restoring local PRD project…', async () => {
        const result = await api('/api/resume', JSON.stringify({ id: saved }));
        session = result.id;
        requirements = result.requirements;
        automation = result;
        table();
        renderAutomation();
        el('message').textContent = 'Restored ' + result.filename;
      });
    buttons();
  })
  .catch((error) => {
    el('message').textContent = error.message;
  });
buttons();

async function refreshAutomation() {
  automation = await api('/api/automation', JSON.stringify({ id: session }));
  scenarioReviewDirty = false;
  if (automation.requirements) {
    requirements = automation.requirements;
    table();
  }
  renderAutomation();
}
function renderAutomation() {
  el('project-id').textContent = session ? 'Project: ' + session : '';
  const config = automation.config;
  if (config) {
    el('application-name').value = config.name;
    el('application-url').value = config.url;
    el('pom-directory').value = config.pomDirectory;
    el('storage-state').value = config.storageState;
    el('allow-local').checked = config.allowLocal;
    el('approved-pages').value = config.approvedPages.join('\n');
  }
  el('inspection-summary').textContent = JSON.stringify(
    automation.inspectionSummary ??
      automation.traceability?.inspection ?? {
        url: null,
        verifiedLocators: 0,
        reusablePomMethods: 0,
      },
    null,
    2,
  );
  if (automation.quality)
    el('output').textContent = JSON.stringify({ quality: automation.quality }, null, 2);
  el('scenario-coverage').textContent = automation.traceability
    ? JSON.stringify(
        {
          generated: automation.traceability.scenarioCoverage,
          approved: automation.traceability.approvedScenarioCoverage,
        },
        null,
        2,
      )
    : '';
  el('inspection').textContent = automation.inspection
    ? JSON.stringify({ inspection: automation.inspection, poms: automation.poms }, null, 2)
    : '';
  el('scenario-review').replaceChildren();
  for (const scenario of automation.scenarios) {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = scenario.id + ' — ' + scenario.status;
    section.append(heading);
    const title = document.createElement('input');
    title.value = scenario.title;
    title.maxLength = 200;
    title.setAttribute('aria-label', scenario.id + ' title');
    section.append(title);
    const steps = document.createElement('textarea');
    steps.value = scenario.steps.join('\n');
    steps.setAttribute('aria-label', scenario.id + ' steps (one step per line)');
    section.append(steps);
    const expected = document.createElement('textarea');
    expected.value = scenario.expectedResult;
    expected.maxLength = 500;
    expected.setAttribute('aria-label', scenario.id + ' expected result');
    section.append(expected);
    const saveEdit = document.createElement('button');
    saveEdit.type = 'button';
    saveEdit.textContent = 'Save Changes and Revalidate';
    saveEdit.disabled = busy;
    saveEdit.onclick = () =>
      task('Saving scenario edit and revalidating quality and traceability…', async () => {
        await api(
          '/api/scenario-edit',
          JSON.stringify({
            id: session,
            scenarioId: scenario.id,
            title: title.value,
            steps: steps.value.split(/\r?\n/),
            expectedResult: expected.value,
          }),
        );
        await refreshAutomation();
        el('message').textContent = 'Scenario saved and revalidated.';
      });
    section.append(saveEdit);
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(scenario, null, 2);
    section.append(pre);
    const readiness = automation.traceability?.scenarioReadiness?.find(
      (r) => r.scenarioId === scenario.id,
    );
    if (readiness) {
      const findings = document.createElement('pre');
      findings.textContent = JSON.stringify(readiness, null, 2);
      section.append(findings);
    }
    const select = document.createElement('select');
    select.setAttribute('aria-label', scenario.id + ' scenario approval');
    for (const value of ['pending', 'needs-fix', 'approved', 'rejected']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      if (value === 'needs-fix') option.disabled = true;
      if (
        value === 'approved' &&
        automation.quality?.issues.some(
          (i) => i.scenarioId === scenario.id && i.severity === 'error',
        )
      )
        option.disabled = true;
      select.append(option);
    }
    select.value = scenario.status;
    select.onchange = () => {
      scenario.status = select.value;
      scenarioReviewDirty = true;
      buttons();
    };
    section.append(select);
    const scenarioErrors =
      automation.quality?.issues.filter(
        (i) => i.scenarioId === scenario.id && i.severity === 'error',
      ) || [];
    if (
      scenarioErrors.length &&
      !(automation.scenarioCorrectionAttempts || []).includes(scenario.id)
    ) {
      const correct = document.createElement('button');
      correct.type = 'button';
      correct.textContent = 'Try One Targeted AI Correction';
      correct.disabled = busy;
      correct.onclick = () =>
        task('Attempting one targeted correction for ' + scenario.id + '…', async () => {
          await api(
            '/api/scenario-correct',
            JSON.stringify({ id: session, scenarioId: scenario.id }),
          );
          await refreshAutomation();
          el('message').textContent =
            scenario.id +
            ' correction attempted. Review the updated scenario and quality findings.';
        });
      section.append(correct);
    }
    el('scenario-review').append(section);
  }
  el('code-review').replaceChildren();
  el('report-links').replaceChildren();
  for (const candidate of automation.candidates) {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = candidate.scenarioId + ' — ' + candidate.status;
    section.append(title);
    const scenario = document.createElement('pre');
    scenario.textContent = JSON.stringify(candidate.scenario, null, 2);
    section.append(scenario);
    const refs = document.createElement('pre');
    refs.textContent = JSON.stringify(
      {
        usedReferences: candidate.references,
        availableEvidence: candidate.evidenceInventory,
        readiness: candidate.readiness,
      },
      null,
      2,
    );
    section.append(refs);
    if (candidate.status === 'blocked') {
      const blocker = document.createElement('p');
      blocker.className = 'task-status error';
      blocker.textContent = candidate.reason;
      section.append(blocker);
    }
    const code = document.createElement('pre');
    code.textContent = candidate.diff || candidate.reason;
    section.append(code);
    if (candidate.status !== 'blocked')
      for (const status of ['approved', 'rejected']) {
        const button = document.createElement('button');
        button.className = 'code-decision';
        button.textContent =
          status === 'approved' ? 'Approve Generated Test' : 'Reject Generated Test';
        button.onclick = () =>
          task('Saving explicit code review…', async () => {
            await api(
              '/api/code-review',
              JSON.stringify({
                id: session,
                scenarioId: candidate.scenarioId,
                status,
                reviewer: el('reviewer').value,
              }),
            );
            await refreshAutomation();
            el('message').textContent = 'Code review saved. Execution remains a separate action.';
          });
        section.append(button);
      }
    if (candidate.status === 'approved') {
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'run-selection';
      check.value = candidate.scenarioId;
      label.append(
        check,
        document.createTextNode('Select ' + candidate.scenarioId + ' for execution'),
      );
      section.append(label);
    }
    if (candidate.execution)
      for (const href of candidate.execution.reportLinks) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = candidate.scenarioId + ' ' + href.split('/').slice(-2).join('/');
        link.target = '_blank';
        link.rel = 'noopener';
        el('report-links').append(link, document.createElement('br'));
      }
    el('code-review').append(section);
  }
  el('traceability').textContent = automation.traceability
    ? JSON.stringify(automation.traceability, null, 2)
    : '';
  buttons();
}
el('save-scenarios').onclick = () =>
  task(
    'Saving scenario approvals…',
    async () => {
      await api(
        '/api/scenario-review',
        JSON.stringify({
          id: session,
          scenarios: automation.scenarios.map(({ id, status }) => ({ id, status })),
        }),
      );
      await refreshAutomation();
      el('message').textContent = 'Scenario review saved. ' + el('generation-help').textContent;
    },
    'scenario-message',
  );
el('save-application').onclick = () =>
  task('Saving application and explicit page scope…', async () => {
    await api(
      '/api/application',
      JSON.stringify({
        id: session,
        config: {
          name: el('application-name').value,
          url: el('application-url').value,
          pomDirectory: el('pom-directory').value,
          storageState: el('storage-state').value,
          allowLocal: el('allow-local').checked,
          approvedPages: el('approved-pages')
            .value.split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    );
    await refreshAutomation();
    el('message').textContent = 'Configuration saved. Inspect the application next.';
  });
el('inspect-application').onclick = () =>
  task('Inspecting approved page and discovering POM signatures…', async () => {
    await api('/api/inspect', JSON.stringify({ id: session }));
    await refreshAutomation();
    el('message').textContent = 'Inspection saved; no controls were clicked.';
  });
el('generate-code').onclick = () =>
  task(
    'Generating bounded test candidates with local Ollama…',
    async () => {
      await api('/api/code-generate', JSON.stringify({ id: session }));
      await refreshAutomation();
      const generated = automation.candidates.filter((c) => c.status !== 'blocked').length;
      const blocked = automation.candidates.filter((c) => c.status === 'blocked').length;
      el('message').textContent =
        generated +
        ' test candidates generated; ' +
        blocked +
        ' blocked. Review the code or missing-evidence reasons below.';
    },
    'generation-message',
  );
el('run-approved').onclick = () =>
  task('Executing selected approved tests (up to five minutes)…', async () => {
    const ids = Array.from(document.querySelectorAll('.run-selection:checked')).map((n) => n.value);
    const result = await api('/api/run', JSON.stringify({ id: session, ids }));
    await refreshAutomation();
    el('message').textContent =
      'Run ' +
      result.runId +
      ' finished. Allure report ' +
      (result.allureGenerated ? 'generated.' : 'generation unavailable; see local allure.log.');
  });
