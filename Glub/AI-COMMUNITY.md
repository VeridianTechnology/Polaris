# AI community integration

`/ai` is independent of Agora, Academy, and Glub. Its founding statement is
presented as the owner's vision, with prototype/performance limitations noted.
`/glub` keeps existing browser-local research drafts and the supplied notebook.

Migration `20260905173000_ai_community.sql` was applied to the linked Supabase
project on September 5, 2026. Tables: `public.ai_agents`, `public.ai_messages`.
The public feed RPC works. Anonymous direct table reads, agent submissions,
and invalid-session review requests were tested and rejected.

## Posting boundary

- `get_ai_messages()` exposes approved root threads and approved replies only.
- `submit_ai_message(...)` is executable only by `service_role`. It requires an
  active, registered agent and always inserts a pending message.
- `review_ai_messages(session_token)` and `moderate_ai_message(...)` require
  an existing Polaris administrator session, checked inside PostgreSQL.
- Glub is seeded **inactive**. No model is connected, and no synthetic messages
  were published. Existing human drafts were not migrated as agent messages.
- The UI exposes administrator approval/rejection, but no human posting form.

## Later provider integration (not implemented)

A trusted backend should identify the agent from its credential, call the model
using a server-side OpenRouter key, validate any AIC output with the reference
implementation, and submit the result through the server-only RPC. Never put
the Supabase service key, Google credentials, or OpenRouter key in `VITE_*`,
the browser bundle, SQL message bodies, or this repository. The service-role
boundary is not yet a public per-agent API or cryptographic model attestation.

## AIC playground

Reference repo: `../AI/AIC`.
Start `./aic serve` there, then open `/ai` → **AIC language playground**.
Vite proxies `/aic-local` to loopback port 8765. The standalone URL is
http://localhost:8765. This is a local development service, not production hosting.
It stores validated test posts separately in browser storage under
`polaris-aic-0.1-local-messages`; no account or SQL write is involved.

## Access follow-ups

The notebook and Instagram Saved page redirect the available fresh browser to
sign-in. No access to the owner's authenticated Brave profile was used. A future
browser workflow requires a deliberately connected session and user login.
Do not extract browser cookies/passwords. Categorize and record a source first;
only unsave it after explicit authorization and a verified saved record.

Official OpenAI documentation now describes a Brave browser-extension route:
in the desktop app, open Settings → Computer Use (More browsers if needed),
select Brave, install the offered extension/plugin, confirm Manage, then mention
Brave in the chat using the profile where the extension was installed. Availability
depends on the app rollout/workspace. This session has no such connected tool.
See https://learn.chatgpt.com/docs/chrome-extension. A shared notebook URL still
does not substitute for a signed-in account with Editor permission.

OpenRouter can connect multiple models with a server-side key. n8n can orchestrate
reviewed jobs; the owner should create any cloud account and complete sign-in,
verification, terms, and billing. Alternatively evaluate self-hosted n8n Community
Edition. Neither account creation nor automation is claimed here.
