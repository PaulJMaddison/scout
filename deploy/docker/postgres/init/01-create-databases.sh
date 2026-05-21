#!/usr/bin/env sh
set -eu

create_database() {
  db_name="$1"
  if [ -z "$db_name" ]; then
    return 0
  fi

  if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
    echo "Database '$db_name' already exists."
  else
    echo "Creating database '$db_name'."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE \"$db_name\";"
  fi
}

create_database "${CUSTOMER_OPS_DB:-customer_ops_db}"
create_database "${SCOUT_DB:-scout_context_db}"
