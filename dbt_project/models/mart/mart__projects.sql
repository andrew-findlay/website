select * from {{ ref('int__projects_with_skills') }}
order by project_order
