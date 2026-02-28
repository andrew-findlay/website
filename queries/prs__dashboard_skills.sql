SELECT
  category,
  skill,
  proficiency,
  years_experience,
  highlighted,
  skill_level
FROM prs__dashboard_skills
WHERE person_id = {{person_id}}
  AND proficiency >= {{min_proficiency}}
ORDER BY category_order, skill_order;
