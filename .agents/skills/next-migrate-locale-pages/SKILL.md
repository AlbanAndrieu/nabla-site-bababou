---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Next.js Migration Skill — Best Practices (EN)

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

---

## IMPORTANT: i18n message ownership

First-class Next.js translations are domain-owned. The runtime loads explicit catalogs from `i18n/messages.ts`, currently under `messages/site`, `messages/contact`, `messages/email`, `messages/link` and `messages/checkout`.

When adding or migrating a page:

- Do **not** add new runtime namespaces to the legacy root `messages/en.json` or `messages/fr.json`; those files are versioned compatibility artifacts and are not loaded by Next.js.
- Choose an existing domain or create a focused `messages/<domain>/{fr,en,de,no}.json` catalog.
- Keep exactly one owner for each top-level namespace and register the domain loader in `i18n/messages.ts`.
- Update all four first-class locales together unless the route itself is intentionally unavailable in a locale.
- Preserve unrelated domain catalogs and validate the diff plus the i18n contract tests before publication.

---

## Migration traps: rewrites, redirects & legacy HTML

**Always check for rewrites or redirects that might shadow your React app with static HTML or legacy content!**

- Examine `vercel.json`, `next.config.mjs`, etc for:
  - `{ "source": "/jm", "destination": "/jm/index.html" }`
  - `/{slug}.html -> /[locale]/{slug}` or inverse
  - Home/policy/landing rewrites
- A fallback or rewrite can shadow even a migrated app route!

**Rule:**
- If a React page exists in `app/[locale]/...`, never update the static HTML.
- Only migrate a rewrite/Fallback after true parity.
- When ready, REMOVE obsolete rewrites.
---

## Migration process (core)

**Global pattern for Next.js migration:**
- NEVER import or code JSX of nav/footer/cta into page-specific files (`page.tsx`): ALL such UI must come from the layout global (`layout.tsx` or shared global component).
- After migration, always remove nav/footer UI and back/nav CTAs from pages — dupes in both page and layout create SSR/CSR bugs and UX confusion.
- Apply this pattern to all migrated pages (EN/FR).

**Best practice for large HTML pages (block-by-block subcomponent migration):**
- Any migration of a large static HTML **must** be split into multiple React subcomponents — one per logical section (Hero, content groups, timeline, references, etc.).
- For each section, create a focused React component and extract visible labels to the page's domain catalogs under `messages/<domain>/{fr,en,de,no}.json`.
- The final page (`page.tsx`) assembles these components, eliminating risk of missing context, truncated exports, or token overflow.
- This segmentation ensures: no section loss, maintainable UX, and industrialized i18n.
- Use this approach **systematically** for every page too large to migrate as a single export/file.

---

**Choose the model**

- Prefer native React + message catalogs for actively maintained/shared pages.
- Use server-side extraction only for legacy static pages.

---

## Accessibility and contrast parity

Contrast is part of migration parity, not a visual-polish follow-up. A page is not ready for legacy redirect/removal merely because it builds or looks acceptable in one theme.

For migrated or materially edited public surfaces:

- Target WCAG 2.2 AA contrast thresholds: normal text `>= 4.5:1`, large text `>= 3:1`, and non-text UI/focus indicators that carry meaning `>= 3:1` against adjacent colors.
- Exercise `light`, `dark`, and `auto` theme behavior where the surface supports the shared theme contract. For `auto`, make the system color scheme deterministic in Playwright before asserting the effective theme.
- Prefer browser-computed foreground/background ratios in Playwright for representative text and controls. Static token assertions are useful, but they do not prove the final cascade after Bootstrap, legacy CSS, or runtime theme changes.
- Do not hide a transient contrast failure behind an arbitrary sleep. If a theme transition briefly crosses below the required ratio, change the transition/foreground-background pairing so the complete state change remains readable.
- On retained legacy HTML, Bootstrap compatibility overrides belong in `public/legacy-contrast.css`. Keep them narrowly scoped to the legacy boundary and use `!important` only where required to beat Bootstrap utilities that already use `!important`.
- Native Next.js surfaces must use the shared semantic `--ui-*` design tokens and must not load Bootstrap or `legacy-contrast.css` merely to satisfy contrast.
- Preserve `prefers-reduced-motion`, keyboard focus visibility, reflow, and the repository's protected homepage/404 contracts while correcting contrast.
- Focused contrast tests establish regression coverage for the checked surfaces; they do **not** by themselves claim site-wide WCAG conformance.

---

## KEY RULE FOR TRANSLATION FILES

Whenever you add a new page or translation key:

- update the owning domain catalog, not the retired root catalogs;
- keep FR/EN/DE/NO structurally aligned;
- never replace or truncate unrelated namespaces;
- add a new loader in `i18n/messages.ts` only when introducing a genuinely new domain;
- validate namespace uniqueness and route parity before removing any legacy HTML fallback.

---
