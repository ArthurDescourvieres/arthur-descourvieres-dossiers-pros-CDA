#!/bin/sh
# Least-privilege application role (defense in depth, § moindre privilège).
#
# The API connects at runtime as APP_DB_USER (DML only, no DDL) via DATABASE_URL,
# while Prisma migrations run as the cluster owner (POSTGRES_USER) via
# MIGRATE_DATABASE_URL. A SQL-injection or application bug therefore can never
# ALTER or DROP the schema — the runtime role simply lacks the privilege.
#
# Runs once, on first cluster initialisation (empty data dir), via the Postgres
# image's /docker-entrypoint-initdb.d hook. For an already-initialised database,
# run this script's SQL manually as the owner. APP_DB_USER / APP_DB_PASSWORD are
# injected by the db service environment (see docker-compose.prod.yml).
set -e

if [ -z "${APP_DB_USER}" ] || [ -z "${APP_DB_PASSWORD}" ]; then
  echo "10-app-role.sh: APP_DB_USER / APP_DB_PASSWORD not set — skipping app-role creation" >&2
  exit 0
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	-- Create the login role once (idempotent via \gexec).
	SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', '${APP_DB_USER}', '${APP_DB_PASSWORD}')
	WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_DB_USER}')\gexec

	-- Connect + read the schema, but never create objects in it (no DDL).
	GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
	GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};
	REVOKE CREATE ON SCHEMA public FROM ${APP_DB_USER};
	REVOKE CREATE ON SCHEMA public FROM PUBLIC;

	-- DML on every existing table/sequence...
	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
	GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};

	-- ...and on every table/sequence the owner creates later (Prisma migrations).
	ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
	  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_DB_USER};
	ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
	  GRANT USAGE, SELECT ON SEQUENCES TO ${APP_DB_USER};
EOSQL

echo "10-app-role.sh: app role '${APP_DB_USER}' provisioned (DML only, no DDL)"
