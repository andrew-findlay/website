import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Database,
  FileDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Network,
  Play,
  Printer,
  Search,
  TerminalSquare
} from 'lucide-react';
import { SCHEMA_TABLES } from './data/schema';
import { queryResultToCsv, triggerDownload } from './lib/export';
import { initDB, runQuery } from './lib/db';
import { executeSavedQuery } from './lib/queryRunner';
import { getSavedQueries, getSavedQuerySql } from './lib/queryRepository';
import type { MasterCvContract, QueryId, QueryResult, SavedQuery, SurfaceMode } from './types';

const SAVED_QUERIES = getSavedQueries();

type QueryResultsMap = Partial<Record<QueryId, QueryResult>>;

const SURFACES: Array<{ id: SurfaceMode; label: string; icon: React.ReactNode }> = [
  { id: 'workspace', label: 'Workspace', icon: <TerminalSquare size={16} /> },
  { id: 'master_cv', label: 'Master CV', icon: <FileText size={16} /> },
  { id: 'insights', label: 'Insights', icon: <BarChart3 size={16} /> },
  { id: 'schema', label: 'Schema', icon: <Network size={16} /> }
];

function App(): React.ReactElement {
  const [dbReady, setDbReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [surface, setSurface] = useState<SurfaceMode>('workspace');
  const [savedResults, setSavedResults] = useState<QueryResultsMap>({});
  const [scratchResult, setScratchResult] = useState<QueryResult | null>(null);
  const [masterCv, setMasterCv] = useState<MasterCvContract | null>(null);
  const [activeSavedQueryId, setActiveSavedQueryId] = useState<QueryId>('profile_overview');
  const [isScratchpad, setIsScratchpad] = useState(false);
  const [editorSql, setEditorSql] = useState(getSavedQuerySql('profile_overview'));

  useEffect(() => {
    let cancelled = false;

    const boot = async (): Promise<void> => {
      try {
        await initDB();
        if (cancelled) {
          return;
        }

        setDbReady(true);

        const [profileExec, masterExec] = await Promise.all([
          executeSavedQuery('profile_overview'),
          executeSavedQuery('master_cv')
        ]);

        if (cancelled) {
          return;
        }

        setSavedResults({
          profile_overview: profileExec.result,
          master_cv: masterExec.result
        });
        setMasterCv(masterExec.masterCv);
      } catch (error) {
        console.error('Failed to initialize DuckDB', error);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (surface !== 'insights' || !dbReady) {
      return;
    }

    const missing: QueryId[] = [];
    if (!savedResults.experience_timeline) {
      missing.push('experience_timeline');
    }
    if (!savedResults.skills_matrix) {
      missing.push('skills_matrix');
    }

    if (missing.length === 0) {
      return;
    }

    const loadInsights = async (): Promise<void> => {
      for (const queryId of missing) {
        const execution = await executeSavedQuery(queryId);
        setSavedResults((previous) => ({
          ...previous,
          [queryId]: execution.result
        }));
      }
    };

    loadInsights().catch((error) => {
      console.error('Failed to load insight queries', error);
    });
  }, [surface, dbReady, savedResults.experience_timeline, savedResults.skills_matrix]);

  useEffect(() => {
    if (surface !== 'master_cv' || !dbReady || masterCv) {
      return;
    }

    executeSavedQuery('master_cv')
      .then((execution) => {
        setSavedResults((previous) => ({ ...previous, master_cv: execution.result }));
        setMasterCv(execution.masterCv);
      })
      .catch((error) => {
        console.error('Failed to load master_cv', error);
      });
  }, [surface, dbReady, masterCv]);

  const activeSavedQuery = useMemo<SavedQuery>(() => {
    return SAVED_QUERIES.find((query) => query.id === activeSavedQueryId) ?? SAVED_QUERIES[0];
  }, [activeSavedQueryId]);

  const currentResult = isScratchpad ? scratchResult : savedResults[activeSavedQueryId] ?? null;

  const selectSavedQuery = (queryId: QueryId): void => {
    setIsScratchpad(false);
    setActiveSavedQueryId(queryId);
    setEditorSql(getSavedQuerySql(queryId));
    setSurface('workspace');
  };

  const selectScratchpad = (): void => {
    setIsScratchpad(true);
    setSurface('workspace');
    setEditorSql((previous) => previous || 'SELECT full_name, headline FROM person;');
  };

  const runActiveQuery = async (): Promise<void> => {
    if (!dbReady || isRunning) {
      return;
    }

    setIsRunning(true);

    try {
      if (isScratchpad) {
        const result = await runQuery(editorSql);
        setScratchResult(result);
      } else {
        const execution = await executeSavedQuery(activeSavedQueryId);
        setSavedResults((previous) => ({
          ...previous,
          [activeSavedQueryId]: execution.result
        }));

        if (activeSavedQueryId === 'master_cv') {
          setMasterCv(execution.masterCv);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const exportCsv = (): void => {
    if (!currentResult || currentResult.error) {
      return;
    }
    const csv = queryResultToCsv(currentResult);
    triggerDownload(csv, 'query-result.csv', 'text/csv;charset=utf-8');
  };

  const exportJson = (): void => {
    if (!currentResult) {
      return;
    }
    const json = JSON.stringify(currentResult.data, null, 2);
    triggerDownload(json, 'query-result.json', 'application/json;charset=utf-8');
  };

  const renderWorkspace = (): React.ReactElement => {
    return (
      <section className="grid min-h-0 grid-rows-[1fr_auto] gap-4 lg:grid-rows-1 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-border-subtle bg-panel-bg/70 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">SQL Editor</p>
              <p className="text-sm font-medium text-text-main">
                {isScratchpad ? 'scratchpad.sql' : activeSavedQuery.file}
              </p>
            </div>
            <button
              type="button"
              onClick={runActiveQuery}
              disabled={!dbReady || isRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={14} />
              {isRunning ? 'Running...' : 'Run Query'}
            </button>
          </div>
          <label className="sr-only" htmlFor="sql-editor">SQL editor</label>
          <textarea
            id="sql-editor"
            value={editorSql}
            readOnly={!isScratchpad}
            onChange={(event) => setEditorSql(event.target.value)}
            className="h-[360px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-text-main outline-none"
            spellCheck={false}
          />
        </article>

        <article className="rounded-2xl border border-border-subtle bg-panel-bg/70 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Results</p>
              <p className="text-sm text-text-main">
                {currentResult ? `${currentResult.affectedRows} rows in ${currentResult.executionTime}` : 'Run a query to load results'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1 rounded border border-border-subtle px-2 py-1 text-xs text-text-dim transition hover:border-primary hover:text-text-main"
              >
                <FileSpreadsheet size={13} />
                CSV
              </button>
              <button
                type="button"
                onClick={exportJson}
                className="inline-flex items-center gap-1 rounded border border-border-subtle px-2 py-1 text-xs text-text-dim transition hover:border-primary hover:text-text-main"
              >
                <FileJson size={13} />
                JSON
              </button>
            </div>
          </div>

          {currentResult?.error ? (
            <div className="p-4 font-mono text-sm text-red-300">
              <p className="mb-2 font-semibold text-red-200">Query error</p>
              <pre className="whitespace-pre-wrap rounded bg-red-500/10 p-3">{currentResult.error}</pre>
            </div>
          ) : (
            <div className="h-[360px] overflow-auto">
              <table className="min-w-full border-collapse text-left font-mono text-xs">
                <thead className="sticky top-0 bg-panel-highlight/90">
                  <tr>
                    {(currentResult?.columns ?? []).map((column) => (
                      <th key={column.key} className="border-b border-border-subtle px-3 py-2 text-text-dim">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(currentResult?.data ?? []).map((row, index) => (
                    <tr key={`row-${index}`} className="even:bg-white/5">
                      {(currentResult?.columns ?? []).map((column) => (
                        <td key={`${index}-${column.key}`} className="border-b border-border-subtle/60 px-3 py-2 text-text-main">
                          {renderTableCell(row[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    );
  };

  const renderMasterCv = (): React.ReactElement => {
    if (!masterCv) {
      return (
        <section className="rounded-2xl border border-border-subtle bg-panel-bg/70 p-8">
          <p className="text-text-dim">Master CV contract is not loaded yet.</p>
        </section>
      );
    }

    return (
      <section className="cv-document rounded-2xl border border-border-subtle bg-white p-8 text-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{masterCv.person.name}</h1>
            <p className="mt-1 text-lg font-medium text-slate-700">{masterCv.person.headline}</p>
            <p className="mt-2 text-sm text-slate-500">{masterCv.person.location}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Print / PDF
          </button>
        </div>

        <p className="mb-6 text-sm leading-6 text-slate-700">{masterCv.person.summary}</p>

        <CvSection title="Contact">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {masterCv.contact_methods.map((method) => (
              <li key={`${method.kind}-${method.value}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="mr-2 font-semibold capitalize text-slate-700">{method.kind}:</span>
                <span>{method.value}</span>
              </li>
            ))}
          </ul>
        </CvSection>

        <CvSection title="Experience">
          <div className="space-y-4">
            {masterCv.experience.map((role) => (
              <article key={`${role.employer}-${role.title}-${role.start_date}`} className="rounded border border-slate-200 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {role.title} · {role.employer}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {role.start_date} - {role.end_date}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{role.summary}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {role.achievements.map((achievement) => (
                    <li key={achievement}>{achievement}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </CvSection>

        <CvSection title="Skills">
          <div className="grid gap-2 md:grid-cols-2">
            {masterCv.skills.map((skill) => (
              <div
                key={`${skill.category}-${skill.skill}`}
                className="rounded border border-slate-200 px-3 py-2 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{skill.skill}</span>
                  <span className="text-slate-500">{skill.proficiency}%</span>
                </div>
                <p className="text-xs text-slate-500">{skill.category}</p>
              </div>
            ))}
          </div>
        </CvSection>

        <CvSection title="Projects">
          <div className="space-y-3">
            {masterCv.projects.map((project) => (
              <article key={project.name} className="rounded border border-slate-200 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-xs text-slate-500">
                    {project.start_year ?? ''}
                    {project.end_year ? ` - ${project.end_year}` : ''}
                  </p>
                </div>
                <p className="mt-2 text-slate-600">{project.description}</p>
                <p className="mt-2 text-xs text-slate-500">Skills: {project.skills.join(', ')}</p>
              </article>
            ))}
          </div>
        </CvSection>
      </section>
    );
  };

  const renderInsights = (): React.ReactElement => {
    const experienceRows = (savedResults.experience_timeline?.data ?? []) as Array<Record<string, unknown>>;
    const skillRows = (savedResults.skills_matrix?.data ?? []) as Array<Record<string, unknown>>;

    return (
      <section className="grid min-h-0 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-border-subtle bg-panel-bg/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-dim">Timeline</h2>
          <div className="mt-4 space-y-3">
            {experienceRows.map((row) => (
              <div key={`${row.id}`} className="rounded-xl border border-border-subtle bg-app-bg/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-main">
                    {String(row.title)} · {String(row.employer)}
                  </p>
                  <p className="text-xs text-text-dim">
                    {String(row.start_date)} - {row.is_current ? 'Present' : String(row.end_date ?? '')}
                  </p>
                </div>
                <p className="mt-2 text-sm text-text-dim">{String(row.summary)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border-subtle bg-panel-bg/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-dim">Skill Matrix</h2>
          <div className="mt-4 space-y-3">
            {skillRows.map((row) => {
              const proficiency = Number(row.proficiency ?? 0);
              return (
                <div key={`${row.category}-${row.skill}`}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <p className="text-text-main">{String(row.skill)}</p>
                    <p className="text-text-dim">{proficiency}%</p>
                  </div>
                  <div className="h-2 rounded bg-app-bg">
                    <div className="h-full rounded bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${proficiency}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-text-dim">{String(row.category)}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    );
  };

  const renderSchema = (): React.ReactElement => {
    return (
      <section className="rounded-2xl border border-border-subtle bg-panel-bg/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-dim">DuckDB Relational Model</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SCHEMA_TABLES.map((table) => (
            <article key={table.name} className="rounded-xl border border-border-subtle bg-app-bg/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Database size={15} className="text-primary" />
                <h3 className="font-mono text-sm text-text-main">{table.name}</h3>
              </div>
              <p className="text-xs leading-5 text-text-dim">{table.description}</p>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-app-bg text-text-main">
      <header className="border-b border-border-subtle bg-panel-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-dim">Personal Website Redesign</p>
            <h1 className="text-lg font-semibold">DuckDB SQL Portfolio</h1>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-2">
            {SURFACES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSurface(entry.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  surface === entry.id
                    ? 'bg-primary text-white'
                    : 'border border-border-subtle text-text-dim hover:text-text-main'
                }`}
              >
                {entry.icon}
                {entry.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-4 px-4 py-4 lg:grid-cols-[320px_1fr]">
        <aside className="min-h-0 rounded-2xl border border-border-subtle bg-panel-bg/70 p-4 backdrop-blur">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-app-bg/60 px-3 py-2 text-text-dim">
            <Search size={14} />
            <span className="text-xs">Saved query explorer</span>
          </div>

          <ul className="space-y-2" aria-label="Saved queries">
            {SAVED_QUERIES.map((query) => (
              <li key={query.id}>
                <button
                  type="button"
                  onClick={() => selectSavedQuery(query.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    !isScratchpad && activeSavedQueryId === query.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border-subtle bg-app-bg/40 hover:border-primary/60'
                  }`}
                >
                  <p className="text-sm font-semibold text-text-main">{query.file}</p>
                  <p className="mt-1 text-xs text-text-dim">{query.description}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-text-dim">{query.surface}</p>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={selectScratchpad}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              isScratchpad
                ? 'border-primary bg-primary/10 text-text-main'
                : 'border-border-subtle text-text-dim hover:text-text-main'
            }`}
          >
            <TerminalSquare size={13} />
            Scratchpad (editable)
          </button>

          <div className="mt-6 rounded-xl border border-border-subtle bg-app-bg/50 p-3 text-xs text-text-dim">
            <p className="font-semibold text-text-main">Execution model</p>
            <p className="mt-1 leading-5">
              Saved queries run through a whitelist-only runner. Scratchpad supports local ad-hoc SQL.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dbReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{dbReady ? 'DuckDB ready' : 'Initializing DuckDB...'}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-1 rounded border border-border-subtle px-2 py-2 text-xs text-text-dim hover:text-text-main"
            >
              <FileSpreadsheet size={13} />
              CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="inline-flex items-center justify-center gap-1 rounded border border-border-subtle px-2 py-2 text-xs text-text-dim hover:text-text-main"
            >
              <FileJson size={13} />
              JSON
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1 rounded border border-border-subtle px-2 py-2 text-xs text-text-dim hover:text-text-main"
            >
              <FileDown size={13} />
              Print
            </button>
            <button
              type="button"
              onClick={runActiveQuery}
              disabled={isRunning || !dbReady}
              className="inline-flex items-center justify-center gap-1 rounded border border-primary px-2 py-2 text-xs text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={13} />
              Run
            </button>
          </div>
        </aside>

        <main className="min-h-0 overflow-auto pb-8">
          {surface === 'workspace' && renderWorkspace()}
          {surface === 'master_cv' && renderMasterCv()}
          {surface === 'insights' && renderInsights()}
          {surface === 'schema' && renderSchema()}
        </main>
      </div>
    </div>
  );
}

function CvSection({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b border-slate-300 pb-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

function renderTableCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="italic text-text-dim">NULL</span>;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export default App;
