
  
  create view "careeros"."main_mart"."mart__projects__dbt_tmp" as (
    select * from "careeros"."main_intermediate"."int__projects_with_skills"
order by project_order
  );
