import type { MasterCvContract, QueryResult } from '../types';

function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
}

export function parseMasterCvResult(result: QueryResult): MasterCvContract | null {
  if (result.error || result.data.length === 0) {
    return null;
  }

  const firstRow = result.data[0] as Record<string, unknown>;
  const cvRaw = firstRow.cv as Record<string, unknown> | undefined;
  if (!cvRaw || typeof cvRaw !== 'object') {
    return null;
  }

  const person = (cvRaw.person as Record<string, unknown>) ?? {};

  return {
    person: {
      name: String(person.name ?? ''),
      headline: String(person.headline ?? ''),
      location: String(person.location ?? ''),
      summary: String(person.summary ?? '')
    },
    contact_methods: asArray(cvRaw.contact_methods),
    social_profiles: asArray(cvRaw.social_profiles),
    experience: asArray(cvRaw.experience),
    skills: asArray(cvRaw.skills),
    education: asArray(cvRaw.education),
    certifications: asArray(cvRaw.certifications),
    projects: asArray(cvRaw.projects),
    talks: asArray(cvRaw.talks),
    updated_at: String(cvRaw.updated_at ?? '')
  };
}
