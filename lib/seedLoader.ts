/**
 * lib/seedLoader.ts
 *
 * Fetches CSV seed files from public/seeds/ and loads them into the
 * in-memory DuckDB instance using COPY … FROM (FORMAT CSV).
 *
 * This replaces the large inline INSERT statements that used to live in
 * data/schema.ts. The CSV files are the single source of truth and also
 * serve as the dbt seed inputs.
 */

import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

const SEEDS = [
  'person',
  'contact_method',
  'social_profile',
  'employer',
  'role',
  'role_achievement',
  'skill_category',
  'skill',
  'person_skill',
  'role_skill',
  'education',
  'certification',
  'project',
  'project_skill',
] as const;

type SeedName = typeof SEEDS[number];

/**
 * Resolve the URL for a seed CSV.
 * Works both locally (Vite dev server) and in production (Vercel).
 */
function seedUrl(name: SeedName): string {
  return new URL(`../public/seeds/${name}.csv`, import.meta.url).href;
}

/**
 * Fetch a CSV file and return its text content.
 */
async function fetchCsv(name: SeedName): Promise<string> {
  const url = seedUrl(name);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch seed CSV: ${name} (${response.status} ${url})`);
  }
  return response.text();
}

/**
 * Load all seed CSVs into DuckDB in dependency order.
 * Each CSV is registered as a virtual file then read via read_csv_auto().
 */
export async function loadSeedsFromCsv(db: AsyncDuckDB): Promise<void> {
  const conn = await db.connect();

  try {
    for (const name of SEEDS) {
      const csvText = await fetchCsv(name);

      // Register CSV as an in-memory file that DuckDB can read
      await db.registerFileText(`seed_${name}.csv`, csvText);

      // Insert into the corresponding table (already created by INIT_SQL DDL)
      await conn.query(
        `INSERT INTO ${name} SELECT * FROM read_csv_auto('seed_${name}.csv', header=true, nullstr='');`
      );
    }
  } finally {
    await conn.close();
  }
}
