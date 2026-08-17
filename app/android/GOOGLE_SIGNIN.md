# Google Sign-In (Android) — project **confidence-up**

## Root cause of `DEVELOPER_ERROR` (code 10)

Two things must match the **same** Firebase project (`confidence-up`, project number `408638792904`):

| Item | Must be |
|------|---------|
| `app/android/app/google-services.json` | Downloaded from **confidence-up** for `com.confidenceup` |
| `oauth_client` in that file | **Not empty** (needs Google Auth enabled — see below) |
| `GOOGLE_WEB_CLIENT_ID` in `app/.env` | Web client ID starting with **`408638792904-`** |
| `GOOGLE_CLIENT_ID` on API (hPanel) | **Same** Web client ID as above |

**Common mistakes:**
- SHA-1 added but **Firebase Authentication → Google** never enabled → `oauth_client: []` in `google-services.json`
- `GOOGLE_WEB_CLIENT_ID` from an old project (`215492223605-...` or `1030539950924-...`) while `google-services.json` is from `confidence-up`

---

## One-time Firebase setup

1. Open [Firebase Console](https://console.firebase.google.com/) → project **confidence-up**

2. **Authentication → Get started** (if you see “Get started”, auth was never enabled)

3. **Authentication → Sign-in method → Google → Enable → Save**  
   This creates OAuth clients and populates `oauth_client` in `google-services.json`.

4. **Project settings → Your apps → Android `com.confidenceup`**

   Add debug SHA-1:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```

5. **Download `google-services.json`** and replace:
   `app/android/app/google-services.json`

   Verify it contains entries like:
   ```json
   "oauth_client": [
     { "client_type": 1, "android_info": { "package_name": "com.confidenceup", ... } },
     { "client_type": 3, "client_id": "408638792904-....apps.googleusercontent.com" }
   ]
   ```
   `client_type: 3` is the **Web** client ID.

6. Copy the **Web client ID** (`client_type: 3`) to:
   - `app/.env` → `GOOGLE_WEB_CLIENT_ID=408638792904-....apps.googleusercontent.com`
   - Hostinger hPanel → `GOOGLE_CLIENT_ID` (same value)

   Release builds also auto-read this from `google-services.json` at compile time.

7. Rebuild:
   ```bash
   cd app/android
   ./gradlew clean assembleRelease
   ```

8. **Uninstall** any old APK signed as `com.app` before installing the new one.

---

## Verify

```bash
cd app/android
./gradlew :app:generateGoogleSignInConfig
```

If `oauth_client` is still empty, repeat step 3 and re-download `google-services.json`.

---

## Release keystore

Release builds currently use the **debug keystore** (see `app/build.gradle`), so the SHA-1 above is enough. When you switch to a production keystore, add its SHA-1 in Firebase and re-download `google-services.json`.

---

## Gradle

- Root `android/build.gradle` — `com.google.gms:google-services`
- App `android/app/build.gradle` — `apply plugin: "com.google.gms.google-services"`
