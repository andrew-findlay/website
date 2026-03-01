with roles as (
    select * from {{ ref('int__roles_with_achievements') }}
),

role_skills as (
    select * from {{ ref('stg__role_skills') }}
)

select
    r.person_id,
    r.id,
    r.employer,
    r.employer_industry,
    r.title,
    r.employment_type,
    r.start_date,
    r.end_date,
    r.is_current,
    r.summary,
    r.role_order,
    r.tenure_months,
    r.achievements,
    list(
        {'skill': rs.skill, 'category': rs.category}
        order by rs.category_order, rs.skill_order
    ) filter (where rs.skill is not null)                           as skills_used
from roles r
left join role_skills rs on rs.role_id = r.id
group by
    r.person_id, r.id, r.employer, r.employer_industry,
    r.title, r.employment_type, r.start_date, r.end_date,
    r.is_current, r.summary, r.role_order,
    r.tenure_months, r.achievements
