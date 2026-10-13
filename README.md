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

## Required setup (in order)

1. Install Node.js 20 or later. Run `npm install`.
2. Create a Supabase project. In the Supabase SQL editor, run **all three** migration files in this order:
   - `supabase/migrations/20261013000000_initial.sql`
   - `supabase/migrations/20261014000000_habit_checkins.sql`
   - `supabase/migrations/20261015000000_private_access.sql`
3. Copy `.env.example` to `.env.local` and populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the Supabase project URL and **public** anonymous/publishable key. Never use a service-role or secret key in client environment variables.
4. In Supabase Auth, configure permitted site/redirect URLs (including the exact application origin for reset links), email confirmation, an appropriate minimum password length and rate limits. Configure invite-only registration or disable open sign-up for final private delivery.
5. Run `npm run dev`. Sign up or invite the intended user using Supabase Auth; confirm their email. Initial accounts are **not** automatically approved to access personal records.
6. As the project administrator in the Supabase SQL editor, approve only the intended account **after verifying the email**. Replace the placeholder below locally. Do not commit the email, personal identifiers, or resulting SQL into the public repository:

   ```sql
   insert into public.app_members (user_id)
   select id from auth.users
   where email = '<verified private account email>'
     and email_confirmed_at is not null
   on conflict (user_id) do nothing;
   ```

7. Sign out and back in, then verify the private dashboard is accessible only to the approved user. An unapproved user must see **Private access awaiting approval** and must not be able to query the private records even with direct API requests.
8. Check `npm run build` and `npm test`; publish the built `dist/` site over HTTPS only after verifying security and setting up backups.

For the single-user private launch, consider using an administrator-created Auth invitation rather than allowing public sign-up. Hiding the registration button alone is **not** an effective access-control mechanism; only backend Auth controls and SQL membership policies prevent unauthorised access.

## Privacy and release checklist

This repository is public. Do not commit account email addresses, the recipient's full name, photos, journal content, passwords, API secrets or financial data. Personalisation should remain restricted to private authenticated areas. The developer attribution must remain exactly **Developed by Andzani Mashabana**.

Test row ownership and administrator approval with **at least two accounts**, including attempted direct API reads/updates of another account's records. Confirm password recovery and email confirmation URLs, carefully configure backups, and complete production security/accessibility reviews. A passing frontend build does not prove production security.

## Explicit limitations

- Quiet-time settings are preferences, **not** phone alarms, push notifications or guaranteed reminders.
- Scripture reading references are provided, but no Bible translation quotations or licensed Bible API are integrated yet.
- The planner is a functional month view with manually saved dated tasks; recurring tasks, full calendar synchronisation and reminders are not available.
- Daily habit completions are saved; streak reporting and advanced routine scheduling are not built.
- Transaction totals are manual net cash flows, not bank balances or a complete category-based budget.
- Wardrobe, grocery planner, personal development courses, Bible browsing and native alarm support remain future implementation phases.
- Supabase configuration, live deployment, production security tests and external integrations are not provisioned by this repository.

## Testing and development

GitHub Actions runs the TypeScript/Vite build and Vitest regression suite on pull requests and changes. The initial tests cover amount validation, monetary precision and date grid calculations. These do not replace end-to-end testing with a configured Supabase database.

Next phases: database integration and privacy checks; recurring planners and journaling tools; licensed Bible integration; grocery and wardrobe management; savings, financial learning and future-planning modules; native-device notifications only after evaluating platform guarantees.

HerLife must always remain purple-led, private by default, gentle in tone, and free of AI-generated features and AI-styled visual gimmicks.

## Connecting the deployed website

After the application branch is reviewed and merged into `main`:

1. Import the HerLife GitHub repository into a Vite-compatible static web host such as Vercel.
2. In the host's **Environment Variables** settings, add `VITE_SUPABASE_URL` (the project URL) and `VITE_SUPABASE_PUBLISHABLE_KEY` (the browser-safe `sb_publishable_...` key). Choose the correct deployment environment and redeploy.
3. Do **not** set `VITE_SUPABASE_SECRET_KEY`, `service_role` or the database password anywhere in the frontend. `VITE_` values are bundled into public browser JavaScript.
4. In Supabase **Authentication → URL Configuration**, set the host's HTTPS URL as the Site URL and add its permitted HTTPS redirect URL (and localhost origin for local tests).
5. Sign in using a verified account. Until the administrator adds the account ID to `public.app_members`, the user will see an **Awaiting approval** screen. The admin must approve the verified account through the Supabase SQL editor, as described above.
6. Verify signup/confirmation, password recovery, private RLS reads/writes, and sign-out on the deployed URL.

No environment keys should be pasted into GitHub source files, issues, pull-request comments, screenshots or ChatGPT messages. Set them only in your hosting platform's environment-variable interface.
