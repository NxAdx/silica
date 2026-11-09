# AGENTS.md - Silica
> **Antigravity Agent Memory & Engineering Directive**  
> *Project*: Silica (`NxAdx/silica`)  
> *Lead Developer*: Aadarsh Lokhande (`NxAdx`)  
> *Package Identifier*: `app.silica`  
> *Current Version*: **v1.0.0** (Android Version Code: `1`)  
> *Target Distribution*: Google Play Store (`app.silica`) & Direct GitHub Releases  
> *Core Stack*: React Native 0.74+ | Expo SDK 51 | Expo Router v3.5 | SQLite | FlashList | Biometrics

---

## 0. Ground-Truth Visual Specification (STRICT ANTI-SLOP RULE)
The exact, pixel-perfect design system for this app has been supplied by the lead developer and is permanently saved in:
* **`docs/ui design (1).jpg`** (Screen 1: Home View with Dual Hero Cards, Recent/Trips Carousels, and Liquid Glass Floating Nav Capsule)
* **`docs/ui design (2).jpg`** (Screen 2: Collection Detail View with Hero Vignette, `Clean âœ¨` pill, and 3-Column Squircle Photo Grid)

> [!IMPORTANT]
> **ANY AI AGENT WORKING ON THIS CODEBASE MUST MATCH THESE TWO IMAGES EXACTLY.**
> Never invent generic cards, arbitrary gradients, or standard Android Material 2/3 cards. The UI must look and feel like an elite, award-winning Apple WWDC fluid interface.

---

## 1. Zero AI Slop & Brutalist Purity Directives
Every line of UI and UX in Silica MUST adhere to these non-negotiables:

1. **Hardware Continuous Squircles**:
   - Never use simple round borders. Every card, button, modal, and badge MUST specify `borderCurve: 'continuous'`.
   - Hero Cards: `borderRadius: 24`, `borderCurve: 'continuous'`.
   - Grid Images: `borderRadius: 16`, `borderCurve: 'continuous'`.
   - Floating Nav Capsule: `height: 54`, `borderRadius: 27`, `borderCurve: 'continuous'`.
   - Action Pills (`Clean âœ¨`, `Select`): `borderRadius: 18`, `borderCurve: 'continuous'`.
2. **Tabular Numerals Everywhere**:
   - All counters, file sizes, percentages, and dates (`526 â€¢ 2.6GB`, `146 >`, `1.256`, `16%`, `25 Oct 2025`) MUST include `fontVariant: ['tabular-nums']` to stop layout shifting during scrolling.
3. **Dual Themes from Frame 0**:
   - **Light Mode**: Pristine optical canvas `#FFFFFF`, cards `#F6F6F8`, charcoal ink `#111113`, translucent white glass `rgba(255,255,255,0.78)`.
   - **Dark Mode**: True pitch OLED black `#000000`, elevated cards `#141416`, crisp white ink `#FFFFFF`, translucent dark glass `rgba(25,25,28,0.82)`.
4. **Instant Fluid Haptics & Springs**:
   - Touch response on pointer-down with subtle spring scaling (`pressed && { transform: [{ scale: 0.98 }] }`).
   - Use `expo-haptics` selection feedback on tabs, pills, and photo clicks.
5. **100% Offline Purity**:
   - Zero network dependencies, zero telemetry, no `INTERNET` permission in manifest. All database queries use local synchronous SQLite (`silica.db`).

---

## 2. Research & Reverse-Engineering Knowledge Base
You have full access to reference codebases and APKs in `D:\Production\`:
1. **Google Photos Decompiled Reference (`D:\Production\rea\apks\Photos.apk`)**:
   - MediaStore querying projections, date-bucketing algorithms, and local thumbnail generation.
2. **`D:\Production\research\ImageToolbox`**:
   - Production EXIF inspection, metadata stripping, offline duplicate detection, and lossless image compression algorithms.
3. **`D:\Production\research\muzei`**:
   - Native Android `WallpaperManager` implementation for 1-tap Home/Lock screen wallpaper.
4. **`D:\Production\research\react-native-reusables`**:
   - Tailored React Native primitives and component patterns.
5. **Sister Project: Saral Lekhan Plus (`D:\Production\saral-lekhan-plus`)**:
   - Gold standard for offline SQLite synchronization, biometric security (`LockScreen.tsx`), and the 7-minute GitHub Actions cloud builder.

---

## 3. Active 13 Skills in `.agents/skills/`
Every agent working in this repository MUST apply these installed skills:
1. **`hallmark`**: High-craft design skill and linter that prevents AI slop (`/hallmark`, `sloplint.mjs`, 50 curated materials).
2. **`impeccable`**: Design vocabulary and 62 deterministic rules catching AI UI anti-patterns (`/impeccable`, `polish`, `bolder`, `critique`, `audit`, `harden`).
3. **`apple-design`**: WWDC fluid physics, interruptible springs, 1:1 gesture tracking, and optical typography.
4. **`appllama-app-design-skill`**: Continuous squircle curvature, tabular numerals, dual-mode frame 0 design.
5. **`react-native-best-practices`**: Callstack performance optimizations, memory leak prevention, FlashList zero-lag image grids.
6. **`expo-router`**: Idiomatic file-based routing and deep linking.
7. **`expo-animation`** & **`animate-expo`**: Native 60fps UI-thread micro-interactions via Reanimated worklets.
8. **`expo-module`**: Writing native Kotlin modules for WallpaperManager and secure biometrics.
9. **`greenlight`**: Pre-submission compliance check for Google Play Store.
10. **`mobile-native`**: Low-level Android native capabilities.
11. **`reverse-engineer-anything`**: For analyzing `Photos.apk` patterns.
12. **`android-updater-patterns`**: In-app self-updating for GitHub releases.

---

## 4. Security & Git Offline Invariants
> [!CAUTION]
> The following directories are strictly offline and must **NEVER** be tracked or pushed to Git:
> * `docs/` (PRD, task lists, specifications, `ui design (1).jpg`, `ui design (2).jpg`)
> * `context/` (modular agent context memory)
> * `.agents/` (rules and skills)
> * Keystores (`*.keystore`, `*.jks`, `keystore_base64.txt`)
> * `google-services.json`

