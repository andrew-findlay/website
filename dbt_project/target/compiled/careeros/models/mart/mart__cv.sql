with profile as (
    select * from "careeros"."main_mart"."mart__profile"
),

timeline as (
    select * from "careeros"."main_mart"."mart__timeline"
),

skills as (
    select * from "careeros"."main_mart"."mart__skills"
),

education as (
    select * from "careeros"."main_mart"."mart__education"
),

certifications as (
    select * from "careeros"."main_raw"."certification"
),

projects as (
    select * from "careeros"."main_mart"."mart__projects"
)

select
    p.person_id,
    {
        'person': {
            'name':     p.full_name,
            'headline': p.headline,
            'location': p.location,
            'summary':  p.summary
        },
        'contact_methods': p.contact_methods,
        'social_profiles': p.social_profiles,
        'experience': (
            select list({
                'employer':        t.employer,
                'title':           t.title,
                'employment_type': t.employment_type,
                'start_date':      cast(t.start_date as varchar),
                'end_date':        case when t.is_current then 'Present'
                                        else cast(t.end_date as varchar) end,
                'is_current':      t.is_current,
                'tenure_months':   t.tenure_months,
                'summary':         t.summary,
                'achievements':    t.achievements,
                'skills_used':     t.skills_used
            } order by t.role_order)
            from timeline t
            where t.person_id = p.person_id
        ),
        'skills': (
            select list({
                'category':       s.category,
                'skill':          s.skill,
                'years_experience': s.years_experience,
                'roles_used_in':  s.roles_used_in
            } order by s.category_order, s.skill_order)
            from skills s
            where s.person_id = p.person_id
        ),
        'education': (
            select list({
                'institution':    e.institution,
                'credential':     e.credential,
                'field_of_study': e.field_of_study,
                'start_year':     e.start_year,
                'end_year':       e.end_year
            } order by e.education_order)
            from education e
            where e.person_id = p.person_id
        ),
        'certifications': (
            select list({
                'name':           c.certification_name,
                'issuer':         c.issuer,
                'issue_year':     c.issue_year,
                'credential_url': c.credential_url
            } order by c.display_order)
            from certifications c
            where c.person_id = p.person_id
        ),
        'projects': (
            select list({
                'name':        pr.name,
                'description': pr.description,
                'repo_url':    pr.repo_url,
                'demo_url':    pr.demo_url,
                'start_year':  pr.start_year,
                'end_year':    pr.end_year,
                'skills':      pr.skills
            } order by pr.project_order)
            from projects pr
            where pr.person_id = p.person_id
        )
    }                                                               as cv
from profile p