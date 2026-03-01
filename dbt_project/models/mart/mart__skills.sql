select * from {{ ref('int__skills_with_context') }}
order by category_order, skill_order
