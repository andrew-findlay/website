with role as (
    select * from {{ source('raw', 'role') }}
),

employer as (
    select * from {{ source('raw', 'employer') }}
)

select
    r.person_id,
    r.id,
    e.name                                          as employer,
    e.industry                                      as employer_industry,
    r.title,
    r.employment_type,
    r.start_date,
    r.end_date,
    r.is_current,
    r.summary,
    r.display_order                                 as role_order
from role r
join employer e on e.id = r.employer_id
