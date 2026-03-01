
  
  create view "careeros"."main_staging"."stg__education__dbt_tmp" as (
    select
    person_id,
    institution,
    credential,
    field_of_study,
    start_year,
    end_year,
    display_order       as education_order
from "careeros"."main_raw"."education"
  );
