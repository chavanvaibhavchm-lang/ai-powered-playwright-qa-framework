import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  documentChunks,
  extractRequirements,
  sourceChunks,
  reviewRequirement,
  MAX_UPLOAD,
} from './prd';
import { OllamaProvider } from './providers';

const statement = 'Users must log in with valid credentials.';
const provider = (requirements: unknown[]) =>
  new OllamaProvider(
    'qwen2.5:1.5b',
    'http://127.0.0.1:11434',
    async () => new Response(JSON.stringify({ response: JSON.stringify({ requirements }) })),
  );
function pdf(text: string): Buffer {
  const stream = text ? 'BT /F1 12 Tf 72 720 Td (' + text + ') Tj ET' : '';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream',
  ];
  let content = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(content.length);
    content += index + 1 + ' 0 obj\n' + object + '\nendobj\n';
  });
  const xref = content.length;
  content +=
    'xref\n0 6\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' +
    xref +
    '\n%%EOF';
  return Buffer.from(content);
}
test('text and Markdown retain source references and long text is chunked', async () => {
  const chunks = await documentChunks(
    'requirements.md',
    Buffer.from('# Authentication\n' + statement),
  );
  assert.match(chunks[0]!.reference, /Authentication/);
  const long = await documentChunks('long.txt', Buffer.from(statement.repeat(200)));
  assert.ok(long.length > 1);
  assert.ok(long.every((chunk) => chunk.text.length <= 2400));
});
test('rejects oversized, empty, unsupported and invalid documents', async () => {
  await assert.rejects(documentChunks('large.txt', Buffer.alloc(MAX_UPLOAD + 1)), /10 MB/);
  await assert.rejects(documentChunks('empty.txt', Buffer.alloc(0)), /nonempty/);
  await assert.rejects(documentChunks('app.exe', Buffer.from(statement)), /Supported formats/);
  await assert.rejects(documentChunks('bad.pdf', Buffer.from(statement)), /Invalid PDF/);
  await assert.rejects(documentChunks('bad.docx', Buffer.from('x')), /Invalid DOCX/);
});
test('text PDF retains page references; image-only PDF is rejected', async () => {
  const chunks = await documentChunks('text.pdf', pdf(statement));
  assert.equal(chunks[0]!.reference, 'Page 1');
  assert.match(chunks[0]!.text, /Users must log in/);
  const rows = await extractRequirements(
    chunks,
    provider([{ description: statement, sourceId: chunks[0]!.id, ambiguityWarning: '' }]),
  );
  assert.equal(rows[0]!.sourceReference, 'Page 1');
  assert.equal(rows[0]!.evidence, chunks[0]!.text);
  await assert.rejects(documentChunks('scan.pdf', pdf('')), /Scanned PDF/);
});
test('server resolves exact evidence and discards paraphrased model evidence', async () => {
  const source = [{ text: '  ' + statement + '\n', reference: 'Page 1' }];
  const sourceId = sourceChunks(source)[0]!.id;
  const item = {
    description: statement,
    sourceId,
    ambiguityWarning: '',
    evidence: 'People sign in using correct passwords.',
  };
  const rows = await extractRequirements(source, provider([item, item]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.evidence, source[0]!.text);
  assert.equal(rows[0]!.sourceReference, 'Page 1');
  assert.equal(rows[0]!.sourceId, sourceId);
  assert.equal(rows[0]!.status, 'pending');
  assert.equal(rows[0]!.evidenceStatus, 'supported');
  await assert.rejects(
    extractRequirements(source, provider([{ description: statement }])),
    /Invalid requirement JSON/,
  );
});
test('stable IDs survive repeated extraction and identify source text changes', () => {
  const source = [{ text: statement, reference: 'Page 1' }];
  assert.deepEqual(sourceChunks(source), sourceChunks(source));
  assert.notEqual(
    sourceChunks(source)[0]!.id,
    sourceChunks([{ ...source[0]!, text: statement + ' Extra.' }])[0]!.id,
  );
});
test('valid source IDs do not prove paraphrases or unsupported details', async () => {
  const source = [{ text: statement, reference: 'Page 1' }];
  const sourceId = sourceChunks(source)[0]!.id;
  const descriptions = [
    'Users sign in using correct credentials.',
    'Users must log in with valid credentials and receive a refund.',
    'Users must not log in with valid credentials.',
  ];
  const rows = await extractRequirements(
    source,
    provider(descriptions.map((description) => ({ description, sourceId, ambiguityWarning: '' }))),
  );
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.equal(row.evidenceStatus, 'needs-review');
    assert.equal(row.status, 'pending');
    assert.match(row.evidenceWarning!, /every condition/);
    assert.equal(row.evidence, statement);
  }
  const edited = reviewRequirement(rows[0]!, statement, 'approved', source);
  assert.equal(edited.evidenceStatus, 'supported');
  assert.equal(edited.status, 'approved');
  const changed = reviewRequirement(edited, 'Users receive refunds.', 'pending', source);
  assert.equal(changed.evidenceStatus, 'needs-review');
});
test('invalid source references get one affected-row retry without losing other requirements', async () => {
  const source = [{ text: statement + ' Users must see the login page.', reference: 'Page 1' }];
  const sourceId = sourceChunks(source)[0]!.id;
  const requests: string[] = [];
  const mock = {
    extractRequirements: async (prompt: string) => {
      requests.push(prompt);
      return requests.length === 1
        ? JSON.stringify({
            requirements: [
              { description: statement, sourceId, ambiguityWarning: '' },
              {
                description: 'Users must see the login page.',
                sourceId: 'invented',
                ambiguityWarning: '',
              },
            ],
          })
        : JSON.stringify({ sourceId: 'still-invented' });
    },
  };
  const rows = await extractRequirements(source, mock);
  assert.equal(requests.length, 2);
  assert.match(requests[1]!, /Correct only/);
  assert.ok(!requests[1]!.includes('"requirements":'));
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.evidenceStatus, 'supported');
  assert.equal(rows[1]!.evidenceStatus, 'unresolved');
  assert.equal(rows[1]!.evidence, '');
  assert.throws(
    () => reviewRequirement(rows[1]!, rows[1]!.description, 'approved', source),
    /Cannot approve unresolved/,
  );
});
test('successful source correction preserves original description and verifies its support', async () => {
  const source = [{ text: statement, reference: 'Page 1' }];
  const sourceId = sourceChunks(source)[0]!.id;
  let calls = 0;
  const rows = await extractRequirements(source, {
    extractRequirements: async () =>
      ++calls === 1
        ? JSON.stringify({
            requirements: [
              { description: 'Users must pay online.', sourceId: 'wrong', ambiguityWarning: '' },
            ],
          })
        : JSON.stringify({ sourceId }),
  });
  assert.equal(calls, 2);
  assert.equal(rows[0]!.description, 'Users must pay online.');
  assert.equal(rows[0]!.evidence, statement);
  assert.equal(rows[0]!.evidenceStatus, 'needs-review');
});
test('failed correction is isolated and out-of-batch source references remain unresolved', async () => {
  const chunks = [
    { text: statement, reference: 'Page 1' },
    { text: 'Users must see products.', reference: 'Page 2' },
  ];
  const sources = sourceChunks(chunks);
  let calls = 0;
  const rows = await extractRequirements(chunks, {
    extractRequirements: async () => {
      calls++;
      if (calls === 1)
        return JSON.stringify({
          requirements: [
            { description: statement, sourceId: sources[1]!.id, ambiguityWarning: '' },
          ],
        });
      if (calls === 2) throw new Error('Ollama unavailable');
      return JSON.stringify({
        requirements: [
          { description: chunks[1]!.text, sourceId: sources[1]!.id, ambiguityWarning: '' },
        ],
      });
    },
  });
  assert.equal(calls, 3);
  assert.equal(rows[0]!.evidenceStatus, 'unresolved');
  assert.equal(rows[1]!.evidenceStatus, 'supported');
});

