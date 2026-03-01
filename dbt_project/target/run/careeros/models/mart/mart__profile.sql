
  
  create view "careeros"."main_mart"."mart__profile__dbt_tmp" as (
    select * from "careeros"."main_staging"."stg__profile"
  );
