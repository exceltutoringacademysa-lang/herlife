# HerLife

**Grow in grace. Live with purpose. Build your future.**

HerLife is a personal, Christian faith-centred life companion. The application uses a restrained purple design system, accessible light and dark themes, and mobile-first layouts. It has **no AI features**.

**Developed by Andzani Mashabana**

## Implemented application foundation

- Supabase email/password sign-in, registration and email password recovery
- **Administrator-approved membership** enforced in database policies, not merely hidden in the interface
- Private home dashboard with current priorities and saved personal records
- Month-by-month planner with date selection and day-specific tasks
- Private journal, prayer notes, quiet-time logging and saved quiet-time preference
- Daily habit check-ins with persistent completion dates
- Goals and manually recorded income and expenses in South African rand
- Monetary calculations using integer cents, JSON data export, responsive purple light/dark design
- PostgreSQL Row Level Security (RLS) protecting every personal record

## One-person private access

HerLife is designed for a single invited owner, not general registration. The public **Create Account** option and the **Awaiting approval** screen are removed from the interface.

**Important:** Hiding registration on the frontend does not disable the Supabase signup API. Before the private handover, open the project's **Authentication → Sign In / Providers → Email** settings and switch off **Allow new users to sign up** (the wording may differ). Keep email/password sign-in and email confirmation enabled. This change must be saved in Supabase's dashboard; the repository cannot enforce it.

The backend intentionally retains the `public.app_members` allowlist in its RLS policies: it is an internal account-binding safeguard, **not a user approval or request process**. The one-time owner assignment should be done by the administrator as part of account setup, not by the recipient. Do not remove those RLS predicates or expose their administration to the browser.

### Initial owner handover

1. Run all three SQL migration files in `supabase/migrations` in order if setting up a new database. They are already applied in the initial hosted HerLife project; do not rerun them.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through Vercel environment variables, never as committed secrets.
3. Invite or create the **intended owner's** account using **Supabase Authentication → Users → Add user / Send invitation**. Only an owner-controlled email address should be used; the recipient sets her own password. Confirm the email before allowing access. If email delivery is limited, configure a trusted SMTP provider rather than turning off confirmation.
4. In the Supabase SQL Editor, an administrator can bind the verified owner's existing Supabase account to HerLife's internal allowlist. Substitute the email privately in the SQL Editor — never commit it:

   ```sql
   insert into public.app_members (user_id)
   select id from auth.users
   where lower(email) = lower('<intended owner's verified email>')
     and email_confirmed_at is not null
   on conflict (user_id) do nothing;
   ```

5. Once the intended owner's account can sign in successfully and her data is verified, **revoke any test account's access** from `public.app_members` using the administrator's SQL Editor. Do not delete real user content inadvertently; separately review test accounts in **Authentication → Users**. Keep only the intended owner in the allowlist.
6. Test unauthorized accounts (including direct API requests) to confirm that all personal tables deny access. Test journal and calendar persistence, sign-out and password recovery. A successful frontend build alone is not a security audit.

The recipient will only encounter the **Sign in** form and her own dashboard: there is no approval queue, registration, or visible account provisioning workflow.

## Privacy and release checklist

This repository is public. Do not commit account email addresses, the recipient's full name, photos, journal content, passwords, API secrets or financial data. Personalisation should remain restricted to private authenticated areas. The developer attribution must remain exactly **Developed by Andzani Mashabana**.

Test row ownership and the private owner allowlist with **at least two accounts**, including attempted direct API reads/updates of another account's records. Confirm password recovery and email confirmation URLs, carefully configure backups, and complete production security/accessibility reviews. A passing frontend build does not prove production security.

## Explicit limitations

