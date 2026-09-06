// Run with POLARIS_PGLITE_MODULE pointing to an installed @electric-sql/pglite.
// Existing Agora auth is a contract stub here; its password hashing/login is not tested.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.POLARIS_PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.agora_public_profiles(profile_number bigint generated always as identity primary key, username text unique, display_name text, is_admin boolean default false);
    create table public.agora_user_sessions(profile_number bigint references public.agora_public_profiles);
    create function public.require_agora_session(text) returns bigint language sql as 'select 1::bigint';
    create function public.register_agora_user(p_username text, p_kind text, p_password text)
    returns table(profile_number bigint, username text) language plpgsql as $$
    declare new_number bigint;
    begin
      if length(p_password) < 12 then raise exception 'Password too short'; end if;
      insert into public.agora_public_profiles(username, display_name) values(p_username, p_username) returning agora_public_profiles.profile_number into new_number;
      insert into public.agora_user_sessions values(new_number);
      return query select new_number, p_username;
    end $$;
  `)
  for (const file of ['20260905173000_ai_community.sql', '20260906120000_ai_agent_registration.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
  }
  const query = async (sql, params = []) => (await db.query(sql, params)).rows
  const make = async (username) => (await query('select * from public.create_ai_registration_challenge($1)', [username]))[0]
  const answer = (c) => ({ nonce: c.nonce, sorted: [...c.numbers].sort((a,b) => a-b), sum: c.numbers.reduce((a,b) => a+b, 0) })
  const register = (c, username, response = answer(c), password = 'testing-password-123') => query('select * from public.register_ai_user($1,$2::jsonb,$3,$4,$5,$6)', [c.challenge_id, JSON.stringify(response), username, 'Test agent', 'Test runtime', password])
  await db.exec('set role anon')
  await assert.rejects(make('bad name'), /Username/)
  const c = await make('test_agent')
  assert.deepEqual(await make('test_agent'), c, 'Outstanding challenge must stay stable')
  await assert.rejects(register(c, 'test_agent', null), /Test failed/)
  await assert.rejects(register(c, 'test_agent', {...answer(c), extra: true}), /Test failed/)
  await assert.rejects(register(c, 'test_agent', {...answer(c), sum: -1}), /Test failed/)
  await assert.rejects(register(c, 'other_agent'), /expired or missing/)
  await assert.rejects(register(c, 'test_agent', answer(c), 'short'), /Password too short/)
  const [account] = await register(c, 'test_agent')
  assert.equal(account.registration_status, 'pending_verification')
  await assert.rejects(register(c, 'test_agent'), /expired or missing/)
  await assert.rejects(query('select * from public.ai_registration_challenges'), /permission denied/)
  await assert.rejects(query("update public.ai_agents set is_active = true"), /permission denied/)
  await assert.rejects(query("select public.submit_ai_message('test_agent','test','body','title')"), /permission denied/)
  const feed = await query('select * from public.get_ai_messages()')
  assert.equal(feed.length, 1)
  assert.match(feed[0].title, /Welcome, agents/)
  const duplicate = await make('test_agent')
  await assert.rejects(register(duplicate, 'test_agent'), /already registered/)
  const expired = await make('expired_agent')
  await db.exec('reset role')
  await query("update public.ai_registration_challenges set expires_at = now() - interval '1 second' where id = $1", [expired.challenge_id])
  await db.exec('set role anon')
  await assert.rejects(register(expired, 'expired_agent'), /expired or missing/)
  await db.exec('reset role')
  const [agent] = await query("select * from public.ai_agents where id = 'test_agent'")
  assert.equal(agent.is_active, false)
  assert.equal(agent.profile_number, account.profile_number)
  assert.ok(agent.protocol_verified_at)
  assert.equal((await query('select * from public.agora_public_profiles')).length, 1)
  assert.equal((await query('select * from public.agora_user_sessions')).length, 0)
  await db.exec('set role service_role')
  await assert.rejects(query("select public.submit_ai_message('test_agent','test','body','title')"), /not active/)
  await query("update public.ai_agents set is_active = true where id = 'test_agent'")
  await query("select public.submit_ai_message('test_agent','Test runtime','Hello agents',null,'a1000000-0000-4000-8000-000000000001')")
  await db.exec('reset role')
  assert.equal((await query("select status from public.ai_messages where agent_id = 'test_agent'"))[0].status, 'pending')
  console.log('PASS: registration, invalid answers, rollback, expiry, replay, duplicate accounts, profile link, permissions, activation, moderation, welcome seed')
} finally { await db.close() }
