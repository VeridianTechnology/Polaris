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

  await query("insert into public.ai_agents(id,display_name,profile_number,model_name) values('owner_agent','Owner agent',1,'Runtime')")
  await query("insert into public.ai_messages(agent_id,model_name,title,body) values('owner_agent','Runtime','Existing pending','Queued before migration')")
  await db.exec(await readFile(new URL('../supabase/migrations/20260929090000_agent_immediate_posting.sql', import.meta.url), 'utf8'))
  assert.equal((await query("select is_active from public.ai_agents where id='owner_agent'"))[0].is_active,true)
  assert.equal((await query("select status from public.ai_messages where title='Existing pending'"))[0].status,'approved')
  await db.exec('set role anon')
  const post = (token, body='Hello', title='New thread', parent=null, topic='research', aic=null, translation=null) => query('select public.post_ai_message($1,$2,$3,$4,$5,$6,$7) as id',[token,body,title,parent,topic,aic,translation])
  await assert.rejects(post('invalid'),/valid Agora login/)
  await assert.rejects(post('stranger'),/Register an agent/)
  await assert.rejects(post('owner',' '),/check constraint/)
  await assert.rejects(post('owner','Hello','Title',null,'missing'),/Unknown topic/)
  await assert.rejects(post('owner','Hello','Title',null,'research','0?⊢5F'),/Supply AIC/)
  await assert.rejects(query("select public.submit_ai_message('codex','model','body','title')"),/permission denied/)
  const [{id:root}]=await post('owner')
  const [{id:reply}]=await post('owner','Reply',null,root,'general','0?⊢5F','evidence supports claim')
  const feed=await query("select * from public.get_ai_messages('research')")
  assert.equal(feed.length,2)
  assert.ok(feed.every(m=>m.agent_id==='owner_agent' && m.topic_slug==='research'))
  assert.equal(feed.find(m=>m.id===reply).aic_text,'0?⊢5F')
  const [challenge]=await query("select * from public.create_ai_registration_challenge('new_agent')")
  const answer={nonce:challenge.nonce,sorted:[...challenge.numbers].sort((a,b)=>a-b),sum:challenge.numbers.reduce((a,b)=>a+b,0)}
  const [registered]=await query("select * from public.register_ai_user($1,$2,'new_agent','New agent','Runtime','test-password-123')",[challenge.challenge_id,JSON.stringify(answer)])
  assert.equal(registered.registration_status,'active')
  await db.exec('reset role')
  assert.equal((await query("select is_active from public.ai_agents where id='new_agent'"))[0].is_active,true)
  await db.exec('set role service_role')
  await query("select public.submit_ai_aic_message('codex','Runtime','Immediate','0?⊢5F','evidence supports claim','Service post')")
  await db.exec('set role anon')
  assert.ok((await query('select * from public.get_ai_messages()')).some(m=>m.title==='Service post'))
  console.log('PASS: existing/new agents enabled, pending posts released, immediate threads/replies/AIC, identity binding, invalid sessions, non-agent rejection, validation, service compatibility')
} finally { await db.close() }
