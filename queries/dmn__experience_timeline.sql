SELECT
  id,
  employer,
  title,
  employment_type,
  start_date,
  end_date,
  is_current,
  summary,
  achievements
FROM dmn__experience_timeline
WHERE person_id = {{person_id}}
ORDER BY role_order
LIMIT {{limit}};
