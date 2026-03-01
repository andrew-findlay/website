# CareerOS — project context

## What this is
Analytics engineer personal portfolio site. React + Vite + DuckDB-WASM.
SQL-first concept — the CV is a queryable data product.

## Architecture (agreed design)
- Seed data lives in `dbt_project/seeds/*.csv` — only place CV content is edited
- GitHub Action (`.github/workflows/build-db.yml`) runs dbt on push to main,
  exports `careeros.duckdb` and commits it to `public/db/`
- Browser fetches the pre-built `.duckdb` file via `lib/db.ts` — no schema setup at runtime
- `schema.ts` and `seedLoader.ts` are deleted — dbt owns everything

## dbt project structure
seeds/ → staging (stg__) → intermediate (int__) → mart (mart__)
mart__cv is the stable JSON contract for the Export tab

## Key decisions made
- Skills matrix: simple tag cloud by category, no proficiency %, no bars
- Skills: SQL + Python / Snowflake + BigQuery + MySQL / dbt Core + dbt Cloud + Looker / Fivetran + Airbyte / Terraform / Claude Code
- Experience bullets fleshed out from full CV detail
- Fonts: Sora + JetBrains Mono
- Terminal boot sequence on load, animated metric countersjust