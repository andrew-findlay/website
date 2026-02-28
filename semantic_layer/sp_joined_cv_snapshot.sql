-- semantic_layer/sp_joined_cv_snapshot.sql
-- Semantic contract: single joined CV snapshot sourced from presentation-layer models.

CREATE OR REPLACE MACRO sp_joined_cv_snapshot(person_id_param) AS TABLE
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
ORDER BY e.role_order;

-- Example invocation:
-- SELECT * FROM sp_joined_cv_snapshot(1);
