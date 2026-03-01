# careeros dbt project

Minimal dbt project that transforms CSV seed data into the layered models
powering the CareerOS portfolio site.

## Stack

- **Adapter**: `dbt-duckdb` (runs locally, no warehouse required)
- **Seed data**: `seeds/*.csv` — edit these to update CV content
- **Models**: `staging → intermediate → mart`

## Setup

```bash
pip install dbt-duckdb

# from this directory
dbt seed          # load CSVs into raw schema
dbt run           # build all views
dbt test          # run schema tests (if added)
```

A `careeros.duckdb` file is created in the project root on first run.

## Structure

```
seeds/                   ← CSV files — the only place you edit CV data
  person.csv
  role.csv
  role_achievement.csv
  skill_category.csv
  skill.csv
  person_skill.csv
  role_skill.csv
  education.csv
  certification.csv
  project.csv
  project_skill.csv

models/
  sources.yml            ← declares seed tables as dbt sources
  staging/               ← stg__*  clean, typed, no business logic
  intermediate/          ← int__*  rollups, tenure calcs, array aggs
  mart/                  ← mart__* one view per product surface
    mart__profile
    mart__timeline        ← roles + achievements + skills_used[]
    mart__skills          ← skills with context
    mart__education
    mart__projects
    mart__cv              ← stable JSON contract for the Export tab
```

## Updating CV content

All content lives in the CSV seed files — no SQL editing required for
day-to-day updates:

| Want to…                        | Edit file               |
|---------------------------------|-------------------------|
| Update summary or headline      | `seeds/person.csv`      |
| Add/edit a role                 | `seeds/role.csv`        |
| Add/edit bullet points          | `seeds/role_achievement.csv` |
| Change skill list               | `seeds/skill.csv`       |
| Change skills used in a role    | `seeds/role_skill.csv`  |
| Add education                   | `seeds/education.csv`   |
| Add a project                   | `seeds/project.csv`     |

After editing, run `dbt seed && dbt run` to rebuild.
