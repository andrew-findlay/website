import { executeStatement, runQuery } from './db';
import { parseMasterCvResult } from './masterCv';
import { getAllowedQueryIds, getQueryCatalogEntries, getSavedQueryById, getSavedQuerySql } from './queryRepository';
import type {
  MasterCvContract,
  QueryId,
  QueryParamDefinition,
  QueryParams,
  QueryParamValue,
  QueryResult,
  SavedQuery
} from '../types';

const ALLOWED_QUERY_IDS = new Set<QueryId>(getAllowedQueryIds());

let catalogSynced = false;

export interface SavedQueryExecution {
  runId: string;
  params: Record<string, QueryParamValue>;
  compiledSql: string;
  result: QueryResult;
  masterCv: MasterCvContract | null;
}

function toSqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function toSqlLiteral(value: QueryParamValue): string {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  return toSqlStringLiteral(value);
}

function validateParamValue(
  queryId: QueryId,
  paramName: string,
  definition: QueryParamDefinition,
  value: QueryParamValue
): QueryParamValue {
  if (definition.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Query ${queryId} expected numeric param ${paramName}`);
    }
    if (definition.minimum !== undefined && value < definition.minimum) {
      throw new Error(`Query ${queryId} param ${paramName} is below minimum ${definition.minimum}`);
    }
    if (definition.maximum !== undefined && value > definition.maximum) {
      throw new Error(`Query ${queryId} param ${paramName} is above maximum ${definition.maximum}`);
    }
  }

  if (definition.type === 'string' && typeof value !== 'string') {
    throw new Error(`Query ${queryId} expected string param ${paramName}`);
  }

  if (definition.type === 'boolean' && typeof value !== 'boolean') {
    throw new Error(`Query ${queryId} expected boolean param ${paramName}`);
  }

  if (definition.enum && definition.enum.length > 0 && !definition.enum.includes(value)) {
    throw new Error(`Query ${queryId} param ${paramName} value is not in the allowed enum`);
  }

  return value;
}

function resolveQueryParams(query: SavedQuery, suppliedParams?: QueryParams): Record<string, QueryParamValue> {
  const supplied = suppliedParams ?? {};
  const schema = query.paramsSchema ?? {};

  for (const suppliedName of Object.keys(supplied)) {
    if (!Object.prototype.hasOwnProperty.call(schema, suppliedName)) {
      throw new Error(`Query ${query.id} received unsupported param: ${suppliedName}`);
    }
  }

  const resolved: Record<string, QueryParamValue> = {};

  for (const [paramName, definition] of Object.entries(schema)) {
    const suppliedValue = supplied[paramName];
    let candidateValue = suppliedValue;

    if (candidateValue === undefined) {
      candidateValue = definition.default;
    }

    if (candidateValue === undefined) {
      if (definition.required) {
        throw new Error(`Query ${query.id} is missing required param: ${paramName}`);
      }
      continue;
    }

    resolved[paramName] = validateParamValue(
      query.id,
      paramName,
      definition,
      candidateValue
    );
  }

  return resolved;
}

function compileQueryTemplate(sqlTemplate: string, params: Record<string, QueryParamValue>): string {
  return sqlTemplate.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      throw new Error(`Missing value for SQL template placeholder: ${key}`);
    }
    return toSqlLiteral(params[key]);
  });
}

function createRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function ensureQueryCatalogSnapshot(): Promise<void> {
  if (catalogSynced) {
    return;
  }

  const entries = getQueryCatalogEntries();
  for (const entry of entries) {
    const paramsSchemaJson = JSON.stringify(entry.paramsSchema);

    await executeStatement(
      `DELETE FROM query_catalog WHERE query_id = ${toSqlStringLiteral(entry.id)};`
    );

    await executeStatement(
      `INSERT INTO query_catalog (
        query_id,
        title,
        surface,
        contract_name,
        contract_version,
        read_only,
        params_schema_json,
        sql_text,
        updated_at
      ) VALUES (
        ${toSqlStringLiteral(entry.id)},
        ${toSqlStringLiteral(entry.title)},
        ${toSqlStringLiteral(entry.surface)},
        ${toSqlStringLiteral(entry.contractName)},
        ${toSqlStringLiteral(entry.contractVersion)},
        ${entry.readOnly ? 'TRUE' : 'FALSE'},
        ${toSqlStringLiteral(paramsSchemaJson)},
        ${toSqlStringLiteral(entry.sqlText)},
        NOW()
      );`
    );
  }

  catalogSynced = true;
}

async function writeRunEvent(
  runId: string,
  queryId: QueryId,
  params: Record<string, QueryParamValue>,
  result: QueryResult,
  elapsedMs: number
): Promise<void> {
  const paramsJson = JSON.stringify(params);
  const errorLiteral = result.error ? toSqlStringLiteral(result.error) : 'NULL';

  await executeStatement(
    `INSERT INTO query_run_event (
      run_id,
      query_id,
      executed_at,
      success,
      duration_ms,
      row_count,
      params_json,
      error_message
    ) VALUES (
      ${toSqlStringLiteral(runId)},
      ${toSqlStringLiteral(queryId)},
      NOW(),
      ${result.error ? 'FALSE' : 'TRUE'},
      ${elapsedMs.toFixed(3)},
      ${result.affectedRows},
      ${toSqlStringLiteral(paramsJson)},
      ${errorLiteral}
    );`
  );
}

export async function executeSavedQuery(
  queryId: QueryId,
  params?: QueryParams
): Promise<SavedQueryExecution> {
  if (!ALLOWED_QUERY_IDS.has(queryId)) {
    throw new Error(`Query ${queryId} is not permitted`);
  }

  const query = getSavedQueryById(queryId);
  if (!query) {
    throw new Error(`Query ${queryId} is missing from manifest`);
  }

  await ensureQueryCatalogSnapshot();

  const resolvedParams = resolveQueryParams(query, params);
  const sqlTemplate = getSavedQuerySql(queryId);
  const compiledSql = compileQueryTemplate(sqlTemplate, resolvedParams);

  const runId = createRunId();
  const start = performance.now();
  const result = await runQuery(compiledSql);
  const elapsedMs = performance.now() - start;

  try {
    await writeRunEvent(runId, queryId, resolvedParams, result, elapsedMs);
  } catch (error) {
    console.warn('Failed to write query_run_event', error);
  }

  return {
    runId,
    params: resolvedParams,
    compiledSql,
    result,
    masterCv: queryId === 'master_cv' ? parseMasterCvResult(result) : null
  };
}
