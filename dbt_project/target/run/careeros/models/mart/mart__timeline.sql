
  
  create view "careeros"."main_mart"."mart__timeline__dbt_tmp" as (
    select * from "careeros"."main_intermediate"."int__roles_with_skills"
order by role_order
  );
