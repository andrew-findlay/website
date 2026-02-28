import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange
  }: {
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <textarea
      aria-label="Warehouse SQL"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}));

vi.mock('../../lib/db', () => ({
  initDB: vi.fn(async () => undefined),
  runQuery: vi.fn(async () => ({
    columns: [
      { key: 'role_title', label: 'role_title', type: 'VARCHAR' },
      { key: 'employer', label: 'employer', type: 'VARCHAR' }
    ],
    data: [{ role_title: 'Analytics Engineer', employer: 'The Orchard' }],
    executionTime: '0.004s',
    affectedRows: 1
  }))
}));

vi.mock('../../lib/queryRunner', () => ({
  executeSavedQuery: vi.fn(async (queryId: string) => {
    if (queryId === 'profile_overview') {
      return {
        result: {
          columns: [
            { key: 'full_name', label: 'full_name', type: 'VARCHAR' },
            { key: 'headline', label: 'headline', type: 'VARCHAR' },
            { key: 'location', label: 'location', type: 'VARCHAR' },
            { key: 'summary', label: 'summary', type: 'VARCHAR' }
          ],
          data: [
            {
              full_name: 'Andrew Findlay',
              headline: 'Analytics Engineer',
              location: 'London, United Kingdom',
              summary: 'Summary'
            }
          ],
          executionTime: '0.001s',
          affectedRows: 1
        },
        masterCv: null
      };
    }

    if (queryId === 'experience_timeline') {
      return {
        result: {
          columns: [
            { key: 'id', label: 'id', type: 'INTEGER' },
            { key: 'employer', label: 'employer', type: 'VARCHAR' },
            { key: 'title', label: 'title', type: 'VARCHAR' },
            { key: 'start_date', label: 'start_date', type: 'DATE' },
            { key: 'end_date', label: 'end_date', type: 'DATE' },
            { key: 'is_current', label: 'is_current', type: 'BOOLEAN' },
            { key: 'summary', label: 'summary', type: 'VARCHAR' },
            { key: 'achievements', label: 'achievements', type: 'LIST' }
          ],
          data: [
            {
              id: 1,
              employer: 'The Orchard',
              title: 'Analytics Engineer',
              start_date: '2023-03-01',
              end_date: null,
              is_current: true,
              summary: 'Role summary',
              achievements: ['Built dbt CI']
            }
          ],
          executionTime: '0.002s',
          affectedRows: 1
        },
        masterCv: null
      };
    }

    if (queryId === 'skills_matrix') {
      return {
        result: {
          columns: [
            { key: 'category', label: 'category', type: 'VARCHAR' },
            { key: 'skill', label: 'skill', type: 'VARCHAR' },
            { key: 'proficiency', label: 'proficiency', type: 'INTEGER' },
            { key: 'highlighted', label: 'highlighted', type: 'BOOLEAN' }
          ],
          data: [
            { category: 'Warehousing & SQL', skill: 'SQL', proficiency: 96, highlighted: true },
            { category: 'Orchestration & Transform', skill: 'dbt', proficiency: 93, highlighted: true }
          ],
          executionTime: '0.002s',
          affectedRows: 2
        },
        masterCv: null
      };
    }

    if (queryId === 'projects_showcase') {
      return {
        result: {
          columns: [
            { key: 'id', label: 'id', type: 'INTEGER' },
            { key: 'name', label: 'name', type: 'VARCHAR' }
          ],
          data: [{ id: 1, name: 'Analytics Workflow Modernisation' }],
          executionTime: '0.002s',
          affectedRows: 1
        },
        masterCv: null
      };
    }

    if (queryId === 'master_cv') {
      return {
        result: {
          columns: [{ key: 'cv', label: 'cv', type: 'STRUCT' }],
          data: [
            {
              cv: {
                person: {
                  name: 'Andrew Findlay',
                  headline: 'Analytics Engineer',
                  location: 'London, United Kingdom',
                  summary: 'Summary'
                },
                contact_methods: [{ kind: 'email', value: 'hello@andrewfindlay.io' }],
                social_profiles: [],
                experience: [],
                skills: [],
                education: [],
                certifications: [],
                projects: [],
                talks: [],
                updated_at: '2026-02-20'
              }
            }
          ],
          executionTime: '0.001s',
          affectedRows: 1
        },
        masterCv: {
          person: {
            name: 'Andrew Findlay',
            headline: 'Analytics Engineer',
            location: 'London, United Kingdom',
            summary: 'Summary'
          },
          contact_methods: [{ kind: 'email', value: 'hello@andrewfindlay.io' }],
          social_profiles: [],
          experience: [],
          skills: [],
          education: [],
          certifications: [],
          projects: [],
          talks: [],
          updated_at: '2026-02-20'
        }
      };
    }

    return {
      result: {
        columns: [],
        data: [],
        executionTime: '0.001s',
        affectedRows: 0
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

  it('renders three-tab shell and dashboard content', async () => {
    render(<App />);

    expect(screen.getByText(/CareerOS v2.4/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data Explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Experience Log/i })).toBeInTheDocument();
    });
  });

  it('shows warehouse semantic layer in data explorer', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Data Explorer/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Data Explorer/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Data Warehouse/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/File Explorer/i)).toBeInTheDocument();
      expect(screen.queryByText(/Stored Procedures/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^sql$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /scratchpad\.sql/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stg__profile_overview\.sql/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sp_joined_cv_snapshot/i })).not.toBeInTheDocument();
    });
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Experience Log/i })).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
