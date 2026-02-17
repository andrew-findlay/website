SELECT
  category,
  skill,
  proficiency,
  years_experience,
  highlighted
FROM v_skills_matrix
WHERE person_id = {{person_id}}
  AND proficiency >= {{min_proficiency}}
ORDER BY category_order, skill_order;
