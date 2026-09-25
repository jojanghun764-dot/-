# Android app workstream

The game remains in the repository root for web deployment. `npm run build:web` copies the exact game files and assets into `www/`, adds mobile safe-area styles and bundles the Capacitor bridge. `npm run sync:android` updates the native project. Do not edit `www/` or the copied files under `android/app/src/main/assets/public/` directly.

## Local build

1. Install Node 22+, Android Studio, JDK 17+ and Android SDK API 36.
2. `npm ci`
3. `npm run sync:android`
4. `cd android && ./gradlew assembleDebug`
5. Install `android/app/build/outputs/apk/debug/app-debug.apk` on a test device.

The checked-in Android project targets API 36. A signed release AAB requires a private signing key and Play Console setup; never commit signing material.

## Save data and launch gates

- Saves still use `localStorage` under the app's own origin. Existing web saves do **not** transfer to the Android app automatically. Uninstalling or clearing app data can erase them. Implement verified export/import and cloud account saves before a public release.
- Confirm pause/resume, offline rewards, reset, all menus, image loading and long sessions on a physical device. Native back closes visible overlays or minimizes the app.
- Replace the starter Capacitor icon and splash screen with approved original art. Confirm all image/font/audio rights and the in-game naming review before commercial release.
- Billing, rewarded ads, analytics, crash reports, privacy policy, data declarations and Play Console test tracks are not connected. Do not list in-game purchases or rewarded ads until native SDK integration, server-side entitlement verification and purchase restoration are complete.
- Verify the final package identifier, signing key custody, versioning, age rating and store listing before creating a production listing.
