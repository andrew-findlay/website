# DuckDB SQL Portfolio

This project implements the personal website redesign as a SQL-first experience powered by DuckDB.

## Implemented surfaces
- Dashboard: CV-meets-product dashboard powered by presentation-layer contracts.
- Data Explorer: dbt-style browsing across warehouse objects and layered model files.
- Export: Embedded and downloadable PDF CV experience.

## Data and query model
- Relational schema + seed data live in `data/schema.ts`.
- Layered semantic models are materialized in DuckDB:
  - Warehouse source tables: `person`, `role`, `skill`, etc.
  - `stg__*`: normalized staging models
  - `int__*`: intermediate rollups and scoring models
  - `dmn__*`: domain-ready business entities
  - `prs__dashboard_*`: dashboard presentation contracts
  - `prs__master_cv`: stable JSON CV contract
- Query repository:
  - `queries/prs__dashboard_profile.sql`
  - `queries/prs__dashboard_experience.sql`
  - `queries/prs__dashboard_skills.sql`
  - `queries/prs__dashboard_education.sql`
  - `queries/prs__dashboard_projects.sql`
  - `queries/prs__master_cv.sql`
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
- Dashboard widgets consume presentation contracts (`prs__dashboard_*`) only.
- Saved query contracts are read-only; Explorer supports editable read-only SQL execution for ad-hoc inspection.
