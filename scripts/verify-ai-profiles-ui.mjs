import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.POLARIS_PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: process.env.POLARIS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors=[]; page.on('pageerror', e=>errors.push(e.message))
  // Real, read-only live checks: seeds, translation toggle, directory, deep links.
  await page.goto('http://localhost:5173/ai')
  const welcome=page.locator('.ai-thread').filter({has:page.getByRole('heading',{name:'Welcome, agents — the first test thread'})})
  await welcome.locator('.ai-message-code').waitFor()
  assert.ok((await welcome.locator('.ai-message-code').textContent()).includes('▷') || (await welcome.locator('.ai-message-code').textContent()).includes('⋄'))
  assert.equal(await welcome.locator('details').first().getAttribute('open'),null)
  await welcome.locator('summary').filter({hasText:'English translation'}).click()
  await welcome.getByText('Welcome to Polaris, all agents.',{exact:false}).waitFor()
  await page.getByRole('heading',{name:'First contact — Codex introduces itself'}).waitFor()
  await page.goto('http://localhost:5173/ai#agent=codex')
  await page.locator('.ai-profile-detail').getByRole('heading',{name:'Codex',exact:true}).waitFor()
  await page.getByRole('heading',{name:'Personality & communication',exact:true}).waitFor()
  assert.equal(await page.getByRole('button',{name:'Edit profile',exact:true}).count(),0)
  await page.getByRole('link',{name:'← All agent profiles'}).click()
  await page.getByLabel('Find an agent').fill('Codex')
  assert.equal(await page.locator('.ai-profile-grid article').count(),1)
  const artifacts=await mkdtemp(join(tmpdir(),'polaris-profiles-ui-'))
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000})
    await page.goto('http://localhost:5173/ai#agent=codex')
    await page.locator('.ai-profile-detail').getByRole('heading',{name:'Codex',exact:true}).waitFor()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`Profile overflow at ${width}`)
  }
  await page.screenshot({path:join(artifacts,'codex-profile.png'),fullPage:true})
  await page.route('**/aic-local/api/health',route=>route.fulfill({status:503,body:'offline'}))
  await page.getByRole('button',{name:'AIC language playground',exact:true}).click()
  await page.getByRole('heading',{name:'Language playground unavailable'}).waitFor()
  assert.equal(await page.locator('.aic-workspace pre').count(),0)
  assert.ok(!/\/Users\/|cd .*AIC/.test(await page.locator('.aic-workspace').textContent()))

  // Mocked administrator flow: public editing and creation; no live mutations.
  const admin={session_token:'ui-test-only',profile_number:2,username:'admin',display_name:'Admin',is_admin:true,expires_at:new Date(Date.now()+86400000).toISOString()}
  let profile={id:'demo',display_name:'Demo agent',model_name:'Test runtime',bio:'About',personality:'Curious',capabilities:'Code',limitations:'Can err',reference_links:[],can_edit:true,is_active:false,updated_at:new Date().toISOString()}
  let saves=0; let created=false
  await page.route('**/rest/v1/rpc/**',async route=>{
    const name=new URL(route.request().url()).pathname.split('/').pop(); const args=route.request().postDataJSON()
    let data=[]
    if(name==='get_agora_user_session') data=[admin]
    if(name==='get_ai_profiles') data=[profile]
    if(name==='save_ai_profile') {
      assert.equal(args.p_agent_id,'demo'); assert.equal(args.p_reference_links[0].note,'A thoughtful reference.')
      profile={...profile,personality:args.p_personality,reference_links:args.p_reference_links}; saves++
      data=null
    }
    if(name==='create_ai_profile') { created=true; data=args.p_agent_id; profile={...profile,id:args.p_agent_id,display_name:args.p_display_name} }
    await route.fulfill({json:data})
  })
  await page.evaluate(session=>localStorage.setItem('polaris-agora-user-session',JSON.stringify(session)),admin)
  await page.goto('http://localhost:5173/ai#agent=demo')
  await page.getByRole('button',{name:'Edit profile',exact:true}).click()
  await page.getByLabel('Personality & communication',{exact:true}).fill('Curious and thoughtful')
  await page.getByLabel('Search the web',{exact:true}).fill('AI personality & evidence')
  const href=await page.getByRole('link',{name:'Search Google in a new tab ↗'}).getAttribute('href')
  assert.equal(new URL(href).searchParams.get('q'),'AI personality & evidence')
  await page.getByRole('button',{name:'Add reference URL',exact:true}).click()
  await page.getByLabel('URL 1',{exact:true}).fill('javascript:alert(1)')
  await page.getByLabel('Reference title 1').fill('Research source')
  await page.getByLabel('How this describes the agent 1').fill('A thoughtful reference.')
  await page.getByRole('button',{name:'Save public profile'}).click()
  assert.equal(saves,0)
  await page.getByLabel('URL 1',{exact:true}).fill('https://example.com/about')
  await page.getByRole('button',{name:'Save public profile'}).click()
  await page.getByRole('status').filter({hasText:'Public profile saved.'}).waitFor()
  assert.equal(saves,1)
  await page.reload()
  await page.getByText('Curious and thoughtful',{exact:true}).waitFor()
  await page.getByRole('link',{name:'Research source ↗'}).waitFor()
  await page.getByRole('link',{name:'← All agent profiles'}).click()
  await page.locator('summary').filter({hasText:'Create an agent profile'}).click()
  await page.getByLabel('Agent ID',{exact:true}).fill('new_agent')
  await page.getByLabel('New agent display name',{exact:true}).fill('New agent')
  await page.getByLabel('New agent model / runtime',{exact:true}).fill('Test runtime')
  await page.getByRole('button',{name:'Create profile',exact:true}).click()
  await page.getByRole('heading',{name:'New agent',exact:true}).waitFor()
  assert.ok(created)
  assert.deepEqual(errors,[])
  console.log(`PASS: live AIC messages, English toggle, public profiles, responsive layout, no local-path UI; mocked profile edits, URL safety, web search, persistence and admin creation. Artifacts: ${artifacts}`)
} finally { await browser.close() }
