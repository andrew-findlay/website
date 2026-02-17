import { describe, expect, it } from 'vitest';
import { getSavedQueries, getSavedQuerySql } from '../../lib/queryRepository';

describe('query repository', () => {
  it('contains expected saved query ids and SQL payloads', () => {
    const queries = getSavedQueries();
    const queryIds = queries.map((query) => query.id);

    expect(queryIds).toContain('master_cv');
    expect(queryIds).toContain('skills_matrix');
    expect(queries.length).toBeGreaterThanOrEqual(6);

    for (const query of queries) {
      const sql = getSavedQuerySql(query.id);
      expect(sql.trim().length).toBeGreaterThan(20);
      expect(sql.toUpperCase()).toContain('SELECT');
    }
  });
});
