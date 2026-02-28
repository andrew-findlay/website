import manifest from '../queries/manifest.json';
import educationHistorySql from '../queries/prs__dashboard_education.sql?raw';
import experienceTimelineSql from '../queries/prs__dashboard_experience.sql?raw';
import masterCvSql from '../queries/prs__master_cv.sql?raw';
import profileOverviewSql from '../queries/prs__dashboard_profile.sql?raw';
import projectsShowcaseSql from '../queries/prs__dashboard_projects.sql?raw';
import skillsMatrixSql from '../queries/prs__dashboard_skills.sql?raw';
import type { QueryCatalogEntry, QueryId, SavedQuery } from '../types';

interface ManifestShape {
  queries: SavedQuery[];
}

const sqlByQueryId: Record<QueryId, string> = {
  profile_overview: profileOverviewSql,
  experience_timeline: experienceTimelineSql,
  skills_matrix: skillsMatrixSql,
  education_history: educationHistorySql,
  projects_showcase: projectsShowcaseSql,
  master_cv: masterCvSql
};

const parsedManifest = manifest as unknown as ManifestShape;

const savedQueries: SavedQuery[] = parsedManifest.queries.map((query) => ({
  ...query,
  tags: query.tags ?? [],
  paramsSchema: query.paramsSchema ?? {}
}));

const queryCatalogEntries: QueryCatalogEntry[] = savedQueries.map((query) => {
  const sqlText = sqlByQueryId[query.id];
  if (!sqlText) {
    throw new Error(`No SQL registered for query: ${query.id}`);
  }
  return {
    ...query,
    sqlText
  };
});

export function getSavedQueries(): SavedQuery[] {
  return savedQueries;
}

export function getSavedQueryById(queryId: QueryId): SavedQuery | undefined {
  return savedQueries.find((query) => query.id === queryId);
}

export function getSavedQuerySql(queryId: QueryId): string {
  const sql = sqlByQueryId[queryId];
  if (!sql) {
    throw new Error(`No SQL registered for query: ${queryId}`);
  }
  return sql;
}

export function getQueryCatalogEntries(): QueryCatalogEntry[] {
  return queryCatalogEntries;
}

export function getAllowedQueryIds(): QueryId[] {
  return savedQueries.map((query) => query.id);
}
