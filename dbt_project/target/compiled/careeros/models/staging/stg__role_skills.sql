with role_skill as (
    select * from "careeros"."main_raw"."role_skill"
),

skill as (
    select * from "careeros"."main_raw"."skill"
),

skill_category as (
    select * from "careeros"."main_raw"."skill_category"
)

select
    rs.role_id,
    s.name                  as skill,
    sc.name                 as category,
    sc.display_order        as category_order,
    s.display_order         as skill_order
from role_skill rs
join skill s            on s.id = rs.skill_id
join skill_category sc  on sc.id = s.skill_category_id