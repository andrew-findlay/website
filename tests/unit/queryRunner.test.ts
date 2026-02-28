import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runQuery: vi.fn(),
  executeStatement: vi.fn(),
  parseMasterCv: vi.fn()
}));

vi.mock('../../lib/db', () => ({
  runQuery: mocks.runQuery,
  executeStatement: mocks.executeStatement
}));

vi.mock('../../lib/masterCv', () => ({
  parseMasterCvResult: mocks.parseMasterCv
}));

vi.mock('../../lib/queryRepository', () => ({
  getAllowedQueryIds: vi.fn(() => ['skills_matrix', 'master_cv']),
  getSavedQueryById: vi.fn((queryId: string) => {
    if (queryId === 'skills_matrix') {
      return {
        id: 'skills_matrix',
        file: 'prs__dashboard_skills.sql',
        title: 'Skills Matrix',
        description: 'Skills',
        surface: 'Insights',
        readOnly: true,
        contractName: 'prs__dashboard_skills',
        contractVersion: '1.0.0',
        resultShape: 'table',
        tags: ['insights'],
        paramsSchema: {
          person_id: { type: 'number', default: 1, minimum: 1, maximum: 999999 },
          min_proficiency: { type: 'number', default: 0, minimum: 0, maximum: 100 }
        }
      };
    }

    if (queryId === 'master_cv') {
      return {
        id: 'master_cv',
        file: 'prs__master_cv.sql',
        title: 'Master CV',
        description: 'Master',
        surface: 'CV',
        readOnly: true,
        contractName: 'prs__master_cv',
        contractVersion: '1.0.0',
        resultShape: 'json_contract',
        tags: ['cv'],
        paramsSchema: {
          person_id: { type: 'number', default: 1, minimum: 1, maximum: 999999 }
        }
      };
    }

    return undefined;
  }),
  getSavedQuerySql: vi.fn((queryId: string) => {
    if (queryId === 'skills_matrix') {
      return 'SELECT * FROM prs__dashboard_skills WHERE person_id = {{person_id}} AND proficiency >= {{min_proficiency}};';
    }
    if (queryId === 'master_cv') {
      return 'SELECT cv FROM prs__master_cv WHERE person_id = {{person_id}};';
    }
    throw new Error('Unknown query');
  }),
  getQueryCatalogEntries: vi.fn(() => [
    {
      id: 'skills_matrix',
      file: 'prs__dashboard_skills.sql',
      title: 'Skills Matrix',
      description: 'Skills',
      surface: 'Insights',
      readOnly: true,
      contractName: 'prs__dashboard_skills',
      contractVersion: '1.0.0',
      resultShape: 'table',
      tags: ['insights'],
      paramsSchema: {
        person_id: { type: 'number', default: 1, minimum: 1, maximum: 999999 },
        min_proficiency: { type: 'number', default: 0, minimum: 0, maximum: 100 }
      },
      sqlText:
        'SELECT * FROM prs__dashboard_skills WHERE person_id = {{person_id}} AND proficiency >= {{min_proficiency}};'
    },
    {
      id: 'master_cv',
      file: 'prs__master_cv.sql',
      title: 'Master CV',
      description: 'Master',
      surface: 'CV',
      readOnly: true,
      contractName: 'prs__master_cv',
      contractVersion: '1.0.0',
      resultShape: 'json_contract',
      tags: ['cv'],
      paramsSchema: {
        person_id: { type: 'number', default: 1, minimum: 1, maximum: 999999 }
      },
      sqlText: 'SELECT cv FROM prs__master_cv WHERE person_id = {{person_id}};'
    }
  ])
}));

import { executeSavedQuery } from '../../lib/queryRunner';

describe('executeSavedQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compiles sql with validated default params and logs events', async () => {
    mocks.runQuery.mockResolvedValue({
      columns: [{ key: 'skill', label: 'skill', type: 'VARCHAR' }],
      data: [{ skill: 'SQL' }],
      executionTime: '0.001s',
      affectedRows: 1
    });

    const execution = await executeSavedQuery('skills_matrix');

    expect(execution.params).toEqual({ person_id: 1, min_proficiency: 0 });
    expect(execution.compiledSql).toContain('person_id = 1');
    expect(execution.compiledSql).toContain('proficiency >= 0');
    expect(mocks.runQuery).toHaveBeenCalledTimes(1);
    expect(mocks.executeStatement).toHaveBeenCalled();
  });

  it('throws on invalid param value', async () => {
    mocks.runQuery.mockResolvedValue({
      columns: [],
      data: [],
      executionTime: '0.001s',
      affectedRows: 0
    });

    await expect(
      executeSavedQuery('skills_matrix', { min_proficiency: 1000 })
    ).rejects.toThrow(/above maximum/);
  });
});
