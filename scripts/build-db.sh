#!/usr/bin/env bash
# scripts/build-db.sh
#
# Local equivalent of the GitHub Actions build-db workflow.
# Run this after editing any CSV seed file or dbt model.
#
# Usage:
#   ./scripts/build-db.sh
#
# Prerequisites:
#   pip install dbt-duckdb

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DBT_DIR="$REPO_ROOT/dbt_project"
OUT_DIR="$REPO_ROOT/public/db"

echo "▶ Running dbt seed..."
cd "$DBT_DIR"
dbt seed --profiles-dir .

echo "▶ Running dbt run..."
dbt run --profiles-dir .

echo "▶ Exporting database..."
mkdir -p "$OUT_DIR"
cp "$DBT_DIR/careeros.duckdb" "$OUT_DIR/careeros.duckdb"

echo "✓ Built: public/db/careeros.duckdb ($(du -sh "$OUT_DIR/careeros.duckdb" | cut -f1))"
echo ""
echo "Restart your dev server to pick up the new database."
