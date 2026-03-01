
  
  create view "careeros"."main_staging"."stg__projects__dbt_tmp" as (
    select
    person_id,
    id,
    name,
    description,
    repo_url,
    demo_url,
    start_year,
    end_year,
    display_order       as project_order
from "careeros"."main_raw"."project"
  );
