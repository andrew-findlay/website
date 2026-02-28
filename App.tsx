import React, { useEffect, useMemo, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  CircleDot,
  ExternalLink,
  FileCode2,
  Folder,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  Moon,
  Phone,
  Play,
  Table2,
  Sun,
  TerminalSquare
} from 'lucide-react';
import { INIT_SQL, SCHEMA_TABLES } from './data/schema';
import { initDB, runQuery } from './lib/db';
import { executeSavedQuery } from './lib/queryRunner';
import type { MasterCvContract, QueryId, QueryResult } from './types';

type QueryResultsMap = Partial<Record<QueryId, QueryResult>>;
type DataRow = Record<string, unknown>;
interface TimelineRow {
  id: string;
  title: string;
  employer: string;
  start_date: unknown;
  end_date: unknown;
  is_current: boolean;
  summary: string;
  achievements: string[];
  timelineStart: Date;
  timelineEnd: Date;
}
type AppTab = 'dashboard' | 'data-explorer' | 'export';
type ExplorerSection = 'warehouse' | 'file_explorer';
type ExplorerKind = 'table' | 'view' | 'model';
type ExplorerInspectorTab = 'schema' | 'preview' | 'sql' | 'lineage';
type ThemeMode = 'dark' | 'light';
type ExplorerLayer = 'stg' | 'int' | 'dmn' | 'prs';

interface ExplorerNode {
  id: string;
  name: string;
  relationName: string;
  description: string;
  section: ExplorerSection;
  kind: ExplorerKind;
  layer?: ExplorerLayer;
  editorSql: string;
  previewSql?: string;
  runSql?: string;
}

const APP_TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'data-explorer', label: 'Data Explorer' },
  { id: 'export', label: 'Export' }
];

