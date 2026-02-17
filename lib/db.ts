import * as duckdb from '@duckdb/duckdb-wasm';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { INIT_SQL } from '../data/schema';
import type { QueryResult } from '../types';

let db: AsyncDuckDB | null = null;
let conn: AsyncDuckDBConnection | null = null;
let initPromise: Promise<void> | null = null;

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      normalized[key] = normalizeValue(entry);
    }
    return normalized;
  }
  return value;
}

async function createDbConnection(): Promise<void> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger();

  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  conn = await db.connect();

  for (const sql of INIT_SQL) {
    await conn.query(sql);
  }
}

export async function initDB(): Promise<void> {
  if (conn) {
    return;
  }
  if (!initPromise) {
    initPromise = createDbConnection().catch((error) => {
      db = null;
      conn = null;
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export async function runQuery(sql: string): Promise<QueryResult> {
  await initDB();
  if (!conn) {
    throw new Error('DuckDB connection unavailable');
  }

  const start = performance.now();
  try {
    const result = await conn.query(sql);
    const elapsedMs = performance.now() - start;

    const columns = result.schema.fields.map((field) => ({
      key: field.name,
      label: field.name,
      type: String(field.type)
    }));

    const data = result.toArray().map((row) => {
      const raw = row as Record<string, unknown>;
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        normalized[key] = normalizeValue(value);
      }
      return normalized;
    });

    return {
      columns,
      data,
      executionTime: `${(elapsedMs / 1000).toFixed(3)}s`,
      affectedRows: data.length
    };
  } catch (error) {
    return {
      columns: [],
      data: [],
      executionTime: '0.000s',
      affectedRows: 0,
      error: error instanceof Error ? error.message : 'Query execution failed'
    };
  }
}

export async function executeStatement(sql: string): Promise<void> {
  await initDB();
  if (!conn) {
    throw new Error('DuckDB connection unavailable');
  }
  await conn.query(sql);
}
