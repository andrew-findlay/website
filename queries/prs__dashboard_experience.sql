SELECT
  id,
  employer,
  title,
  employment_type,
  start_date,
  end_date,
  is_current,
  summary,
  achievements,
  tenure_months
FROM prs__dashboard_experience
WHERE person_id = {{person_id}}
ORDER BY role_order
LIMIT {{limit}};
