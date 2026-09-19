import assert from 'node:assert/strict'
import test from 'node:test'
import { extractMedications, extractionFailure, readMedicationImages } from './medication-extraction.ts'

const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
function request(files) {
  const form = new FormData()
  files.forEach(([bytes, type]) => form.append('images', new Blob([bytes], { type }), 'test-image'))
  return new Request('http://localhost/api/medications/extract', { method: 'POST', body: form })
}

test('upload reader accepts image headers and rejects invalid types, counts and sizes', async () => {
  assert.equal((await readMedicationImages(request([[png, 'image/png']])))[0].type, 'image/png')
  for (const files of [[], Array(4).fill([png, 'image/png']), [[png, 'image/jpeg']],
    [[new Uint8Array(0), 'image/png']], [[new Uint8Array(5 * 1024 * 1024 + 1), 'image/png']],
    [[png, 'image/heic']]]) {
    await assert.rejects(readMedicationImages(request(files)))
  }
})

test('provider request keeps photos out of text and requires structured transcription', async () => {
  let sent
  const fetcher = async (_url, options) => {
    sent = JSON.parse(options.body)
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"medications":[]}' } }] })
  }
  assert.deepEqual(await extractMedications([{ type: 'image/png', bytes: png }], 'fake-test-key', 'test-model', fetcher), [])
  assert.equal(sent.store, false)
  assert.equal(sent.response_format.json_schema.strict, true)
  assert.match(sent.messages[0].content, /untrusted data/)
  assert.match(sent.messages[1].content[0].text, /Photo 1/)
  assert.equal(sent.messages[1].content[1].type, 'image_url')
})

test('nonempty extraction with textual nulls reaches review without inventing missing dates', async () => {
  const medication = { name: 'Example medicine', strength: '5 mg tablet', amount: '1 tablet', quantity: 'null',
    action: 'take', start: 'null', end: 'null', startTime: 'null', frequency: 2, times: ['8:00 AM', '8:00 PM'],
    timing: 'twice daily', sourceText: 'Example medicine: 1 tablet twice daily', sources: [1], procedureSpecific: false, issues: [] }
  const result = await extractMedications([{ type: 'image/png', bytes: png }], 'fake-test-key', 'test-model', async () =>
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ medications: [medication] }) } }] }))
  assert.equal(result.length, 1)
  assert.equal(result[0].startTime, null)
  assert.equal(result[0].start, null)
  assert.equal(result[0].quantity, null)
  assert.equal(result[0].procedureSpecific, false)
  assert.deepEqual(result[0].times, ['08:00', '20:00'])
})

test('invalid extraction diagnostics expose field names only', async () => {
  await assert.rejects(extractMedications([{ type: 'image/png', bytes: png }], 'fake-test-key', 'test-model', async () =>
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ medications: [{ name: 'PRIVATE PATIENT TEXT' }] }) } }] })),
    error => {
      const diagnostic = extractionFailure(error).diagnostic
      assert.ok(diagnostic.invalidFields.includes('sources'))
      assert.ok(!JSON.stringify(diagnostic).includes('PRIVATE'))
      return true
    })
})

test('provider errors, refusals, truncation and malformed output fail closed', async () => {
  const results = [new Response('', { status: 429 }),
    Response.json({ choices: [{ finish_reason: 'length', message: { content: '{"medications":[]}' } }] }),
    Response.json({ choices: [{ finish_reason: 'stop', message: { refusal: 'No', content: '{}' } }] }),
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'not json' } }] }),
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"medications":[{}]}' } }] })]
  for (const result of results) {
    await assert.rejects(extractMedications([{ type: 'image/png', bytes: png }], 'fake-test-key', 'test-model', async () => result))
  }
})

test('distinguishes quota, credentials, rate limits, configuration and timeouts without exposing provider text', async () => {
  const cases = [
    [429, 'insufficient_quota', 'quota', 503],
    [429, 'rate_limit_exceeded', 'rate_limit', 429],
    [401, 'invalid_api_key', 'credentials', 503],
    [400, 'invalid_json_schema', 'configuration', 503],
    [500, 'private medication text', 'provider', 502],
  ]
  for (const [status, code, kind, clientStatus] of cases) {
    try {
      await extractMedications([{ type: 'image/png', bytes: png }], 'fake-test-key', 'test-model', async () =>
        Response.json({ error: { code, message: 'private medication text and API credentials' } }, { status }))
      assert.fail('Expected failure')
    } catch (error) {
      const failure = extractionFailure(error)
      assert.equal(failure.diagnostic.kind, kind)
      assert.equal(failure.status, clientStatus)
      assert.ok(!JSON.stringify(failure).includes('private medication text'))
    }
  }
  for (const [error, kind] of [[new DOMException('private content', 'TimeoutError'), 'timeout'], [new TypeError('private content'), 'network']]) {
    await assert.rejects(extractMedications([], 'fake-test-key', 'test-model', async () => { throw error }),
      err => extractionFailure(err).diagnostic.kind === kind)
  }
})