test('DOCX extracts local text and paragraph references', async () => {
  const chunks = await documentChunks(
    'requirements.docx',
    Buffer.from(
      'UEsDBAoAAAAAAImBSF10JJxTPgEAAD4BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbDxUeXBlcyB4bWxucz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3BhY2thZ2UvMjAwNi9jb250ZW50LXR5cGVzIj48RGVmYXVsdCBFeHRlbnNpb249InJlbHMiIENvbnRlbnRUeXBlPSJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtcGFja2FnZS5yZWxhdGlvbnNoaXBzK3htbCIvPjxPdmVycmlkZSBQYXJ0TmFtZT0iL3dvcmQvZG9jdW1lbnQueG1sIiBDb250ZW50VHlwZT0iYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQubWFpbit4bWwiLz48L1R5cGVzPlBLAwQKAAAAAACJgUhdAAAAAAAAAAAAAAAABgAAAF9yZWxzL1BLAwQKAAAAAACJgUhdYXsvQ/IAAADyAAAACwAAAF9yZWxzLy5yZWxzPFJlbGF0aW9uc2hpcHMgeG1sbnM9Imh0dHA6Ly9zY2hlbWFzLm9wZW54bWxmb3JtYXRzLm9yZy9wYWNrYWdlLzIwMDYvcmVsYXRpb25zaGlwcyI+PFJlbGF0aW9uc2hpcCBJZD0icklkMSIgVHlwZT0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL29mZmljZURvY3VtZW50LzIwMDYvcmVsYXRpb25zaGlwcy9vZmZpY2VEb2N1bWVudCIgVGFyZ2V0PSJ3b3JkL2RvY3VtZW50LnhtbCIvPjwvUmVsYXRpb25zaGlwcz5QSwMECgAAAAAAiYFIXQAAAAAAAAAAAAAAAAUAAAB3b3JkL1BLAwQKAAAAAACJgUhdqFubW7sAAAC7AAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sPHc6ZG9jdW1lbnQgeG1sbnM6dz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3dvcmRwcm9jZXNzaW5nbWwvMjAwNi9tYWluIj48dzpib2R5Pjx3OnA+PHc6cj48dzp0PlVzZXJzIG11c3QgbG9nIGluIHdpdGggdmFsaWQgY3JlZGVudGlhbHMuPC93OnQ+PC93OnI+PC93OnA+PC93OmJvZHk+PC93OmRvY3VtZW50PlBLAQIUAAoAAAAAAImBSF10JJxTPgEAAD4BAAATAAAAAAAAAAAAAAAAAAAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQACgAAAAAAiYFIXQAAAAAAAAAAAAAAAAYAAAAAAAAAAAAQAAAAbwEAAF9yZWxzL1BLAQIUAAoAAAAAAImBSF1hey9D8gAAAPIAAAALAAAAAAAAAAAAAAAAAJMBAABfcmVscy8ucmVsc1BLAQIUAAoAAAAAAImBSF0AAAAAAAAAAAAAAAAFAAAAAAAAAAAAEAAAAK4CAAB3b3JkL1BLAQIUAAoAAAAAAImBSF2oW5tbuwAAALsAAAARAAAAAAAAAAAAAAAAANECAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAABQAFACABAAC7AwAAAAA=',
      'base64',
    ),
  );
  assert.match(chunks[0]!.text, /Users must log in/);
  assert.match(chunks[0]!.reference, /Paragraph/);
  const rows = await extractRequirements(
    chunks,
    provider([{ description: statement, sourceId: chunks[0]!.id, ambiguityWarning: '' }]),
  );
  assert.match(rows[0]!.sourceReference, /Paragraph/);
  assert.equal(rows[0]!.evidence, chunks[0]!.text);
});

