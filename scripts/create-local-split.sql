DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'localuser') THEN
    EXECUTE 'CREATE USER localuser WITH PASSWORD ''localpass''';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'split_local') THEN
    EXECUTE 'CREATE DATABASE split_local OWNER localuser';
  END IF;
END
$$;
