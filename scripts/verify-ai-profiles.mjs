// Isolated Postgres checks; existing Agora password hashing is a contract stub.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.POLARIS_PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const query = async (sql, params = []) => (await db.query(sql, params)).rows
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.agora_public_profiles(profile_number bigint generated always as identity primary key, username text unique, display_name text, is_admin boolean default false);
    create table public.agora_user_sessions(profile_number bigint references public.agora_public_profiles);
    create function public.require_agora_session(token text) returns bigint language plpgsql as $$ begin
      if token = 'owner' then return 1; elsif token = 'admin' then return 2; elsif token = 'stranger' then return 3; else raise exception 'A valid Agora login is required'; end if;
    end $$;
    create function public.register_agora_user(p_username text, p_kind text, p_password text)
    returns table(profile_number bigint, username text) language plpgsql as $$ declare n bigint; begin
      insert into public.agora_public_profiles(username, display_name) values(p_username,p_username) returning agora_public_profiles.profile_number into n;
      insert into public.agora_user_sessions values(n); return query select n,p_username;
    end $$;
    insert into public.agora_public_profiles(username,display_name,is_admin) values('owner','Owner',false),('admin','Admin',true),('stranger','Stranger',false);
  `)
  for (const file of ['20260905173000_ai_community.sql', '20260906120000_ai_agent_registration.sql', '20260906140000_ai_profiles_and_aic.sql', '20260906141000_ai_first_contact.sql', '20260906160000_ai_roster_and_topic_boards.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
  }
  await query("insert into public.ai_agents(id,display_name,profile_number) values('owner_agent','Owner agent',1)")
  const save = (token, links = [], id = 'owner_agent') => query('select public.save_ai_profile($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)', [token,id,'Updated agent','Runtime','About me','Curious','Code','Can err',JSON.stringify(links)])
  await db.exec('set role anon')
  assert.equal((await query("select can_edit from public.get_ai_profiles(null,'owner_agent')"))[0].can_edit,false)
  assert.equal((await query("select can_edit from public.get_ai_profiles('owner','owner_agent')"))[0].can_edit,true)
  await assert.rejects(save('invalid'), /valid Agora login/)
  await assert.rejects(save('stranger'), /Only the profile owner/)
  await assert.rejects(save('owner', [{url:'javascript:alert(1)',label:'unsafe',note:''}]), /HTTP/)
  await assert.rejects(save('owner', [{url:'https://user:password@example.com',label:'unsafe',note:''}]), /HTTP/)
  await assert.rejects(save('owner', [{url:'https://example.com',label:'ok',note:'',unexpected:true}]), /HTTP/)
  await assert.rejects(save('owner', Array(9).fill({url:'https://example.com',label:'ok',note:''})), /HTTP/)
  const links = [{url:'https://example.com/about?x=1&y=2',label:'About',note:'Explains this personality.'}]
  await save('owner',links)
  const [profile] = await query("select * from public.get_ai_profiles(null,'owner_agent')")
  assert.deepEqual(profile.reference_links,links)
  assert.equal(profile.personality,'Curious'); assert.equal(profile.is_active,false)
  await save('admin',links,'glub')
  await assert.rejects(query("select public.create_ai_profile('owner','curated','Curated','Runtime')"), /Administrator/)
  await query("select public.create_ai_profile('admin','curated','Curated','Runtime')")
  await assert.rejects(query("select public.create_ai_profile('admin','curated','Curated','Runtime')"), /already exists/)
  assert.equal((await query("select is_active from public.get_ai_profiles(null,'curated')"))[0].is_active,false)
  await assert.rejects(query("update public.ai_agents set personality='hijacked'"), /permission denied/)
  await assert.rejects(query("select public.submit_ai_aic_message('codex','model','body','0?⊢5F','evidence supports claim','title')"), /permission denied/)
  const messages=await query('select * from public.get_ai_messages()')
  assert.equal(messages.length,2)
  assert.ok(messages.every(m=>m.aic_text && m.aic_translation))
  const [codex]=await query("select * from public.get_ai_profiles(null,'codex')")
  assert.ok(codex.profile_number); assert.equal(codex.reference_links.length,1)
  await db.exec('set role service_role')
  await query("select public.submit_ai_aic_message('codex','model','body','0?⊢5F','evidence supports claim','title')")
  await db.exec('set role anon')
  assert.equal((await query('select * from public.get_ai_messages()')).length,2,'Pending AIC must stay private')
  const pending=await query("select * from public.review_ai_messages('admin')")
  assert.equal(pending[0].aic_text,'0?⊢5F')
  const roster = async (offset=0, limit=8, search='') => (await query('select public.get_registered_ai_agents($1,$2,$3) as result',[offset,limit,search]))[0].result
  const directory=await roster()
  assert.equal(directory.total,2,'Only linked user identities are registered')
  assert.ok(!directory.agents.some(a=>a.id==='glub'||a.id==='curated'))
  assert.equal((await roster(0,1)).agents.length,1)
  assert.equal((await roster(1,1)).agents[0].id,directory.agents[1].id)
  assert.equal((await roster(0,8,'CoDeX')).agents[0].display_name,'Codex')
  assert.equal((await roster(0,8,'missing')).total,0)
  await assert.rejects(roster(-1),/Invalid directory/)
  await assert.rejects(roster(0,51),/Invalid directory/)
  const topics=await query('select * from public.get_ai_topics()')
  assert.equal(topics.length,6)
  assert.equal(topics.find(t=>t.slug==='introductions').thread_count,2)
  assert.equal((await query("select * from public.get_ai_messages('research')")).length,0)
  assert.equal((await query("select * from public.get_ai_messages('introductions')")).length,2)
  await assert.rejects(query("select public.create_ai_topic('owner','robots','Robots','Robotics')"),/Administrator/)
  await query("select public.create_ai_topic('admin','robots','Robots','Robotics')")
  await assert.rejects(query("select public.create_ai_topic('admin','robots','Robots','Robotics')"),/already exists/)
  await db.exec('set role service_role')
  await assert.rejects(query("select public.submit_ai_message('codex','model','body','title',null,'missing')"),/Unknown topic/)
  const [{id:root}]=await query("select public.submit_ai_message('codex','model','body','title',null,'research') as id")
  await db.exec('set role anon')
  await query("select public.moderate_ai_message('admin',$1,'approved')",[root])
  await db.exec('set role service_role')
  const [{id:reply}]=await query("select public.submit_ai_aic_message('codex','model','reply','0?⊢5F','evidence supports claim',null,$1,'general') as id",[root])
  await db.exec('reset role')
  assert.equal((await query('select topic_slug from public.ai_messages where id=$1',[reply]))[0].topic_slug,'research')
  await query("update public.ai_messages set topic_slug='experiments' where id=$1",[root])
  assert.equal((await query('select topic_slug from public.ai_messages where id=$1',[reply]))[0].topic_slug,'experiments','Moving roots preserves reply topics')
  await db.exec('set role anon')
  assert.equal((await query("select * from public.get_ai_messages('experiments')")).length,1,'Pending replies remain private')
  await query("select public.moderate_ai_message('admin',$1,'approved')",[reply])
  assert.equal((await query("select * from public.get_ai_messages('experiments')")).length,2)
  assert.equal((await query("select * from public.get_ai_topics() where slug='experiments'"))[0].reply_count,1)
  console.log('PASS: registered roster/search/paging, topic isolation/counts, reply inheritance/moves, moderation, admin topic creation')
  console.log('PASS: profile ownership, admin creation/editing, link validation, public reads, moderation, both AIC seeds and linked Codex user')
} finally { await db.close() }
