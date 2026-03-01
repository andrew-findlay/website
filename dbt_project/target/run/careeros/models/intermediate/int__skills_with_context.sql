
  
  create view "careeros"."main_intermediate"."int__skills_with_context__dbt_tmp" as (
    with skills as (
    select * from "careeros"."main_staging"."stg__skills"
),

role_skill as (
    select * from "careeros"."main_raw"."role_skill"
),

role as (
    select * from "careeros"."main_raw"."role"
),

employer as (
    select * from "careeros"."main_raw"."employer"
)

select
    s.person_id,
    s.category,
    s.skill,
    s.skill_id,
    s.years_experience,
    s.category_order,
    s.skill_order,
    (
        select count(distinct rs.role_id)
        from role_skill rs
        where rs.skill_id = s.skill_id
    )                                                               as roles_used_in,
    (
        select list(distinct e.name order by e.name)
        from role_skill rs
        join role r     on r.id = rs.role_id
        join employer e on e.id = r.employer_id
        where rs.skill_id = s.skill_id
    )                                                               as used_at_employers
from skills s
  );
