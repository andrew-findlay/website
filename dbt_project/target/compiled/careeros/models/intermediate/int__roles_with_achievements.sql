with roles as (
    select * from "careeros"."main_staging"."stg__roles"
),

achievements as (
    select * from "careeros"."main_raw"."role_achievement"
)

select
    r.person_id,
    r.id,
    r.employer,
    r.employer_industry,
    r.title,
    r.employment_type,
    r.start_date,
    r.end_date,
    r.is_current,
    r.summary,
    r.role_order,
    case
        when r.is_current
            then date_diff('month', r.start_date, current_date) + 1
        else date_diff('month', r.start_date, coalesce(r.end_date, current_date)) + 1
    end                                                             as tenure_months,
    list(a.achievement_text order by a.display_order)
        filter (where a.achievement_text is not null)               as achievements
from roles r
left join achievements a on a.role_id = r.id
group by
    r.person_id, r.id, r.employer, r.employer_industry,
    r.title, r.employment_type, r.start_date, r.end_date,
    r.is_current, r.summary, r.role_order