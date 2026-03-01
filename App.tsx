import React, { useEffect, useMemo, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Briefcase,
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
  Sun,
  Table2,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import { INIT_SQL, SCHEMA_TABLES } from './data/schema';
import { initDB, runQuery } from './lib/db';
import { executeSavedQuery } from './lib/queryRunner';
import type { MasterCvContract, QueryId, QueryResult } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

type QueryResultsMap = Partial<Record<QueryId, QueryResult>>;
type DataRow = Record<string, unknown>;

interface TimelineRow {
  id: string;
  title: string;
  employer: string;
  employment_type: string;
  start_date: unknown;
  end_date: unknown;
  is_current: boolean;
  summary: string;
  achievements: string[];
  skills_used: Array<{ skill: string; category: string }>;
  timelineStart: Date;
  timelineEnd: Date;
  tenure_months: number;
}

type AppTab = 'dashboard' | 'data-explorer' | 'export';
type ExplorerSection = 'warehouse' | 'file_explorer';
type ExplorerKind = 'table' | 'view' | 'model';
type ExplorerInspectorTab = 'code' | 'schema' | 'preview' | 'sql';
type ThemeMode = 'dark' | 'light';
type ExplorerLayer = 'stg' | 'int' | 'mart';

interface ExplorerNode {
  id: string;
  name: string;
  relationName: string;
  description: string;
  section: ExplorerSection;
  kind: ExplorerKind;
  layer?: ExplorerLayer;
  codeSql?: string;
  editorSql: string;
  previewSql?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const APP_TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'data-explorer', label: 'Data Explorer' },
  { id: 'export',        label: 'Export' },
];

const CV_PDF_URL = new URL('./docs/assets/Andrew-Findlay-CV.pdf', import.meta.url).href;
const THEME_STORAGE_KEY = 'careeros-theme-mode';
const FILE_EXPLORER_PREFIXES = ['stg__', 'int__', 'mart__'] as const;

const EXPLORER_LAYER_LABELS: Record<ExplorerLayer, string> = {
  stg:  'staging',
  int:  'intermediate',
  mart: 'mart',
};

const LAYER_COLORS: Record<ExplorerLayer, string> = {
  stg:  'text-yellow-400',
  int:  'text-orange-400',
  mart: 'text-emerald-400',
};

