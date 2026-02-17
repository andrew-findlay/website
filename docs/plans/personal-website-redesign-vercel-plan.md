# Personal Website Redesign and Vercel Deployment Plan

## Context and goals
- Transform the current SQL Portfolio prototype into a robust personal website.
- Keep the SQL-first concept: saved queries, file-browser navigation, and a master query powering the CV view.
- Add a BI/visualization view and a polished rendered CV page based on the attached CV design.
- Deploy safely to Vercel with preview environments and CI quality gates.

## Current-state review (repo-based)
- Existing app: React + Vite single-page app with in-browser DuckDB-WASM query execution.
- Strengths: SQL editor metaphor, query execution, schema explorer, basic results export UX.
- Gaps:
  - No CI workflows in `.github/workflows`.
  - No automated tests or lint/typecheck scripts in `package.json`.
  - Data model is small and hardcoded in `constants.ts`.
  - Export modal is mostly UI and not a complete production export/render pipeline.
  - No robust deployment config or environment strategy for Vercel.

## Target architecture
- Frontend: Next.js (App Router) + TypeScript strict mode.
- Data: managed Postgres (Neon or Supabase) with migration tooling (Drizzle recommended).
- Runtime:
  - Public read-only routes for profile/cv/insights.
  - Controlled query-runner endpoint to execute only approved saved queries.
- Observability: Sentry + Vercel Analytics.

## Relational data model (CV + LinkedIn coverage)
Core entities:
- `person`
- `contact_method`
- `social_profile`
- `employer`
- `role`
- `role_achievement`
- `skill_category`
- `skill`
- `person_skill`
- `education`
- `certification`
- `project`
- `project_skill`
- `publication_or_talk` (optional)

Design notes:
- Normalize experience and skills; preserve display order fields for CV rendering.
- Track date precision and nullability for current roles.
- Include metadata fields for source (`cv`, `linkedin`, `manual`) and last-updated timestamp.

## Query system design
Repository structure:
- `queries/profile_overview.sql`
- `queries/experience_timeline.sql`
- `queries/skills_matrix.sql`
- `queries/education_history.sql`
- `queries/projects_showcase.sql`
- `queries/master_cv.sql`
- `queries/manifest.json`

Execution model:
- UI file browser lists saved queries from `manifest.json`.
- Production query execution is whitelist-only by query ID.
- `master_cv.sql` returns a stable JSON contract consumed by CV and API layers.

## UX/UI redesign direction
Primary product surfaces:
- Explorer: saved queries and metadata.
- Workspace: editor/read-only SQL view + results.
- Master CV: composite output from `master_cv.sql`.
- Insights: BI-style visualizations (timeline, skill matrix, progression).
- Rendered CV page: printable, responsive, visually aligned with the attached CV style.

Design requirements:
- Strong visual hierarchy and readability.
- Mobile-first responsiveness.
- Accessibility baseline: semantic structure, keyboard support, contrast compliance.
- Print CSS for high-quality PDF export.

## Testing and quality gates
Add scripts and tooling for:
- Lint (`eslint`)
- Typecheck (`tsc --noEmit`)
- Unit tests (Vitest)
- Component tests (Testing Library)
- E2E tests (Playwright)
- Accessibility checks (`axe`)

Critical E2E scenarios:
- Saved query navigation and execution.
- Master CV query generation.
- Rendered CV page integrity.
- Insights page load and key visuals.
- Export/download behavior.

## CI/CD and Vercel rollout
Branching and protections:
- Protected `main` branch.
- Required PR reviews and required status checks.

GitHub Actions pipeline (PR and main):
1. Install dependencies
2. Lint
3. Typecheck
4. Unit/component tests
5. Build
6. E2E against preview deployment

Vercel strategy:
- PRs -> Preview deployments.
- `main` -> Production deployment only after checks pass.
- Separate preview vs production environment variables.
- Rollback path via Vercel deployment history.

## Delivery phases
Phase 0: Discovery and design (2-3 days)
- Finalize schema, UI architecture, and migration approach.

Phase 1: Foundations (4-6 days)
- Scaffold Next.js app, DB integration, migrations, seed/import pipeline.

Phase 2: Query platform (4-6 days)
- Build saved-query browser, whitelist query-runner, and `master_cv.sql` contract.

Phase 3: Product surfaces (4-6 days)
- Build Explorer/Workspace, Insights page, and CV render page.

Phase 4: Hardening (3-4 days)
- Add comprehensive tests, accessibility checks, and observability.

Phase 5: Release (1-2 days)
- Configure Vercel projects/envs, enable branch protections, and go live.

## Definition of done
- Full relational model supports CV + LinkedIn-like profile depth.
- Saved queries + master CV query are stable and tested.
- Rendered CV and insights pages are production-ready and responsive.
- CI checks are required and green for merge.
- Vercel preview flow is active for every PR; production deploy is controlled.

## Risks and mitigations
- Data completeness risk: LinkedIn data availability may be partial.
  - Mitigation: add import + manual override workflow with source tracking.
- Query safety risk: arbitrary SQL execution in production.
  - Mitigation: strict whitelist execution by ID and read-only DB role.
- Regression risk during redesign.
  - Mitigation: incremental rollout behind feature flags + CI gates.
