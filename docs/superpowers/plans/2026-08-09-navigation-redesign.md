# Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat page list with a five-tab shell, merge weight and withers height into one Growth page, and route every visible string through react-i18next so a second language becomes a file drop.

**Architecture:** A `DogLayout` route element owns the header and the bottom tab bar and wraps the five tab routes as children; pages stop rendering their own chrome. Health is a hub of cards, only Growth being live. Weight and height logs become two panels selected by local state inside a thin `Growth` route. i18n is initialised once in `src/lib/i18n.ts` with French values in `src/locales/fr.json`.

**Tech Stack:** Vite 8, React 19, TypeScript 6, react-router-dom 7, TanStack Query 5, Supabase JS, i18next + react-i18next (added by Task 1). No test runner in this repo — every task is verified with `npm run typecheck`, `npm run lint`, and a check in the browser preview.

**Spec:** `docs/superpowers/specs/2026-08-09-navigation-redesign-design.md`

**House rule:** this codebase carries no comments in TS, TSX, CSS or SQL. Explanations belong in commit messages.

---

## File Structure

Created:

| File | Responsibility |
| --- | --- |
| `src/lib/i18n.ts` | i18next instance, resources, stored language |
| `src/locales/fr.json` | every French string, grouped by area |
| `src/types/i18next.d.ts` | types translation keys from `fr.json` |
| `src/components/DogLayout.tsx` | header + `<Outlet/>` + tab bar, resolves current dog |
| `src/components/TabBar.tsx` | the five tabs and their active state |
| `src/components/HubCard.tsx` | one hub card, active or disabled |
| `src/components/WeightPanel.tsx` | weight chart, entry form, history |
| `src/components/HeightPanel.tsx` | height chart, entry form, history |
| `src/routes/Health.tsx` | the hub grid |
| `src/routes/Growth.tsx` | weight/height toggle, renders one panel |
| `src/routes/Profile.tsx` | dog details, dog switcher, household, sign-out |
| `src/routes/Placeholder.tsx` | shared "coming soon" page for Map and Coach |

Modified: `src/App.tsx` (nested routes, redirects, i18n provider), `src/routes/Home.tsx` (summary tiles only), `src/routes/Training.tsx` (header removed), `src/lib/format.ts` and `src/lib/age.ts` (locale-aware), `src/index.css` (tab bar, hub grid, toggle), every route and component that holds a French literal.

Deleted: `src/routes/WeightLog.tsx`, `src/routes/HeightLog.tsx` (content moves into the panels).

Untouched: `src/hooks/*`, `src/lib/growth.ts`, `src/lib/progress.ts`, `src/lib/skills.ts`, `src/lib/chartScale.ts`, `supabase/*`.

---

## Task 1: i18n foundation

**Files:**
- Create: `src/lib/i18n.ts`, `src/locales/fr.json`, `src/types/i18next.d.ts`
- Modify: `src/App.tsx:1-20`, `tsconfig.app.json`

- [ ] **Step 1: Install the libraries**

```bash
npm install i18next@^25 react-i18next@^16
```

- [ ] **Step 2: Allow JSON imports to be typed**

In `tsconfig.app.json`, inside `compilerOptions`, add:

```json
"resolveJsonModule": true
```

- [ ] **Step 3: Create the French resource file**

Create `src/locales/fr.json`. This is the seed; later tasks append their own groups.

```json
{
  "common": {
    "loading": "Chargement…",
    "back": "← Retour",
    "save": "Enregistrer",
    "saving": "Enregistrement…",
    "delete": "Supprimer",
    "edit": "Modifier",
    "empty": "—",
    "error": "Une erreur est survenue"
  },
  "nav": {
    "home": "Accueil",
    "health": "Santé",
    "training": "Éducation",
    "map": "Carte",
    "coach": "IA Chat",
    "soon": "bientôt"
  }
}
```

- [ ] **Step 4: Create the i18next instance**

Create `src/lib/i18n.ts`:

```ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from '../locales/fr.json';

export const LANGUAGE_STORAGE_KEY = 'puptrack.language';
export const FALLBACK_LANGUAGE = 'fr';

void i18next.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? FALLBACK_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
});

export default i18next;
```

- [ ] **Step 5: Type the keys**

Create `src/types/i18next.d.ts`:

```ts
import type fr from '../locales/fr.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}
```

- [ ] **Step 6: Load i18n from the app entry point**

In `src/App.tsx`, add the import next to the other `./lib` imports (side-effect import, no provider needed since `initReactI18next` registers globally):

```ts
import './lib/i18n';
```

- [ ] **Step 7: Verify**

```bash
npm run typecheck && npm run lint
```

