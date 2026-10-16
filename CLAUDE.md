# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Apartment management app for a single 9-flat building ("Sürur Apartmanı"). Expo SDK 57 + React Native 0.86 + TypeScript, backed by Firebase Auth and Firestore. Distributed as an Android APK, not through stores. All UI text and code comments are Turkish — keep it that way.

Read `AGENTS.md` too: it requires checking versioned Expo docs before touching Expo/RN APIs and using `npx expo install` (never plain npm add) for dependencies.

## Hard constraint: free Firebase plan only

The owner will not pay. Everything must work on the Spark plan: **no Cloud Functions, no Firebase Storage**. This shapes several designs below. Don't propose features that need either without a free alternative.

## Commands

```bash
npx expo start                              # dev server; test on device with Expo Go
npm run typecheck                           # tsc --noEmit
npx expo export --platform android --output-dir <tmp>   # verifies the Android bundle actually builds
```

- No test suite exists. Verification = typecheck + Android export.
- No ESLint config is committed; `npx expo lint` would install one interactively.
- **Typed routes go stale.** After adding/renaming files under `src/app/`, `tsc` reports bogus `Href` errors until types regenerate. Fix: delete `.expo/types/router.d.ts`, run `npx expo start` until the file reappears, then stop it. If the regenerated file contains `/../` entries (generator picked up non-route files), delete and regenerate again.
- `firestore.rules` is **not** deployed by tooling (no firebase CLI). After editing it, tell the user to paste it into Firebase Console → Firestore → Rules → Publish. Any new collection/field written by a service needs a matching rule or writes fail.
- Env vars live in `.env` (git-ignored, template in `.env.example`) as `EXPO_PUBLIC_FIREBASE_*`; they must be read statically (`process.env.EXPO_PUBLIC_X`) to be inlined.

## Architecture

### Auth and roles
- Users type a username; `src/lib/username.ts` maps it to `username@apartman.local` for Firebase email/password auth (no real email ever). Turkish chars are normalized.
- Role lives in `users/{uid}.role`: `admin` (app owner), `manager` (building manager), `resident`. `src/context/auth-context.tsx` listens to the profile doc live; a missing/invalid profile signs the user out (this is how "delete user" works).
- `src/app/_layout.tsx` gates `login`, `admin`, `manager`, `resident` route groups with `Stack.Protected`; `src/app/index.tsx` redirects by role. UI gating is cosmetic — **`firestore.rules` is the real authorization layer**, and rules use `get()` on the caller's user doc (`me()`, `currentRole()`, `hasProfile()`).
- Admin creates users via a **secondary Firebase app instance with in-memory auth** (`services/users.ts`), so the admin's own session isn't replaced. Admins cannot reset passwords or delete Auth accounts from the app (needs Admin SDK); deleting only removes the Firestore profile.
- `tsconfig.json` maps `@firebase/auth` to its React Native typings so `getReactNativePersistence` type-checks.

### Routing layout
Each role folder (`src/app/{admin,manager,resident}/`) has a `_layout.tsx` using `RoleStack` (outer stack for detail/modal screens) and a `(tabs)/` group using `RoleTabs` + the custom `FloatingTabBar`. Detail screens are registered as `Stack.Screen`s in the role's `_layout.tsx`.

Most features are implemented once as a shared screen in `src/components/` and mounted by thin per-role route files that pass role-specific props — typically `onOpen`/`onCreate`/`onEdit` callbacks (which also keep `router.push` hrefs type-checked per role) or `canManage`/`canPublish` flags that reveal manager-only controls.

### Data layer (`src/services/`)
One file per collection. Conventions to follow:
- Live data via `subscribeTo*(onChange, onError)` wrappers around `onSnapshot`; screens call them in `useEffect` and return the unsubscribe.
- **Sort client-side** rather than adding `orderBy` combos — composite indexes aren't managed in this repo.
- Read with `snapshot.data({ serverTimestamps: 'estimate' })` so freshly written docs don't have null timestamps; rules commonly require `createdAt == request.time`.
- Validation errors are thrown as feature-specific `*Error` classes whose message is shown to the user verbatim.

Design decisions driven by rules/free plan:
- `dues/{yyyy-mm}_{flat}`: residents may read only their own flat's dues, so anything aggregate across flats for residents must be **published by the manager** as a snapshot (see `reports/{year}`, computed in `services/reports.ts`).
- Polls: one vote per flat at `polls/{id}/votes/{flat}`; the vote doc and the poll's `counts`/`votedApartments` are written in one batch and the rules cross-check them with `getAfter()`. Residents can't read others' votes.
- Unread-announcement badges are tracked **per device** in AsyncStorage (`src/lib/read-announcements.ts`); separately, `announcements/{id}/reads/{uid}` records are written so the manager can see which flats read it.
- No image uploads (no Storage). Photos were explicitly dropped; keep bundle size small (charts are plain Views, no chart library).

### UI system
- **Import `Text`/`TextInput` from `@/components/ui/text`, not `react-native`.** It maps `fontWeight` to the matching Plus Jakarta Sans family (fonts loaded in the root layout); raw RN `Text` falls back to the system font.
- Colors/spacing/typography come from `src/constants/theme.ts` (`useThemeColors()`, light + dark palettes, per-section `tints`). Don't hardcode colors.
- Reusable primitives live in `src/components/ui/` (Screen, Card, Button, TextField, SkeletonList, Notice, EmptyState...). Loading states use `SkeletonList`, not spinners. Haptics helpers are in `src/lib/haptics.ts`.
- Apartment name and flat count are constants in `src/constants/apartment.ts`.
