# SpeakUpMic — Google Play Store Publishing Guide

This guide provides the complete, step-by-step checklist to build and publish **SpeakUpMic** to the Google Play Store.

---

## 1. Quick Build Commands

Google Play Console requires an **Android App Bundle (`.aab`)**. You can build it using either:

### Windows (PowerShell / Command Prompt):
```powershell
cd app
npm run android:bundle
```
*Or directly via Gradle:*
```cmd
cd app\android
gradlew.bat bundleRelease
```

### Clean Rebuild (if needed):
```powershell
cd app
npm run android:bundle:clean
```

The generated `.aab` file will be located at:
`app/android/app/build/outputs/bundle/release/app-release.aab`

---

## 2. Important: Google Sign-In & Firebase Keystore Fingerprints

> [!CAUTION]
> If the Release SHA-1 is not added to Firebase, Google Sign-In will fail with **Error 10 / 12500** in production.

1. **Local Release Keystore**:
   - Keystore path: `app/android/app/speakupmic-release-key.keystore`
   - Alias: `speakupmic-key-alias`
2. **Google Play App Signing** (Recommended by Google):
   - When you upload your `.aab` to Play Console, Google manages the app signing key.
   - In **Play Console** &rarr; **Release** &rarr; **Setup** &rarr; **App Integrity** &rarr; **App Signing**:
     - Copy the **SHA-1 certificate fingerprint** and **SHA-256 certificate fingerprint**.
3. **Add to Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/) &rarr; Project **confidence-up** &rarr; **Project settings** &rarr; **Your apps** &rarr; `com.speakupmic`.
   - Click **Add fingerprint** and paste the SHA-1 and SHA-256 keys.
   - Download the updated `google-services.json` and replace `app/android/app/google-services.json`.

---

## 3. URLs for Google Play Console

| Field in Play Console | URL to Enter |
| :--- | :--- |
| **Privacy Policy** | `https://speakupmic.vercel.app/privacy` |
| **Terms of Service** | `https://speakupmic.vercel.app/terms` |
| **Account & Data Deletion** | `https://speakupmic.vercel.app/delete-account` |
| **Support / Contact** | `https://speakupmic.vercel.app/contact` |
| **Website** | `https://speakupmic.vercel.app` |

---

## 4. Google Play Console Data Safety Form

When filling out the **Data Safety Questionnaire** in Google Play Console, use the following answers:

### Data Types Collected:
1. **Audio files (Voice or sound recordings)**:
   - **Collected?** Yes
   - **Shared with 3rd parties?** No
   - **Processed ephemerally?** Yes (transcribed and analyzed for speech metrics / confidence scoring)
   - **Required or optional?** Required for speech coaching features
   - **Purposes:** *App functionality*, *Analytics*
2. **Personal Info (Name, Email address)**:
   - **Collected?** Yes (via Google Sign-In / Account registration)
   - **Shared?** No
   - **Purposes:** *App functionality*, *Account management*
3. **App Activity (Speech history, Streaks, Badges)**:
   - **Collected?** Yes
   - **Shared?** No
   - **Purposes:** *App functionality*, *Personalization*
4. **App info and performance (Crash logs / Diagnostics)**:
   - **Collected?** Yes (if Firebase Crashlytics or Analytics is used)
   - **Shared?** No
   - **Purposes:** *Analytics*

### Security Practices:
- **Data encrypted in transit?** Yes (All network traffic uses TLS/HTTPS with cleartext blocked)
- **Do you provide a way for users to request data deletion?** Yes:
  - In-app deletion: **Profile &rarr; Delete Account & Data**
  - Web deletion URL: `https://speakupmic.vercel.app/delete-account`

---

## 5. Store Listing Assets

### Text Metadata:
- **App Name (max 30 chars)**: `SpeakUpMic: Speech Confidence`
- **Short Description (max 80 chars)**: `Overcome speaking anxiety and build vocal confidence with AI speech coaching.`
- **Category**: Education / Personal Growth / Communication
- **Target Audience**: 13+ (Teens and Adults)

### Graphic Assets Required:
- **App Icon**: 512 × 512 px, 32-bit PNG with alpha (max 1024 KB)
- **Feature Graphic**: 1024 × 500 px, JPG or 24-bit PNG (no alpha, max 15 MB)
- **Phone Screenshots**: Min 4 screenshots (1080 × 1920 or 1080 × 2400) showcasing:
  1. Live speech practice & waveform
  2. Confidence score breakdown & speech metrics (WPM, pause cadence, filler words)
  3. Daily challenge progression & RPG-style missions
  4. Streak milestones & progress dashboard

---

## 6. Recommended Release Steps

1. **Build the `.aab`**: Run `npm run android:bundle` inside `app/`.
2. **Upload to Internal Testing**: Upload `app-release.aab` to Play Console under **Testing &rarr; Internal testing**.
3. **Test with Internal Testers**:
   - Verify Google Sign-In authentication.
   - Verify microphone permission prompt and speech recording flow.
   - Test offline fallback and network error states.
   - Test push notifications.
4. **Promote to Production**: Once verified in internal testing, create a production release for review.
