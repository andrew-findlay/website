select * from {{ ref('int__roles_with_skills') }}
order by role_order
