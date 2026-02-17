export type SurfaceMode = 'workspace' | 'schema' | 'master_cv' | 'insights';

export type QueryId =
  | 'profile_overview'
  | 'experience_timeline'
  | 'skills_matrix'
  | 'education_history'
  | 'projects_showcase'
  | 'master_cv';

export type QueryParamType = 'string' | 'number' | 'boolean';

export type QueryParamValue = string | number | boolean;

export interface QueryParamDefinition {
  type: QueryParamType;
  required?: boolean;
  default?: QueryParamValue;
  minimum?: number;
  maximum?: number;
  enum?: QueryParamValue[];
  description?: string;
}

export type QueryParams = Record<string, QueryParamValue | undefined>;

export interface SavedQuery {
  id: QueryId;
  file: string;
  title: string;
  description: string;
  surface: 'Explorer' | 'Insights' | 'CV';
  readOnly: boolean;
  contractName: string;
  contractVersion: string;
  resultShape: 'table' | 'json_contract';
  tags: string[];
  paramsSchema: Record<string, QueryParamDefinition>;
}

export interface QueryCatalogEntry extends SavedQuery {
  sqlText: string;
}

export interface QueryResultColumn {
  key: string;
  label: string;
  type: string;
}

export interface QueryResult {
  columns: QueryResultColumn[];
  data: Array<Record<string, unknown>>;
  executionTime: string;
  affectedRows: number;
  error?: string;
}

export interface MasterCvPerson {
  name: string;
  headline: string;
  location: string;
  summary: string;
}

export interface MasterCvExperience {
  employer: string;
  title: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  summary: string;
  achievements: string[];
}

export interface MasterCvSkill {
  category: string;
  skill: string;
  proficiency: number;
  years_experience: number;
  highlighted: boolean;
}

export interface MasterCvContactMethod {
  kind: string;
  value: string;
  label?: string;
}

export interface MasterCvSocialProfile {
  platform: string;
  url: string;
  handle?: string;
}

export interface MasterCvEducation {
  institution: string;
  credential: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
}

export interface MasterCvCertification {
  name: string;
  issuer: string;
  issue_year?: number;
  credential_url?: string;
}

export interface MasterCvProject {
  name: string;
  description: string;
  repo_url?: string;
  demo_url?: string;
  start_year?: number;
  end_year?: number;
  skills: string[];
}

export interface MasterCvTalk {
  kind: string;
  title: string;
  venue?: string;
  publication_year?: number;
  url?: string;
}

export interface MasterCvContract {
  person: MasterCvPerson;
  contact_methods: MasterCvContactMethod[];
  social_profiles: MasterCvSocialProfile[];
  experience: MasterCvExperience[];
  skills: MasterCvSkill[];
  education: MasterCvEducation[];
  certifications: MasterCvCertification[];
  projects: MasterCvProject[];
  talks: MasterCvTalk[];
  updated_at: string;
}

// Legacy compatibility with existing components.
export type FileId =
  | 'bio.sql'
  | 'work_history.sql'
  | 'education.sql'
  | 'tech_stack.sql'
  | 'resume_export.sql'
  | 'scratchpad.sql';

export type ViewMode = 'editor' | 'schema';

export interface SqlFile {
  id: FileId;
  name: string;
  content: string;
  description: string;
  readOnly?: boolean;
}

export interface SchemaNode {
  id: string;
  title: string;
  type: 'public' | 'private';
  color: string;
  x: number;
  y: number;
  columns: Array<{
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
  }>;
}
