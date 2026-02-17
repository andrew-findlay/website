SELECT
  institution,
  credential,
  field_of_study,
  start_year,
  end_year
FROM v_education_history
WHERE person_id = {{person_id}}
ORDER BY education_order;
