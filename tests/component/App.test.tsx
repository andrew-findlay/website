import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/db', () => ({
  initDB: vi.fn(async () => undefined),
  runQuery: vi.fn(async () => ({
    columns: [{ key: 'value', label: 'value', type: 'INTEGER' }],
    data: [{ value: 1 }],
    executionTime: '0.001s',
    affectedRows: 1
  }))
}));

vi.mock('../../lib/queryRepository', () => ({
  getSavedQueries: vi.fn(() => [
    {
      id: 'profile_overview',
      file: 'profile_overview.sql',
      title: 'Profile Overview',
      description: 'Profile',
      surface: 'Explorer',
      readOnly: true
    },
    {
      id: 'master_cv',
      file: 'master_cv.sql',
      title: 'Master CV',
      description: 'Master contract',
      surface: 'CV',
      readOnly: true
    }
  ]),
  getSavedQuerySql: vi.fn(() => 'SELECT 1 AS value;')
}));

vi.mock('../../lib/queryRunner', () => ({
  executeSavedQuery: vi.fn(async (queryId: string) => {
    if (queryId === 'master_cv') {
      return {
        result: {
          columns: [{ key: 'cv', label: 'cv', type: 'STRUCT' }],
          data: [
            {
              cv: {
                person: {
                  name: 'Andrew Findlay',
                  headline: 'Senior Data Engineer',
                  location: 'United States',
                  summary: 'Summary'
                },
                contact_methods: [],
                social_profiles: [],
                experience: [],
                skills: [],
                education: [],
                certifications: [],
                projects: [],
                talks: [],
                updated_at: '2026-01-01'
              }
            }
          ],
          executionTime: '0.001s',
          affectedRows: 1
        },
        masterCv: {
          person: {
            name: 'Andrew Findlay',
            headline: 'Senior Data Engineer',
            location: 'United States',
            summary: 'Summary'
          },
          contact_methods: [],
          social_profiles: [],
          experience: [],
          skills: [],
          education: [],
          certifications: [],
          projects: [],
          talks: [],
          updated_at: '2026-01-01'
        }
      };
    }

    return {
      result: {
        columns: [{ key: 'value', label: 'value', type: 'INTEGER' }],
        data: [{ value: 1 }],
        executionTime: '0.001s',
        affectedRows: 1
      },
      masterCv: null
    };
  })
}));

import App from '../../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation and saved query explorer', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /DuckDB SQL Portfolio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Master CV/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('list', { name: /Saved queries/i })).toBeInTheDocument();
    });
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/DuckDB ready/i)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
