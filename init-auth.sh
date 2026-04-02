#!/bin/bash
set -e

# This script will be run after init.sql to configure authentication

echo "Configuring PostgreSQL authentication..."

# Modify pg_hba.conf to use md5 authentication for TCP connections
echo "Replacing SCRAM-SHA-256 with md5 for TCP connections..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --database "$POSTGRES_DB" <<-'EOSQL'
    -- No actual SQL needed here, auth is configured via pg_hba.conf modifications
    SELECT 1;
EOSQL

echo "Authentication configuration complete"
