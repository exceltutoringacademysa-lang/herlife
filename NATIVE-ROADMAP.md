# HerLife native mobile release foundation

The web feature release includes an owner-protected calendar event table (including start timestamp and reminder offset), projected shopping bag, and calculator. It is **not** an Android APK or iOS app and cannot schedule guaranteed native alarms or display true operating-system home-screen widgets. Do not advertise these as working on devices yet.

## Native implementation plan (Android, iPhone, iPad)

1. Wrap the existing Vite application using Capacitor with native Android and iOS projects; install and configure a notification plugin and its permissions. Validate auth redirect behavior and secure Supabase session persistence in both native shells.
2. On authenticated calendar synchronization, schedule local alerts for `starts_at - reminder_minutes` using the device-local timezone conversion. Cancel/reconcile alerts when events are changed, deleted, or the user signs out. Handle notification permissions and limits; never claim an audible alert is guaranteed under silent, Focus, battery, or operating-system restrictions.
3. Build an Android home-screen widget using Jetpack Glance/AppWidgetProvider and an iOS/iPadOS WidgetKit extension. Display only non-sensitive minimal summaries (such as next event or scripture reference). Avoid showing financial balance or private notes on the lock screen by default. Use native secure, read-only shared snapshots and app-deep-links; never embed service-role keys or plain Supabase tokens in widget storage.
4. Design a user-consent toggle for any widget displaying sensitive financial figures. Widget update cadences are managed by Android/iOS and are not exact or continuously live.
5. Implement phone/iPad integration tests for scheduling, notification permission denied, DST transitions, sign-out, widget refresh, airplane mode, and budget precision before shipping.
6. Build with Android Studio and Xcode, including platform signing and Apple Developer account requirements. These cannot be verified by GitHub's existing Vite web checks alone.

Shopping products are currently **manually entered links and prices**, not an authorised Temu/retailer product API or commerce checkout. Integration with real catalogues and checkout must use approved partner agreements and verify pricing, delivery and taxation. `shopping_items` does not deduct account transactions until a separate confirmed-expense workflow is intentionally implemented.

For now, users can **install the HerLife PWA** through supported browsers. This remains separate from actual native home-screen widgets.