const CV_PDF_URL = new URL('./docs/assets/Andrew-Findlay-CV.pdf', import.meta.url).href;
const THEME_STORAGE_KEY = 'careeros-theme-mode';
const FILE_EXPLORER_PREFIXES = ['stg__', 'int__', 'dmn__', 'prs__'] as const;
const EXPLORER_SECTION_LABELS: Record<ExplorerSection, string> = {
  warehouse: 'Data Warehouse',
  file_explorer: 'File Explorer'
};
const EXPLORER_LAYER_LABELS: Record<ExplorerLayer, string> = {
  stg: 'staging',
  int: 'intermediate',
  dmn: 'domain',
  prs: 'presentation'
};
function isFileExplorerModelName(name: string): boolean {
  return FILE_EXPLORER_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function getExplorerLayer(name: string): ExplorerLayer | null {
  if (name.startsWith('stg__')) {
    return 'stg';
  }
  if (name.startsWith('int__')) {
    return 'int';
  }
  if (name.startsWith('dmn__')) {
    return 'dmn';
  }
  if (name.startsWith('prs__')) {
    return 'prs';
  }
  return null;
}

function findModelDefinitionSql(modelName: string): string | null {
  const declaration = `CREATE OR REPLACE VIEW ${modelName} AS`;
  const statement = INIT_SQL.find((sql) => sql.includes(declaration));
  return statement ? statement.trim() : null;
}

const EXPLORER_NODES: ExplorerNode[] = (() => {
  const warehouseObjects = SCHEMA_TABLES
    .filter((entry) => !entry.name.startsWith('sp_') && !isFileExplorerModelName(entry.name))
    .map((entry) => ({
      id: `warehouse:${entry.name}`,
      name: entry.name,
      relationName: entry.name,
      description: entry.description,
      section: 'warehouse' as const,
      kind: 'table' as const,
      editorSql: `SELECT *\nFROM ${entry.name}\nLIMIT 100;`,
      previewSql: `SELECT * FROM ${entry.name} LIMIT 20;`,
      runSql: `SELECT * FROM ${entry.name} LIMIT 100;`
    }));

  const modelFiles = SCHEMA_TABLES
    .filter((entry) => isFileExplorerModelName(entry.name))
    .map((entry) => {
      const modelDefinitionSql = findModelDefinitionSql(entry.name);
      const layer = getExplorerLayer(entry.name) ?? 'stg';

      return {
        id: `file_explorer:${entry.name}`,
        name: `${entry.name}.sql`,
        relationName: entry.name,
        description: entry.description,
        section: 'file_explorer' as const,
        kind: 'model' as const,
        layer,
        editorSql: modelDefinitionSql ?? `SELECT *\nFROM ${entry.name}\nLIMIT 100;`,
        previewSql: `SELECT * FROM ${entry.name} LIMIT 20;`,
        runSql: `SELECT * FROM ${entry.name} LIMIT 100;`
      };
    });

  return [...warehouseObjects, ...modelFiles];
})();

const DEFAULT_EXPLORER_NODE_ID = EXPLORER_NODES.find((node) => node.section === 'warehouse')?.id
  ?? EXPLORER_NODES[0]?.id
  ?? '';

const DASHBOARD_FALLBACK = {
  profile: {
    full_name: 'Andrew Findlay',
    headline: 'Analytics Engineer',
    location: 'London, United Kingdom',
    summary:
      'Analytics Engineer focused on building data-led systems that improve outcomes and support confident decision-making for technical and non-technical stakeholders.'
  },
  experience: [
    {
      id: 'fallback-role-1',
      title: 'Analytics Engineer',
      employer: 'Tasman Analytics',
      start_date: '2025-07-01',
      end_date: null,
      is_current: true,
      summary:
        'Implemented modern data stacks across greenfield client engagements spanning ingestion, transformation, and serving layers.',
      achievements: [
        'Built AI summarisation pipelines with BigQuery ML and dbt',
        'Optimised dbt models across BigQuery, Snowflake, and Fabric'
      ]
    },
    {
      id: 'fallback-role-2',
      title: 'Analytics Engineer',
      employer: 'The Orchard',
      start_date: '2023-03-01',
      end_date: '2025-06-01',
      is_current: false,
      summary:
        'Led delivery improvements across dbt, Looker, and Snowflake reliability with CI, workload tuning, and stakeholder-ready datasets.',
      achievements: [
        'Implemented slim CI checks for dbt pull requests',
        'Co-led Snowflake warehouse segmentation to reduce queueing'
      ]
    },
    {
      id: 'fallback-role-3',
      title: 'Senior Data Analyst',
      employer: 'TotallyMoney',
      start_date: '2021-09-01',
      end_date: '2022-09-01',
      is_current: false,
      summary:
        'Modernised analytics workflows with dbt and mentored experimentation practice across technical and non-technical teams.',
      achievements: [
        'Implemented dbt to modernise analytics delivery',
        'Mentored analysts and stakeholders on A/B testing'
      ]
    },
    {
      id: 'fallback-role-4',
      title: 'Product Data Analyst',
      employer: 'TotallyMoney',
      start_date: '2018-10-01',
      end_date: '2021-09-01',
      is_current: false,
      summary:
        'Embedded experimentation and product analytics into cross-functional squads while replacing legacy reporting workflows.',
      achievements: [
        'Implemented A/B testing practice in day-to-day product delivery',
        'Built Looker models and visualisations for stakeholder reporting',
        'Helped define MAU as a North Star metric'
      ]
    },
    {
      id: 'fallback-role-5',
      title: 'Risk & Data Analyst',
      employer: 'Start Up Loans',
      start_date: '2017-09-01',
      end_date: '2018-09-01',
      is_current: false,
      summary:
        'Produced operational MI and improved data automation and board reporting processes.',
      achievements: [
        'Produced daily SQL MI for internal and external stakeholders',
        'Co-owned monthly board reporting packs and process improvements'
      ]
    },
    {
      id: 'fallback-role-6',
      title: 'Performance Analyst',
      employer: 'Start Up Loans',
      start_date: '2014-08-01',
      end_date: '2018-09-01',
      is_current: false,
      summary:
        'Delivered KPI and forecasting insights for a large subcontractor network with scorecard governance.',
      achievements: [
        'Produced KPI and forecast reporting across 30+ subcontractors',
        'Introduced scorecard-based RAG monitoring'
      ]
    }
  ],
  education: [
    {
      institution: 'Birkbeck, University of London',
      credential: 'Graduate Certificate',
      field_of_study: 'Statistical Data Science',
      start_year: 2020,
      end_year: 2021
    },
    {
      institution: 'University College London',
      credential: 'MSc',
      field_of_study: 'International Public Policy',
      start_year: 2012,
      end_year: 2013
    },
    {
      institution: 'University of Reading',
      credential: 'BA',
      field_of_study: 'Politics & International Relations',
      start_year: 2008,
      end_year: 2011
    }
  ],
  contacts: [
    { kind: 'email', value: 'hello@andrewfindlay.io' },
    { kind: 'website', value: 'https://www.andrewfindlay.io' },
    { kind: 'phone', value: '07792 300766' }
  ],
  socials: [
    { platform: 'GitHub', url: 'https://github.com/andrewfindlay' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/andrew-findlay' }
  ]
};

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });
  const [dbReady, setDbReady] = useState(false);
  const [savedResults, setSavedResults] = useState<QueryResultsMap>({});
  const [masterCv, setMasterCv] = useState<MasterCvContract | null>(null);

  const [explorerSearch, setExplorerSearch] = useState('');
  const [activeExplorerNodeId, setActiveExplorerNodeId] = useState<string>(DEFAULT_EXPLORER_NODE_ID);
  const [explorerInspectorTab, setExplorerInspectorTab] = useState<ExplorerInspectorTab>('sql');
  const [explorerSql, setExplorerSql] = useState<string>(
    EXPLORER_NODES.find((node) => node.id === DEFAULT_EXPLORER_NODE_ID)?.editorSql
      ?? EXPLORER_NODES[0]?.editorSql
      ?? 'SELECT 1;'
  );
  const [explorerResult, setExplorerResult] = useState<QueryResult | null>(null);
  const [isExplorerRunning, setIsExplorerRunning] = useState(false);
  const [showPreTmHistory, setShowPreTmHistory] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    let cancelled = false;

    const boot = async (): Promise<void> => {
      try {
        await initDB();
        if (cancelled) {
          return;
        }

        setDbReady(true);

        const preloadQueries: Array<{
          id: QueryId;
          params?: Record<string, number>;
        }> = [
          { id: 'profile_overview' },
          { id: 'experience_timeline', params: { limit: 200 } },
          { id: 'skills_matrix', params: { min_proficiency: 0 } },
          { id: 'education_history' },
          { id: 'projects_showcase', params: { limit: 12 } },
          { id: 'master_cv' }
        ];

        const settled = await Promise.allSettled(
          preloadQueries.map((query) => executeSavedQuery(query.id, query.params))
        );

        if (cancelled) {
          return;
        }

        const nextResults: QueryResultsMap = {};

        settled.forEach((item, index) => {
          const queryId = preloadQueries[index].id;

          if (item.status === 'fulfilled') {
            nextResults[queryId] = item.value.result;
            if (queryId === 'master_cv') {
              setMasterCv(item.value.masterCv);
            }
            return;
          }

          console.error(`Failed to load ${queryId}`, item.reason);
        });

        setSavedResults(nextResults);
      } catch (error) {
        console.error('Failed to initialize DuckDB', error);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const explorerNodeById = useMemo<Record<string, ExplorerNode>>(() => {
    return Object.fromEntries(EXPLORER_NODES.map((node) => [node.id, node]));
  }, []);

  const fallbackExplorerNode: ExplorerNode = EXPLORER_NODES[0] ?? {
    id: '__fallback_explorer_node__',
    name: 'person',
    relationName: 'person',
    description: 'Fallback explorer node.',
    section: 'warehouse',
    kind: 'table',
    editorSql: 'SELECT 1;',
    previewSql: 'SELECT 1;',
    runSql: 'SELECT 1;'
  };

  const activeExplorerNode = explorerNodeById[activeExplorerNodeId] ?? fallbackExplorerNode;

  useEffect(() => {
    setExplorerResult(null);
    setExplorerSql(activeExplorerNode.editorSql);
    if (activeExplorerNode.section === 'warehouse') {
      setExplorerInspectorTab('schema');
      return;
    }
    setExplorerInspectorTab('sql');
  }, [activeExplorerNode]);

  const runExplorerQuery = async (mode: 'preview' | 'run' = 'run'): Promise<void> => {
    if (isExplorerRunning) {
      return;
    }

    setIsExplorerRunning(true);

    try {
      let result: QueryResult;

      const sqlToRun = mode === 'preview' && activeExplorerNode.previewSql
        ? activeExplorerNode.previewSql
        : mode === 'run' && activeExplorerNode.runSql && explorerSql.trim() === activeExplorerNode.editorSql.trim()
          ? activeExplorerNode.runSql
          : explorerSql;

      if (!isReadOnlySql(sqlToRun)) {
        setExplorerResult({
          columns: [],
          data: [],
          executionTime: '0.000s',
          affectedRows: 0,
          error: 'Read-only mode: SELECT/SHOW/DESCRIBE/EXPLAIN statements only.'
        });
        return;
      }

      result = await runQuery(sqlToRun);

      setExplorerResult(result);
      if (mode === 'preview') {
        setExplorerInspectorTab('preview');
      }
    } finally {
      setIsExplorerRunning(false);
    }
  };

  const overviewRow = (savedResults.profile_overview?.data?.[0] as DataRow | undefined) ?? null;
  const experienceRows = useMemo(() => (savedResults.experience_timeline?.data ?? []) as DataRow[], [savedResults.experience_timeline]);

  const dashboardProfile = {
    full_name: String(overviewRow?.full_name ?? masterCv?.person.name ?? DASHBOARD_FALLBACK.profile.full_name),
    headline: String(overviewRow?.headline ?? masterCv?.person.headline ?? DASHBOARD_FALLBACK.profile.headline),
    location: String(overviewRow?.location ?? masterCv?.person.location ?? DASHBOARD_FALLBACK.profile.location),
    summary: String(overviewRow?.summary ?? masterCv?.person.summary ?? DASHBOARD_FALLBACK.profile.summary)
  };

  const dashboardContactMethods = useMemo(() => {
    if (Array.isArray(overviewRow?.contact_methods) && overviewRow.contact_methods.length > 0) {
      return overviewRow.contact_methods as Array<{ kind: string; value: string; label?: string }>;
    }
    if (masterCv?.contact_methods && masterCv.contact_methods.length > 0) {
      return masterCv.contact_methods;
    }
    return DASHBOARD_FALLBACK.contacts;
  }, [overviewRow?.contact_methods, masterCv?.contact_methods]);

  const dashboardExperienceRows = useMemo<DataRow[]>(() => {
    if (experienceRows.length > 0) {
      return experienceRows;
    }

    if (masterCv?.experience && masterCv.experience.length > 0) {
      return masterCv.experience.map((role, index) => ({
        id: `master-role-${index}`,
        employer: role.employer,
        title: role.title,
        start_date: role.start_date,
        end_date: role.end_date === 'Present' ? null : role.end_date,
        is_current: role.is_current,
        summary: role.summary,
        achievements: role.achievements
      }));
    }

    return DASHBOARD_FALLBACK.experience as DataRow[];
  }, [experienceRows, masterCv?.experience]);

  const dashboardEducationRows = useMemo<DataRow[]>(() => {
    const educationRows = (savedResults.education_history?.data ?? []) as DataRow[];
    if (educationRows.length > 0) {
      return educationRows;
    }

    if (masterCv?.education && masterCv.education.length > 0) {
      return masterCv.education.map((education, index) => ({
        id: `master-education-${index}`,
        institution: education.institution,
        credential: education.credential,
        field_of_study: education.field_of_study,
        start_year: education.start_year,
        end_year: education.end_year
      }));
    }

    return DASHBOARD_FALLBACK.education as DataRow[];
  }, [savedResults.education_history, masterCv?.education]);

  const yearsExperience = useMemo(() => {
    const tmStartCandidates = dashboardExperienceRows
      .filter((row) => String(row.employer ?? '').toLowerCase().includes('totallymoney'))
      .map((row) => parseDateValue(row.start_date))
      .filter((value): value is Date => value !== null);

    if (tmStartCandidates.length > 0) {
      const tmStart = new Date(Math.min(...tmStartCandidates.map((date) => date.getTime())));
      const months = monthDiff(tmStart, new Date());
      return Math.max(0, Math.floor(months / 12));
    }

    const startYears = dashboardExperienceRows
      .map((row) => parseYear(row.start_date))
      .filter((value) => value !== null) as number[];

    if (startYears.length === 0) {
      return null;
    }

    const earliest = Math.min(...startYears);
    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - earliest);
  }, [dashboardExperienceRows]);

  const filteredExplorerNodes = useMemo(() => {
    const search = explorerSearch.trim().toLowerCase();
    const baseNodes = EXPLORER_NODES;

    if (!search) {
      return baseNodes;
    }

    return baseNodes.filter((node) => {
      return node.name.toLowerCase().includes(search)
        || node.relationName.toLowerCase().includes(search)
        || node.description.toLowerCase().includes(search);
    });
  }, [explorerSearch]);

  const warehouseExplorerNodes = useMemo(() => {
    return filteredExplorerNodes.filter((node) => node.section === 'warehouse');
  }, [filteredExplorerNodes]);

  const fileExplorerNodes = useMemo(() => {
    return filteredExplorerNodes.filter((node) => node.section === 'file_explorer');
  }, [filteredExplorerNodes]);

  const fileExplorerNodesByLayer = useMemo(() => {
    return {
      stg: fileExplorerNodes.filter((node) => node.layer === 'stg'),
      int: fileExplorerNodes.filter((node) => node.layer === 'int'),
      dmn: fileExplorerNodes.filter((node) => node.layer === 'dmn'),
      prs: fileExplorerNodes.filter((node) => node.layer === 'prs')
    };
  }, [fileExplorerNodes]);

  const activeExplorerGroupLabel = EXPLORER_SECTION_LABELS[activeExplorerNode.section];
  const activeExplorerName = activeExplorerNode.name;
  const activeExplorerDescription = activeExplorerNode.description;
  const activeEditorPath = activeExplorerNode.name;
  const activeExplorerLayerLabel = activeExplorerNode.layer ? EXPLORER_LAYER_LABELS[activeExplorerNode.layer] : null;
  const explorerInspectorTabs = activeExplorerNode.section === 'warehouse'
    ? (['schema', 'preview', 'lineage'] as ExplorerInspectorTab[])
    : (['schema', 'sql', 'preview', 'lineage'] as ExplorerInspectorTab[]);
  const lineageSources = useMemo(() => {
    const relationName = activeExplorerNode.relationName.toLowerCase();
    const matches = Array.from(activeExplorerNode.editorSql.toLowerCase().matchAll(/\b(from|join)\s+([a-zA-Z0-9_]+)/g))
      .map(([, , relation]) => relation)
      .filter((relation) => relation !== relationName);
    return [...new Set(matches)];
  }, [activeExplorerNode.editorSql, activeExplorerNode.relationName]);

  const lineageConsumers = useMemo(() => {
    const relationName = activeExplorerNode.relationName.toLowerCase();
    const dependents = fileExplorerNodes
      .filter((node) => node.relationName.toLowerCase() !== relationName)
      .filter((node) => node.editorSql.toLowerCase().includes(relationName))
      .map((node) => node.relationName);
    return [...new Set(dependents)];
  }, [activeExplorerNode.relationName, fileExplorerNodes]);

  const timelineRows = useMemo<TimelineRow[]>(() => {
    return [...dashboardExperienceRows]
      .map((row) => {
        const start = parseDateValue(row.start_date);
        const end = row.is_current ? new Date() : parseDateValue(row.end_date) ?? new Date();
        return {
          id: String(row.id ?? ''),
          title: String(row.title ?? ''),
          employer: String(row.employer ?? ''),
          start_date: row.start_date,
          end_date: row.end_date,
          is_current: Boolean(row.is_current),
          summary: String(row.summary ?? ''),
          achievements: toStringArray(row.achievements),
          timelineStart: start ?? new Date(),
          timelineEnd: end
        } satisfies TimelineRow;
      })
      .sort((left, right) => right.timelineStart.getTime() - left.timelineStart.getTime());
  }, [dashboardExperienceRows]);

  const totallyMoneyStart = useMemo(() => {
    const tmRows = timelineRows.filter((row) => row.employer.toLowerCase().includes('totallymoney'));
    if (tmRows.length === 0) {
      return null;
    }

    return new Date(Math.min(...tmRows.map((row) => row.timelineStart.getTime())));
  }, [timelineRows]);

  const preTotallyMoneyRows = useMemo(() => {
    if (!totallyMoneyStart) {
      return [];
    }

    return timelineRows.filter((row) => row.timelineStart.getTime() < totallyMoneyStart.getTime());
  }, [timelineRows, totallyMoneyStart]);

  const visibleTimelineRows = useMemo(() => {
    if (!totallyMoneyStart || showPreTmHistory) {
      return timelineRows;
    }

    return timelineRows.filter((row) => row.timelineStart.getTime() >= totallyMoneyStart.getTime());
  }, [timelineRows, totallyMoneyStart, showPreTmHistory]);

  const timelineBounds = useMemo(() => {
    if (visibleTimelineRows.length === 0) {
      const now = new Date();
      return {
        min: now,
        max: now,
        spanMonths: 1
      };
    }

    const starts = visibleTimelineRows.map((row) => row.timelineStart.getTime());
    const ends = visibleTimelineRows.map((row) => row.timelineEnd.getTime());
    const min = new Date(Math.min(...starts));
    const max = new Date(Math.max(...ends));
    const spanMonths = Math.max(1, monthSpanInclusive(min, max));
    return { min, max, spanMonths };
  }, [visibleTimelineRows]);

  const currentRole = useMemo(() => {
    return timelineRows.find((row) => Boolean(row.is_current)) ?? timelineRows[0] ?? null;
  }, [timelineRows]);

  const currentRoleTenureMonths = useMemo(() => {
    if (!currentRole) {
      return null;
    }

    return Math.max(1, monthSpanInclusive(currentRole.timelineStart, new Date()));
  }, [currentRole]);

  const rolesShownSummary = useMemo(() => {
    return `${visibleTimelineRows.length}/${timelineRows.length}`;
  }, [visibleTimelineRows.length, timelineRows.length]);

  const timelineAxisTicks = useMemo(() => {
    const minYear = timelineBounds.min.getUTCFullYear();
    const maxYear = timelineBounds.max.getUTCFullYear();
    const yearSpan = Math.max(0, maxYear - minYear);
    const maxTickCount = 7;
    const step = yearSpan <= maxTickCount - 1 ? 1 : Math.ceil(yearSpan / (maxTickCount - 1));

    const yearTicks = new Set<number>();
    yearTicks.add(minYear);
    for (let year = minYear; year <= maxYear; year += step) {
      yearTicks.add(year);
    }
    yearTicks.add(maxYear);

    return [...yearTicks]
      .sort((left, right) => left - right)
      .map((year) => {
        const tickDate = new Date(Date.UTC(year, 0, 1));
        const offset = monthDiff(timelineBounds.min, tickDate);
        const left = Math.min(100, Math.max(0, (offset / timelineBounds.spanMonths) * 100));
        return {
          label: String(year),
          left
        };
      });
  }, [timelineBounds]);

  return (
    <div className="min-h-screen bg-app-bg text-text-main">
      <header className="sticky top-0 z-30 border-b border-border-subtle/80 bg-app-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-primary/50 bg-primary/10">
              <TerminalSquare size={14} className="text-primary" />
            </div>
            <p className="font-mono text-lg font-semibold tracking-tight">CareerOS v2.4</p>
          </div>

          <nav className="flex items-center gap-1 rounded-lg border border-border-subtle bg-panel-bg/70 p-1">
            {APP_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  activeTab === tab.id
                    ? 'bg-panel-highlight text-text-main shadow-[inset_0_0_0_1px_rgba(60,131,246,0.5)]'
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThemeMode((previous) => (previous === 'dark' ? 'light' : 'dark'))}
              className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-panel-bg px-3 py-1.5 text-xs text-text-main transition hover:border-primary"
            >
              {themeMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 md:py-6">
        {activeTab === 'dashboard' ? (
          <section className="space-y-5" aria-label="Dashboard">
            <article className="rounded-xl border border-border-subtle bg-panel-bg/80 p-5">
              <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border-subtle bg-panel-highlight text-lg font-semibold">
                  {toInitials(dashboardProfile.full_name)}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold leading-tight">{dashboardProfile.full_name}</h1>
                  <p className="mt-1 font-mono text-sm text-primary">{dashboardProfile.headline}</p>
                  <p className="mt-2 max-w-3xl text-sm text-text-dim">{dashboardProfile.summary}</p>
                </div>
                <div className="flex flex-col items-start gap-2 text-xs text-text-dim">
                  <InfoLine icon={<MapPin size={14} />} label={dashboardProfile.location} />
                  {dashboardContactMethods.slice(0, 2).map((method) => (
                    <InfoLine
                      key={`${method.kind}-${method.value}`}
                      icon={contactIcon(method.kind)}
                      label={method.value}
                      href={toContactHref(method.kind, method.value)}
                    />
                  ))}
                </div>
              </div>
            </article>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Years Exp" value={yearsExperience !== null ? `${yearsExperience}+` : '--'} suffix="Years" />
              <MetricCard label="Roles" value={String(timelineRows.length)} suffix="Tracked" />
              <MetricCard label="Current Tenure" value={currentRoleTenureMonths !== null ? String(currentRoleTenureMonths) : '--'} suffix="Months" />
              <MetricCard label="History" value={rolesShownSummary} suffix="Shown" />
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <article className="rounded-xl border border-border-subtle bg-panel-bg/80">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em]">
                    <CircleDot size={15} className="text-primary" />
                    Experience Log
                  </h2>
                  <div className="flex items-center gap-2">
                    {preTotallyMoneyRows.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowPreTmHistory((previous) => !previous)}
                        className="inline-flex items-center gap-1 rounded border border-border-subtle bg-panel-highlight/40 px-2 py-1 text-[11px] text-text-main hover:border-primary"
                      >
                        {showPreTmHistory ? 'Show Less History' : `Show More History (${preTotallyMoneyRows.length})`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveTab('data-explorer')}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-blue-300"
                    >
                      Open Explore
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {timelineRows.length === 0 ? (
                    <p className="rounded border border-red-900/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      No experience rows found in the warehouse.
                    </p>
                  ) : (
                    <>
                      <div className="rounded border border-border-subtle bg-panel-highlight/20 px-3 pb-4 pt-3">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-text-dim">
                          <span>{formatMonthYear(timelineBounds.min)}</span>
                          <span>{formatMonthYear(timelineBounds.max)}</span>
                        </div>
                        <div className="relative h-8">
                          <div className="absolute left-0 right-0 top-4 h-px bg-border-subtle" />
                          {timelineAxisTicks.map((tick) => (
                            <div
                              key={`axis-${tick.label}-${tick.left}`}
                              className="absolute top-0 -translate-x-1/2"
                              style={{ left: `${tick.left}%` }}
                            >
                              <div className="mx-auto h-4 w-px bg-border-subtle" />
                              <p className="mt-1 font-mono text-[10px] text-text-dim">{tick.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {visibleTimelineRows.map((row) => {
                        const offsetMonths = monthDiff(timelineBounds.min, row.timelineStart);
                        const durationMonths = Math.max(1, monthSpanInclusive(row.timelineStart, row.timelineEnd));
                        const left = (offsetMonths / timelineBounds.spanMonths) * 100;
                        const width = (durationMonths / timelineBounds.spanMonths) * 100;

                        return (
                          <article key={String(row.id)} className="rounded-lg border border-border-subtle bg-panel-highlight/30 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{String(row.title)}</p>
                              <p className="font-mono text-xs text-primary">{String(row.employer)}</p>
                            </div>
                            <span className="rounded border border-border-subtle bg-app-bg px-2 py-0.5 font-mono text-[11px] text-text-dim">
                              {formatRolePeriod(row.start_date, row.end_date, row.is_current)}
                            </span>
                            </div>
                            <p className="mt-2 text-xs text-text-dim">{String(row.summary)}</p>
                            <div className="mt-3 h-2 rounded-full bg-app-bg">
                              <div
                                className="h-full rounded-full bg-primary/80"
                                style={{
                                  marginLeft: `${left}%`,
                                  width: `${Math.max(width, 2)}%`
                                }}
                              />
                            </div>
                            {row.achievements.length > 0 ? (
                              <ul className="mt-3 space-y-1">
                                {row.achievements.map((achievement) => (
                                  <li key={`${row.id}-${achievement}`} className="text-xs text-text-dim">
                                    • {achievement}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </article>
                        );
                      })}
                    </>
                  )}
                </div>
              </article>

              <div className="space-y-5">
                <article className="rounded-xl border border-border-subtle bg-panel-bg/80">
                  <div className="border-b border-border-subtle px-4 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em]">
                      <GraduationCap size={15} className="text-primary" />
                      Education
                    </h2>
                  </div>
                  <div className="space-y-3 p-4">
                    {dashboardEducationRows.map((education) => (
                      <article key={`${education.institution}-${education.credential}`} className="rounded-lg border border-border-subtle bg-panel-highlight/35 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{String(education.institution)}</p>
                            <p className="text-xs text-text-dim">
                              {String(education.credential)}
                              {education.field_of_study ? ` · ${String(education.field_of_study)}` : ''}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-text-dim">{formatEducationYears(education.start_year, education.end_year)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'data-explorer' ? (
          <section className="h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/75" aria-label="Data Explorer">
            <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-b border-border-subtle p-4 lg:border-b-0 lg:border-r">
                <label className="mb-3 block">
                  <span className="sr-only">Search explorer</span>
                  <input
                    type="search"
                    value={explorerSearch}
                    onChange={(event) => setExplorerSearch(event.target.value)}
                    placeholder="Search data or model files..."
                    className="w-full rounded-md border border-border-subtle bg-app-bg px-3 py-2 font-mono text-sm text-text-main outline-none placeholder:text-text-dim focus:border-primary"
                  />
                </label>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">Data Warehouse</p>
                    <ul className="space-y-1">
                      {warehouseExplorerNodes.length === 0 ? (
                        <li className="rounded px-2 py-1 text-xs text-text-dim">No data objects match</li>
                      ) : (
                        warehouseExplorerNodes.map((node) => (
                          <li key={node.id}>
                            <button
                              type="button"
                              onClick={() => setActiveExplorerNodeId(node.id)}
                              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition ${
                                activeExplorerNodeId === node.id
                                  ? 'border-primary/70 bg-primary/10 text-text-main'
                                  : 'border-transparent text-text-dim hover:border-border-subtle hover:text-text-main'
                              }`}
                            >
                              <Table2 size={14} />
                              <span className="font-mono text-xs">{node.name}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">File Explorer</p>
                    <div className="space-y-2">
                      {(['stg', 'int', 'dmn', 'prs'] as ExplorerLayer[]).map((layer) => {
                        const layerNodes = fileExplorerNodesByLayer[layer];
                        return (
                          <div key={layer} className="rounded-md border border-border-subtle/70 bg-panel-highlight/20 p-2">
                            <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
                              <Folder size={12} />
                              {layer} · {EXPLORER_LAYER_LABELS[layer]}
                            </p>
                            <ul className="space-y-1">
                              {layerNodes.length === 0 ? (
                                <li className="rounded px-2 py-1 text-xs text-text-dim">No files match</li>
                              ) : (
                                layerNodes.map((node) => (
                                  <li key={node.id}>
                                    <button
                                      type="button"
                                      onClick={() => setActiveExplorerNodeId(node.id)}
                                      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition ${
                                        activeExplorerNodeId === node.id
                                          ? 'border-primary/70 bg-primary/10 text-text-main'
                                          : 'border-transparent text-text-dim hover:border-border-subtle hover:text-text-main'
                                      }`}
                                    >
                                      <FileCode2 size={14} />
                                      <span className="font-mono text-xs">{node.name}</span>
                                    </button>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex min-h-0 overflow-hidden flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">{activeExplorerGroupLabel}</p>
                    <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                      <Folder size={16} className="text-primary" />
                      {activeExplorerName}
                    </h2>
                    <p className="text-sm text-text-dim">{activeExplorerDescription}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void runExplorerQuery('preview')}
                      disabled={isExplorerRunning}
                      className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-panel-bg px-3 py-2 text-xs text-text-main transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => void runExplorerQuery('run')}
                      disabled={isExplorerRunning}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={14} />
                      {isExplorerRunning ? 'Running...' : 'Run Query'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2">
                  {explorerInspectorTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setExplorerInspectorTab(tab)}
                      className={`rounded-md px-2 py-1 text-xs font-mono uppercase tracking-wide transition ${
                        explorerInspectorTab === tab
                          ? 'bg-panel-highlight text-text-main'
                          : 'text-text-dim hover:text-text-main'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="grid min-h-0 flex-1 grid-rows-[1fr_280px] xl:grid-cols-[1.1fr_1fr] xl:grid-rows-1">
                  <article className="min-h-0 border-b border-border-subtle xl:border-b-0 xl:border-r">
                    {explorerInspectorTab === 'schema' ? (
                      <div className="h-full overflow-auto p-4">
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">Schema Snapshot</p>
                        <div className="mt-3 space-y-2 text-sm text-text-dim">
                          <p>
                            <span className="font-semibold text-text-main">Object:</span> {activeExplorerNode.name}
                          </p>
                          <p>
                            <span className="font-semibold text-text-main">Relation:</span> {activeExplorerNode.relationName}
                          </p>
                          <p>
                            <span className="font-semibold text-text-main">Type:</span> {activeExplorerNode.kind}
                          </p>
                          {activeExplorerLayerLabel ? (
                            <p>
                              <span className="font-semibold text-text-main">Layer:</span> {activeExplorerLayerLabel}
                            </p>
                          ) : null}
                          <p>
                            <span className="font-semibold text-text-main">Description:</span> {activeExplorerNode.description}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {explorerInspectorTab === 'lineage' ? (
                      <div className="h-full overflow-auto p-4">
                        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-text-dim">Lineage</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded border border-border-subtle bg-panel-highlight/40 p-3 text-xs">
                            <p className="font-semibold text-text-main">Sources ({lineageSources.length})</p>
                            <p className="mt-1 text-text-dim">
                              {lineageSources.length > 0 ? lineageSources.join(', ') : 'No upstream relations detected'}
                            </p>
                          </div>
                          <div className="rounded border border-primary/50 bg-primary/10 p-3 text-xs">
                            <p className="font-semibold text-text-main">Selected</p>
                            <p className="mt-1 text-text-dim">{activeExplorerNode.relationName}</p>
                          </div>
                          <div className="rounded border border-border-subtle bg-panel-highlight/40 p-3 text-xs">
                            <p className="font-semibold text-text-main">Consumers ({lineageConsumers.length})</p>
                            <p className="mt-1 text-text-dim">
                              {lineageConsumers.length > 0 ? lineageConsumers.join(', ') : 'No downstream models detected'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {explorerInspectorTab === 'sql' ? (
                      <>
                        <label className="sr-only" htmlFor="warehouse-sql-editor">Warehouse SQL</label>
                        <MonacoEditor
                          key={activeEditorPath}
                          path={activeEditorPath}
                          value={explorerSql}
                          onChange={(value) => {
                            setExplorerSql(value ?? '');
                          }}
                          theme={themeMode === 'dark' ? 'vs-dark' : 'vs'}
                          language="sql"
                          height="100%"
                          options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            smoothScrolling: true,
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            padding: { top: 12, bottom: 12 },
                            automaticLayout: true
                          }}
                          loading={
                            <div className="flex h-full items-center justify-center text-sm text-text-dim">
                              Loading Monaco editor...
                            </div>
                          }
                        />
                      </>
                    ) : null}

                    {explorerInspectorTab === 'preview' ? (
                      <div className="h-full overflow-auto p-4 text-sm text-text-dim">
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">Preview Guidance</p>
                        <p className="mt-2">Use the Preview button to load a sample before running full queries.</p>
                      </div>
                    ) : null}
                  </article>

                  <article className="min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                      <p className="font-mono text-xs text-text-dim">
                        {explorerResult ? `${explorerResult.affectedRows} rows in ${explorerResult.executionTime}` : 'Run query to load results'}
                      </p>
                      <span className="font-mono text-xs text-emerald-300">{dbReady ? 'connected: duckdb_wasm' : 'initializing duckdb'}</span>
                    </div>

                    {explorerResult?.error ? (
                      <div className="p-4 font-mono text-sm text-red-300">
                        <p className="mb-2 text-red-200">Query error</p>
                        <pre className="whitespace-pre-wrap rounded bg-red-500/10 p-3">{explorerResult.error}</pre>
                      </div>
                    ) : !explorerResult ? (
                      <div className="p-4 font-mono text-xs text-text-dim">
                        No results loaded yet. Click Preview or Run Query.
                      </div>
                    ) : (
                      <div className="h-full overflow-auto">
                        <table className="min-w-full border-collapse text-left font-mono text-xs">
                          <thead className="sticky top-0 bg-panel-highlight/80">
                            <tr>
                              {(explorerResult?.columns ?? []).map((column) => (
                                <th key={column.key} className="border-b border-border-subtle px-3 py-2 text-text-dim">
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(explorerResult?.data ?? []).map((row, index) => (
                              <tr key={`result-row-${index}`} className="even:bg-white/5">
                                {(explorerResult?.columns ?? []).map((column) => (
                                  <td key={`${index}-${column.key}`} className="border-b border-border-subtle/70 px-3 py-2 text-text-main">
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
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'export' ? (
          <section className="space-y-4" aria-label="Export">
            <article className="rounded-xl border border-border-subtle bg-panel-bg/75 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-dim">Export</p>
                  <h2 className="mt-1 text-xl font-semibold">Regular PDF CV</h2>
                  <p className="text-sm text-text-dim">View, open, or download the latest CV PDF directly from this tab.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={CV_PDF_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-main transition hover:border-primary"
                  >
                    <ExternalLink size={14} />
                    Open PDF
                  </a>
                  <a
                    href={CV_PDF_URL}
                    download="Andrew-Findlay-CV.pdf"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <ArrowDownToLine size={14} />
                    Download PDF
                  </a>
                </div>
              </div>
            </article>

            <div className="h-[75vh] overflow-hidden rounded-xl border border-border-subtle bg-white">
              <iframe
                title="Andrew Findlay CV PDF"
                src={`${CV_PDF_URL}#toolbar=1&navpanes=0&view=FitH`}
                className="h-full w-full"
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({ label, value, suffix }: { label: string; value: string; suffix: string }): React.ReactElement {
  return (
    <article className="h-[108px] rounded-xl border border-border-subtle bg-panel-bg/80 p-4 transition hover:border-primary/50">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">{label}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="truncate text-4xl font-semibold leading-none sm:text-3xl">{value}</p>
        {suffix ? <span className="text-sm text-text-dim">{suffix}</span> : null}
      </div>
    </article>
  );
}

function InfoLine({
  icon,
  label,
  href
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-dim">{icon}</span>
      {href ? (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
          className="break-all text-text-main underline decoration-border-subtle underline-offset-2 hover:text-primary"
        >
          {label}
        </a>
      ) : (
        <span className="break-all">{label}</span>
      )}
    </div>
  );
}

function contactIcon(kind: string): React.ReactElement {
  const normalized = kind.toLowerCase();

  if (normalized.includes('email')) {
    return <Mail size={15} />;
  }

  if (normalized.includes('phone')) {
    return <Phone size={15} />;
  }

  if (normalized.includes('website')) {
    return <Globe2 size={15} />;
  }

  return <TerminalSquare size={15} />;
}

function toContactHref(kind: string, value: string): string | undefined {
  const normalizedKind = kind.toLowerCase();
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedKind.includes('email')) {
    return normalizedValue.startsWith('mailto:') ? normalizedValue : `mailto:${normalizedValue}`;
  }

  if (normalizedKind.includes('phone')) {
    return normalizedValue.startsWith('tel:') ? normalizedValue : `tel:${normalizedValue.replace(/\s+/g, '')}`;
  }

  if (normalizedKind.includes('website')) {
    return normalizedValue.startsWith('http') ? normalizedValue : `https://${normalizedValue}`;
  }

  return normalizedValue.startsWith('http') ? normalizedValue : undefined;
}

function toInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) {
    return 'AF';
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function parseYear(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(String(value));
  const year = date.getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

function parseDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function monthDiff(start: Date, end: Date): number {
  const startMonth = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const endMonth = end.getUTCFullYear() * 12 + end.getUTCMonth();
  return Math.max(0, endMonth - startMonth);
}

function monthSpanInclusive(start: Date, end: Date): number {
  return monthDiff(start, end) + 1;
}

function formatRolePeriod(startValue: unknown, endValue: unknown, isCurrent: unknown): string {
  const start = formatMonthYear(startValue);
  const end = isCurrent ? 'Present' : formatMonthYear(endValue);
  return `${start} - ${end}`;
}

function formatMonthYear(value: unknown): string {
  if (!value) {
    return '--';
  }

  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) {
    return '--';
  }

  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function formatEducationYears(startYear: unknown, endYear: unknown): string {
  const start = parseNullableYear(startYear);
  const end = parseNullableYear(endYear);

  if (start === null && end === null) {
    return 'n/a';
  }
  if (start !== null && end !== null) {
    return `${start} - ${end}`;
  }
  return String(start ?? end);
}

function parseNullableYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.trunc(numeric);
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry));
}

function isReadOnlySql(sql: string): boolean {
  const withoutLineComments = sql.replace(/--.*$/gm, '');
  const withoutBlockComments = withoutLineComments.replace(/\/\*[\s\S]*?\*\//g, '');
  const statements = withoutBlockComments
    .split(';')
    .map((statement) => statement.trim().toLowerCase())
    .filter(Boolean);

  if (statements.length === 0) {
    return false;
  }

  const allowedCommands = new Set(['select', 'with', 'show', 'describe', 'desc', 'explain', 'values', 'pragma']);
  return statements.every((statement) => {
    const [command] = statement.split(/\s+/);
    return allowedCommands.has(command);
  });
}

function renderTableCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="italic text-text-dim">NULL</span>;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return (
        <a
          href={trimmed}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-border-subtle underline-offset-2 hover:text-primary"
        >
          {trimmed}
        </a>
      );
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) {
      return (
        <a href={`mailto:${trimmed}`} className="underline decoration-border-subtle underline-offset-2 hover:text-primary">
          {trimmed}
        </a>
      );
    }
  }

  return String(value);
}

export default App;
