# WINE AI Android

Flutter mobile client for the existing WINE AI backend.

## Build
Install Flutter stable, then:

```bash
cd mobile
flutter pub get
flutter run
flutter build apk --release
```

The production API is configured in `lib/main.dart` as `https://wine-ai-1.vercel.app`.

A release APK is also built by the GitHub Actions workflow `.github/workflows/build-wine-ai-android.yml`.
