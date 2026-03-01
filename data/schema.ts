// data/schema.ts
// Coherent analytics data model: source → stg → int → mart
// Key additions vs previous version:
//   - role_skill: skills used per role (closes the "what did I use where?" gap)
//   - talk_or_article: renamed from publication_or_talk, FK to role added
//   - layers renamed to stg / int / mart (standard dbt convention)
//   - query_catalog + query_run_event removed from domain tables
//   - start_date_precision / end_date_precision removed (use first-of-month convention)
//   - impact_metric removed from role_achievement (dead column)

export const INIT_SQL: string[] = [
  // ─────────────────────────────────────────
  // SOURCE LAYER — normalised facts, no logic
  // ─────────────────────────────────────────
  `CREATE TABLE person (
    id             INTEGER PRIMARY KEY,
    full_name      VARCHAR NOT NULL,
    headline       VARCHAR NOT NULL,
    summary        VARCHAR NOT NULL,
    location       VARCHAR NOT NULL,
    source         VARCHAR NOT NULL DEFAULT 'cv',
    updated_at     TIMESTAMP NOT NULL
  );`,

  `CREATE TABLE contact_method (
    id             INTEGER PRIMARY KEY,
    person_id      INTEGER NOT NULL,
    kind           VARCHAR NOT NULL,   -- 'email' | 'phone' | 'website'
    value          VARCHAR NOT NULL,
    label          VARCHAR,
    display_order  INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,

  `CREATE TABLE social_profile (
    id             INTEGER PRIMARY KEY,
    person_id      INTEGER NOT NULL,
    platform       VARCHAR NOT NULL,   -- 'GitHub' | 'LinkedIn'
    url            VARCHAR NOT NULL,
    handle         VARCHAR,
    display_order  INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,

  `CREATE TABLE employer (
    id             INTEGER PRIMARY KEY,
    name           VARCHAR NOT NULL,
    website        VARCHAR,
    location       VARCHAR,
    industry       VARCHAR
  );`,

  `CREATE TABLE role (
    id              INTEGER PRIMARY KEY,
    person_id       INTEGER NOT NULL,
    employer_id     INTEGER NOT NULL,
    title           VARCHAR NOT NULL,
    employment_type VARCHAR NOT NULL,  -- 'Full-time' | 'Contract' | 'Part-time'
    start_date      DATE NOT NULL,     -- always first-of-month
    end_date        DATE,              -- NULL when is_current = true
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    summary         VARCHAR NOT NULL,
    display_order   INTEGER NOT NULL,
    FOREIGN KEY (person_id)  REFERENCES person(id),
    FOREIGN KEY (employer_id) REFERENCES employer(id)
  );`,

  `CREATE TABLE role_achievement (
    id               INTEGER PRIMARY KEY,
    role_id          INTEGER NOT NULL,
    achievement_text VARCHAR NOT NULL,
    display_order    INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id)
  );`,

  `CREATE TABLE skill_category (
    id             INTEGER PRIMARY KEY,
    name           VARCHAR NOT NULL,
    display_order  INTEGER NOT NULL
  );`,

  `CREATE TABLE skill (
    id               INTEGER PRIMARY KEY,
    skill_category_id INTEGER NOT NULL,
    name             VARCHAR NOT NULL,
    display_order    INTEGER NOT NULL,
    FOREIGN KEY (skill_category_id) REFERENCES skill_category(id)
  );`,

  // Person-level skill record: years of experience + whether it's a highlighted/core skill.
  // Proficiency as a percentage is deliberately omitted — it's a made-up number that means nothing
  // to a reader. Instead we surface years_experience (real) and roles_used_in (derived from role_skill).
  `CREATE TABLE person_skill (
    id               INTEGER PRIMARY KEY,
    person_id        INTEGER NOT NULL,
    skill_id         INTEGER NOT NULL,
    years_experience DECIMAL(4,1) NOT NULL,
    highlighted      BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (person_id) REFERENCES person(id),
    FOREIGN KEY (skill_id)  REFERENCES skill(id)
  );`,

  // KEY ADDITION: which skills were used in which role
  `CREATE TABLE role_skill (
    id        INTEGER PRIMARY KEY,
    role_id   INTEGER NOT NULL,
    skill_id  INTEGER NOT NULL,
    FOREIGN KEY (role_id)  REFERENCES role(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
  );`,

  `CREATE TABLE education (
    id             INTEGER PRIMARY KEY,
    person_id      INTEGER NOT NULL,
    institution    VARCHAR NOT NULL,
    credential     VARCHAR NOT NULL,
    field_of_study VARCHAR,
    start_year     INTEGER,
    end_year       INTEGER,
    display_order  INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,

  `CREATE TABLE certification (
    id                  INTEGER PRIMARY KEY,
    person_id           INTEGER NOT NULL,
    certification_name  VARCHAR NOT NULL,
    issuer              VARCHAR NOT NULL,
    issue_year          INTEGER,
    credential_url      VARCHAR,
    display_order       INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,

  `CREATE TABLE project (
    id             INTEGER PRIMARY KEY,
    person_id      INTEGER NOT NULL,
    name           VARCHAR NOT NULL,
    description    VARCHAR NOT NULL,
    repo_url       VARCHAR,
    demo_url       VARCHAR,
    start_year     INTEGER,
    end_year       INTEGER,
    display_order  INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,

  `CREATE TABLE project_skill (
    id         INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL,
    skill_id   INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (skill_id)   REFERENCES skill(id)
  );`,

  // Renamed from publication_or_talk; role_id added so context is preserved
  `CREATE TABLE talk_or_article (
    id               INTEGER PRIMARY KEY,
    person_id        INTEGER NOT NULL,
    role_id          INTEGER,           -- optional: which role were you in when this happened?
    kind             VARCHAR NOT NULL,  -- 'talk' | 'article' | 'podcast'
    title            VARCHAR NOT NULL,
    venue            VARCHAR,
    publication_year INTEGER,
    url              VARCHAR,
    display_order    INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id),
    FOREIGN KEY (role_id)   REFERENCES role(id)
  );`,

  // ──────────────────────────────────────────────────────────────
  // SEED DATA  (loaded from CSV files in public/seeds/)
  // In development DuckDB-WASM reads the CSVs directly via fetch.
  // In the dbt project, run `dbt seed` to load these into DuckDB.
  // ──────────────────────────────────────────────────────────────
  // Tables are populated by loadSeedsFromCsv() in lib/db.ts.
  // The CREATE TABLE statements above remain; INSERTs are gone.
  // ──────────────────────────────────────────────────────────────

    // ─────────────────────────────────
  // STAGING LAYER (stg__)
  // Clean, typed, no business logic
  // ─────────────────────────────────
  `CREATE OR REPLACE VIEW stg__roles AS
    SELECT
      r.person_id,
      r.id,
      e.name           AS employer,
      e.industry       AS employer_industry,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.display_order  AS role_order
    FROM role r
    JOIN employer e ON e.id = r.employer_id;`,

  `CREATE OR REPLACE VIEW stg__achievements AS
    SELECT role_id, achievement_text, display_order
    FROM role_achievement;`,

  `CREATE OR REPLACE VIEW stg__skills AS
    SELECT
      ps.person_id,
      sc.name           AS category,
      s.name            AS skill,
      s.id              AS skill_id,
      ps.years_experience,
      ps.highlighted,
      sc.display_order  AS category_order,
      s.display_order   AS skill_order
    FROM person_skill ps
    JOIN skill s  ON s.id = ps.skill_id
    JOIN skill_category sc ON sc.id = s.skill_category_id;`,

  `CREATE OR REPLACE VIEW stg__role_skills AS
    SELECT
      rs.role_id,
      s.name           AS skill,
      sc.name          AS category,
      sc.display_order AS category_order,
      s.display_order  AS skill_order
    FROM role_skill rs
    JOIN skill s  ON s.id = rs.skill_id
    JOIN skill_category sc ON sc.id = s.skill_category_id;`,

  `CREATE OR REPLACE VIEW stg__education AS
    SELECT
      person_id,
      institution,
      credential,
      field_of_study,
      start_year,
      end_year,
      display_order AS education_order
    FROM education;`,

  `CREATE OR REPLACE VIEW stg__projects AS
    SELECT
      p.person_id,
      p.id,
      p.name,
      p.description,
      p.repo_url,
      p.demo_url,
      p.start_year,
      p.end_year,
      p.display_order AS project_order
    FROM project p;`,

  `CREATE OR REPLACE VIEW stg__profile AS
    SELECT
      p.id AS person_id,
      p.full_name,
      p.headline,
      p.location,
      p.summary,
      list({'kind': c.kind, 'value': c.value, 'label': c.label} ORDER BY c.display_order)
        FILTER (WHERE c.id IS NOT NULL) AS contact_methods,
      (
        SELECT list({'platform': s.platform, 'url': s.url, 'handle': s.handle} ORDER BY s.display_order)
        FROM social_profile s
        WHERE s.person_id = p.id
      ) AS social_profiles,
      p.updated_at
    FROM person p
    LEFT JOIN contact_method c ON c.person_id = p.id
    GROUP BY p.id, p.full_name, p.headline, p.location, p.summary, p.updated_at;`,

  // ─────────────────────────────────────────────
  // INTERMEDIATE LAYER (int__)
  // Business logic: rollups, tenure, skill scoring
  // ─────────────────────────────────────────────
  `CREATE OR REPLACE VIEW int__roles_with_achievements AS
    SELECT
      r.person_id,
      r.id,
      r.employer,
      r.employer_industry,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.role_order,
      CASE
        WHEN r.is_current THEN date_diff('month', r.start_date, current_date) + 1
        ELSE date_diff('month', r.start_date, coalesce(r.end_date, current_date)) + 1
      END AS tenure_months,
      list(a.achievement_text ORDER BY a.display_order)
        FILTER (WHERE a.achievement_text IS NOT NULL) AS achievements
    FROM stg__roles r
    LEFT JOIN stg__achievements a ON a.role_id = r.id
    GROUP BY r.person_id, r.id, r.employer, r.employer_industry, r.title,
             r.employment_type, r.start_date, r.end_date, r.is_current,
             r.summary, r.role_order;`,

  `CREATE OR REPLACE VIEW int__roles_with_skills AS
    SELECT
      r.person_id,
      r.id,
      r.employer,
      r.employer_industry,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.role_order,
      r.tenure_months,
      r.achievements,
      list({'skill': rs.skill, 'category': rs.category} ORDER BY rs.category_order, rs.skill_order)
        FILTER (WHERE rs.skill IS NOT NULL) AS skills_used
    FROM int__roles_with_achievements r
    LEFT JOIN stg__role_skills rs ON rs.role_id = r.id
    GROUP BY r.person_id, r.id, r.employer, r.employer_industry, r.title,
             r.employment_type, r.start_date, r.end_date, r.is_current,
             r.summary, r.role_order, r.tenure_months, r.achievements;`,

  // Skills enriched with context derived entirely from real data (years + role count).
  // skill_level is a human label derived from years_experience, not an arbitrary percentage.
  `CREATE OR REPLACE VIEW int__skills_with_context AS
    SELECT
      s.person_id,
      s.category,
      s.skill,
      s.skill_id,
      s.years_experience,
      s.highlighted,
      s.category_order,
      s.skill_order,
      CASE
        WHEN s.years_experience >= 8  THEN 'Expert'
        WHEN s.years_experience >= 4  THEN 'Advanced'
        WHEN s.years_experience >= 1.5 THEN 'Proficient'
        ELSE 'Familiar'
      END AS skill_level,
      (
        SELECT COUNT(DISTINCT rs.role_id)
        FROM role_skill rs
        WHERE rs.skill_id = s.skill_id
      ) AS roles_used_in,
      (
        SELECT list(DISTINCT e.name ORDER BY e.name)
        FROM role_skill rs
        JOIN role r ON r.id = rs.role_id
        JOIN employer e ON e.id = r.employer_id
        WHERE rs.skill_id = s.skill_id
      ) AS used_at_employers
    FROM stg__skills s;`,

  `CREATE OR REPLACE VIEW int__projects_with_skills AS
    SELECT
      p.person_id,
      p.id,
      p.name,
      p.description,
      p.repo_url,
      p.demo_url,
      p.start_year,
      p.end_year,
      p.project_order,
      list(s.name ORDER BY sc.display_order, s.display_order)
        FILTER (WHERE s.name IS NOT NULL) AS skills
    FROM stg__projects p
    LEFT JOIN project_skill ps ON ps.project_id = p.id
    LEFT JOIN skill s ON s.id = ps.skill_id
    LEFT JOIN skill_category sc ON sc.id = s.skill_category_id
    GROUP BY p.person_id, p.id, p.name, p.description,
             p.repo_url, p.demo_url, p.start_year, p.end_year, p.project_order;`,

  // ─────────────────────────────────────────
  // MART LAYER (mart__)
  // Replaces old dmn__ + prs__ split
  // Single clean view per business concept
  // ─────────────────────────────────────────
  `CREATE OR REPLACE VIEW mart__profile AS
    SELECT * FROM stg__profile;`,

  `CREATE OR REPLACE VIEW mart__timeline AS
    SELECT * FROM int__roles_with_skills ORDER BY role_order;`,

  `CREATE OR REPLACE VIEW mart__skills AS
    SELECT * FROM int__skills_with_context ORDER BY category_order, skill_order;`,

  `CREATE OR REPLACE VIEW mart__education AS
    SELECT
      e.*,
      c.certification_name,
      c.issuer,
      c.issue_year,
      c.credential_url
    FROM stg__education e
    FULL OUTER JOIN certification c ON c.person_id = e.person_id
    ORDER BY e.education_order NULLS LAST;`,

  `CREATE OR REPLACE VIEW mart__projects AS
    SELECT * FROM int__projects_with_skills ORDER BY project_order;`,

  `CREATE OR REPLACE VIEW mart__cv AS
    SELECT
      p.person_id,
      {
        'person': {
          'name':     p.full_name,
          'headline': p.headline,
          'location': p.location,
          'summary':  p.summary
        },
        'contact_methods': p.contact_methods,
        'social_profiles': p.social_profiles,
        'experience': (
          SELECT list({
            'employer':        e.employer,
            'title':           e.title,
            'employment_type': e.employment_type,
            'start_date':      CAST(e.start_date AS VARCHAR),
            'end_date':        CASE WHEN e.is_current THEN 'Present' ELSE CAST(e.end_date AS VARCHAR) END,
            'is_current':      e.is_current,
            'tenure_months':   e.tenure_months,
            'summary':         e.summary,
            'achievements':    e.achievements,
            'skills_used':     e.skills_used
          } ORDER BY e.role_order)
          FROM mart__timeline e
          WHERE e.person_id = p.person_id
        ),
        'skills': (
          SELECT list({
            'category':        s.category,
            'skill':           s.skill,
            'years_experience': s.years_experience,
            'skill_level':     s.skill_level,
            'highlighted':     s.highlighted,
            'roles_used_in':   s.roles_used_in,
            'used_at':         s.used_at_employers
          } ORDER BY s.category_order, s.skill_order)
          FROM mart__skills s
          WHERE s.person_id = p.person_id
        ),
        'education': (
          SELECT list({
            'institution':    e.institution,
            'credential':     e.credential,
            'field_of_study': e.field_of_study,
            'start_year':     e.start_year,
            'end_year':       e.end_year
          } ORDER BY e.education_order NULLS LAST)
          FROM stg__education e
          WHERE e.person_id = p.person_id
        ),
        'certifications': (
          SELECT list({
            'name':           c.certification_name,
            'issuer':         c.issuer,
            'issue_year':     c.issue_year,
            'credential_url': c.credential_url
          } ORDER BY c.display_order)
          FROM certification c
          WHERE c.person_id = p.person_id
        ),
        'projects': (
          SELECT list({
            'name':        pr.name,
            'description': pr.description,
            'repo_url':    pr.repo_url,
            'demo_url':    pr.demo_url,
            'start_year':  pr.start_year,
            'end_year':    pr.end_year,
            'skills':      pr.skills
          } ORDER BY pr.project_order)
          FROM mart__projects pr
          WHERE pr.person_id = p.person_id
        ),
        'updated_at': CAST(p.updated_at AS VARCHAR)
      } AS cv
    FROM mart__profile p;`
];

// ─────────────────────────────────────────────────
// Schema table registry for the Data Explorer UI
// Only mart__ views + source tables are surfaced.
// stg__ and int__ are shown in File Explorer (models).
// ─────────────────────────────────────────────────
export const SCHEMA_TABLES: Array<{ name: string; description: string }> = [
  // Source tables
  { name: 'person',           description: 'Root profile entity — one row per person.' },
  { name: 'contact_method',   description: 'Email, phone, and website contact channels.' },
  { name: 'social_profile',   description: 'GitHub, LinkedIn, and other social handles.' },
  { name: 'employer',         description: 'Normalised employer dimension with industry.' },
  { name: 'role',             description: 'Employment timeline — one row per job.' },
  { name: 'role_achievement', description: 'Bullet-point achievements per role.' },
  { name: 'role_skill',       description: 'Skills actually used in each role.' },
  { name: 'skill_category',   description: 'Skill groupings (e.g. Warehousing, AI).' },
  { name: 'skill',            description: 'Individual skills within categories.' },
  { name: 'person_skill',     description: 'Overall proficiency and experience per skill.' },
  { name: 'education',        description: 'Degrees and academic credentials.' },
  { name: 'certification',    description: 'Professional certifications.' },
  { name: 'project',          description: 'Portfolio and side projects.' },
  { name: 'project_skill',    description: 'Skills used per project.' },
  { name: 'talk_or_article',  description: 'Talks, articles, and podcasts.' },
  // Staging models
  { name: 'stg__profile',          description: 'Staged profile with contact and social arrays.' },
  { name: 'stg__roles',            description: 'Cleaned role records joined to employer.' },
  { name: 'stg__achievements',     description: 'Normalised achievement bullet points.' },
  { name: 'stg__skills',           description: 'Person-level skills with category metadata.' },
  { name: 'stg__role_skills',      description: 'Skills per role joined to skill metadata.' },
  { name: 'stg__education',        description: 'Cleaned education entries.' },
  { name: 'stg__projects',         description: 'Project records with ordering.' },
  // Intermediate models
  { name: 'int__roles_with_achievements', description: 'Roles with achievements rolled up and tenure calculated.' },
  { name: 'int__roles_with_skills',       description: 'Roles enriched with skills_used array.' },
  { name: 'int__skills_with_context',     description: 'Skills enriched with level, employer context, and role count.' },
  { name: 'int__projects_with_skills',    description: 'Projects enriched with linked skills array.' },
  // Mart views
  { name: 'mart__profile',    description: 'Mart: person profile for dashboard hero card.' },
  { name: 'mart__timeline',   description: 'Mart: career timeline with achievements and skills per role.' },
  { name: 'mart__skills',     description: 'Mart: skills matrix with proficiency, level, and employer context.' },
  { name: 'mart__education',  description: 'Mart: education and certifications combined.' },
  { name: 'mart__projects',   description: 'Mart: projects with linked skills.' },
  { name: 'mart__cv',         description: 'Mart: stable JSON CV contract consumed by the Export tab.' },
];
