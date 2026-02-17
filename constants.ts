import { SqlFile, SchemaNode } from "./types";

export const INIT_SQL = [
    // 1. Employees (Root)
    `CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name VARCHAR,
        title VARCHAR,
        summary VARCHAR,
        email VARCHAR,
        location VARCHAR
    );`,
    `INSERT INTO employees VALUES 
    (1, 'Alex Dev', 'Senior Data Engineer', 'Specializing in high-scale ETL and modern data stacks.', 'alex@example.com', 'San Francisco, CA');`,
    
    // 2. Employment History (Relational)
    `CREATE TABLE employment_history (
        id INTEGER PRIMARY KEY,
        employee_id INTEGER,
        company VARCHAR,
        role VARCHAR,
        start_date DATE,
        end_date DATE,
        description VARCHAR,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );`,
    `INSERT INTO employment_history VALUES
    (1, 1, 'TechCorp', 'Staff Engineer', '2022-01-01', NULL, 'Leading data infrastructure migration to Snowflake.'),
    (2, 1, 'DataStart', 'Senior Analyst', '2019-03-01', '2021-12-31', 'Built initial dbt core models.'),
    (3, 1, 'OldSchool Inc', 'Junior DBA', '2017-06-01', '2019-02-28', 'Maintained legacy Postgres clusters.');`,

    // 3. Education (Relational)
    `CREATE TABLE degrees (
        id INTEGER PRIMARY KEY,
        employee_id INTEGER,
        school VARCHAR,
        degree VARCHAR,
        grad_year INTEGER,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );`,
    `INSERT INTO degrees VALUES
    (1, 1, 'University of Tech', 'B.S. Computer Science', 2017),
    (2, 1, 'Data Academy', 'Cert. Data Engineering', 2020);`,

    // 4. Skills (Relational)
    `CREATE TABLE tech_stack (
        id INTEGER PRIMARY KEY,
        employee_id INTEGER,
        category VARCHAR,
        skill_name VARCHAR,
        proficiency INTEGER,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );`,
    `INSERT INTO tech_stack VALUES
    (1, 1, 'Languages', 'SQL', 95),
    (2, 1, 'Languages', 'Python', 90),
    (3, 1, 'Languages', 'TypeScript', 80),
    (4, 1, 'Tools', 'dbt', 95),
    (5, 1, 'Tools', 'Snowflake', 85),
    (6, 1, 'Tools', 'Docker', 75);`
];

export const FILES: Record<string, SqlFile> = {
    'bio.sql': {
        id: 'bio.sql',
        name: 'bio.sql',
        description: 'Candidate profile summary',
        content: `-- Employee Profile
SELECT name, title, summary, location 
FROM employees 
WHERE id = 1;`
    },
    'work_history.sql': {
        id: 'work_history.sql',
        name: 'work_history.sql',
        description: 'Professional timeline',
        content: `-- Career Timeline
SELECT 
    company, 
    role, 
    start_date, 
    COALESCE(CAST(end_date AS VARCHAR), 'Present') as end_date,
    description
FROM employment_history
WHERE employee_id = 1
ORDER BY start_date DESC;`
    },
    'education.sql': {
        id: 'education.sql',
        name: 'education.sql',
        description: 'Academic background',
        content: `-- Education History
SELECT school, degree, grad_year
FROM degrees
WHERE employee_id = 1
ORDER BY grad_year DESC;`
    },
    'tech_stack.sql': {
        id: 'tech_stack.sql',
        name: 'tech_stack.sql',
        description: 'Skills matrix',
        content: `-- Tech Stack Proficiency
SELECT category, skill_name, proficiency
FROM tech_stack
WHERE employee_id = 1
ORDER BY proficiency DESC;`
    },
    'resume_export.sql': {
        id: 'resume_export.sql',
        name: 'resume_export.sql',
        description: 'Generate structured JSON resume',
        content: `-- Relational Resume Generation
-- Uses structural aggregation to build a single document object
-- Click 'Run' to see the nested data structure

SELECT 
    e.name,
    e.title,
    e.email,
    -- Aggregate Experience into a list of structs
    (SELECT list({
        'company': h.company, 
        'role': h.role, 
        'period': CAST(h.start_date AS VARCHAR) || ' to ' || COALESCE(CAST(h.end_date AS VARCHAR), 'Present')
     }) 
     FROM employment_history h 
     WHERE h.employee_id = e.id) as experience,
     
    -- Aggregate Skills into a simplified list
    (SELECT list(s.skill_name) 
     FROM tech_stack s 
     WHERE s.employee_id = e.id AND s.proficiency > 80) as top_skills

FROM employees e
WHERE e.id = 1;`
    },
    'scratchpad.sql': {
        id: 'scratchpad.sql',
        name: 'scratchpad.sql',
        description: 'Temporary workspace',
        content: `-- Ad-hoc Query Area
-- Try joining tables:

SELECT e.name, h.company, h.role 
FROM employees e
JOIN employment_history h ON e.id = h.employee_id;`
    }
};

export const SCHEMA_NODES: SchemaNode[] = [
    {
        id: 'employees',
        title: 'employees',
        type: 'public',
        color: 'bg-primary',
        x: 100,
        y: 250,
        columns: [
            { name: 'id', type: 'INTEGER', isPk: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'title', type: 'VARCHAR' },
            { name: 'summary', type: 'VARCHAR' },
            { name: 'email', type: 'VARCHAR' },
            { name: 'location', type: 'VARCHAR' }
        ]
    },
    {
        id: 'history',
        title: 'employment_history',
        type: 'public',
        color: 'bg-purple-500',
        x: 500,
        y: 100,
        columns: [
            { name: 'id', type: 'INTEGER', isPk: true },
            { name: 'employee_id', type: 'INTEGER', isFk: true },
            { name: 'company', type: 'VARCHAR' },
            { name: 'role', type: 'VARCHAR' },
            { name: 'start_date', type: 'DATE' },
            { name: 'end_date', type: 'DATE' }
        ]
    },
    {
        id: 'degrees',
        title: 'degrees',
        type: 'public',
        color: 'bg-pink-500',
        x: 500,
        y: 400,
        columns: [
            { name: 'id', type: 'INTEGER', isPk: true },
            { name: 'employee_id', type: 'INTEGER', isFk: true },
            { name: 'school', type: 'VARCHAR' },
            { name: 'degree', type: 'VARCHAR' },
            { name: 'grad_year', type: 'INTEGER' }
        ]
    },
    {
        id: 'stack',
        title: 'tech_stack',
        type: 'public',
        color: 'bg-orange-500',
        x: 500,
        y: 600,
        columns: [
            { name: 'id', type: 'INTEGER', isPk: true },
            { name: 'employee_id', type: 'INTEGER', isFk: true },
            { name: 'category', type: 'VARCHAR' },
            { name: 'skill_name', type: 'VARCHAR' },
            { name: 'proficiency', type: 'INTEGER' }
        ]
    }
];