- Quiet-time settings are preferences, **not** phone alarms, push notifications or guaranteed reminders.
- Scripture reading references are provided, but no Bible translation quotations or licensed Bible API are integrated yet.
- The planner is a functional month view with manually saved dated tasks; recurring tasks, full calendar synchronisation and reminders are not available.
- Daily habit completions are saved; streak reporting and advanced routine scheduling are not built.
- Transaction totals are manual net cash flows, not bank balances or a complete category-based budget.
- Wardrobe, grocery planner, personal development courses, Bible browsing and native alarm support remain future implementation phases.
- Production security tests and certain external integrations have not been completed. Supabase/Vercel hosted access must be verified before private handover.

## Testing and development

GitHub Actions runs the TypeScript/Vite build and Vitest regression suite on pull requests and changes. The initial tests cover amount validation, monetary precision and date grid calculations. These do not replace end-to-end testing with a configured Supabase database.

Next phases: database integration and privacy checks; recurring planners and journaling tools; licensed Bible integration; grocery and wardrobe management; savings, financial learning and future-planning modules; native-device notifications only after evaluating platform guarantees.

HerLife must always remain purple-led, private by default, gentle in tone, and free of AI-generated features and AI-styled visual gimmicks.

## Hosting

The Vite application is connected to GitHub and deployed to a Vercel HTTPS address with browser-safe Supabase credentials. Supabase Authentication's Site URL and Redirect URLs must match the actual HTTPS domain. Keep the private account access restrictions described above in place.

## Installable website (PWA foundation)

The Vite site now includes a HerLife web manifest, purple app icons, a scoped service worker for public static assets, and Vercel SPA routing configuration. After deployment over HTTPS, compatible browsers may offer **Install app** or **Add to Home Screen**. It is an installable **website**, not a native Android/iOS application.

**Privacy:** the service worker does not cache Supabase responses, personal entries, tokens, journal text or authenticated pages. Private data and account actions require internet connectivity. Device-level background alarms and push notifications have not been implemented.

After Vercel is connected and the changes are approved/merged, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel project environment variables, deploy, then configure the actual HTTPS site URL and allowed redirect URLs in Supabase Auth. Test account access with a verified, explicitly approved user. Never expose secret credentials or real personal data through GitHub commits.

## Private first-sign-in memory film

This feature uses a private Supabase Storage bucket named `herlife-memories` and a `preferences.welcome_film_seen_at` timestamp. The **20261016000000_private_memories.sql** migration creates the required database configuration; it has been applied to the original HerLife Supabase project. Do not make the storage bucket public.

**Private media provisioning — administrator only:** The owner photos, videos and song must never be checked into this public GitHub repository or stored in `public/` or the Vercel build. Only place the assets in Supabase Dashboard → Storage → `herlife-memories` inside the folder named **exactly the verified intended owner's Supabase Auth UUID** (viewable in Authentication → Users). Media access policies use this UUID. A developer/test user's folder does not grant access to the intended owner.

Uploaded filenames are played in ascending lexical order. Use `001-memory.jpg`, `002-memory.jpg`, etc., with video files interleaved in sequence (e.g. `013-memory-video.mp4`, `024-memory-video.mp4`). Name the soundtrack `soundtrack.mp3`. Download the user-supplied assets from the private conversation file package, extract locally and upload the actual files, **not the ZIP archive**. Supported photos: JPG/PNG/WebP; videos: MP4/WebM; soundtrack: MP3/M4A; maximum asset size 50 MB. The browser obtains short-lived signed URLs only after authenticated owner access.

Once a photo has been uploaded and the user signs in, the cinematic film begins with **Begin your journey** (a user gesture required for browser audio playback). Skipping or closing the film does not permanently mark it watched; **Enter HerLife** marks the film seen in the user's private preferences. She can replay it later from the home dashboard's **My journey & memories** tile. Where media have not yet been uploaded, no film auto-opens.

The slideshow captions are an initial original draft; the photo sequence and video placement should be reviewed with the person preparing the gift. This browser experience does not guarantee background audio autoplay, offline playback, native home-screen widgets or notifications. The song must be used with the rights-holder's permission and according to any licence that applies to publishing it online, even in a private app.