// Terminal boot messages — shown on first load
const BOOT_MESSAGES = [
  '> Initialising DuckDB-WASM runtime…',
  '> Loading source tables: person, role, skill, education…',
  '> Running stg__ staging models…',
  '> Running int__ intermediate models…',
  '> Running mart__ presentation layer…',
  '> All models materialised. 6 roles · 19 skills · 5 projects',
  '> Ready.',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────


function parseDateValue(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function parseYear(value: unknown): number | null {
  const d = parseDateValue(value);
  return d ? d.getUTCFullYear() : null;
}

function monthDiff(a: Date, b: Date): number {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

function monthSpanInclusive(a: Date, b: Date): number {
  return monthDiff(a, b) + 1;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatRolePeriod(start: unknown, end: unknown, isCurrent: boolean): string {
  const s = parseDateValue(start);
  const e = parseDateValue(end);
  const startStr = s ? formatMonthYear(s) : '?';
  const endStr = isCurrent ? 'Present' : (e ? formatMonthYear(e) : '?');
  return `${startStr} – ${endStr}`;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function toObjArray(value: unknown): Array<{ skill: string; category: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map((item) => ({
    skill: String((item as Record<string, unknown>)?.skill ?? ''),
    category: String((item as Record<string, unknown>)?.category ?? ''),
  }));
}

function isFileExplorerModelName(name: string): boolean {
  return FILE_EXPLORER_PREFIXES.some((p) => name.startsWith(p));
}

function getExplorerLayer(name: string): ExplorerLayer | null {
  if (name.startsWith('stg__'))  return 'stg';
  if (name.startsWith('int__'))  return 'int';
  if (name.startsWith('mart__')) return 'mart';
  return null;
}

function findModelDefinitionSql(modelName: string): string | null {
  const decl = `CREATE OR REPLACE VIEW ${modelName} AS`;
  const stmt = INIT_SQL.find((sql) => sql.includes(decl));
  return stmt ? stmt.trim() : null;
}

function extractModelSql(createViewSql: string): string {
  const match = createViewSql.match(/CREATE OR REPLACE VIEW \S+ AS\s*([\s\S]+)/i);
  return match ? match[1].trim() : createViewSql;
}

function contactIcon(kind: string) {
  if (kind === 'email')   return <Mail size={13} />;
  if (kind === 'phone')   return <Phone size={13} />;
  if (kind === 'website') return <Globe2 size={13} />;
  return <Globe2 size={13} />;
}

function toContactHref(kind: string, value: string): string | undefined {
  if (kind === 'email')   return `mailto:${value}`;
  if (kind === 'phone')   return `tel:${value}`;
  if (kind === 'website') return value;
  return undefined;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoLine({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const cls = 'flex items-center gap-1.5 truncate max-w-[220px]';
  return href ? (
    <a href={href} className={`${cls} hover:text-primary transition-colors`} target="_blank" rel="noreferrer">
      {icon}<span className="truncate">{label}</span>
    </a>
  ) : (
    <span className={cls}>{icon}<span className="truncate">{label}</span></span>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const duration = 1200;

  useEffect(() => {
    startRef.current = null;
    const animate = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return <>{display}{suffix}</>;
}

function MetricCard({ label, value, subtitle, icon }: {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/80 p-4 transition-all hover:border-primary/50 hover:bg-panel-bg">
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
           style={{ background: 'radial-gradient(circle at 50% 0%, rgba(60,131,246,0.08) 0%, transparent 70%)' }} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{label}</span>
          <span className="text-text-dim/60">{icon}</span>
        </div>
        <p className="font-mono text-3xl font-bold tabular-nums text-text-main">
          <AnimatedCounter target={value} />
        </p>
        <p className="mt-1 text-xs text-text-dim">{subtitle}</p>
      </div>
    </div>
  );
}

function SkillPill({ skill, category }: { skill: string; category: string }) {
  const colorMap: Record<string, string> = {
    'Programming Languages': 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    'Warehousing':           'bg-blue-500/10 text-blue-300 border-blue-500/20',
    'Analytics Engineering': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    'Ingestion':             'bg-purple-500/10 text-purple-300 border-purple-500/20',
    'IaC':                   'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    'AI & Automation':       'bg-pink-500/10 text-pink-300 border-pink-500/20',
  };
  const cls = colorMap[category] ?? 'bg-text-dim/10 text-text-dim border-border-subtle';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
      {skill}
    </span>
  );
}

function BootTerminal({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      if (i >= BOOT_MESSAGES.length) {
        setTimeout(() => { setDone(true); setTimeout(onDone, 400); }, 300);
        return;
      }
      setLines((prev) => [...prev, BOOT_MESSAGES[i]]);
      i++;
      setTimeout(tick, i === BOOT_MESSAGES.length ? 600 : 260);
    };
    setTimeout(tick, 200);
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-app-bg transition-opacity duration-500 ${done ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full max-w-xl px-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/50 bg-primary/10">
            <TerminalSquare size={16} className="text-primary" />
          </div>
          <span className="font-mono text-base font-semibold text-text-main">CareerOS</span>
          <span className="font-mono text-xs text-text-dim">v3.0 // Andrew Findlay</span>
        </div>
        <div className="rounded-lg border border-border-subtle bg-panel-bg p-5 font-mono text-xs">
          {lines.map((line, idx) => (
            <div key={idx} className={`leading-6 ${idx === lines.length - 1 ? 'text-text-main' : 'text-text-dim'}`}>
              {line}
              {idx === lines.length - 1 && !done && (
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsPane({ result }: { result: QueryResult }) {
  if (result.error) {
    return <div className="p-4 font-mono text-xs text-red-400">{result.error}</div>;
  }
  return (
    <div className="overflow-auto">
      <table className="w-full font-mono text-xs">
        <thead className="sticky top-0 bg-panel-bg">
          <tr>
            {result.columns.map((col) => (
              <th key={col.key} className="border-b border-border-subtle px-3 py-2 text-left font-medium text-text-dim">
                {col.label}
                <span className="ml-1 text-[9px] text-text-dim/50">{col.type}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-app-bg/30' : ''}>
              {result.columns.map((col) => (
                <td key={col.key} className="border-b border-border-subtle/50 px-3 py-1.5 text-text-dim">
                  {String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border-subtle px-3 py-2 font-mono text-[10px] text-text-dim">
        {result.affectedRows} rows · {result.executionTime}
      </div>
    </div>
  );
}

// ─── Explorer node builder ────────────────────────────────────────────────────

const EXPLORER_NODES: ExplorerNode[] = (() => {
  const warehouseObjects = SCHEMA_TABLES
    .filter((t) => !isFileExplorerModelName(t.name))
    .map((t) => ({
      id: `warehouse:${t.name}`,
      name: t.name,
      relationName: t.name,
      description: t.description,
      section: 'warehouse' as const,
      kind: 'table' as const,
      editorSql: `SELECT *\nFROM ${t.name}\nLIMIT 100;`,
      previewSql: `SELECT * FROM ${t.name} LIMIT 20;`,
    }));

  const modelFiles = SCHEMA_TABLES
    .filter((t) => isFileExplorerModelName(t.name))
    .map((t) => {
      const createViewSql = findModelDefinitionSql(t.name);
      const layer = getExplorerLayer(t.name) ?? 'stg';
      return {
        id: `file_explorer:${t.name}`,
        name: `${t.name}.sql`,
        relationName: t.name,
        description: t.description,
        section: 'file_explorer' as const,
        kind: 'model' as const,
        layer,
        codeSql: createViewSql ? extractModelSql(createViewSql) : undefined,
        editorSql: `SELECT *\nFROM ${t.name}\nLIMIT 100;`,
        previewSql: `SELECT * FROM ${t.name} LIMIT 20;`,
      };
    });

  return [...warehouseObjects, ...modelFiles];
})();

const DEFAULT_EXPLORER_NODE = EXPLORER_NODES.find((n) => n.section === 'warehouse') ?? EXPLORER_NODES[0];

// ─── Dashboard fallback data ──────────────────────────────────────────────────

const DASHBOARD_FALLBACK = {
  profile: {
    full_name: 'Andrew Findlay',
    headline: 'Analytics Engineer',
    location: 'London, United Kingdom',
    summary: 'Analytics Engineer focused on building data-led systems that improve outcomes and support confident decision-making for technical and non-technical stakeholders. Experienced in cross-functional delivery and translating complex technical concepts for non-technical audiences.',
    contact_methods: [
      { kind: 'email',   value: 'hello@andrewfindlay.io' },
      { kind: 'website', value: 'https://www.andrewfindlay.io' },
    ],
    social_profiles: [
      { platform: 'GitHub',   url: 'https://github.com/andrewfindlay',      handle: 'andrewfindlay' },
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/andrew-findlay', handle: 'andrew-findlay' },
    ],
  },
  experience: [
    {
      id: 'f1',
      title: 'Analytics Engineer',
      employer: 'Tasman Analytics',
      employment_type: 'Contract',
      start_date: '2025-07-01',
      end_date: null,
      is_current: true,
      summary: 'Implementing modern data stacks on greenfield client engagements, covering ingestion, transformation, and serving layers.',
      achievements: [
        'Implemented modern data stack engagements from discovery to serving, covering ingestion, transformation, and BI layers.',
        'Built AI-powered summarisation pipelines using BigQuery ML with LLM calls orchestrated through dbt.',
        'Optimised dbt models across BigQuery, Snowflake, and Microsoft Fabric to improve performance and reduce costs.',
        'Reviewed incremental model designs for large event datasets, reducing identity resolution complexity.',
        'Designed automated client data submission workflows with validation, error classification, and bulk transformation.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'Python', category: 'Programming Languages' },
        { skill: 'BigQuery', category: 'Warehousing' },
        { skill: 'Snowflake', category: 'Warehousing' },
        { skill: 'dbt Core', category: 'Analytics Engineering' },
        { skill: 'dbt Cloud', category: 'Analytics Engineering' },
        { skill: 'Fivetran', category: 'Ingestion' },
        { skill: 'Airbyte', category: 'Ingestion' },
        { skill: 'Terraform', category: 'IaC' },
        { skill: 'Claude Code', category: 'AI & Automation' },
      ],
    },
    {
      id: 'f2',
      title: 'Analytics Engineer',
      employer: 'The Orchard',
      employment_type: 'Full-time',
      start_date: '2023-03-01',
      end_date: '2025-06-01',
      is_current: false,
      summary: 'Led analytics engineering delivery across dbt, Looker, and Snowflake with a focus on reliability, performance, and stakeholder enablement.',
      achievements: [
        'Introduced pull-request and review templates for dbt Cloud and Looker workflows, improving governance and code quality.',
        'Implemented slim CI checks for all dbt pull requests, reducing production defects.',
        'Co-led Snowflake warehouse segmentation for different Looker user groups, reducing query queueing at stable cost.',
        'Introduced Datadog alerting for periods of heavy Snowflake load to improve warehouse reliability.',
        'Built datasets from MusicBrainz data landed in S3, expanding reusable external data assets for data science.',
        'Built datasets underpinning a new business review process, reducing analyst time-to-analysis.',
        'Managed ingestion prioritisation between data engineering and analytics teams.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'Python', category: 'Programming Languages' },
        { skill: 'Snowflake', category: 'Warehousing' },
        { skill: 'dbt Core', category: 'Analytics Engineering' },
        { skill: 'dbt Cloud', category: 'Analytics Engineering' },
        { skill: 'Looker', category: 'Analytics Engineering' },
        { skill: 'Fivetran', category: 'Ingestion' },
      ],
    },
    {
      id: 'f3',
      title: 'Senior Data Analyst',
      employer: 'TotallyMoney',
      employment_type: 'Full-time',
      start_date: '2021-09-01',
      end_date: '2022-09-01',
      is_current: false,
      summary: 'Modernised analytics workflows with dbt while mentoring experimentation practice across the analytics team.',
      achievements: [
        'Implemented dbt to modernise and streamline analytics data workflows, replacing ad-hoc SQL scripts.',
        'Mentored junior analysts on A/B testing methods, raising statistical confidence in product decisions.',
        'Supported non-technical teams to upskill their experimentation processes, improving trust in metrics.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'Python', category: 'Programming Languages' },
        { skill: 'dbt Core', category: 'Analytics Engineering' },
        { skill: 'Looker', category: 'Analytics Engineering' },
      ],
    },
    {
      id: 'f4',
      title: 'Product Data Analyst',
      employer: 'TotallyMoney',
      employment_type: 'Full-time',
      start_date: '2018-10-01',
      end_date: '2021-09-01',
      is_current: false,
      summary: 'Embedded experimentation and product analytics in cross-functional squads and replaced legacy spreadsheet reporting.',
      achievements: [
        'Implemented A/B testing as day-to-day practice within the product team, enabling evidence-based iteration.',
        'Partnered with engineering to define product data capture standards, improving instrumentation quality.',
        'Gathered stakeholder requirements and delivered Looker models and visualisations.',
        'Co-administered Looker and maintained uptime and data quality targets.',
        'Moved product reporting away from spreadsheet-based legacy workflows.',
        'Developed Monthly Active User reporting and helped define it as the North Star metric.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'Python', category: 'Programming Languages' },
        { skill: 'Looker', category: 'Analytics Engineering' },
      ],
    },
    {
      id: 'f5',
      title: 'Risk & Data Analyst',
      employer: 'Start Up Loans',
      employment_type: 'Full-time',
      start_date: '2017-09-01',
      end_date: '2018-09-01',
      is_current: false,
      summary: 'Produced automated MI reporting, supported board-level packs, and improved lending scorecard operations.',
      achievements: [
        'Produced daily SQL MI for internal and external stakeholders, delivering reliable recurring reporting.',
        'Contributed to company-wide data automation and rationalisation using SQL and VBA.',
        'Co-owned monthly board reporting packs including extraction, narrative, and process improvements.',
        'Identified issues in data warehouse feeds and coordinated supplier fixes, improving data quality continuity.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'Python', category: 'Programming Languages' },
        { skill: 'MySQL', category: 'Warehousing' },
      ],
    },
    {
      id: 'f6',
      title: 'Performance Analyst',
      employer: 'Start Up Loans',
      employment_type: 'Full-time',
      start_date: '2014-08-01',
      end_date: '2018-09-01',
      is_current: false,
      summary: 'Built KPI reporting, benchmarking, and performance scorecards for a network of subcontractors.',
      achievements: [
        'Produced monthly KPI and forecast reporting across 30+ subcontractors, enhancing network performance visibility.',
        'Worked across teams to identify 20+ underperforming subcontractors and support remediation and exits.',
        'Led specification and rollout of bespoke quarterly subcontractor KPI reporting.',
        'Introduced scorecard-based RAG monitoring for subcontractor performance.',
      ],
      skills_used: [
        { skill: 'SQL', category: 'Programming Languages' },
        { skill: 'MySQL', category: 'Warehousing' },
      ],
    },
  ],
  skills: [
    { category: 'Programming Languages', skill: 'SQL',         category_order: 1, skill_order: 1 },
    { category: 'Programming Languages', skill: 'Python',      category_order: 1, skill_order: 2 },
    { category: 'Warehousing',           skill: 'Snowflake',   category_order: 2, skill_order: 1 },
    { category: 'Warehousing',           skill: 'BigQuery',    category_order: 2, skill_order: 2 },
    { category: 'Warehousing',           skill: 'MySQL',       category_order: 2, skill_order: 3 },
    { category: 'Analytics Engineering', skill: 'dbt Core',    category_order: 3, skill_order: 1 },
    { category: 'Analytics Engineering', skill: 'dbt Cloud',   category_order: 3, skill_order: 2 },
    { category: 'Analytics Engineering', skill: 'Looker',      category_order: 3, skill_order: 3 },
    { category: 'Ingestion',             skill: 'Fivetran',    category_order: 4, skill_order: 1 },
    { category: 'Ingestion',             skill: 'Airbyte',     category_order: 4, skill_order: 2 },
    { category: 'IaC',                   skill: 'Terraform',   category_order: 5, skill_order: 1 },
    { category: 'AI & Automation',       skill: 'Claude Code', category_order: 6, skill_order: 1 },
  ],
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [booted, setBooted] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) ?? 'dark'; } catch { return 'dark'; }
  });
  const [showPreHistory, setShowPreHistory] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [activeExplorerNode, setActiveExplorerNode] = useState<ExplorerNode>(DEFAULT_EXPLORER_NODE);
  const [explorerInspectorTab, setExplorerInspectorTab] = useState<ExplorerInspectorTab>('schema');
  const [editorSql, setEditorSql] = useState(DEFAULT_EXPLORER_NODE.editorSql);
  const [editorResult, setEditorResult] = useState<QueryResult | null>(null);
  const [editorRunning, setEditorRunning] = useState(false);
  const [schemaResult, setSchemaResult] = useState<QueryResult | null>(null);
  const [previewResult, setPreviewResult] = useState<QueryResult | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResultsMap>({});
  const [masterCv, setMasterCv] = useState<MasterCvContract | null>(null);

  // ── Theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    try { localStorage.setItem(THEME_STORAGE_KEY, themeMode); } catch { /* ignore */ }
  }, [themeMode]);

  // ── DB init + saved queries ──
  useEffect(() => {
    if (!booted) return;
    (async () => {
      try {
        await initDB();
        setDbReady(true);
        const queryIds: QueryId[] = ['profile_overview', 'experience_timeline', 'skills_matrix', 'education_history', 'projects_showcase', 'master_cv'];
        const results = await Promise.allSettled(queryIds.map((id) => executeSavedQuery(id)));
        const map: QueryResultsMap = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            map[queryIds[i]] = r.value.result;
            if (queryIds[i] === 'master_cv' && r.value.masterCv) setMasterCv(r.value.masterCv);
          }
        });
        setQueryResults(map);
      } catch (err) {
        console.error('DB init failed:', err);
      }
    })();
  }, [booted]);

  // ── Auto-load schema / preview when inspector tab changes ──
  useEffect(() => {
    if (!dbReady || schemaResult || explorerInspectorTab !== 'schema') return;
    runQuery(`DESCRIBE ${activeExplorerNode.relationName};`).then(setSchemaResult);
  }, [explorerInspectorTab, activeExplorerNode, dbReady, schemaResult]);

  useEffect(() => {
    if (!dbReady || previewResult || explorerInspectorTab !== 'preview') return;
    runQuery(activeExplorerNode.previewSql ?? `SELECT * FROM ${activeExplorerNode.relationName} LIMIT 20;`).then(setPreviewResult);
  }, [explorerInspectorTab, activeExplorerNode, dbReady, previewResult]);

  // ── Dashboard data extraction ──
  const profileData = useMemo(() => {
    const rows = (queryResults['profile_overview']?.data ?? []) as DataRow[];
    if (rows.length === 0) return DASHBOARD_FALLBACK.profile;
    const row = rows[0];
    return {
      full_name:       String(row.full_name ?? DASHBOARD_FALLBACK.profile.full_name),
      headline:        String(row.headline ?? DASHBOARD_FALLBACK.profile.headline),
      location:        String(row.location ?? DASHBOARD_FALLBACK.profile.location),
      summary:         String(row.summary ?? DASHBOARD_FALLBACK.profile.summary),
      contact_methods: toObjArray(row.contact_methods) as Array<{ kind: string; value: string; label?: string }> ?? DASHBOARD_FALLBACK.profile.contact_methods,
      social_profiles: toObjArray(row.social_profiles) as Array<{ platform: string; url: string; handle: string }> ?? DASHBOARD_FALLBACK.profile.social_profiles,
    };
  }, [queryResults]);

  const experienceRows = useMemo((): TimelineRow[] => {
    const rows = (queryResults['experience_timeline']?.data ?? []) as DataRow[];
    const source = rows.length > 0 ? rows : DASHBOARD_FALLBACK.experience;
    return source
      .map((row) => {
        const start = parseDateValue(row.start_date) ?? new Date();
        const end = row.is_current ? new Date() : parseDateValue(row.end_date) ?? new Date();
        return {
          id:              String(row.id ?? ''),
          title:           String(row.title ?? ''),
          employer:        String(row.employer ?? ''),
          employment_type: String(row.employment_type ?? ''),
          start_date:      row.start_date,
          end_date:        row.end_date,
          is_current:      Boolean(row.is_current),
          summary:         String(row.summary ?? ''),
          achievements:    toStringArray(row.achievements),
          skills_used:     toObjArray(row.skills_used),
          timelineStart:   start,
          timelineEnd:     end,
          tenure_months:   Number(row.tenure_months ?? monthSpanInclusive(start, end)),
        };
      })
      .sort((a, b) => b.timelineStart.getTime() - a.timelineStart.getTime());
  }, [queryResults]);

  const skillRows = useMemo(() => {
    const rows = (queryResults['skills_matrix']?.data ?? []) as DataRow[];
    return rows.length > 0 ? rows : DASHBOARD_FALLBACK.skills;
  }, [queryResults]);

  const skillsByCategory = useMemo(() => {
    const map = new Map<string, typeof skillRows>();
    skillRows.forEach((s) => {
      const cat = String(s.category ?? 'Other');
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return map;
  }, [skillRows]);

  // ── Timeline bounds ──
  const currentRole = useMemo(() => experienceRows.find((r) => r.is_current) ?? experienceRows[0] ?? null, [experienceRows]);

  // Pre-TotallyMoney history toggle (keeping same UX pattern)
  const earlyRows = useMemo(() => {
    const tmStart = experienceRows.find((r) => r.employer.toLowerCase().includes('totallymoney'))?.timelineStart;
    if (!tmStart) return [];
    return experienceRows.filter((r) => r.timelineStart < tmStart);
  }, [experienceRows]);

  const visibleRows = useMemo(() => {
    const tmStart = experienceRows.find((r) => r.employer.toLowerCase().includes('totallymoney'))?.timelineStart;
    if (!tmStart || showPreHistory) return experienceRows;
    return experienceRows.filter((r) => r.timelineStart >= tmStart);
  }, [experienceRows, showPreHistory]);

  const timelineBounds = useMemo(() => {
    if (visibleRows.length === 0) { const now = new Date(); return { min: now, max: now, spanMonths: 1 }; }
    const min = new Date(Math.min(...visibleRows.map((r) => r.timelineStart.getTime())));
    const max = new Date(Math.max(...visibleRows.map((r) => r.timelineEnd.getTime())));
    return { min, max, spanMonths: Math.max(1, monthSpanInclusive(min, max)) };
  }, [visibleRows]);

  const yearsExperience = useMemo(() => {
    const dataStart = new Date('2018-10-01');
    const now = new Date();
    const years = now.getFullYear() - dataStart.getFullYear();
    const monthAdjust = now.getMonth() < dataStart.getMonth() ||
      (now.getMonth() === dataStart.getMonth() && now.getDate() < dataStart.getDate()) ? 1 : 0;
    return years - monthAdjust;
  }, []);

  // ── Explorer ──
  const filteredNodes = useMemo(() => {
    const q = explorerSearch.trim().toLowerCase();
    if (!q) return EXPLORER_NODES;
    return EXPLORER_NODES.filter((n) => n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
  }, [explorerSearch]);

  const warehouseNodes = filteredNodes.filter((n) => n.section === 'warehouse');
  const fileNodes      = filteredNodes.filter((n) => n.section === 'file_explorer');
  const nodesByLayer   = {
    stg:  fileNodes.filter((n) => n.layer === 'stg'),
    int:  fileNodes.filter((n) => n.layer === 'int'),
    mart: fileNodes.filter((n) => n.layer === 'mart'),
  };

  function selectNode(node: ExplorerNode) {
    setActiveExplorerNode(node);
    setEditorSql(node.editorSql);
    setEditorResult(null);
    setSchemaResult(null);
    setPreviewResult(null);
    setExplorerInspectorTab(node.section === 'file_explorer' ? 'code' : 'schema');
  }

  async function runEditorQuery() {
    if (!dbReady) return;
    setEditorRunning(true);
    try {
      const result = await runQuery(editorSql);
      setEditorResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setEditorRunning(false);
    }
  }

  // ── Export data ──
  const exportRows = useMemo(() => {
    if (!masterCv) return null;
    return masterCv;
  }, [masterCv]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {!booted && <BootTerminal onDone={() => setBooted(true)} />}

      <div className="min-h-screen bg-app-bg text-text-main">
        {/* ── Dot-grid background ── */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-border-subtle/80 bg-app-bg/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 md:px-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-primary/50 bg-primary/10">
                <TerminalSquare size={13} className="text-primary" />
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight">CareerOS</span>
              <span className="hidden font-mono text-[11px] text-text-dim sm:inline">// Andrew Findlay</span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1 rounded-lg border border-border-subtle bg-panel-bg/70 p-1">
              {APP_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-panel-highlight text-text-main shadow-[inset_0_0_0_1px_rgba(60,131,246,0.4)]'
                      : 'text-text-dim hover:text-text-main'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {dbReady && (
                <span className="hidden items-center gap-1.5 rounded border border-emerald-900/50 bg-emerald-950/50 px-2 py-1 font-mono text-[10px] text-emerald-400 sm:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  DB ready
                </span>
              )}
              <button
                type="button"
                onClick={() => setThemeMode((p) => p === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-panel-bg px-2.5 py-1.5 text-xs text-text-main transition hover:border-primary"
              >
                {themeMode === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                {themeMode === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">

          {/* ══════════════════════════════════════════
              DASHBOARD TAB
          ══════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <section className="space-y-6" aria-label="Dashboard">

              {/* Profile hero */}
              <article className="relative overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/80 p-6">
                {/* Background accent */}
                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-10"
                     style={{ background: 'radial-gradient(circle, #3c83f6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="relative grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
                  {/* Avatar */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-primary/30">
                    <img src="/avatar.jpg" alt={profileData.full_name} className="h-full w-full object-cover object-top" />
                  </div>
                  {/* Bio */}
                  <div>
                    <h1 className="text-2xl font-bold leading-tight tracking-tight">{profileData.full_name}</h1>
                    <p className="mt-1 font-mono text-sm text-primary">{profileData.headline}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-dim">{profileData.summary}</p>
                  </div>
                  {/* Contact */}
                  <div className="flex flex-col gap-2 text-xs text-text-dim">
                    <InfoLine icon={<MapPin size={13} />} label={profileData.location} />
                    {profileData.contact_methods.map((m) => (
                      <InfoLine key={m.kind} icon={contactIcon(m.kind)} label={m.value} href={toContactHref(m.kind, m.value)} />
                    ))}
                    {profileData.social_profiles.map((s) => (
                      <InfoLine key={s.platform} icon={<ExternalLink size={13} />} label={s.platform} href={s.url} />
                    ))}
                  </div>
                </div>
              </article>

              {/* Metric cards */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Experience" value={yearsExperience ?? 11} subtitle="years in data" icon={<Briefcase size={15} />} />
                <MetricCard label="Roles"       value={experienceRows.length} subtitle="positions tracked" icon={<CircleDot size={15} />} />
                <MetricCard label="Current tenure" value={currentRole?.tenure_months ?? 0} subtitle="months at Tasman" icon={<Zap size={15} />} />
                <MetricCard label="Skills" value={skillRows.length} subtitle="tracked across roles" icon={<Table2 size={15} />} />
              </section>

              {/* Main grid: Timeline + right sidebar */}
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

                {/* ── Experience timeline ── */}
                <article className="rounded-xl border border-border-subtle bg-panel-bg/80">
                  <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
                    <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
                      <CircleDot size={14} className="text-primary" />
                      Experience Log
                    </h2>
                    <div className="flex items-center gap-2">
                      {earlyRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPreHistory((p) => !p)}
                          className="rounded border border-border-subtle bg-panel-highlight/40 px-2 py-1 font-mono text-[10px] text-text-dim hover:border-primary hover:text-text-main"
                        >
                          {showPreHistory ? 'Collapse' : `+${earlyRows.length} earlier`}
                        </button>
                      )}
                      <button type="button" onClick={() => setActiveTab('data-explorer')} className="flex items-center gap-1 text-xs text-primary hover:text-blue-300">
                        Explore <ArrowUpRight size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Timeline axis */}
                  <div className="px-5 pb-0 pt-4">
                    <div className="relative mb-4 h-6">
                      <div className="absolute left-0 right-0 top-3 h-px bg-border-subtle" />
                      {[timelineBounds.min.getUTCFullYear(), timelineBounds.max.getUTCFullYear()].map((yr, i) => {
                        const left = i === 0 ? 0 : 100;
                        return (
                          <div key={yr} className="absolute -translate-x-1/2" style={{ left: `${left}%` }}>
                            <div className="h-3 w-px bg-border-subtle mx-auto" />
                            <p className="mt-0.5 font-mono text-[9px] text-text-dim">{yr}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role cards */}
                  <div className="space-y-3 px-5 pb-5">
                    {visibleRows.map((row) => {
                      const offsetMonths = monthDiff(timelineBounds.min, row.timelineStart);
                      const durMonths = Math.max(1, monthSpanInclusive(row.timelineStart, row.timelineEnd));
                      const left = (offsetMonths / timelineBounds.spanMonths) * 100;
                      const width = (durMonths / timelineBounds.spanMonths) * 100;

                      return (
                        <article
                          key={row.id}
                          className={`group rounded-lg border bg-panel-highlight/20 p-4 transition-all hover:bg-panel-highlight/40 ${
                            row.is_current
                              ? 'border-primary/30 shadow-[0_0_0_1px_rgba(60,131,246,0.1)]'
                              : 'border-border-subtle'
                          }`}
                        >
                          {/* Role header */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{row.title}</p>
                                {row.is_current && (
                                  <span className="flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/60 px-2 py-0.5 font-mono text-[9px] text-emerald-400">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-xs text-primary">{row.employer}</p>
                            </div>
                            <div className="text-right">
                              <span className="rounded border border-border-subtle bg-app-bg px-2 py-0.5 font-mono text-[10px] text-text-dim">
                                {formatRolePeriod(row.start_date, row.end_date, row.is_current)}
                              </span>
                              <p className="mt-1 font-mono text-[10px] text-text-dim">{row.employment_type}</p>
                            </div>
                          </div>

                          {/* Mini timeline bar */}
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-app-bg">
                            <div
                              className={`h-full rounded-full transition-all ${row.is_current ? 'bg-primary' : 'bg-primary/40'}`}
                              style={{ marginLeft: `${left}%`, width: `${Math.max(width, 2)}%` }}
                            />
                          </div>

                          {/* Summary */}
                          <p className="mt-3 text-xs leading-relaxed text-text-dim">{row.summary}</p>

                          {/* Achievements */}
                          {row.achievements.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {row.achievements.map((a) => (
                                <li key={a} className="flex gap-2 text-xs text-text-dim">
                                  <span className="mt-0.5 shrink-0 text-primary">▸</span>
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Skills used in this role — the key new addition */}
                          {row.skills_used.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {row.skills_used.map((s) => (
                                <SkillPill key={s.skill} skill={s.skill} category={s.category} />
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </article>

                {/* ── Right sidebar ── */}
                <div className="space-y-6">

                  {/* Skills matrix */}
                  <article className="rounded-xl border border-border-subtle bg-panel-bg/80">
                    <div className="border-b border-border-subtle px-5 py-3.5">
                      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-dim flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        Skills Matrix
                      </h2>
                    </div>
                    <div className="p-5 space-y-4">
                      {Array.from(skillsByCategory.entries()).map(([cat, skills]) => (
                        <div key={cat}>
                          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim">{cat}</p>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((s) => (
                              <span
                                key={String(s.skill)}
                                className="rounded-md border border-border-subtle bg-panel-highlight/30 px-2.5 py-1.5 text-sm text-text-main transition-colors hover:border-primary/50 hover:bg-panel-highlight/60"
                              >
                                {String(s.skill)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  {/* Education */}
                  <article className="rounded-xl border border-border-subtle bg-panel-bg/80">
                    <div className="border-b border-border-subtle px-5 py-3.5">
                      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-dim flex items-center gap-2">
                        <GraduationCap size={14} className="text-primary" />
                        Education
                      </h2>
                    </div>
                    <div className="space-y-3 p-5">
                      {[
                        { institution: 'Birkbeck, University of London', credential: 'Graduate Certificate', field: 'Statistical Data Science', years: '2020–2021' },
                        { institution: 'University College London',       credential: 'MSc',                  field: 'International Public Policy', years: '2012–2013' },
                        { institution: 'University of Reading',           credential: 'BA',                   field: 'Politics & International Relations', years: '2008–2011' },
                      ].map((edu) => (
                        <div key={edu.institution} className="rounded-lg border border-border-subtle bg-panel-highlight/20 p-3">
                          <p className="text-sm font-semibold leading-snug">{edu.institution}</p>
                          <p className="mt-0.5 text-xs text-text-dim">{edu.credential} · {edu.field}</p>
                          <p className="mt-1 font-mono text-[10px] text-text-dim">{edu.years}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            </section>
          )}

          {/* ══════════════════════════════════════════
              DATA EXPLORER TAB
          ══════════════════════════════════════════ */}
          {activeTab === 'data-explorer' && (
            <section className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/60">

              {/* Left sidebar: object browser */}
              <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle">
                <div className="p-3">
                  <input
                    type="search"
                    placeholder="Search tables & models…"
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    className="w-full rounded border border-border-subtle bg-app-bg px-3 py-1.5 font-mono text-xs text-text-main placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {/* Source tables */}
                  <div className="px-3 py-1.5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">Data Warehouse</p>
                  </div>
                  {warehouseNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => selectNode(node)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs transition ${
                        activeExplorerNode.id === node.id ? 'bg-primary/10 text-text-main' : 'text-text-dim hover:bg-panel-highlight hover:text-text-main'
                      }`}
                    >
                      <Table2 size={11} className={activeExplorerNode.id === node.id ? 'text-primary' : 'text-text-dim'} />
                      <span className="truncate">{node.name}</span>
                    </button>
                  ))}

                  {/* File explorer layers */}
                  {(['stg', 'int', 'mart'] as ExplorerLayer[]).map((layer) => (
                    nodesByLayer[layer].length > 0 && (
                      <React.Fragment key={layer}>
                        <div className="mt-3 px-3 py-1">
                          <p className={`font-mono text-[9px] uppercase tracking-[0.15em] ${LAYER_COLORS[layer]}`}>
                            {EXPLORER_LAYER_LABELS[layer]}
                          </p>
                        </div>
                        {nodesByLayer[layer].map((node) => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => selectNode(node)}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs transition ${
                              activeExplorerNode.id === node.id ? 'bg-primary/10 text-text-main' : 'text-text-dim hover:bg-panel-highlight hover:text-text-main'
                            }`}
                          >
                            <FileCode2 size={11} className={activeExplorerNode.id === node.id ? 'text-primary' : 'text-text-dim'} />
                            <span className="truncate">{node.name}</span>
                          </button>
                        ))}
                      </React.Fragment>
                    )
                  ))}
                </div>
              </aside>

              {/* Main panel: editor + inspector */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Object header */}
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{activeExplorerNode.name}</p>
                    <p className="mt-0.5 text-xs text-text-dim">{activeExplorerNode.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {(activeExplorerNode.section === 'file_explorer'
                      ? ['code', 'preview', 'sql'] as ExplorerInspectorTab[]
                      : ['schema', 'preview', 'sql'] as ExplorerInspectorTab[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setExplorerInspectorTab(t)}
                        className={`rounded px-3 py-1.5 font-mono text-xs transition ${
                          explorerInspectorTab === t ? 'bg-primary/15 text-primary' : 'text-text-dim hover:text-text-main'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* code tab: dbt model SQL, read-only */}
                {explorerInspectorTab === 'code' && (
                  <div className="relative flex-1 overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language="sql"
                      theme={themeMode === 'dark' ? 'vs-dark' : 'vs'}
                      value={activeExplorerNode.codeSql ?? '-- Model definition not available'}
                      options={{ fontSize: 12, minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12 }, readOnly: true }}
                    />
                  </div>
                )}

                {/* schema tab: DESCRIBE results */}
                {explorerInspectorTab === 'schema' && (
                  <div className="flex-1 overflow-auto">
                    {schemaResult
                      ? <ResultsPane result={schemaResult} />
                      : <div className="flex h-full items-center justify-center font-mono text-xs text-text-dim">{dbReady ? 'Loading schema…' : 'Waiting for DB…'}</div>
                    }
                  </div>
                )}

                {/* preview tab: SELECT * LIMIT 20 */}
                {explorerInspectorTab === 'preview' && (
                  <div className="flex-1 overflow-auto">
                    {previewResult
                      ? <ResultsPane result={previewResult} />
                      : <div className="flex h-full items-center justify-center font-mono text-xs text-text-dim">{dbReady ? 'Loading preview…' : 'Waiting for DB…'}</div>
                    }
                  </div>
                )}

                {/* sql tab: ad-hoc editor */}
                {explorerInspectorTab === 'sql' && (
                  <>
                    <div className="relative flex-1 overflow-hidden border-b border-border-subtle">
                      <MonacoEditor
                        height="100%"
                        language="sql"
                        theme={themeMode === 'dark' ? 'vs-dark' : 'vs'}
                        value={editorSql}
                        onChange={(v) => setEditorSql(v ?? '')}
                        options={{ fontSize: 12, minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12 } }}
                      />
                      <button
                        type="button"
                        onClick={runEditorQuery}
                        disabled={editorRunning || !dbReady}
                        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        <Play size={14} />
                        {editorRunning ? 'Running…' : 'Run Query'}
                      </button>
                    </div>
                    {editorResult && (
                      <div className="max-h-56">
                        <ResultsPane result={editorResult} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════
              EXPORT TAB
          ══════════════════════════════════════════ */}
          {activeTab === 'export' && (
            <section className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-xl border border-border-subtle bg-panel-bg/80 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                  <ArrowDownToLine size={22} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold">Export CV</h2>
                <p className="mt-2 text-sm text-text-dim">
                  Download a polished PDF version of this CV, or export the raw data powering this site.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'PDF CV',   sub: 'Best for sharing with hiring teams.', href: CV_PDF_URL,                                    icon: <ArrowDownToLine size={16} /> },
                    { label: 'LinkedIn', sub: 'View full profile.',                   href: 'https://linkedin.com/in/andrew-findlay',      icon: <ExternalLink size={16} /> },
                  ].map((opt) => (
                    <a
                      key={opt.label}
                      href={opt.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle bg-panel-highlight/30 p-5 text-center transition hover:border-primary hover:bg-panel-highlight/60"
                    >
                      <span className="text-primary">{opt.icon}</span>
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-xs text-text-dim">{opt.sub}</span>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
