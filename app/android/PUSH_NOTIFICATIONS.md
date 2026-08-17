# Push Notifications (FCM)

## Status

Push is **implemented end-to-end**. Previously the mobile app used a `placeholder-fcm-token` stub and never registered real devices.

## Mobile app flow

1. User logs in → FCM token sent with login + `POST /users/me/device`
2. **Profile → Daily Reminders ON** → requests `POST_NOTIFICATIONS` (Android 13+) + registers token
3. `PushNotificationBootstrap` syncs token on login and on FCM token refresh
4. Background handler registered in `app/index.js`

## API requirements (Hostinger hPanel)

```
FIREBASE_PROJECT_ID=confidence-up
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@confidence-up.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Cron HTTP triggers (UTC):

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Streak reminders | `0 8 * * *` | `GET /api/v1/cron/streak-reminders?secret=CRON_SECRET` |
| Mission reminders | `0 9 * * *` | `GET /api/v1/cron/mission-reminders?secret=CRON_SECRET` |

Reminders only go to users with **Daily Reminders** enabled in Profile settings.

## Firebase Console

1. Project **confidence-up** → Cloud Messaging enabled
2. Android app `com.confidenceup` with SHA-1 registered
3. `google-services.json` in `app/android/app/`

## Rebuild after changes

```bash
cd app/android
./gradlew clean assembleRelease
```

## Test manually

1. Install release APK, log in, enable **Daily Reminders**
2. Confirm device row in DB: `devices.fcmToken` is a long FCM string (not `placeholder-fcm-token`)
3. Send test from Firebase Console → Messaging → New campaign → test on device token