test('partial statements cannot discard negation or prerequisite context', async () => {
  for (const text of [
    'Users must not log in with valid credentials.',
    'Only administrators may log in with valid credentials.',
  ]) {
    const source = [{ text, reference: 'Page 1' }];
    const rows = await extractRequirements(
      source,
      provider([
        {
          description: 'log in with valid credentials.',
          sourceId: sourceChunks(source)[0]!.id,
          ambiguityWarning: '',
        },
      ]),
    );
    assert.equal(rows[0]!.evidenceStatus, 'needs-review');
  }
});

test('missing or wrongly typed source IDs receive a single correction rather than aborting the batch', async () => {
  for (const invalid of [undefined, null, 123, '']) {
    const source = [{ text: statement, reference: 'Page 1' }];
    let calls = 0;
    const rows = await extractRequirements(source, {
      extractRequirements: async () =>
        ++calls === 1
          ? JSON.stringify({
              requirements: [{ description: statement, sourceId: invalid, ambiguityWarning: '' }],
            })
          : JSON.stringify({ sourceId: 'UNRESOLVED' }),
    });
    assert.equal(calls, 2);
    assert.equal(rows[0]!.evidenceStatus, 'unresolved');
  }
});

test('scenario adapter retries incomplete JSON once with bounded output', async () => {
  let calls = 0;
  const budgets: number[] = [];
  const local = new OllamaProvider(
    'qwen2.5:1.5b',
    'http://127.0.0.1:11434',
    async (_url, options) => {
      const request = JSON.parse(String(options?.body));
      budgets.push(request.options.num_predict);
      calls++;
      assert.equal(request.format.properties.scenarios.maxItems, 3);
      return new Response(
        JSON.stringify({ response: calls === 1 ? '{' : JSON.stringify({ scenarios: [] }) }),
      );
    },
  );
  assert.deepEqual(JSON.parse(await local.generate([{ id: 'PRD-01', description: statement }])), {
    scenarios: [],
  });
  assert.equal(calls, 2);
  assert.deepEqual(budgets, [1600, 3200]);
});
test('repeated malformed scenario output fails clearly after exactly one retry', async () => {
  let calls = 0;
  const local = new OllamaProvider('qwen2.5:1.5b', 'http://127.0.0.1:11434', async () => {
    calls++;
    return new Response(JSON.stringify({ response: 'not JSON' }));
  });
  await assert.rejects(local.generate([{ id: 'PRD-01', description: statement }]), /JSON twice/);
  assert.equal(calls, 2);
});
