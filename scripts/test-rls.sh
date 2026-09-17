#!/usr/bin/env bash
set -euo pipefail
# Fixed disposable container only. Never accepts a remote connection string.
for test_file in supabase/tests-security.sql supabase/tests-publications.sql; do
  docker exec -i supabase_db_presente-de-alegria-relatorios \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$test_file"
done
