import { test, expect } from '../../fixtures/test';
import { OllamaProvider, suggest } from '../../ai/providers';

test('[AI-03] optional live local Ollama suggestion evaluation', { tag: '@local-ai' }, async () => {
  test.skip(
    process.env.RUN_LOCAL_AI !== '1' || !process.env.OLLAMA_MODEL,
    'Opt in with RUN_LOCAL_AI=1 and an installed OLLAMA_MODEL; no model is downloaded automatically',
  );
  test.setTimeout(150_000);
  const result = await suggest(
    new OllamaProvider(process.env.OLLAMA_MODEL ?? '', process.env.OLLAMA_URL),
    [{ id: 'AUTH-01', description: 'standard_user can sign in to the public demo inventory.' }],
  );
  expect(result.scenarios.length).toBeGreaterThan(0);
  await test.info().attach('live-local-suggestions', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
});