Expected: both pass, no output beyond the tool banners.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.app.json src/lib/i18n.ts src/locales/fr.json src/types/i18next.d.ts src/App.tsx
git commit -m "feat: set up i18next with a French resource file"
```

---

## Task 2: Locale-aware formatting

**Files:**
- Modify: `src/lib/format.ts` (whole file), `src/lib/age.ts:14-23`, `src/routes/Home.tsx` (the `formatAge` call site)

`formatAge` currently returns French text (`"12 semaines · 2 mois"`). Text belongs in `fr.json`, so it is replaced by `ageParts`, which returns numbers.

- [ ] **Step 1: Make the number and date formatters follow the active language**

Replace the whole of `src/lib/format.ts`:

```ts
import i18next from './i18n';

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function get<T extends Intl.NumberFormat | Intl.DateTimeFormat>(kind: string, build: (locale: string) => T): T {
  const locale = i18next.language || 'fr';
  const key = `${kind}:${locale}`;
  const hit = cache.get(key);
  if (hit) return hit as T;
  const made = build(locale);
  cache.set(key, made);
  return made;
}

const kg = () =>
  get('kg', (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }));
const cm = () =>
  get('cm', (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 }));
const shortDate = () =>
  get('shortDate', (locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }));
const longDate = () =>
  get(
    'longDate',
    (locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
  );

export function formatKg(value: number): string {
  return kg().format(value);
}

export function formatCm(value: number): string {
  return cm().format(value);
}

export function formatSignedCm(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${cm().format(Math.abs(value))}`;
}

export function formatSignedKg(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${kg().format(Math.abs(value))}`;
}

export function formatShortDate(isoDate: string): string {
  return shortDate().format(new Date(`${isoDate}T00:00:00`));
}

export function formatLongDate(isoDate: string): string {
  return longDate().format(new Date(`${isoDate}T00:00:00`));
}
```

- [ ] **Step 2: Return age as numbers instead of French text**

In `src/lib/age.ts`, delete `formatAge` and add:

```ts
export type AgeParts = { weeks: number; months: number | null };

export function ageParts(birthDate: string | null, now = new Date()): AgeParts | null {
  const weeks = ageInWeeks(birthDate, now);
  if (weeks === null) return null;
  return { weeks, months: weeks < 9 ? null : Math.floor(weeks / 4.345) };
}
```

- [ ] **Step 3: Add the age keys**

In `src/locales/fr.json`, add at the top level:

```json
"dog": {
  "age": {
    "weeks_one": "{{count}} semaine",
    "weeks_other": "{{count}} semaines",
    "withMonths": "{{weeks}} · {{months}} mois"
  }
}
```

- [ ] **Step 4: Fix the only call site so the build stays green**

In `src/routes/Home.tsx`, inside `DogCard`, replace `const age = formatAge(dog.birth_date);` with:

```tsx
const { t } = useTranslation();
const parts = ageParts(dog.birth_date);
const weeksLabel = parts ? t('dog.age.weeks', { count: parts.weeks }) : null;
const age =
  parts && parts.months !== null
    ? t('dog.age.withMonths', { weeks: weeksLabel, months: parts.months })
    : weeksLabel;
```

Update the imports in that file: `import { useTranslation } from 'react-i18next';` and `import { ageParts, isInSocializationWindow } from '../lib/age';`.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint
```

Expected: both pass. A failure naming `formatAge` means a call site was missed — `grep -rn formatAge src` finds it.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts src/lib/age.ts src/routes/Home.tsx src/locales/fr.json
git commit -m "refactor: format numbers, dates and age against the active locale"
```

---

## Task 3: Tab bar and layout shell

**Files:**
- Create: `src/components/TabBar.tsx`, `src/components/DogLayout.tsx`, `src/routes/Placeholder.tsx`
- Modify: `src/index.css` (append)

- [ ] **Step 1: Write the tab bar**

Create `src/components/TabBar.tsx`:

```tsx
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TABS = [
  { to: '', key: 'nav.home', icon: '🏠', ready: true },
  { to: 'health', key: 'nav.health', icon: '❤️', ready: true },
  { to: 'training', key: 'nav.training', icon: '🎓', ready: true },
  { to: 'map', key: 'nav.map', icon: '📍', ready: false },
  { to: 'coach', key: 'nav.coach', icon: '💬', ready: false },
] as const;

export function TabBar({ dogId }: { dogId: string }) {
  const { t } = useTranslation();

  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          end={tab.to === ''}
          to={tab.to ? `/dog/${dogId}/${tab.to}` : `/dog/${dogId}`}
          className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-label">{t(tab.key)}</span>
          {tab.ready ? null : <span className="tab-badge">{t('nav.soon')}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Write the layout**

Create `src/components/DogLayout.tsx`:

```tsx
import { Link, Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDog } from '../hooks/useDogs';
import { TabBar } from './TabBar';

export function DogLayout() {
  const { dogId } = useParams();
  const { data: dog, isPending } = useDog(dogId);
  const { t } = useTranslation();

  if (!dogId) return <Navigate to="/" replace />;

  return (
    <div className="shell shell-tabs">
      <header className="dogbar">
        <Link to={`/dog/${dogId}/profile`} className="dogbar-identity">
          <span className="dogbar-avatar" aria-hidden="true">
            🐶
          </span>
          <span className="dogbar-name">{isPending ? t('common.loading') : (dog?.name ?? '')}</span>
        </Link>
      </header>

      <main className="shell-body">
        <Outlet />
      </main>

      <TabBar dogId={dogId} />
    </div>
  );
}
```

- [ ] **Step 3: Write the placeholder page**

Create `src/routes/Placeholder.tsx`:

```tsx
import { useTranslation } from 'react-i18next';

export function Placeholder({ titleKey }: { titleKey: 'nav.map' | 'nav.coach' }) {
  const { t } = useTranslation();

  return (
    <section className="card">
      <h1>{t(titleKey)}</h1>
      <p className="muted">{t('placeholder.body')}</p>
    </section>
  );
}
```

- [ ] **Step 4: Add the keys**

In `src/locales/fr.json`, add at the top level:

```json
"placeholder": {
  "body": "Cette partie arrive bientôt. Elle est déjà prévue dans la feuille de route."
}
```

- [ ] **Step 5: Style the shell**

Append to `src/index.css`:

```css
.shell-tabs {
  padding-bottom: 5.5rem;
}

.dogbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0 1rem;
}

.dogbar-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
}

.dogbar-avatar {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  font-size: 1.5rem;
}

.dogbar-name {
  font-size: 1.6rem;
  font-weight: 700;
}

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom));
  background: rgba(20, 18, 16, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.35rem 0.1rem;
  border-radius: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  text-decoration: none;
}

.tab-active {
  color: #e08a3c;
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-badge {
  font-size: 0.6rem;
  opacity: 0.6;
}
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint
```

Expected: both pass. Nothing renders yet — the routes arrive in Task 4.

- [ ] **Step 7: Commit**

```bash
git add src/components/TabBar.tsx src/components/DogLayout.tsx src/routes/Placeholder.tsx src/index.css src/locales/fr.json
git commit -m "feat: add the tab bar shell and its placeholder page"
```

---

## Task 4: English routes under the layout

**Files:**
- Modify: `src/App.tsx:60-146`
- Create: `src/routes/HomeRedirect.tsx`

`/` must send the user to their first dog, so it becomes a small component rather than a static redirect.

- [ ] **Step 1: Write the entry redirect**

Create `src/routes/HomeRedirect.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDogs } from '../hooks/useDogs';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';

export function HomeRedirect() {
  const { session } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: dogs, isPending } = useDogs(household?.id);
  const { t } = useTranslation();

  if (isPending) return <p className="centered muted">{t('common.loading')}</p>;
  if (!dogs?.length) return <Navigate to="/dog/new" replace />;
  return <Navigate to={`/dog/${dogs[0].id}`} replace />;
}
```

- [ ] **Step 2: Rewrite the route table**

In `src/App.tsx`, replace the whole `<Routes>` block (currently lines 64-145) with:

```tsx
<Routes>
  <Route
    path="/login"
    element={
      <RedirectIfAuthenticated>
        <Login />
      </RedirectIfAuthenticated>
    }
  />
  <Route
    path="/onboarding"
    element={
      <RequireAuth>
        <RedirectIfHousehold>
          <Onboarding />
        </RedirectIfHousehold>
      </RequireAuth>
    }
  />
  <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />

  <Route
    element={
      <RequireAuth>
        <RequireHousehold>
          <Outlet />
        </RequireHousehold>
      </RequireAuth>
    }
  >
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/dog/new" element={<NewDog />} />
    <Route path="/dog/:dogId/edit" element={<EditDog />} />

    <Route path="/dog/:dogId" element={<DogLayout />}>
      <Route index element={<Home />} />
      <Route path="health" element={<Health />} />
      <Route path="health/growth" element={<Growth />} />
      <Route path="training" element={<Training />} />
      <Route path="map" element={<Placeholder titleKey="nav.map" />} />
      <Route path="coach" element={<Placeholder titleKey="nav.coach" />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    <Route path="/dog/:dogId/poids" element={<LegacyRedirect to="health/growth" />} />
    <Route path="/dog/:dogId/taille" element={<LegacyRedirect to="health/growth" />} />
    <Route path="/dog/:dogId/education" element={<LegacyRedirect to="training" />} />
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

- [ ] **Step 3: Add the legacy redirect helper**

In `src/App.tsx`, above `export default function App()`:

```tsx
function LegacyRedirect({ to }: { to: string }) {
  const { dogId } = useParams();
  return <Navigate to={`/dog/${dogId}/${to}`} replace />;
}
```

- [ ] **Step 4: Fix the imports**

In `src/App.tsx`, the router import becomes:

```ts
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
```

Remove the `HeightLog` and `WeightLog` imports and add:

```ts
import { DogLayout } from './components/DogLayout';
import { Growth } from './routes/Growth';
import { Health } from './routes/Health';
import { HomeRedirect } from './routes/HomeRedirect';
import { Placeholder } from './routes/Placeholder';
import { Profile } from './routes/Profile';
```

`Growth`, `Health` and `Profile` do not exist yet, so typecheck fails until Tasks 5-7 land. Create the three files now as one-line stubs so the app runs in between:

```tsx
export function Health() {
  return null;
}
```

(same shape in `src/routes/Growth.tsx` exporting `Growth`, and `src/routes/Profile.tsx` exporting `Profile`)

- [ ] **Step 5: Verify in the browser**

Start the preview with the `puptrack` configuration from `.claude/launch.json`, then check:

- `/` lands on `/dog/<id>` and the tab bar shows five tabs
- tapping Éducation goes to `/dog/<id>/training` and marks that tab active
- `/dog/<id>/poids` redirects to `/dog/<id>/health/growth`
- `/dog/<id>/education` redirects to `/dog/<id>/training`
- the console shows no router warnings

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/routes/HomeRedirect.tsx src/routes/Health.tsx src/routes/Growth.tsx src/routes/Profile.tsx
git commit -m "refactor: nest the dog pages under a tab layout with English paths"
```

---

## Task 5: Growth page

**Files:**
- Create: `src/components/WeightPanel.tsx`, `src/components/HeightPanel.tsx`
- Modify: `src/routes/Growth.tsx`, `src/index.css` (append), `src/locales/fr.json`
- Delete: `src/routes/WeightLog.tsx`, `src/routes/HeightLog.tsx`

- [ ] **Step 1: Move the weight page into a panel**

Create `src/components/WeightPanel.tsx` with the body of `src/routes/WeightLog.tsx`, changed as follows and nothing else:

- rename the exported function `WeightLog` to `WeightPanel`
- drop the outer `<div className="shell">` and the `<header className="topbar">` block; return a `<>` fragment holding the three `<section className="card">` blocks
- the first section's `<h1>` becomes `<h2>{t('growth.weight.title')}</h2>`
- replace every French literal with a `t(...)` call using the keys added in Step 3
- keep `MissingReference` in this file, and point its link at `/dog/${dog.id}/edit` instead of `/dog/${dog.id}`

- [ ] **Step 2: Move the height page into a panel**

Create `src/components/HeightPanel.tsx` from `src/routes/HeightLog.tsx` with the same three changes: rename to `HeightPanel`, drop the shell and topbar, `<h1>` becomes `<h2>{t('growth.height.title')}</h2>`, and all literals go through `t(...)`.

- [ ] **Step 3: Add the growth keys**

In `src/locales/fr.json`, add at the top level:

```json
"growth": {
  "title": "Croissance",
  "toggle": { "weight": "Poids", "height": "Taille" },
  "weight": {
    "title": "Poids",
    "unit": "kg",
    "change": "{{value}} kg depuis la pesée précédente",
    "first": "Première pesée enregistrée.",
    "empty": "Aucune pesée pour l'instant. Ajoute la première ci-dessous.",
    "addTitle": "Ajouter une pesée",
    "dateLabel": "Date",
    "valueLabel": "Poids en kilos",
    "valuePlaceholder": "5,4",
    "noteLabel": "Note",
    "notePlaceholder": "Après la visite chez le véto",
    "invalid": "Entre un poids en kilos, par exemple 5,4",
    "range": "À {{weeks}} semaines, 82 % des chiens de ce gabarit pèsent entre {{low}} et {{high}} kg",
    "position": {
      "below": "sous la fourchette",
      "inside": "dans la fourchette",
      "above": "au-dessus de la fourchette"
    },
    "centile": ", autour du {{centile}}",
    "source": "Courbes WALTHAM Petcare Science Institute, catégorie {{min}}–{{max}} kg de poids adulte, {{sex}}. Un repère, pas un diagnostic : c'est la régularité de la courbe qui compte, et le vétérinaire qui tranche.",
    "missing": "Renseigne {{fields}} dans la fiche pour comparer aux courbes de croissance.",
    "missingLink": "Compléter",
    "missingBreed": "la race",
    "missingSex": "le sexe",
    "missingBirthDate": "la date de naissance",
    "tooYoung_one": "Les courbes de référence démarrent à 12 semaines. Encore {{count}} semaine avant de pouvoir situer la croissance.",
    "tooYoung_other": "Les courbes de référence démarrent à 12 semaines. Encore {{count}} semaines avant de pouvoir situer la croissance.",
    "historyTitle": "Historique",
    "historyDate": "Date",
    "historyValue": "Poids"
  },
  "height": {
    "title": "Taille au garrot",
    "unit": "cm au garrot",
    "change": "{{value}} cm depuis la mesure précédente",
    "first": "Première mesure enregistrée.",
    "empty": "Aucune mesure pour l'instant. La taille au garrot se prend du sol au sommet des omoplates, chien debout sur un sol plat.",
    "addTitle": "Ajouter une mesure",
    "dateLabel": "Date",
    "valueLabel": "Taille au garrot en centimètres",
    "valuePlaceholder": "26,5",
    "noteLabel": "Note",
    "notePlaceholder": "Mesuré contre le mur",
    "invalid": "Entre une taille en centimètres, par exemple 26,5",
    "measuredAt": "Mesuré à {{weeks}} semaines. ",
    "method": "La taille au garrot se prend du sol au sommet des omoplates, chien debout sur un sol plat. Aucun barème publié n'existe par race et par âge : la courbe montre sa progression à lui, sans comparaison.",
    "standard": "{{breed}} : le standard de race donne une taille adulte, pas une courbe de croissance. À confirmer auprès du club de race ou du vétérinaire.",
    "historyTitle": "Historique",
    "historyDate": "Date",
    "historyValue": "Taille"
  }
},
"dogSex": { "female": "femelle", "male": "mâle" }
```

- [ ] **Step 4: Write the Growth route**

Replace the stub `src/routes/Growth.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HeightPanel } from '../components/HeightPanel';
import { WeightPanel } from '../components/WeightPanel';

type Measure = 'weight' | 'height';

const STORAGE_KEY = 'puptrack.growth-measure';

export function Growth() {
  const { t } = useTranslation();
  const [measure, setMeasure] = useState<Measure>(
    () => (localStorage.getItem(STORAGE_KEY) as Measure | null) ?? 'weight',
  );

  function select(next: Measure) {
    setMeasure(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <>
      <div className="chips">
        <button
          type="button"
          className={measure === 'weight' ? 'chip chip-active' : 'chip'}
          onClick={() => select('weight')}
        >
          {t('growth.toggle.weight')}
        </button>
        <button
          type="button"
          className={measure === 'height' ? 'chip chip-active' : 'chip'}
          onClick={() => select('height')}
        >
          {t('growth.toggle.height')}
        </button>
      </div>

      {measure === 'weight' ? <WeightPanel /> : <HeightPanel />}
    </>
  );
}
```

- [ ] **Step 5: Delete the old pages**

```bash
git rm src/routes/WeightLog.tsx src/routes/HeightLog.tsx
```

- [ ] **Step 6: Verify in the browser**

On `/dog/<id>/health/growth`:

- the toggle switches between the weight curve and the height curve
- adding a weight updates the hero figure, the chart and the history table
- adding a height does the same on the height side
- deleting an entry still works on both
- reloading the page keeps the last selected measure
- no French literal is left in the two panels: `grep -nE "[éèêàçù]" src/components/WeightPanel.tsx src/components/HeightPanel.tsx` returns nothing

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/components/WeightPanel.tsx src/components/HeightPanel.tsx src/routes/Growth.tsx src/locales/fr.json src/routes/WeightLog.tsx src/routes/HeightLog.tsx
git commit -m "feat: merge weight and withers height into one growth page"
```

---

## Task 6: Health hub

**Files:**
- Create: `src/components/HubCard.tsx`
- Modify: `src/routes/Health.tsx`, `src/index.css` (append), `src/locales/fr.json`

- [ ] **Step 1: Write the card**

Create `src/components/HubCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = {
  icon: string;
  title: string;
  value?: string | null;
  to?: string;
};

export function HubCard({ icon, title, value, to }: Props) {
  const { t } = useTranslation();

  const body = (
    <>
      <span className="hub-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="hub-title">{title}</span>
      <span className="hub-value">{to ? (value ?? t('common.empty')) : t('nav.soon')}</span>
    </>
  );

  if (!to) return <div className="hub-card hub-card-disabled">{body}</div>;
  return (
    <Link to={to} className="hub-card">
      {body}
    </Link>
  );
}
```

- [ ] **Step 2: Write the hub**

Replace the stub `src/routes/Health.tsx`:

```tsx
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { HubCard } from '../components/HubCard';
import { latestHeight, useHeights } from '../hooks/useHeights';
import { latestWeight, useWeights } from '../hooks/useWeights';
import { formatCm, formatKg } from '../lib/format';

export function Health() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { data: weights } = useWeights(dogId);
  const { data: heights } = useHeights(dogId);

  const weight = latestWeight(weights);
  const height = latestHeight(heights);
  const growthValue = [
    weight ? `${formatKg(weight.weight_kg)} kg` : null,
    height ? `${formatCm(height.withers_cm)} cm` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <h1>{t('health.title')}</h1>

      <div className="hub-grid">
        <HubCard
          icon="📈"
          title={t('health.cards.growth')}
          value={growthValue || null}
          to={`/dog/${dogId}/health/growth`}
        />
        <HubCard icon="💉" title={t('health.cards.record')} />
        <HubCard icon="🍽️" title={t('health.cards.feeding')} />
        <HubCard icon="🛁" title={t('health.cards.hygiene')} />
        <HubCard icon="🚑" title={t('health.cards.vet')} />
        <HubCard icon="🦷" title={t('health.cards.teething')} />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Add the keys**

In `src/locales/fr.json`, add at the top level:

```json
"health": {
  "title": "Santé & Suivi",
  "cards": {
    "growth": "Croissance",
    "record": "Carnet de santé",
    "feeding": "Alimentation",
    "hygiene": "Hygiène",
    "vet": "Vétérinaire & urgence",
    "teething": "Mue dentaire"
  }
}
```

- [ ] **Step 4: Style the grid**

Append to `src/index.css`:

```css
.hub-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.hub-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  text-decoration: none;
}

.hub-card-disabled {
  opacity: 0.45;
}

.hub-icon {
  font-size: 1.5rem;
}

.hub-title {
  font-weight: 600;
}

.hub-value {
  font-size: 0.85rem;
  opacity: 0.7;
}
```

- [ ] **Step 5: Verify in the browser**

On `/dog/<id>/health`: six cards, only Croissance clickable and showing the two current figures, the five others muted with the "bientôt" label. Tapping Croissance opens the Growth page.

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/HubCard.tsx src/routes/Health.tsx src/index.css src/locales/fr.json
git commit -m "feat: add the health hub with growth live and the rest disabled"
```

---

## Task 7: Home and Profile split

**Files:**
- Modify: `src/routes/Home.tsx` (whole file), `src/routes/Profile.tsx`, `src/locales/fr.json`, `src/index.css` (append)

- [ ] **Step 1: Move the household block into Profile**

Replace the stub `src/routes/Profile.tsx`. The household section, invite code and sign-out come from the current `src/routes/Home.tsx:53-92`; the dog details come from its `DogCard`.

```tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../hooks/useAuth';
import { useDog, useDogs } from '../hooks/useDogs';
import { useCreateInvite, useHousehold, useMembers } from '../hooks/useHousehold';

export function Profile() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: members } = useMembers(household?.id);
  const { data: dog } = useDog(dogId);
  const { data: dogs } = useDogs(household?.id);
  const createInvite = useCreateInvite();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h1>{dog?.name ?? ''}</h1>
          <Link to={`/dog/${dogId}/edit`} className="link">
            {t('common.edit')}
          </Link>
        </div>
        <ul className="list">
          <li>
            <span className="muted">{t('dog.breed')}</span>
            <span>{dog?.breed || t('common.empty')}</span>
          </li>
          <li>
            <span className="muted">{t('dog.sex')}</span>
            <span>
              {dog?.sex === 'female'
                ? t('dogSex.female')
                : dog?.sex === 'male'
                  ? t('dogSex.male')
                  : t('common.empty')}
            </span>
          </li>
        </ul>
      </section>

      {dogs && dogs.length > 1 ? (
        <section className="card">
          <h2>{t('profile.otherDogs')}</h2>
          <ul className="list">
            {dogs
              .filter((item) => item.id !== dogId)
              .map((item) => (
                <li key={item.id}>
                  <Link to={`/dog/${item.id}`} className="link">
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>{household?.name}</h2>
        <ul className="list">
          {members?.map((member) => (
            <li key={member.user_id}>
              <span>
                {member.display_name ||
                  (member.user_id === session?.user.id ? t('profile.you') : t('profile.member'))}
              </span>
              <span className="muted">
                {member.role === 'owner' ? t('profile.owner') : t('profile.member')}
              </span>
            </li>
          ))}
        </ul>

        {code ? (
          <>
            <p className="code">{code}</p>
            <p className="muted">{t('profile.codeHint')}</p>
            <button type="button" className="ghost" onClick={() => void copy()}>
              {copied ? t('profile.copied') : t('profile.copy')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            disabled={!household || createInvite.isPending}
            onClick={async () => setCode(await createInvite.mutateAsync(household!.id))}
          >
            {createInvite.isPending ? t('profile.generating') : t('profile.invite')}
          </button>
        )}
        {createInvite.error ? (
          <p className="error">{(createInvite.error as Error).message}</p>
        ) : null}
      </section>

      <section className="card">
        <button type="button" className="ghost" onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Rewrite Home as summary tiles plus disabled blocks**

Replace the whole of `src/routes/Home.tsx`:

```tsx
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDog } from '../hooks/useDogs';
import { latestHeight, useHeights } from '../hooks/useHeights';
import { latestWeight, useWeights, weightChange } from '../hooks/useWeights';
import { ageParts, isInSocializationWindow } from '../lib/age';
import { formatCm, formatKg, formatSignedKg } from '../lib/format';

export function Home() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { data: dog } = useDog(dogId);
  const { data: weights } = useWeights(dogId);
  const { data: heights } = useHeights(dogId);

  const weight = latestWeight(weights);
  const height = latestHeight(heights);
  const change = weightChange(weights);

  const parts = ageParts(dog?.birth_date ?? null);
  const weeksLabel = parts ? t('dog.age.weeks', { count: parts.weeks }) : null;
  const age =
    parts && parts.months !== null
      ? t('dog.age.withMonths', { weeks: weeksLabel, months: parts.months })
      : weeksLabel;

  return (
    <>
      <div className="tiles">
        <div className="tile">
          <span className="tile-label">{t('home.tiles.weight')}</span>
          <span className="tile-value">
            {weight ? `${formatKg(weight.weight_kg)} kg` : t('common.empty')}
          </span>
          {change !== null ? (
            <span className="tile-hint">{formatSignedKg(change)} kg</span>
          ) : null}
        </div>
        <div className="tile">
          <span className="tile-label">{t('home.tiles.height')}</span>
          <span className="tile-value">
            {height ? `${formatCm(height.withers_cm)} cm` : t('common.empty')}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label">{t('home.tiles.age')}</span>
          <span className="tile-value">{age ?? t('common.empty')}</span>
        </div>
      </div>

      {isInSocializationWindow(dog?.birth_date ?? null) ? (
        <p className="highlight">{t('home.socialization')}</p>
      ) : null}

      <section className="card card-disabled">
        <h2>{t('home.quickJournal.title')}</h2>
        <p className="muted">{t('home.quickJournal.body')}</p>
      </section>

      <section className="card card-disabled">
        <h2>{t('home.dailyJournal.title')}</h2>
        <p className="muted">{t('home.dailyJournal.body')}</p>
      </section>

      <section className="card card-disabled">
        <h2>{t('home.reminders.title')}</h2>
        <p className="muted">{t('home.reminders.body')}</p>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Add the keys**

In `src/locales/fr.json`, add to the existing `dog` group:

```json
"breed": "Race",
"sex": "Sexe"
```

and at the top level:

```json
"home": {
  "tiles": { "weight": "Poids", "height": "Taille au garrot", "age": "Âge" },
  "socialization": "Période critique de socialisation : chaque nouvelle expérience compte jusqu'à 16 semaines.",
  "quickJournal": {
    "title": "Journal express",
    "body": "Repas, sortie, pipi, caca en un tap. Bientôt disponible."
  },
  "dailyJournal": {
    "title": "Journal quotidien",
    "body": "Le résumé de la journée arrive bientôt."
  },
  "reminders": {
    "title": "Rappels de santé",
    "body": "Vaccins et antiparasitaires arriveront avec le carnet de santé."
  }
},
"profile": {
  "otherDogs": "Les autres chiens",
  "you": "Toi",
  "member": "membre",
  "owner": "propriétaire",
  "codeHint": "Valable 7 jours, utilisable une fois.",
  "copy": "Copier le code",
  "copied": "Copié",
  "invite": "Inviter l'autre maître",
  "generating": "Génération…",
  "signOut": "Se déconnecter"
}
```

- [ ] **Step 4: Style the tiles**

Append to `src/index.css`:

```css
.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
}

.tile-label {
  font-size: 0.75rem;
  opacity: 0.7;
}

.tile-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e08a3c;
}

.tile-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.card-disabled {
  opacity: 0.45;
}
```

- [ ] **Step 5: Verify in the browser**

On `/dog/<id>`: three tiles with real figures, three muted blocks, no household section. Tapping the dog name in the header opens Profile, which shows the members, creates an invite code, switches dog when several exist, and signs out.

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/Home.tsx src/routes/Profile.tsx src/index.css src/locales/fr.json
git commit -m "feat: reshape home around the daily summary and move the household to profile"
```

---

## Task 8: Training under the layout

**Files:**
- Modify: `src/routes/Training.tsx`, `src/locales/fr.json`

- [ ] **Step 1: Drop the page chrome**

In `src/routes/Training.tsx`, remove the outer `<div className="shell">` and its `<header className="topbar">` (the "← Retour" link), returning a `<>` fragment instead. Remove the now-unused `Link` import if nothing else in the file uses it.

- [ ] **Step 2: Move its strings to keys**

Replace every French literal in `src/routes/Training.tsx` — starting with the `VIEWS` array, whose entries become `{ view: 'age', key: 'training.views.age' }` and are rendered with `t(item.key)` — plus the strings in `src/components/Collections.tsx`, `src/components/DogLists.tsx`, `src/components/SkillPickerDialog.tsx`, `src/components/SkillRow.tsx` and `src/components/SkillProgress.tsx`.

Add to `src/locales/fr.json` a `training` group holding them, seeded with the view labels:

```json
"training": {
  "views": {
    "age": "Pour son âge",
    "favourites": "Favoris",
    "progress": "Progression",
    "lists": "Mes listes",
    "collections": "Listes toutes faites",
    "all": "Tout le catalogue"
  }
}
```

Add the remaining keys under the same group as you walk the files; keep the key names English and descriptive.

- [ ] **Step 3: Verify in the browser**

On `/dog/<id>/training`: the six view chips read the same as before, switching views works, the skill picker opens and saves, and the tab bar stays visible with Éducation active.

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/Training.tsx src/components/Collections.tsx src/components/DogLists.tsx src/components/SkillPickerDialog.tsx src/components/SkillRow.tsx src/components/SkillProgress.tsx src/locales/fr.json
git commit -m "refactor: move training strings to translation keys and drop its header"
```

---

## Task 9: Remaining strings

**Files:**
- Modify: `src/routes/Login.tsx`, `src/routes/Onboarding.tsx`, `src/routes/ResetPassword.tsx`, `src/routes/DogForm.tsx`, `src/routes/Setup.tsx`, `src/components/BreedPicker.tsx`, `src/components/PasswordInput.tsx`, `src/components/WeightChart.tsx`, `src/components/HeightChart.tsx`, `src/components/RateChart.tsx`, `src/lib/authErrors.ts`, `src/locales/fr.json`

- [ ] **Step 1: Find what is left**

```bash
grep -rnE "[éèêàçùîôûÉÈÀ]|'[A-Z][a-z]+ " src/routes src/components src/lib --include=*.ts --include=*.tsx
```

Every hit outside `src/locales/` is a string to move.

- [ ] **Step 2: Migrate the auth pages**

Move the strings of `Login`, `Onboarding`, `ResetPassword` and `PasswordInput` into an `auth` group in `fr.json`. `src/lib/authErrors.ts` returns French sentences today: change its functions to return key strings (`'auth.errors.invalidCredentials'`) and let the calling component pass them through `t()`.

- [ ] **Step 3: Migrate the dog form and pickers**

Move the strings of `DogForm`, `BreedPicker` and `Setup` into `dogForm`, `breedPicker` and `setup` groups. Breed names arriving from Supabase stay untranslated.

- [ ] **Step 4: Migrate chart labels**

Axis and legend labels in `WeightChart`, `HeightChart` and `RateChart` move into a `charts` group.

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint
grep -rnE "[éèêàçùîôûÉÈÀ]" src/routes src/components src/lib --include=*.ts --include=*.tsx
```

Expected: the grep returns nothing.

In the browser, walk the sign-out → login → sign-in path and the new-dog form, checking that no label renders as a raw key (a visible `auth.title` means the key is missing from `fr.json`).

- [ ] **Step 6: Commit**

```bash
git add src/routes src/components src/lib src/locales/fr.json
git commit -m "refactor: move the remaining interface strings to translation keys"
```

---

## Task 10: Final pass

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full check**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all three succeed.

- [ ] **Step 2: Walk the app**

In the browser, in order: `/` redirects to the dog, the five tabs each open their page and mark themselves active, Health shows six cards, Growth toggles between the two curves and accepts a new entry of each kind, Training works, Map and Coach show the placeholder, Profile creates an invite code and signs out. The three legacy URLs redirect. The browser console is clean.

- [ ] **Step 3: Document the structure**

In `README.md`, under the technical stack, record the tab structure and where translations live:

```markdown
L'interface est organisée en cinq onglets (Accueil, Santé, Éducation, Carte, IA Chat)
sous `DogLayout`, avec les routes en anglais (`/dog/:dogId/health/growth`). Tous les
textes visibles passent par des clés de traduction : les valeurs françaises sont dans
`src/locales/fr.json`, servies par react-i18next. Ajouter une langue revient à déposer
un fichier à côté et à l'enregistrer dans `src/lib/i18n.ts`.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe the tab structure and the translation setup"
```
