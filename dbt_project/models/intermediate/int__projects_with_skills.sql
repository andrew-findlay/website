with projects as (
    select * from {{ ref('stg__projects') }}
),

project_skill as (
    select * from {{ source('raw', 'project_skill') }}
),

skill as (
    select * from {{ source('raw', 'skill') }}
),

skill_category as (
    select * from {{ source('raw', 'skill_category') }}
)

select
    p.person_id,
    p.id,
    p.name,
    p.description,
    p.repo_url,
    p.demo_url,
    p.start_year,
    p.end_year,
    p.project_order,
    list(s.name order by sc.display_order, s.display_order)
        filter (where s.name is not null)                           as skills
from projects p
left join project_skill ps  on ps.project_id = p.id
left join skill s           on s.id = ps.skill_id
left join skill_category sc on sc.id = s.skill_category_id
group by
    p.person_id, p.id, p.name, p.description,
    p.repo_url, p.demo_url, p.start_year, p.end_year, p.project_order
