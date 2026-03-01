with person as (
    select * from {{ source('raw', 'person') }}
),

contact as (
    select * from {{ source('raw', 'contact_method') }}
),

social as (
    select * from {{ source('raw', 'social_profile') }}
)

select
    p.id                                                        as person_id,
    p.full_name,
    p.headline,
    p.location,
    p.summary,
    list(
        {'kind': c.kind, 'value': c.value, 'label': c.label}
        order by c.display_order
    ) filter (where c.id is not null)                          as contact_methods,
    (
        select list(
            {'platform': s.platform, 'url': s.url, 'handle': s.handle}
            order by s.display_order
        )
        from social s
        where s.person_id = p.id
    )                                                           as social_profiles
from person p
left join contact c on c.person_id = p.id
group by p.id, p.full_name, p.headline, p.location, p.summary
