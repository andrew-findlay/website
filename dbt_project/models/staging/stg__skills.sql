with person_skill as (
    select * from {{ source('raw', 'person_skill') }}
),

skill as (
    select * from {{ source('raw', 'skill') }}
),

skill_category as (
    select * from {{ source('raw', 'skill_category') }}
)

select
    ps.person_id,
    sc.name                 as category,
    s.name                  as skill,
    s.id                    as skill_id,
    ps.years_experience,
    sc.display_order        as category_order,
    s.display_order         as skill_order
from person_skill ps
join skill s            on s.id = ps.skill_id
join skill_category sc  on sc.id = s.skill_category_id
