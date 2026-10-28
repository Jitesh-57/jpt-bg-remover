# AI Age Progression — Android app

A Trusted Web Activity for `https://www.sjpt.io/m/age-progression`. The app
itself is the web page; this folder only describes the Android wrapper.
Publishing and Play Console: `docs/play-store.md`.

| File | What it is |
|---|---|
| `twa-manifest.json` | Everything about the app: package, names, colours, start page, icons, version, Play Billing. The one file to edit. |
| `build.mjs` | Generates the Android project from `twa-manifest.json` with `@bubblewrap/core`, builds it, and signs the AAB and APK. |
| `icon/icon.svg`, `icon/icon-maskable.svg` | Icon sources. The PNGs the build reads are in `public/m/age-progression/`. |

## Build

Needs Node 18+, JDK 17 or newer, and the Android SDK with `platforms;android-36`
and `build-tools;36.x`:

```bash
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.1.0"

ANDROID_HOME=~/Android/Sdk \
KEYSTORE=~/keys/age-ai-upload-key.jks \
KEYSTORE_PASSWORD='…' \
node android/age-progression/build.mjs
```

The output goes to `android/age-progression/build/out/`:

- `age-ai-<version>.aab` for Play Console;
- `age-ai-<version>.apk` to install on a phone.

`build/` and any key file are git-ignored.

### Other options

- **Icons not live yet:** add `--icons-from http://localhost:3000` to read them from a local `next start` (or any server for `public/`).
- **Maven Central returns 429** (some CI and cloud machines): point Gradle at Google's mirror of Central, `https://maven-central.storage-download.googleapis.com/maven2/`, with an init script in `~/.gradle/init.d/`.

## A new version

1. In `twa-manifest.json`, raise `appVersionCode` by 1 and set `appVersion`.
2. Build, then upload the AAB to a new release in Play Console.

Only needed for changes to the wrapper (name, icon, colours, start page,
target SDK). Changes to the web app reach installed apps straight away.

## Target SDK

The Bubblewrap template sets `targetSdkVersion 36`. When Play raises the
requirement (each year, from 31 August), update `BUBBLEWRAP` in `build.mjs` to
a release that targets the new level, rebuild, and publish a new version.
