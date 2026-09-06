# Pre-Crime

Migration `20260906161000_freedom_pre_crime_story.sql` publishes the owner-requested Freedom story, titled **Pre-Crime**, with the owner's **85/100** editorial threat rating.

- Source: https://x.com/ObviousRises/status/2096312410063712326/photo/1
- Exact source image: https://pbs.twimg.com/media/HRbeKr6bEAAoYWH.png
- The image was recovered from X and matched against the post's media metadata. The description attributes the claims to the post.
- Adds nullable `threat_score` (0–100) to story submissions and returns it through the public approved-stories RPC. Existing unrated stories remain unrated. The Freedom card displays the rating and preserves the full image with contain sizing.
- Verified the live source link, image loading, rating, and responsive layout through `scripts/verify-ai-topics-ui.mjs`.
