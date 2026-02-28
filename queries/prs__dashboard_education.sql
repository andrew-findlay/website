SELECT
  institution,
  credential,
  field_of_study,
  start_year,
  end_year
FROM prs__dashboard_education
WHERE person_id = {{person_id}}
ORDER BY education_order;
