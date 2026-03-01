
  
  create view "careeros"."main_mart"."mart__skills__dbt_tmp" as (
    select * from "careeros"."main_intermediate"."int__skills_with_context"
order by category_order, skill_order
  );
