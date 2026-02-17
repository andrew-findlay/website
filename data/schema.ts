export const INIT_SQL: string[] = [
  `CREATE TABLE person (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    headline VARCHAR NOT NULL,
    summary VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL
  );`,
  `CREATE TABLE contact_method (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    kind VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    label VARCHAR,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE social_profile (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    handle VARCHAR,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE employer (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    website VARCHAR,
    location VARCHAR,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL
  );`,
  `CREATE TABLE role (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    employer_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    employment_type VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    start_date_precision VARCHAR NOT NULL,
    end_date DATE,
    end_date_precision VARCHAR,
    is_current BOOLEAN NOT NULL,
    summary VARCHAR NOT NULL,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id),
    FOREIGN KEY (employer_id) REFERENCES employer(id)
  );`,
  `CREATE TABLE role_achievement (
    id INTEGER PRIMARY KEY,
    role_id INTEGER NOT NULL,
    achievement_text VARCHAR NOT NULL,
    impact_metric VARCHAR,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id)
  );`,
  `CREATE TABLE skill_category (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL
  );`,
  `CREATE TABLE skill (
    id INTEGER PRIMARY KEY,
    skill_category_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (skill_category_id) REFERENCES skill_category(id)
  );`,
  `CREATE TABLE person_skill (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    proficiency INTEGER NOT NULL,
    years_experience DECIMAL(4,1),
    highlighted BOOLEAN NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
  );`,
  `CREATE TABLE education (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    institution VARCHAR NOT NULL,
    credential VARCHAR NOT NULL,
    field_of_study VARCHAR,
    start_year INTEGER,
    end_year INTEGER,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE certification (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    certification_name VARCHAR NOT NULL,
    issuer VARCHAR NOT NULL,
    issue_year INTEGER,
    credential_url VARCHAR,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE project (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    repo_url VARCHAR,
    demo_url VARCHAR,
    start_year INTEGER,
    end_year INTEGER,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE project_skill (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
  );`,
  `CREATE TABLE publication_or_talk (
    id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL,
    kind VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    venue VARCHAR,
    publication_year INTEGER,
    url VARCHAR,
    display_order INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (person_id) REFERENCES person(id)
  );`,
  `CREATE TABLE query_catalog (
    query_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    surface VARCHAR NOT NULL,
    contract_name VARCHAR NOT NULL,
    contract_version VARCHAR NOT NULL,
    read_only BOOLEAN NOT NULL,
    params_schema_json VARCHAR NOT NULL,
    sql_text VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL
  );`,
  `CREATE TABLE query_run_event (
    run_id VARCHAR PRIMARY KEY,
    query_id VARCHAR NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    success BOOLEAN NOT NULL,
    duration_ms DOUBLE NOT NULL,
    row_count INTEGER NOT NULL,
    params_json VARCHAR NOT NULL,
    error_message VARCHAR
  );`,

  `INSERT INTO person VALUES (
    1,
    'Andrew Findlay',
    'Senior Data Engineer',
    'Data engineer focused on reliable analytics systems, SQL platform design, and developer experience.',
    'United States',
    'manual',
    NOW()
  );`,
  `INSERT INTO contact_method VALUES
    (1, 1, 'email', 'andrew@example.com', 'Work email', 1, 'manual', NOW()),
    (2, 1, 'website', 'https://andrewfindlay.dev', 'Personal site', 2, 'manual', NOW());`,
  `INSERT INTO social_profile VALUES
    (1, 1, 'LinkedIn', 'https://linkedin.com/in/andrewfindlay', '@andrewfindlay', 1, 'linkedin', NOW()),
    (2, 1, 'GitHub', 'https://github.com/andrewfindlay', '@andrewfindlay', 2, 'manual', NOW());`,
  `INSERT INTO employer VALUES
    (1, 'CloudScale Analytics', 'https://cloudscale.example', 'Remote', 'cv', NOW()),
    (2, 'Northwind Data', 'https://northwind.example', 'Seattle, WA', 'cv', NOW()),
    (3, 'Acme Labs', 'https://acme.example', 'Portland, OR', 'linkedin', NOW());`,
  `INSERT INTO role VALUES
    (1, 1, 1, 'Senior Data Engineer', 'Full-time', DATE '2022-02-01', 'month', NULL, NULL, TRUE, 'Own the shared data platform and SQL developer tooling.', 1, 'cv', NOW()),
    (2, 1, 2, 'Data Engineer', 'Full-time', DATE '2019-06-01', 'month', DATE '2022-01-01', 'month', FALSE, 'Led modernization from batch ETL to near real-time pipelines.', 2, 'cv', NOW()),
    (3, 1, 3, 'Analytics Engineer', 'Full-time', DATE '2017-01-01', 'month', DATE '2019-05-01', 'month', FALSE, 'Built foundational dimensional models and BI datasets.', 3, 'linkedin', NOW());`,
  `INSERT INTO role_achievement VALUES
    (1, 1, 'Introduced standardized query contracts used by product and analytics teams.', 'Reduced ad-hoc query defects by 40%', 1, 'cv', NOW()),
    (2, 1, 'Built governed SQL execution surface with whitelisted query IDs.', 'Cut production incident risk for query endpoints', 2, 'manual', NOW()),
    (3, 2, 'Migrated 60+ pipelines to a metadata-driven orchestration approach.', 'Saved ~25 engineering hours per sprint', 1, 'cv', NOW()),
    (4, 2, 'Implemented observability for data freshness and SLA tracking.', 'Improved SLA attainment to 99.5%', 2, 'cv', NOW()),
    (5, 3, 'Developed semantic models for executive reporting.', 'Enabled weekly KPI reviews', 1, 'linkedin', NOW());`,
  `INSERT INTO skill_category VALUES
    (1, 'Languages', 1, 'manual', NOW()),
    (2, 'Data Platforms', 2, 'manual', NOW()),
    (3, 'Visualization', 3, 'manual', NOW()),
    (4, 'Engineering', 4, 'manual', NOW());`,
  `INSERT INTO skill VALUES
    (1, 1, 'SQL', 1, 'manual', NOW()),
    (2, 1, 'TypeScript', 2, 'manual', NOW()),
    (3, 1, 'Python', 3, 'manual', NOW()),
    (4, 2, 'DuckDB', 1, 'manual', NOW()),
    (5, 2, 'dbt', 2, 'manual', NOW()),
    (6, 2, 'Airflow', 3, 'manual', NOW()),
    (7, 3, 'Tableau', 1, 'manual', NOW()),
    (8, 3, 'Power BI', 2, 'manual', NOW()),
    (9, 4, 'GitHub Actions', 1, 'manual', NOW()),
    (10, 4, 'Testing Library', 2, 'manual', NOW());`,
  `INSERT INTO person_skill VALUES
    (1, 1, 1, 97, 10.0, TRUE, 'manual', NOW()),
    (2, 1, 2, 83, 5.0, TRUE, 'manual', NOW()),
    (3, 1, 3, 88, 8.0, TRUE, 'manual', NOW()),
    (4, 1, 4, 85, 3.0, TRUE, 'manual', NOW()),
    (5, 1, 5, 90, 6.0, TRUE, 'manual', NOW()),
    (6, 1, 6, 80, 6.0, FALSE, 'manual', NOW()),
    (7, 1, 7, 74, 4.0, FALSE, 'manual', NOW()),
    (8, 1, 8, 69, 2.0, FALSE, 'manual', NOW()),
    (9, 1, 9, 82, 4.0, TRUE, 'manual', NOW()),
    (10, 1, 10, 78, 3.0, FALSE, 'manual', NOW());`,
  `INSERT INTO education VALUES
    (1, 1, 'University of Washington', 'B.S.', 'Computer Science', 2012, 2016, 1, 'cv', NOW());`,
  `INSERT INTO certification VALUES
    (1, 1, 'AWS Certified Data Analytics - Specialty', 'Amazon Web Services', 2023, NULL, 1, 'linkedin', NOW()),
    (2, 1, 'dbt Fundamentals', 'dbt Labs', 2022, NULL, 2, 'cv', NOW());`,
  `INSERT INTO project VALUES
    (1, 1, 'SQL Portfolio Explorer', 'Interactive SQL-first portfolio with query contracts and printable CV.', 'https://github.com/andrewfindlay/sql-portfolio', NULL, 2025, NULL, 1, 'manual', NOW()),
    (2, 1, 'Data Quality Ops Kit', 'Reusable alerting and validation framework for analytics pipelines.', 'https://github.com/andrewfindlay/dq-ops', NULL, 2024, 2025, 2, 'manual', NOW());`,
  `INSERT INTO project_skill VALUES
    (1, 1, 1, 'manual', NOW()),
    (2, 1, 2, 'manual', NOW()),
    (3, 1, 4, 'manual', NOW()),
    (4, 1, 9, 'manual', NOW()),
    (5, 2, 1, 'manual', NOW()),
    (6, 2, 3, 'manual', NOW()),
    (7, 2, 6, 'manual', NOW());`,
  `INSERT INTO publication_or_talk VALUES
    (1, 1, 'talk', 'Designing Stable SQL Contracts for Product Surfaces', 'Data Engineering Meetup', 2024, NULL, 1, 'manual', NOW());`,

  `CREATE OR REPLACE VIEW v_profile_overview AS
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
  `CREATE OR REPLACE VIEW v_experience_timeline AS
    SELECT
      r.person_id,
      r.id,
      e.name AS employer,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.display_order AS role_order,
      list(a.achievement_text ORDER BY a.display_order) FILTER (WHERE a.id IS NOT NULL) AS achievements
    FROM role r
    JOIN employer e ON e.id = r.employer_id
    LEFT JOIN role_achievement a ON a.role_id = r.id
    GROUP BY
      r.person_id,
      r.id,
      e.name,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.display_order;`,
  `CREATE OR REPLACE VIEW v_skills_matrix AS
    SELECT
      ps.person_id,
      sc.name AS category,
      s.name AS skill,
      ps.proficiency,
      ps.years_experience,
      ps.highlighted,
      sc.display_order AS category_order,
      s.display_order AS skill_order
    FROM person_skill ps
    JOIN skill s ON s.id = ps.skill_id
    JOIN skill_category sc ON sc.id = s.skill_category_id;`,
  `CREATE OR REPLACE VIEW v_education_history AS
    SELECT
      e.person_id,
      e.institution,
      e.credential,
      e.field_of_study,
      e.start_year,
      e.end_year,
      e.display_order AS education_order
    FROM education e;`,
  `CREATE OR REPLACE VIEW v_projects_showcase AS
    SELECT
      p.person_id,
      p.id,
      p.name,
      p.description,
      p.repo_url,
      p.demo_url,
      p.start_year,
      p.end_year,
      p.display_order AS project_order,
      list(s.name ORDER BY s.display_order) FILTER (WHERE s.id IS NOT NULL) AS skills
    FROM project p
    LEFT JOIN project_skill ps ON ps.project_id = p.id
    LEFT JOIN skill s ON s.id = ps.skill_id
    GROUP BY
      p.person_id,
      p.id,
      p.name,
      p.description,
      p.repo_url,
      p.demo_url,
      p.start_year,
      p.end_year,
      p.display_order;`,
  `CREATE OR REPLACE VIEW v_master_cv AS
    SELECT
      p.id AS person_id,
      {
        'person': {
          'name': p.full_name,
          'headline': p.headline,
          'location': p.location,
          'summary': p.summary
        },
        'contact_methods': (
          SELECT contact_methods
          FROM v_profile_overview vpo
          WHERE vpo.person_id = p.id
        ),
        'social_profiles': (
          SELECT social_profiles
          FROM v_profile_overview vpo
          WHERE vpo.person_id = p.id
        ),
        'experience': (
          SELECT list({
            'employer': vet.employer,
            'title': vet.title,
            'employment_type': vet.employment_type,
            'start_date': CAST(vet.start_date AS VARCHAR),
            'end_date': CASE WHEN vet.is_current THEN 'Present' ELSE CAST(vet.end_date AS VARCHAR) END,
            'is_current': vet.is_current,
            'summary': vet.summary,
            'achievements': vet.achievements
          } ORDER BY vet.role_order)
          FROM v_experience_timeline vet
          WHERE vet.person_id = p.id
        ),
        'skills': (
          SELECT list({
            'category': vsm.category,
            'skill': vsm.skill,
            'proficiency': vsm.proficiency,
            'years_experience': vsm.years_experience,
            'highlighted': vsm.highlighted
          } ORDER BY vsm.category_order, vsm.skill_order)
          FROM v_skills_matrix vsm
          WHERE vsm.person_id = p.id
        ),
        'education': (
          SELECT list({
            'institution': veh.institution,
            'credential': veh.credential,
            'field_of_study': veh.field_of_study,
            'start_year': veh.start_year,
            'end_year': veh.end_year
          } ORDER BY veh.education_order)
          FROM v_education_history veh
          WHERE veh.person_id = p.id
        ),
        'certifications': (
          SELECT list({
            'name': c.certification_name,
            'issuer': c.issuer,
            'issue_year': c.issue_year,
            'credential_url': c.credential_url
          } ORDER BY c.display_order)
          FROM certification c
          WHERE c.person_id = p.id
        ),
        'projects': (
          SELECT list({
            'name': vps.name,
            'description': vps.description,
            'repo_url': vps.repo_url,
            'demo_url': vps.demo_url,
            'start_year': vps.start_year,
            'end_year': vps.end_year,
            'skills': vps.skills
          } ORDER BY vps.project_order)
          FROM v_projects_showcase vps
          WHERE vps.person_id = p.id
        ),
        'talks': (
          SELECT list({
            'kind': t.kind,
            'title': t.title,
            'venue': t.venue,
            'publication_year': t.publication_year,
            'url': t.url
          } ORDER BY t.display_order)
          FROM publication_or_talk t
          WHERE t.person_id = p.id
        ),
        'updated_at': CAST(p.updated_at AS VARCHAR)
      } AS cv
    FROM person p;`
];

export const SCHEMA_TABLES: Array<{ name: string; description: string }> = [
  { name: 'person', description: 'Root profile entity.' },
  { name: 'contact_method', description: 'Email, website, and other contact channels.' },
  { name: 'social_profile', description: 'Social handles and profile links.' },
  { name: 'employer', description: 'Normalized employer dimension.' },
  { name: 'role', description: 'Employment timeline with date precision and sort order.' },
  { name: 'role_achievement', description: 'Role-specific impact statements.' },
  { name: 'skill_category', description: 'Skill category taxonomy.' },
  { name: 'skill', description: 'Individual skills within categories.' },
  { name: 'person_skill', description: 'Skill proficiency for the person.' },
  { name: 'education', description: 'Education records.' },
  { name: 'certification', description: 'Certifications and credentials.' },
  { name: 'project', description: 'Highlighted projects.' },
  { name: 'project_skill', description: 'Project-to-skill mapping table.' },
  { name: 'publication_or_talk', description: 'Optional talks and publications.' },
  { name: 'query_catalog', description: 'Registered saved-query metadata snapshot.' },
  { name: 'query_run_event', description: 'Execution telemetry for saved queries.' },
  { name: 'v_profile_overview', description: 'Contract view for top-level profile data.' },
  { name: 'v_experience_timeline', description: 'Contract view for role timeline.' },
  { name: 'v_skills_matrix', description: 'Contract view for skills and proficiency.' },
  { name: 'v_education_history', description: 'Contract view for education records.' },
  { name: 'v_projects_showcase', description: 'Contract view for project highlights.' },
  { name: 'v_master_cv', description: 'Stable JSON CV contract view.' }
];
