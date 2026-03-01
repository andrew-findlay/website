
  
  create view "careeros"."main_mart"."mart__education__dbt_tmp" as (
    select * from "careeros"."main_staging"."stg__education"
order by education_order
  );
