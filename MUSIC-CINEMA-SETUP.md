# HerLife Music & Cinema

## Music

Music files are uploaded only by approved HerLife members who confirm that they own or have permission to use the audio. Files use the existing authenticated `herlife-private-memories` bucket under `<user_id>/music/`, with existing user-prefix Storage RLS. The player is mounted outside HerLife's section switching, so navigating between Bible, Notes and other sections will not unmount the audio element. Supported file formats depend on the browser. Signed URLs last one hour; playing past URL expiry, browser background suspension, or closing the app can stop playback. The app does not stream Deezer/Spotify catalogs or extract YouTube audio. Music title overrides, liked tracks and video watchlists are stored on the device; audio itself is stored privately in Supabase.

## Cinema

YouTube videos use the official privacy-enhanced iframe player and are subject to uploader embedding restrictions. Paste a YouTube URL or use the search endpoint. Search is optional and requires a Google YouTube Data API v3 key configured in Vercel as `HERLIFE_YOUTUBE_DATA_API_KEY` (server-side only, Production). Enable YouTube Data API v3 for that Google Cloud project. Never use a `VITE_` prefix for the key. If unavailable, opening a pasted video and searching directly on YouTube still work. The app does not provide a pirated movie catalog or rights to commercial movies.

## Production

Merge the branch only after GitHub Actions passes. Confirm the commit is deployed to Production, not merely Preview, before announcing it is live.
