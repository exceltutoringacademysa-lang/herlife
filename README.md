# HerLife

**Grow in grace. Live with purpose. Build your future.**

HerLife is a private, faith-centred life companion, with a carefully restrained purple design system, light and dark modes, accessible layouts, and no AI-powered features.

**Developed by Andzani Mashabana**

## Implemented foundation

- Supabase email/password registration and sign-in
- Personal dashboard with today's task progress
- Private journal, prayer entries, task planner, habits and goals
- Quiet-time session tracking and saved preferred start time
- Manual income/expense tracking in South African rand (ZAR)
- JSON data export and a responsive, purple-based interface
- PostgreSQL storage with authenticated-user Row Level Security (RLS)

## Running locally

1. Install Node.js 20+ and run `npm install`.
2. Create a Supabase project and execute `supabase/migrations/20261013000000_initial.sql` in its SQL editor.
3. Copy `.env.example` to `.env.local` and populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the URL and **public** anonymous/publishable key. Do not expose any service-role or secret key.
4. Configure the permitted Auth redirect URLs, email confirmation and registration controls in Supabase.
5. Run `npm run dev`. Verify production output with `npm run build` and serve `dist/` over HTTPS.

The project requires your Supabase configuration. No secret keys or external service accounts are included.

## Security before launch

This GitHub repository is public. Do not commit private recipient information, journal entries, photos, access tokens or credentials. Public screens and metadata do not reveal the recipient's full name. Private areas use only a first-name greeting. Developer credit must remain exactly **Developed by Andzani Mashabana**.

The SQL migration enables user-owner RLS policies. **Supabase registration is open unless you restrict it.** Before distributing the app, configure an invitation-only registration process or restrict new sign-ups, audit permissions with multiple test accounts, and implement proper backup and deletion procedures. This is a development foundation, not a completed security audit.

## Current limitations

- The quiet-time time setting is only a preference; a functioning alarm/push notification scheduler is not implemented.
- Scripture references are a reading guide, not copyrighted Bible verse text; a licensed Bible provider has not been configured.
- Habits are manually checkable items, without daily resets or streak history.
- Recorded transaction totals are not bank balances, nor a complete budget.
- Wardrobe, grocery planning, calendar sync, recurring tasks, educational libraries, relationship sharing and native notifications remain future phases.
- No live hosting or third-party integrations have been configured.

## Delivery plan

1. Validate sign-up, sign-in, CRUD persistence and cross-account database isolation.
2. Introduce recurring tasks, date-specific habit tracking, expanded calendar and journal workflows.
3. Add licensed Bible integration and platform-appropriate notifications with explicit permissions.
4. Build wardrobe, groceries, budgets, savings and learning modules incrementally.
5. Complete accessibility, production security, backups, regression testing and release validation.

HerLife must remain personal, faith-centred, private by default, and purple-led in every subsequent feature and design change.
