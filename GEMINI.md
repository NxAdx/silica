# AGENTS.md - Silica
> **Antigravity Agent Memory & Engineering Directive**  
> *Project*: Silica (`NxAdx/silica`)  
> *Lead Developer*: Aadarsh Lokhande (`NxAdx`)  
> *Package Identifier*: `app.silica`  
> *Current Version*: **v1.0.0** (Android Version Code: `1`)  
> *Target Distribution*: Google Play Store (`app.silica`) & Direct GitHub Releases  
> *Core Stack*: React Native 0.74+ | Expo SDK 51 | Expo Router v3.5 | SQLite | FlashList | Biometrics

---

## 0. Global Production Ecosystem & Master Controller
This project is part of the **Aadarsh Lokhande (`NxAdx`) Production Ecosystem** managed centrally from `D:\Production\`:
* **Master Controller**: `D:\Production\` (Root orchestration hub)
* **Master Architecture & Playbooks**:
  * `D:\Production\USER_COMMAND_CENTER.md`: Developer operating manual & quick reference
  * `D:\Production\DEVELOPER_PLAYBOOK.md`: 9-section master architecture and deployment guide
  * `D:\Production\docs\SENIOR_VIBE_CODING_PLAYBOOK.md`: High-velocity engineering standards & AI pair-programming rules
  * `D:\Production\docs\REVERSE_ENGINEERING_PLAYBOOK.md`: Decompilation workflows & APK analysis
* **Sister Projects in Ecosystem**:
  * **`silica`** (`D:\Production\silica`): v1.0.0 | Pure offline minimalist gallery & biometric vault (Apple Liquid Glass design)
  * **`saral-lekhan-plus`** (`D:\Production\saral-lekhan-plus`): v2.19.32 | Offline powerhouse note-taking & rich text writing engine
  * **`monojot`** (`D:\Production\monojot`): v1.0.0 | Radical single-thought scratchpad with lock screen glance notification
  * **`De-Launcher`** (`D:\Production\De-Launcher`): v1.0.0 | Intentional minimal launcher with Kotlin native module
  * **`Product-ive`** (`D:\Production\Product-ive`): v1.3.3 | Android Home Widgets & productivity tracker
  * **`rea`** (`D:\Production\rea`): Reverse Engineer Anything engine & reference APK repository (`apks/Photos.apk`)

---

## 1. Product Philosophy & Non-Negotiables
Silica is an intentional, offline-first gallery app that provides the fluid speed of Apple Photos without Google Play Services or cloud tracking:
1. **100% Offline & Private**: Zero Google services, zero cloud backup, zero network permissions. Photos never leave the device.
2. **Apple Liquid Glass Design**:
   - Floating translucent navigation pill at bottom (`BlurView`, continuous squircles).
   - Top Dual Hero cards with storage/memory badges (`16%`, `24%`).
   - Recent and Trips horizontal carousels with tabular sizes (`526 • 2.6GB`, `tabular-nums`).
   - Collection detail with hero fade vignette, **`Clean ✨`** pill, and 3-column squircle grid (`borderCurve: 'continuous'`).
3. **Smart Tagging & Instant Search**: Every photo can have custom user tags for instant keyword filtering.
4. **Collections as Folders**: Collections map directly to albums/folders with seamless creation and management.
5. **Private Vault / Locker**: Hide sensitive photos behind a secure PIN or Biometric (Fingerprint / Face ID) gate.
6. **Wallpaper Integration**: 1-tap "Set as Wallpaper" (Home Screen, Lock Screen, or Both) via native Android `WallpaperManager`.
7. **Anti-Slop Invariants**:
   - Continuous corners: `borderCurve: 'continuous'` everywhere.
   - Tabular numerals: `fontVariant: ['tabular-nums']` on all counters and sizes.
   - Dual-mode frame 0: Light warm paper `#F6F6F8` and pure OLED pitch `#000000`.

---

## 2. Directory Layout
* `src/app/`: Expo Router screens:
  * `(tabs)/index.tsx`: Home View with Hero cards, Recent carousel, Trips carousel.
  * `(tabs)/collections.tsx`: Collections / Folders grid.
  * `(tabs)/vault.tsx`: Biometric Locker / Secret Vault.
  * `collection/[id].tsx`: Collection Detail with `Clean ✨` pill and 3-col squircle grid.
  * `viewer/[id].tsx`: Fullscreen photo viewer with pinch-to-zoom and Wallpaper action.
* `src/components/`: Reusable UI primitives (`GlassPillNav.tsx`, `HeroCard.tsx`, `ImageCard.tsx`).
* `src/services/`: `mediaService.ts`, `tagService.ts`, `wallpaperService.ts`, `vaultService.ts`.
* `src/store/`: Zustand + SQLite stores (`mediaStore.ts`, `vaultStore.ts`, `themeStore.ts`).
* `src/tokens.ts`: Apple Liquid Glass tokens, blur levels, continuous squircles.
* `context/`: 14-file modular developer playbook (Saral Lekhan standard).
* `docs/`: Product Requirements Document (`PRD.md`), `TASKS.md`, `AGENT_CONTEXT.md`, `AGENT_HANDOFF.md`.

---

## 3. Security & Git Offline Invariants
> [!CAUTION]
> The following directories are strictly offline and must **NEVER** be tracked or pushed to Git:
> * `docs/` (PRD, task lists, specifications)
> * `context/` (modular agent context memory)
> * `.agents/` (rules and skills)
> * Keystores (`*.keystore`, `*.jks`, `keystore_base64.txt`)
> * `google-services.json`
