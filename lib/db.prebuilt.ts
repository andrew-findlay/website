/**
 * lib/db.ts
 *
 * Initialises DuckDB-WASM by fetching the pre-built careeros.duckdb file
 * that was exported by the GitHub Actions dbt build pipeline.
 *
 * No schema setup, no CSV loading, no inline SQL — the database arrives
 * fully built. The browser just opens it.
 */

import * as duckdb from '@duckdb/duckdb-wasm';

const DB_URL = '/db/careeros.duckdb';

let _db: duckdb.AsyncDuckDB | null = null;

export async function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;

  // Pick the right WASM bundle for this browser
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Fetch the pre-built database file
  const response = await fetch(DB_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch database: ${response.status} ${DB_URL}. ` +
      `Run the GitHub Action (or 'dbt seed && dbt run' locally) to build it first.`
    );
  }

  const buffer = await response.arrayBuffer();

  // Register the file buffer and open it
  await db.registerFileBuffer('careeros.duckdb', new Uint8Array(buffer));
  await db.open({ path: 'careeros.duckdb', accessMode: duckdb.DuckDBAccessMode.READ_ONLY });

  URL.revokeObjectURL(worker_url);
  _db = db;
  return db;
}

/** Run a read-only query and return rows as plain objects. */
export async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((row) => row.toJSON());
  } finally {
    await conn.close();
  }
}

/** Execute a statement with no return value (for admin use in dev). */
export async function executeStatement(sql: string): Promise<void> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    await conn.query(sql);
  } finally {
    await conn.close();
  }
}
