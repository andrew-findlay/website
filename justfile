root   := justfile_directory()
venv   := root / ".venv"
python := venv / "bin" / "python"
dbt    := venv / "bin" / "dbt"

# List available recipes
default:
    @just --list

# Create venv and install dbt dependencies
install:
    python3 -m venv {{venv}}
    {{python}} -m pip install --quiet --upgrade pip
    {{python}} -m pip install --quiet -r requirements.txt
    @echo "✓ dbt-duckdb installed in {{venv}}"

# Update pip and reinstall requirements
upgrade:
    {{python}} -m pip install --quiet --upgrade pip
    {{python}} -m pip install --quiet --upgrade -r requirements.txt
    @echo "✓ Upgraded"

# Run dbt seed + run and copy database to public/db/
build:
    cd dbt_project && {{dbt}} seed --profiles-dir .
    cd dbt_project && {{dbt}} run --profiles-dir .
    mkdir -p public/db
    cp dbt_project/careeros.duckdb public/db/careeros.duckdb
    @echo "✓ Built: public/db/careeros.duckdb"

# Run dbt seed only
seed:
    cd dbt_project && {{dbt}} seed --profiles-dir .

# Run dbt run only (assumes seeds already loaded)
run:
    cd dbt_project && {{dbt}} run --profiles-dir .

# Run dbt tests
test:
    cd dbt_project && {{dbt}} test --profiles-dir .

# Show dbt docs (opens browser)
docs:
    cd dbt_project && {{dbt}} docs generate --profiles-dir .
    cd dbt_project && {{dbt}} docs serve --profiles-dir .

# Remove venv and dbt artifacts
clean:
    rm -rf {{venv}} dbt_project/target dbt_project/dbt_packages dbt_project/careeros.duckdb
    @echo "✓ Cleaned"
