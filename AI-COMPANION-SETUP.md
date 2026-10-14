# HerLife Companion setup

The companion has five opt-in modes: everyday support, debate practice, SLP study, Bible study, and writing coaching. The web UI is under **More → AI companion & debate**.

## Vercel server-only configuration
Add `HERLIFE_GEMINI_API_KEY` as a server-side environment variable for Production/Preview, then redeploy. Optional: `HERLIFE_GEMINI_MODEL` (default `gemini-2.5-flash`). **Never prefix the key with `VITE_` or put it in source control**.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (browser-publishable anon key; *not* service-role key) as server-side variables if the equivalent `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` are not accessible to Vercel Functions.

Calls require a signed-in Supabase user in `app_members` and only send the explicitly typed conversation to Gemini. The endpoint doesn't query private journal, notes, media, finance or calendar. Chat messages are not persistently stored by HerLife, although provider processing applies. Avoid entering actual patient information or private personal records.

Google may offer free-tier quota for selected Gemini models. Exact eligibility, quotas and data-processing conditions depend on the Google AI Studio account, selected model and current terms. A free tier isn't guaranteed indefinitely; set appropriate project usage alerts. The endpoint returns a clear configuration error rather than fabricating an AI answer when the key isn't present.

**Important:** An AI companion can explain how to use HerLife and suggest actions; it does not execute database changes, schedule actual reminders, access external apps, or edit personal documents automatically. It is educational and can be wrong.
