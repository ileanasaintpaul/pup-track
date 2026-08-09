# Navigation redesign and i18n groundwork

Date: 2026-08-09

## Problem

The app grew page by page: weight and withers height each got their own top-level
route, the home page carries both the dog summary and the household management,
and there is no navigation shell at all. The README lists around forty features
still to come. Adding them to the current structure means more sibling routes and
no place that tells the user where anything lives.

Two concrete symptoms:

- Weight and withers height are the same thing — growth over time, against the same
  breed reference curves — but they live on two unrelated pages.
- Every visible string is hardcoded French, so no second language is possible
  without touching every component.

## Goals

- A five-tab shell that matches the target mockups: Home, Health, Training, Map, Coach.
- Weight and withers height merged into a single Growth page.
- Health as a card hub that can absorb the upcoming features without becoming a
  scrolling dump.
- Household, sign-out and dog switching moved off the home page into a Profile page.
- Every user-visible string served through a translation key, with French values in
  `src/locales/fr.json`, so a language switch is a later addition rather than a rewrite.
- English route paths.

## Non-goals

- No new tracked data. No Supabase migration, no hook changes.
- Quick Journal, health record, feeding, hygiene, map and coach are **not** implemented.
  They appear as disabled cards so the target structure is visible.
- No second locale file. Only `fr.json` ships; the machinery makes adding `en.json` cheap.
- No visual redesign beyond what the new structure requires. Existing styles carry over.

## Navigation

### Shell

`DogLayout` owns the chrome: a header (dog avatar and name, tapping it opens Profile)
above an `<Outlet/>`, and a fixed bottom tab bar. It is the single component that
resolves the current dog from the route, so pages stop rendering their own header.

Tabs: Home · Health · Training · Map · Coach. Map and Coach render a placeholder page
and their tab shows a "soon" badge; they are reachable but obviously unfinished.

### Routes

| Path | Page |
| --- | --- |
| `/` | redirect to `/dog/<first dog>`, or `/dog/new` when the household has none |
| `/dog/new` | `NewDog` (unchanged) |
| `/dog/:dogId` | Home |
| `/dog/:dogId/health` | Health hub |
| `/dog/:dogId/health/growth` | Growth (weight + height) |
| `/dog/:dogId/training` | Training (existing page) |
| `/dog/:dogId/map` | placeholder |
| `/dog/:dogId/coach` | placeholder |
| `/dog/:dogId/profile` | Profile |
| `/dog/:dogId/edit` | `EditDog` (unchanged) |

The five tab routes are children of `DogLayout`. `/dog/new`, `/dog/:dogId/edit` and the
auth routes stay outside it — they have no tab bar.

Old paths redirect so existing bookmarks survive: `/dog/:dogId/poids` and
`/dog/:dogId/taille` to `/dog/:dogId/health/growth`, `/dog/:dogId/education` to
`/dog/:dogId/training`.

## Pages

### Home

- Header (from the layout): avatar, dog name, link to Profile.
- Summary tiles fed by real data through the existing hooks: latest weight with its
  change, latest withers height, age.
- Disabled blocks sketching what comes next: Quick Journal, daily journal, health
  reminders.
- The household block, the invite code and sign-out leave this page.

### Health hub

A grid of cards. Each card shows a title, an icon and — when the feature exists — a
headline figure.

- **Growth** — active, shows current weight and height, links to the Growth page.
- **Health record**, **Feeding**, **Hygiene**, **Vet & emergency**, **Teething** —
  disabled, rendered by the same `HubCard` component in a muted state, not clickable.

### Growth

One chart at a time with a Weight/Height toggle above it, the breed reference range
behind the curve, and below it the entry form and history for the selected measurement.
The toggle is local state, not a route: the page has one URL.

### Training

Unchanged behaviour. It loses its own header and top padding to the layout.

### Profile

Dog profile details and a link to `EditDog`, the list of the household's other dogs
with a switcher, the household members, the invite code creation, and sign-out.

## Code layout

New:

- `src/components/DogLayout.tsx` — header, outlet, tab bar, current-dog resolution.
- `src/components/TabBar.tsx` — the five tabs, active state from the router.
- `src/components/HubCard.tsx` — one hub card, active or disabled.
- `src/routes/Health.tsx` — the hub.
- `src/routes/Growth.tsx` — toggle plus the two panels.
- `src/routes/Profile.tsx` — dog, household, sign-out.
- `src/routes/Placeholder.tsx` — shared "coming soon" page for Map and Coach.

Changed:

- `src/routes/WeightLog.tsx` (236 lines) and `src/routes/HeightLog.tsx` (177 lines)
  become `src/components/WeightPanel.tsx` and `src/components/HeightPanel.tsx`: each
  keeps its own form, history list and chart, and drops its page chrome. `Growth.tsx`
  stays thin — toggle state and panel selection only.
- `src/routes/Home.tsx` (158 lines) sheds the household section to `Profile.tsx` and
  the header to `DogLayout`.
- `src/App.tsx` — the flat route list becomes nested routes under `DogLayout`, plus
  the legacy redirects.
- `src/routes/Training.tsx` — header removed.

Charts, hooks and `src/lib/*` are untouched.

## Internationalisation

Library: `i18next` + `react-i18next`, initialised in `src/lib/i18n.ts` and mounted with
`I18nextProvider` in `App.tsx`.

- Resources: `src/locales/fr.json`, a single default namespace, loaded statically.
  `fallbackLng: 'fr'`, `lng` read from `localStorage` and defaulted to `fr`.
- Keys are dotted and grouped by area: `nav.*`, `home.*`, `health.*`, `growth.*`,
  `training.*`, `profile.*`, `auth.*`, `dog.*`, `common.*`. Key names are English and
  describe the role, not the French wording (`growth.toggle.weight`, not
  `growth.toggle.poids`).
- Components read strings with `useTranslation()`; no literal user-visible string stays
  in a component. Counts go through i18next plurals (`_one` / `_other`), values through
  interpolation.
- Scope: every existing page migrates, not only the new ones — `Login`, `Onboarding`,
  `ResetPassword`, `DogForm`, `Training`, `Home`, `Setup`, `BreedPicker`, `DogLists`,
  `Collections`, `SkillPickerDialog`, `SkillRow`, `SkillProgress`, and the chart
  components' labels.
- Data coming from Supabase (dog names, breed names, skill names) is not translated.
- `src/lib/format.ts` and `src/lib/age.ts` keep formatting numbers and dates, but take
  the active locale from i18next instead of assuming `fr-FR`.
- `index.html` keeps `lang="fr"`; a later language switch updates it at runtime.

Adding English later means dropping an `en.json` next to `fr.json`, registering it, and
exposing a switcher in Profile. Nothing else.

## Verification

- `npm run typecheck` and `npm run lint` pass.
- The dev server renders each of the five tabs, and the tab bar marks the right one active.
- Growth shows both curves through the toggle, and adding a weight and a height from that
  page updates the chart and the history.
- The legacy `/poids`, `/taille` and `/education` URLs land on their new pages.
- A grep for user-visible literals in `src/routes` and `src/components` returns nothing
  outside `fr.json`.

## Risks

- The i18n migration touches every component, so it is wide but shallow. A missed string
  shows up as French text that simply cannot be switched later — the grep in Verification
  is the safety net.
- Splitting `WeightLog` and `HeightLog` into panels is the only place where behaviour can
  regress; both entry forms must keep their current validation and optimistic updates.
