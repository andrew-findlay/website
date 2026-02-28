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
    'Analytics Engineer',
    'Analytics Engineer focused on developing data-led solutions that improve outcomes for customers and business stakeholders. Experienced in cross-functional delivery and translating complex technical concepts for non-technical audiences.',
    'London, United Kingdom',
    'cv',
    NOW()
  );`,
  `INSERT INTO contact_method VALUES
    (1, 1, 'email', 'hello@andrewfindlay.io', 'Email', 1, 'cv', NOW()),
    (2, 1, 'website', 'https://www.andrewfindlay.io', 'Website', 2, 'cv', NOW()),
    (3, 1, 'phone', '07792 300766', 'Mobile', 3, 'cv', NOW());`,
  `INSERT INTO social_profile VALUES
    (1, 1, 'GitHub', 'https://github.com/andrewfindlay', 'andrewfindlay', 1, 'manual', NOW()),
    (2, 1, 'LinkedIn', 'https://linkedin.com/in/andrew-findlay', 'andrew-findlay', 2, 'manual', NOW());`,
  `INSERT INTO employer VALUES
    (1, 'Tasman Analytics', NULL, 'London, UK', 'cv', NOW()),
    (2, 'The Orchard', NULL, 'London, UK', 'cv', NOW()),
    (3, 'TotallyMoney', NULL, 'London, UK', 'cv', NOW()),
    (4, 'Start Up Loans', NULL, 'London, UK', 'cv', NOW());`,
  `INSERT INTO role VALUES
    (1, 1, 1, 'Analytics Engineer', 'Contract', DATE '2025-07-01', 'month', NULL, NULL, TRUE, 'Implemented modern data stacks on greenfield engagements, covering ingestion, transformation, and serving layers.', 1, 'cv', NOW()),
    (2, 1, 2, 'Analytics Engineer', 'Full-time', DATE '2023-03-01', 'month', DATE '2025-06-01', 'month', FALSE, 'Led analytics engineering delivery across dbt, Looker, and Snowflake with a focus on reliability, performance, and stakeholder enablement.', 2, 'cv', NOW()),
    (3, 1, 3, 'Senior Data Analyst', 'Full-time', DATE '2021-09-01', 'month', DATE '2022-09-01', 'month', FALSE, 'Modernised analytics workflows with dbt while mentoring experimentation practice across the analytics team.', 3, 'cv', NOW()),
    (4, 1, 3, 'Product Data Analyst', 'Full-time', DATE '2018-10-01', 'month', DATE '2021-09-01', 'month', FALSE, 'Embedded experimentation and product analytics in cross-functional squads and replaced legacy spreadsheet reporting.', 4, 'cv', NOW()),
    (5, 1, 4, 'Risk & Data Analyst', 'Full-time', DATE '2017-09-01', 'month', DATE '2018-09-01', 'month', FALSE, 'Produced automated MI reporting, supported board-level packs, and improved lending scorecard operations.', 5, 'cv', NOW()),
    (6, 1, 4, 'Performance Analyst', 'Full-time', DATE '2014-08-01', 'month', DATE '2018-09-01', 'month', FALSE, 'Built KPI reporting, benchmarking, and performance scorecards for a network of subcontractors.', 6, 'cv', NOW());`,
  `INSERT INTO role_achievement VALUES
    (1, 1, 'Implemented modern data stacks on greenfield client engagements from discovery to serving.', 'Faster delivery across end-to-end stack', 1, 'cv', NOW()),
    (2, 1, 'Built AI-powered summarisation pipelines using BigQuery''s native ML with LLM calls in dbt.', 'Improved automated narrative generation', 2, 'cv', NOW()),
    (3, 1, 'Optimised dbt models across BigQuery, Snowflake, and Microsoft Fabric.', 'Portable patterns across warehouse platforms', 3, 'cv', NOW()),
    (4, 1, 'Reviewed incremental model designs for large event datasets.', 'Reduced identity resolution complexity', 4, 'cv', NOW()),
    (5, 1, 'Designed automated client data submission workflows with validation and error classification.', 'Lower manual operations overhead', 5, 'cv', NOW()),
    (6, 2, 'Introduced pull-request and review templates for Looker and dbt Cloud workflows.', 'Improved governance and code quality', 1, 'cv', NOW()),
    (7, 2, 'Built datasets for a new business review process.', 'Reduced analyst time-to-analysis', 2, 'cv', NOW()),
    (8, 2, 'Managed ingestion prioritisation between data engineering and analytics teams.', 'Improved delivery coordination', 3, 'cv', NOW()),
    (9, 2, 'Implemented slim CI checks for all dbt pull requests.', 'Reduced production defects', 4, 'cv', NOW()),
    (10, 2, 'Introduced Datadog alerting for periods of heavy Snowflake load.', 'Improved warehouse reliability', 5, 'cv', NOW()),
    (11, 2, 'Co-led functional Snowflake warehouse setup for different Looker user groups.', 'Reduced query queuing at stable cost', 6, 'cv', NOW()),
    (12, 2, 'Built models from MusicBrainz data landed in S3 for data science use cases.', 'Expanded reusable external data assets', 7, 'cv', NOW()),
    (13, 3, 'Implemented dbt to modernise and streamline analytics data workflows.', 'Improved analytics delivery speed', 1, 'cv', NOW()),
    (14, 3, 'Mentored junior team members on A/B testing methods.', 'Raised statistical confidence in decisions', 2, 'cv', NOW()),
    (15, 3, 'Supported non-technical teams to upskill their experimentation processes.', 'Improved trust in metrics', 3, 'cv', NOW()),
    (16, 4, 'Implemented A/B testing within the product team as day-to-day practice.', 'Enabled evidence-based iteration', 1, 'cv', NOW()),
    (17, 4, 'Partnered with engineering to define product data capture standards.', 'Improved instrumentation quality', 2, 'cv', NOW()),
    (18, 4, 'Gathered stakeholder requirements and delivered Looker models and visualisations.', 'Improved reporting coverage', 3, 'cv', NOW()),
    (19, 4, 'Co-administered Looker and maintained uptime and data quality targets.', 'Increased BI platform reliability', 4, 'cv', NOW()),
    (20, 4, 'Moved product reporting away from spreadsheet-based legacy workflows.', 'Reduced manual reporting dependency', 5, 'cv', NOW()),
    (21, 4, 'Developed Monthly Active User reporting and helped define it as the North Star metric.', 'Aligned product KPI strategy', 6, 'cv', NOW()),
    (22, 4, 'Delivered ad-hoc insight work across product squads and wider business.', 'Improved decision turnaround', 7, 'cv', NOW()),
    (23, 5, 'Produced daily SQL MI for internal and external stakeholders.', 'Reliable recurring reporting delivery', 1, 'cv', NOW()),
    (24, 5, 'Contributed to company-wide data automation and rationalisation using SQL and VBA.', 'Increased automation coverage', 2, 'cv', NOW()),
    (25, 5, 'Co-owned monthly board reporting packs including extraction and process improvements.', 'Improved board reporting operations', 3, 'cv', NOW()),
    (26, 5, 'Identified issues in data warehouse feeds and coordinated supplier fixes.', 'Improved data quality continuity', 4, 'cv', NOW()),
    (27, 6, 'Produced monthly KPI and forecast reporting across 30+ subcontractors.', 'Enhanced network performance visibility', 1, 'cv', NOW()),
    (28, 6, 'Worked across teams to identify 20+ underperforming subcontractors.', 'Supported remediation and exits', 2, 'cv', NOW()),
    (29, 6, 'Led specification and rollout of bespoke quarterly subcontractor KPI reporting.', 'Standardized stakeholder reporting', 3, 'cv', NOW()),
    (30, 6, 'Introduced scorecard-based RAG monitoring for subcontractor performance.', 'Created repeatable governance tracking', 4, 'cv', NOW());`,
  `INSERT INTO skill_category VALUES
    (1, 'Warehousing & SQL', 1, 'cv', NOW()),
    (2, 'Ingestion', 2, 'cv', NOW()),
    (3, 'Analytics Engineering', 3, 'cv', NOW()),
    (4, 'Languages & Notebooks', 4, 'cv', NOW()),
    (5, 'AI Tooling', 5, 'cv', NOW());`,
  `INSERT INTO skill VALUES
    (1, 1, 'SQL', 1, 'cv', NOW()),
    (2, 1, 'Snowflake', 2, 'cv', NOW()),
    (3, 1, 'BigQuery', 3, 'cv', NOW()),
    (4, 1, 'Microsoft Fabric', 4, 'cv', NOW()),
    (5, 2, 'Airbyte', 1, 'cv', NOW()),
    (6, 2, 'Fivetran', 2, 'cv', NOW()),
    (7, 3, 'dbt Core', 1, 'cv', NOW()),
    (8, 3, 'dbt Cloud', 2, 'cv', NOW()),
    (9, 3, 'Looker Modeling', 3, 'cv', NOW()),
    (10, 3, 'Looker Visualisation', 4, 'cv', NOW()),
    (11, 4, 'Python', 1, 'cv', NOW()),
    (12, 4, 'Pandas', 2, 'cv', NOW()),
    (13, 4, 'Jupyter Notebooks', 3, 'cv', NOW()),
    (14, 4, 'Git', 4, 'cv', NOW()),
    (15, 4, 'GitHub', 5, 'cv', NOW()),
    (16, 4, 'R Studio', 6, 'cv', NOW()),
    (17, 5, 'Claude Code', 1, 'cv', NOW()),
    (18, 5, 'GitHub Cortex', 2, 'cv', NOW());`,
  `INSERT INTO person_skill VALUES
    (1, 1, 1, 97, 11.5, TRUE, 'cv', NOW()),
    (2, 1, 2, 92, 4.0, TRUE, 'cv', NOW()),
    (3, 1, 3, 90, 1.5, TRUE, 'cv', NOW()),
    (4, 1, 4, 84, 1.0, FALSE, 'cv', NOW()),
    (5, 1, 5, 82, 2.0, FALSE, 'cv', NOW()),
    (6, 1, 6, 80, 3.0, FALSE, 'cv', NOW()),
    (7, 1, 7, 94, 4.5, TRUE, 'cv', NOW()),
    (8, 1, 8, 90, 4.0, TRUE, 'cv', NOW()),
    (9, 1, 9, 91, 8.0, TRUE, 'cv', NOW()),
    (10, 1, 10, 88, 8.0, FALSE, 'cv', NOW()),
    (11, 1, 11, 90, 9.0, TRUE, 'cv', NOW()),
    (12, 1, 12, 88, 9.0, FALSE, 'cv', NOW()),
    (13, 1, 13, 86, 8.0, FALSE, 'cv', NOW()),
    (14, 1, 14, 89, 10.0, FALSE, 'cv', NOW()),
    (15, 1, 15, 91, 10.0, TRUE, 'cv', NOW()),
    (16, 1, 16, 70, 6.0, FALSE, 'cv', NOW()),
    (17, 1, 17, 83, 1.0, TRUE, 'cv', NOW()),
    (18, 1, 18, 79, 1.0, FALSE, 'cv', NOW());`,
  `INSERT INTO education VALUES
    (1, 1, 'Birkbeck, University of London', 'Graduate Certificate', 'Statistical Data Science', 2020, 2021, 1, 'cv', NOW()),
    (2, 1, 'Birkbeck, University of London', 'Affiliate Student', 'Calculus 1 & Statistics 1', 2020, 2020, 2, 'cv', NOW()),
    (3, 1, 'University College London', 'MSc', 'International Public Policy', 2012, 2013, 3, 'cv', NOW()),
    (4, 1, 'University of Reading', 'BA', 'Politics & International Relations', 2008, 2011, 4, 'cv', NOW());`,
  `INSERT INTO project VALUES
    (1, 1, 'Modern Data Stack Delivery', 'Delivered end-to-end data platform implementations from ingestion to serving across greenfield client projects.', NULL, NULL, 2026, NULL, 1, 'cv', NOW()),
    (2, 1, 'AI Summarisation Pipelines', 'Built production summarisation flows with BigQuery ML and dbt-managed orchestration patterns.', NULL, NULL, 2026, NULL, 2, 'cv', NOW()),
    (3, 1, 'Client Data Submission Automation', 'Designed automated validation, error classification, and bulk transformation pipelines for client data delivery.', NULL, NULL, 2026, NULL, 3, 'cv', NOW()),
    (4, 1, 'Warehouse Performance & Cost Optimisation', 'Implemented Snowflake workload segmentation and reliability controls for Looker user groups.', NULL, NULL, 2023, 2025, 4, 'cv', NOW());`,
  `INSERT INTO project_skill VALUES
    (1, 1, 1, 'cv', NOW()),
    (2, 1, 3, 'cv', NOW()),
    (3, 1, 5, 'cv', NOW()),
    (4, 1, 6, 'cv', NOW()),
    (5, 1, 7, 'cv', NOW()),
    (6, 1, 15, 'cv', NOW()),
    (7, 2, 3, 'cv', NOW()),
    (8, 2, 7, 'cv', NOW()),
    (9, 2, 11, 'cv', NOW()),
    (10, 2, 12, 'cv', NOW()),
    (11, 2, 17, 'cv', NOW()),
    (12, 2, 18, 'cv', NOW()),
    (13, 3, 1, 'cv', NOW()),
    (14, 3, 5, 'cv', NOW()),
    (15, 3, 6, 'cv', NOW()),
    (16, 3, 11, 'cv', NOW()),
    (17, 3, 12, 'cv', NOW()),
    (18, 4, 2, 'cv', NOW()),
    (19, 4, 8, 'cv', NOW()),
    (20, 4, 9, 'cv', NOW()),
    (21, 4, 14, 'cv', NOW());`,
  `CREATE OR REPLACE VIEW stg__profile_overview AS
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
  `CREATE OR REPLACE VIEW stg__experience_roles AS
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
      r.display_order AS role_order
    FROM role r
    JOIN employer e ON e.id = r.employer_id;`,
  `CREATE OR REPLACE VIEW stg__role_achievements AS
    SELECT
      role_id,
      achievement_text,
      display_order
    FROM role_achievement;`,
  `CREATE OR REPLACE VIEW stg__skills_inventory AS
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
  `CREATE OR REPLACE VIEW stg__education_history AS
    SELECT
      person_id,
      institution,
      credential,
      field_of_study,
      start_year,
      end_year,
      display_order AS education_order
    FROM education;`,
  `CREATE OR REPLACE VIEW stg__projects_inventory AS
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
      ps.skill_id
    FROM project p
    LEFT JOIN project_skill ps ON ps.project_id = p.id;`,

  `CREATE OR REPLACE VIEW int__experience_rollup AS
    SELECT
      r.person_id,
      r.id,
      r.employer,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.role_order,
      list(a.achievement_text ORDER BY a.display_order) FILTER (WHERE a.achievement_text IS NOT NULL) AS achievements
    FROM stg__experience_roles r
    LEFT JOIN stg__role_achievements a ON a.role_id = r.id
    GROUP BY
      r.person_id,
      r.id,
      r.employer,
      r.title,
      r.employment_type,
      r.start_date,
      r.end_date,
      r.is_current,
      r.summary,
      r.role_order;`,
  `CREATE OR REPLACE VIEW int__projects_rollup AS
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
      list(s.name ORDER BY s.display_order) FILTER (WHERE s.name IS NOT NULL) AS skills
    FROM stg__projects_inventory p
    LEFT JOIN skill s ON s.id = p.skill_id
    GROUP BY
      p.person_id,
      p.id,
      p.name,
      p.description,
      p.repo_url,
      p.demo_url,
      p.start_year,
      p.end_year,
      p.project_order;`,
  `CREATE OR REPLACE VIEW int__skills_scored AS
    SELECT
      person_id,
      category,
      skill,
      proficiency,
      years_experience,
      highlighted,
      category_order,
      skill_order,
      CASE
        WHEN proficiency >= 90 THEN 'expert'
        WHEN proficiency >= 75 THEN 'advanced'
        WHEN proficiency >= 60 THEN 'intermediate'
        ELSE 'working'
      END AS skill_level
    FROM stg__skills_inventory;`,

  `CREATE OR REPLACE VIEW dmn__profile_overview AS
    SELECT * FROM stg__profile_overview;`,
  `CREATE OR REPLACE VIEW dmn__experience_timeline AS
    SELECT
      person_id,
      id,
      employer,
      title,
      employment_type,
      start_date,
      end_date,
      is_current,
      summary,
      role_order,
      achievements,
      CASE
        WHEN is_current THEN date_diff('month', start_date, current_date) + 1
        ELSE date_diff('month', start_date, coalesce(end_date, current_date)) + 1
      END AS tenure_months
    FROM int__experience_rollup;`,
  `CREATE OR REPLACE VIEW dmn__skills_matrix AS
    SELECT * FROM int__skills_scored;`,
  `CREATE OR REPLACE VIEW dmn__education_history AS
    SELECT * FROM stg__education_history;`,
  `CREATE OR REPLACE VIEW dmn__projects_showcase AS
    SELECT * FROM int__projects_rollup;`,

  `CREATE OR REPLACE VIEW prs__dashboard_profile AS
    SELECT
      person_id,
      full_name,
      headline,
      location,
      summary,
      contact_methods,
      social_profiles,
      updated_at
    FROM dmn__profile_overview;`,
  `CREATE OR REPLACE VIEW prs__dashboard_experience AS
    SELECT
      person_id,
      id,
      employer,
      title,
      employment_type,
      start_date,
      end_date,
      is_current,
      summary,
      achievements,
      tenure_months,
      role_order
    FROM dmn__experience_timeline;`,
  `CREATE OR REPLACE VIEW prs__dashboard_skills AS
    SELECT
      person_id,
      category,
      skill,
      proficiency,
      years_experience,
      highlighted,
      skill_level,
      category_order,
      skill_order
    FROM dmn__skills_matrix;`,
  `CREATE OR REPLACE VIEW prs__dashboard_education AS
    SELECT
      person_id,
      institution,
      credential,
      field_of_study,
      start_year,
      end_year,
      education_order
    FROM dmn__education_history;`,
  `CREATE OR REPLACE VIEW prs__dashboard_projects AS
    SELECT
      person_id,
      id,
      name,
      description,
      repo_url,
      demo_url,
      start_year,
      end_year,
      skills,
      project_order
    FROM dmn__projects_showcase;`,
  `CREATE OR REPLACE VIEW prs__master_cv AS
    SELECT
      p.person_id,
      {
        'person': {
          'name': p.full_name,
          'headline': p.headline,
          'location': p.location,
          'summary': p.summary
        },
        'contact_methods': p.contact_methods,
        'social_profiles': p.social_profiles,
        'experience': (
          SELECT list({
            'employer': e.employer,
            'title': e.title,
            'employment_type': e.employment_type,
            'start_date': CAST(e.start_date AS VARCHAR),
            'end_date': CASE WHEN e.is_current THEN 'Present' ELSE CAST(e.end_date AS VARCHAR) END,
            'is_current': e.is_current,
            'summary': e.summary,
            'achievements': e.achievements
          } ORDER BY e.role_order)
          FROM prs__dashboard_experience e
          WHERE e.person_id = p.person_id
        ),
        'skills': (
          SELECT list({
            'category': s.category,
            'skill': s.skill,
            'proficiency': s.proficiency,
            'years_experience': s.years_experience,
            'highlighted': s.highlighted
          } ORDER BY s.category_order, s.skill_order)
          FROM prs__dashboard_skills s
          WHERE s.person_id = p.person_id
        ),
        'education': (
          SELECT list({
            'institution': e.institution,
            'credential': e.credential,
            'field_of_study': e.field_of_study,
            'start_year': e.start_year,
            'end_year': e.end_year
          } ORDER BY e.education_order)
          FROM prs__dashboard_education e
          WHERE e.person_id = p.person_id
        ),
        'certifications': (
          SELECT list({
            'name': c.certification_name,
            'issuer': c.issuer,
            'issue_year': c.issue_year,
            'credential_url': c.credential_url
          } ORDER BY c.display_order)
          FROM certification c
          WHERE c.person_id = p.person_id
        ),
        'projects': (
          SELECT list({
            'name': pr.name,
            'description': pr.description,
            'repo_url': pr.repo_url,
            'demo_url': pr.demo_url,
            'start_year': pr.start_year,
            'end_year': pr.end_year,
            'skills': pr.skills
          } ORDER BY pr.project_order)
          FROM prs__dashboard_projects pr
          WHERE pr.person_id = p.person_id
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
          WHERE t.person_id = p.person_id
        ),
        'updated_at': CAST(p.updated_at AS VARCHAR)
      } AS cv
    FROM prs__dashboard_profile p;`,
  `CREATE OR REPLACE MACRO sp_joined_cv_snapshot(person_id_param) AS TABLE
    WITH skill_inventory AS (
      SELECT
        s.person_id,
        list({
          'category': s.category,
          'skill': s.skill,
          'proficiency': s.proficiency,
          'years_experience': s.years_experience,
          'highlighted': s.highlighted
        } ORDER BY s.category_order, s.skill_order) AS skills
      FROM prs__dashboard_skills s
      GROUP BY s.person_id
    ),
    project_inventory AS (
      SELECT
        p.person_id,
        list({
          'name': p.name,
          'description': p.description,
          'start_year': p.start_year,
          'end_year': p.end_year,
          'skills': p.skills
        } ORDER BY p.project_order) AS projects
      FROM prs__dashboard_projects p
      GROUP BY p.person_id
    ),
    education_inventory AS (
      SELECT
        e.person_id,
        list({
          'institution': e.institution,
          'credential': e.credential,
          'field_of_study': e.field_of_study,
          'start_year': e.start_year,
          'end_year': e.end_year
        } ORDER BY e.education_order) AS education
      FROM prs__dashboard_education e
      GROUP BY e.person_id
    )
    SELECT
      p.person_id,
      p.full_name,
      p.headline,
      p.location,
      e.id AS role_id,
      e.employer,
      e.title AS role_title,
      e.start_date,
      e.end_date,
      e.is_current,
      e.summary AS role_summary,
      e.achievements,
      si.skills AS skill_inventory,
      pi.projects AS project_inventory,
      ei.education AS education_inventory
    FROM prs__dashboard_profile p
    LEFT JOIN prs__dashboard_experience e ON e.person_id = p.person_id
    LEFT JOIN skill_inventory si ON si.person_id = p.person_id
    LEFT JOIN project_inventory pi ON pi.person_id = p.person_id
    LEFT JOIN education_inventory ei ON ei.person_id = p.person_id
    WHERE p.person_id = person_id_param
    ORDER BY e.role_order;`
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
  { name: 'stg__profile_overview', description: 'Staging model for profile, contact, and social data.' },
  { name: 'stg__experience_roles', description: 'Staging model for role records with employer enrichment.' },
  { name: 'stg__role_achievements', description: 'Staging model for normalized achievement statements.' },
  { name: 'stg__skills_inventory', description: 'Staging model for skill inventory with category metadata.' },
  { name: 'stg__education_history', description: 'Staging model for education entries.' },
  { name: 'stg__projects_inventory', description: 'Staging model for projects and linked skills.' },
  { name: 'int__experience_rollup', description: 'Intermediate model rolling achievements into each role.' },
  { name: 'int__projects_rollup', description: 'Intermediate model rolling skills into each project.' },
  { name: 'int__skills_scored', description: 'Intermediate model adding semantic skill levels.' },
  { name: 'dmn__profile_overview', description: 'Domain model for person-level profile overview.' },
  { name: 'dmn__experience_timeline', description: 'Domain model for role timeline with tenure metrics.' },
  { name: 'dmn__skills_matrix', description: 'Domain model for skills and capability depth.' },
  { name: 'dmn__education_history', description: 'Domain model for education records.' },
  { name: 'dmn__projects_showcase', description: 'Domain model for project highlights.' },
  { name: 'prs__dashboard_profile', description: 'Presentation model for dashboard hero/profile state.' },
  { name: 'prs__dashboard_experience', description: 'Presentation model for dashboard timeline widgets.' },
  { name: 'prs__dashboard_skills', description: 'Presentation model for dashboard skill visualizations.' },
  { name: 'prs__dashboard_education', description: 'Presentation model for dashboard education widgets.' },
  { name: 'prs__dashboard_projects', description: 'Presentation model for dashboard project widgets.' },
  { name: 'prs__master_cv', description: 'Presentation model for the stable JSON CV contract.' },
  { name: 'sp_joined_cv_snapshot', description: 'Semantic-layer macro returning a joined CV dataset.' }
];
