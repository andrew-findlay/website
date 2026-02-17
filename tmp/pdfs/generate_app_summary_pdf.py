from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from pypdf import PdfReader

OUTPUT = "output/pdf/sql_portfolio_app_summary.pdf"


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "TitleSmall",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=13,
            textColor=colors.HexColor("#111827"),
            spaceBefore=6,
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=2,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=10.6,
            leftIndent=0,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=1,
        ),
    }
    return styles


def add_bullets(story, items, style):
    for item in items:
        story.append(Paragraph(f"- {item}", style))
    story.append(Spacer(1, 2))


def build_pdf(path: str):
    styles = make_styles()
    doc = SimpleDocTemplate(
        path,
        pagesize=letter,
        leftMargin=0.58 * inch,
        rightMargin=0.58 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.5 * inch,
        title="SQL Portfolio App Summary",
        author="Codex",
    )

    story = []

    story.append(Paragraph("SQL Portfolio: One-Page App Summary", styles["title"]))
    story.append(Paragraph("Repository: /Users/andrew.findlay/Documents/Github/personal/website", styles["body"]))
    story.append(Spacer(1, 3))

    story.append(Paragraph("What it is", styles["section"]))
    story.append(
        Paragraph(
            "SQL Portfolio is a single-page React/Vite app that presents a developer portfolio as a SQL IDE plus schema explorer (metadata.json). It runs DuckDB-WASM in the browser, seeds portfolio tables, and executes user SQL locally (lib/db.ts, constants.ts).",
            styles["body"],
        )
    )

    story.append(Paragraph("Who it is for", styles["section"]))
    story.append(
        Paragraph(
            "Primary persona: Not found in repo. Evidence suggests a developer/candidate showcasing experience to hiring teams (constants.ts sample resume data; ExportModal text: \"Best for sharing with hiring teams\").",
            styles["body"],
        )
    )

    story.append(Paragraph("What it does", styles["section"]))
    add_bullets(
        story,
        [
            "Initializes an in-browser DuckDB database and loads seeded schema/data for employees, history, education, and tech stack (lib/db.ts, constants.ts).",
            "Provides a multi-tab SQL editor with syntax highlighting, line numbers, and open/close tab behavior (components/Editor/CodeEditor.tsx, App.tsx).",
            "Runs SQL queries from the active file and tracks execution state and DB readiness in app state (App.tsx).",
            "Renders query results with column types, row numbers, execution time, affected-row count, and SQL error display (components/Editor/ResultsPane.tsx).",
            "Supports data export of current query results to CSV and JSON from the results toolbar (components/Editor/ResultsPane.tsx).",
            "Includes a schema explorer view driven by static schema nodes and relationship connectors (components/Schema/SchemaView.tsx, constants.ts).",
            "Includes an export modal UI for PDF/CSV/JSON selection and preview; modal download action wiring to actual file generation is Not found in repo (components/Modals/ExportModal.tsx).",
        ],
        styles["bullet"],
    )

    story.append(Paragraph("How it works (compact architecture)", styles["section"]))
    add_bullets(
        story,
        [
            "Frontend shell: index.tsx mounts App; App composes Header, Sidebar/MobileNav, CodeEditor, ResultsPane, SchemaView, and ExportModal.",
            "State + orchestration: App.tsx controls active/open files, editor/schema view mode, modal visibility, run status, DB readiness, and per-file query results.",
            "Data service: lib/db.ts initializes @duckdb/duckdb-wasm in a Web Worker (bundle selection via jsDelivr), creates connection, and runs INIT_SQL.",
            "Data flow: user action -> App handlers -> runQuery(sql) -> Arrow result mapped to plain objects/columns -> ResultsPane render/export helpers.",
            "Config/runtime: Vite dev server (port 3000) and GEMINI_API_KEY define entries in vite.config.ts; backend API/service layer is Not found in repo.",
        ],
        styles["bullet"],
    )

    story.append(Paragraph("How to run (minimal)", styles["section"]))
    add_bullets(
        story,
        [
            "Prerequisite: Node.js (README.md).",
            "Install dependencies: npm install.",
            "Set GEMINI_API_KEY in /Users/andrew.findlay/Documents/Github/personal/website/.env.local (README.md).",
            "Start dev server: npm run dev, then open http://localhost:3000 (vite.config.ts).",
        ],
        styles["bullet"],
    )

    doc.build(story)


def assert_one_page(path: str):
    pages = len(PdfReader(path).pages)
    if pages != 1:
        raise RuntimeError(f"Expected 1 page, found {pages}")


if __name__ == "__main__":
    build_pdf(OUTPUT)
    assert_one_page(OUTPUT)
    print(OUTPUT)
