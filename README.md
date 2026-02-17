# DuckDB SQL Portfolio

This project implements the personal website redesign as a SQL-first experience powered by DuckDB.

## Implemented surfaces
- Explorer: Saved query manifest with SQL files in `queries/`.
- Workspace: Query viewer + runner with whitelist execution for saved queries.
- Master CV: Rendered printable CV backed by `master_cv.sql` contract.
- Insights: Experience timeline and skills matrix visualizations.
- Schema: Relational model browser for the CV data model.

## Data and query model
- Relational schema + seed data live in `data/schema.ts`.
- Contract views are materialized in DuckDB for UI stability:
  - `v_profile_overview`
  - `v_experience_timeline`
  - `v_skills_matrix`
  - `v_education_history`
  - `v_projects_showcase`
  - `v_master_cv`
- Query repository:
  - `queries/profile_overview.sql`
  - `queries/experience_timeline.sql`
  - `queries/skills_matrix.sql`
  - `queries/education_history.sql`
  - `queries/projects_showcase.sql`
  - `queries/master_cv.sql`
  - `queries/manifest.json`
- Manifest entries include contract metadata (`contractName`, `contractVersion`) and param schemas.
- Query runner only permits IDs present in the manifest, validates params, and logs to:
  - `query_catalog` (catalog snapshot)
  - `query_run_event` (execution telemetry)

## Local development
Prerequisites: Node.js 20+

1. Install dependencies:
   `npm ci`
2. Start dev server:
   `npm run dev`
3. Build preview:
   `npm run build && npm run preview`

## Quality gates
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Unit/component tests: `npm run test`
- E2E tests: `npm run test:e2e`

## CI/CD
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Vercel project config: `vercel.json`
- Recommended branch protection: require `quality` and `e2e` jobs on `main`.
- Optional preview e2e target: set repository variable `PLAYWRIGHT_BASE_URL` to run Playwright against a deployed preview URL instead of starting a local dev server.

## Notes
- This implementation keeps DuckDB as the SQL engine/backend.
- Saved queries are read-only contracts. Scratchpad remains editable for local ad-hoc SQL.
