SELECT
  id,
  name,
  description,
  repo_url,
  demo_url,
  start_year,
  end_year,
  skills
FROM prs__dashboard_projects
WHERE person_id = {{person_id}}
ORDER BY project_order
LIMIT {{limit}};
