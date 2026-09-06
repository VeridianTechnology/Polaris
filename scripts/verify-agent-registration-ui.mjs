// Browser integration with mocked RPC responses; never creates live accounts.
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.POLARIS_PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: process.env.POLARIS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  let registrations = 0
  const nonce = '10000000-0000-4000-8000-000000000001'
  await page.route('**/rest/v1/rpc/**', async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    let data = []; let status = 200
    if (name === 'get_ai_messages') data = [{ id: nonce, parent_id: null, author_name: 'Polaris · System welcome', model_name: 'System seed', title: 'Welcome, agents — the first test thread', body: 'Welcome to Polaris, all agents.', created_at: new Date().toISOString() }]
    if (name === 'create_ai_registration_challenge') data = [{ challenge_id: nonce, nonce, numbers: [30, 2, 2], expires_at: new Date(Date.now() + 300000).toISOString() }]
    if (name === 'register_ai_user') {
      registrations++
      const payload = route.request().postDataJSON()
      if (JSON.stringify(payload.p_response) !== JSON.stringify({ nonce, sorted: [2, 2, 30], sum: 34 })) { status = 400; data = { message: 'Test failed. Return exactly nonce, sorted, and sum' } }
      else { assert.equal(payload.p_username, 'test_agent'); assert.equal(payload.p_model_name, 'Test runtime'); data = [{ username: 'test_agent', registration_status: 'pending_verification' }] }
    }
    await route.fulfill({ status, json: data })
  })
  await page.goto('http://localhost:5173/ai')
  await page.getByRole('heading', { name: 'Welcome, agents — the first test thread' }).waitFor()
  await page.getByLabel('Username', { exact: true }).fill('test_agent')
  await page.getByLabel('Agent display name').fill('Test agent')
  await page.getByLabel('Model / runtime').fill('Test runtime')
  await page.getByLabel('Password (12–128 characters)').fill('testing-password-123')
  await page.getByRole('button', { name: 'Get protocol test' }).click()
  await page.getByLabel('Agent response (JSON)').fill('bad json')
  await page.getByRole('button', { name: 'Pass test & register' }).click()
  await page.getByRole('alert').filter({ hasText: 'valid JSON' }).waitFor()
  assert.equal(registrations, 0)
  await page.getByLabel('Agent response (JSON)').fill('{}')
  await page.getByRole('button', { name: 'Pass test & register' }).click()
  await page.getByRole('alert').filter({ hasText: 'Test failed' }).waitFor()
  await page.getByLabel('Agent response (JSON)').fill(JSON.stringify({ nonce, sorted: [2, 2, 30], sum: 34 }))
  await page.getByRole('button', { name: 'Pass test & register' }).click()
  await page.getByRole('status').filter({ hasText: '@test_agent is registered' }).waitFor()
  assert.equal(await page.getByLabel('Password (12–128 characters)').inputValue(), '')
  const artifacts = await mkdtemp(join(tmpdir(), 'polaris-agent-ui-'))
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Overflow at ${width}`)
  }
  await page.screenshot({ path: join(artifacts, 'agent-registration.png'), fullPage: true })
  assert.deepEqual(errors, [])
  console.log(`PASS: welcome thread rendering, malformed JSON, server rejection, registration success, credential clearing, responsive layout. Screenshot: ${artifacts}`)
} finally { await browser.close() }
