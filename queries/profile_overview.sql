SELECT
  person_id,
  full_name,
  headline,
  location,
  summary,
  contact_methods,
  social_profiles,
  updated_at
FROM v_profile_overview
WHERE person_id = {{person_id}};
