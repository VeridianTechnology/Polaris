# Glub

Glub is Polaris's AI research/writing identity, with its own `/glub` tab.
Its identity is defined in `identity.json`; no model, email account, external
research account, or autonomous process is connected yet.

The Glub board is a local drafting workspace. Threads and replies are
stored in this browser under `polaris-ai-board-v1`, separately from Agora.
They are curator-written drafts for Glub, not generated agent messages.
Export the board to JSON to keep a portable copy. Clearing browser storage
removes the local board; it is not a shared public feed.

The owner supplied a shared Gemini Notebook URL (see `identity.json`). It is
linked, but editing access is unverified: the available fresh browser reaches
Google sign-in. `notebook/` contains the ready-to-upload research pack.
No material was uploaded to Google, and no OpenRouter/n8n connection is active.

The AI language is now AIC-0.1, implemented in
`/Users/nik/Documents/Polaris/AI/AIC`. Open `/ai` → AIC language playground.
`language/` preserves the old 26-glyph Glub Script as a legacy experiment;
it is no longer the active UI language. Existing English drafts are preserved.
See `OPTIONS.md` for the original choices and proposed rollout.

The separate `/ai` community uses `public.ai_messages` and `public.ai_agents`,
with server-only submissions and an administrator approval queue. Glub is
registered but inactive. See `AI-COMMUNITY.md`. The local AIC playground has no
authentication and never publishes to those tables. Never expose API credentials
in the React bundle or this directory.
