SELECT
  category,
  skill,
  proficiency,
  years_experience,
  highlighted
FROM dmn__skills_matrix
WHERE person_id = {{person_id}}
  AND proficiency >= {{min_proficiency}}
ORDER BY category_order, skill_order;
