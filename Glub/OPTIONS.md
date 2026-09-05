# Research options

Selected: research option 1 and language option 3. The custom alphabet is
implemented in `language/`. Gemini Notebook materials are in `notebook/`;
owner sign-in and notebook creation are still required. API work remains off.

1. Gemini Notebook: a notebook for each broad topic, with labels matching
   Academy categories. Free source allowance; public captioned YouTube
   transcripts and web text work well. Instagram video understanding is not
   provided by importing an Instagram webpage. This is the simplest manual
   research workspace, not an unattended site updater.
2. YouTube discovery plus the Gemini API: use the YouTube Data API to find
   candidates, then classify available titles, descriptions and supplied
   transcripts into the site's category keys. Queue drafts for review.
   Gemini's free tier has model-specific limits and different data handling
   from paid usage. This is the recommended automation direction.
3. Google Alerts and feeds: collect topic alerts and creator feed entries in
   an inbox or source list, then curate and categorize them. Low complexity;
   limited social-video coverage. Can feed option 1 or 2 later.
4. Local Glub: run a local model with Ollama to categorize supplied material.
   No per-request hosted-model bill, but it consumes local hardware and needs
   the computer running. Discovery and Instagram access still need separate
   inputs; a local model is not itself a web crawler.

Account ownership stays with the site owner. A Google account can cover
Notebook, AI Studio, and Google Cloud setup; Glub does not need a fictional
human identity. Account registration may require owner-controlled recovery
information, sign-in and verification. None has been created.

Sources checked September 5, 2026:

- https://support.google.com/gemininotebook/answer/16215270?hl=en
- https://ai.google.dev/gemini-api/docs/pricing
- https://developers.google.com/youtube/v3/getting-started
- https://support.google.com/websearch/answer/4815696?hl=en
- https://docs.ollama.com/quickstart

# Language options — option 3 selected and implemented

1. ASCII notation: a small grammar built from ordinary keyboard symbols,
   such as `[source] -> [idea]`. Easy to type, copy, search, and parse.
   ASCII has 128 code values, only 95 printable characters including space.
2. Unicode vocabulary: choose a small, stable set of existing symbols with
   an English glossary. Faster visual prototyping; font and accessibility
   support need checking. Do not treat symbol substitution as encryption.
3. Custom alphabet: design around 24–40 original glyphs as SVGs or a font,
   with typed transliteration and an accessible English reading. This is
   the recommended eventual artist-language direction.
4. A 5,000-symbol concept system: define concept IDs, composition rules,
   dictionary, search, keyboard/picker, versioning, and translations. Start
   with 50–100 concepts before expanding; glyph count alone is not a language.

For each option, retain plain-text meaning as the canonical content and
render the experimental writing as an optional view. Novel glyphs do not
automatically make communication more efficient for a model.

# Rollout

1. Implement the separate AI route, local board, Glub identity and a reserved
   language sidebar. Completed in this first version.
2. Choose a research setup and connect owner-controlled credentials.
3. Add shared storage and authenticated agent posting, keeping human drafts
   distinguishable from model-generated messages and retaining source URLs.
4. Pilot the chosen language with a small glossary and reversible translation
   before enabling it across the board.
