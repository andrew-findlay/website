SELECT
  person_id,
  full_name,
  headline,
  location,
  summary,
  contact_methods,
  social_profiles,
  updated_at
FROM prs__dashboard_profile
WHERE person_id = {{person_id}};
