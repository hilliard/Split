<#
  One-shot local Postgres setup script for Windows PowerShell.
  Creates a local user (localuser) and a database (split_local) if missing,
  and grants necessary privileges. It will also write the final DATABASE_URL
  into .env.local so your app can connect to the local DB.
  Enhancements: supports non-interactive admin login via AdminPassword, reports a summary, and writes env.
  Important: adjust default credentials if you want different local user/password.
#>

param(
  [string]$DbUser = 'localuser',
  [string]$DbPassword = 'localpass',
  [string]$DbName = 'split_local',
  [string]$DbHost = 'localhost',
  [int]$Port = 5432,
  [string]$AdminUser = 'postgres',
  [string]$AdminHost = 'localhost',
  [int]$AdminPort = 5432,
  [string]$EnvFile = '.env.local',
  [string]$AdminPassword = $null
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command 'psql' -ErrorAction SilentlyContinue)) {
  Write-Error 'psql not found in PATH. Please install PostgreSQL client and ensure it is in PATH.'
  exit 1
}

# Prefer explicit AdminPassword, then an environment variable to avoid exposing on CLI
"# Admin password can be provided via -AdminPassword or via environment variable ADMIN_PASSWORD" | Out-Null
$adminPasswordFromEnv = $Env:ADMIN_PASSWORD
$adminPassword = if ($AdminPassword) { $AdminPassword } elseif ($adminPasswordFromEnv) { $adminPasswordFromEnv } else { $null }
if ($adminPassword) {
  $env:PGPASSWORD = $adminPassword
}

Write-Host "Setting up local DB: $DbName with user $DbUser" -ForegroundColor Green

$summary = @()

# 1) Check and create user (idempotent)
$checkUserSql = @"
SELECT 1 FROM pg_roles WHERE rolname = '$DbUser';
"@ 
$userExists = $false
try {
  $uout = & psql -U $AdminUser -h $AdminHost -p $AdminPort -d postgres -t -A -c $checkUserSql 2>&1
  if ($LASTEXITCODE -eq 0 -and $uout.Trim() -eq '1') { $userExists = $true }
} catch {
  # ignore; we'll try to create anyway
}

if (-not $userExists) {
$cmdUser = @"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DbUser') THEN
    EXECUTE 'CREATE USER $DbUser WITH PASSWORD ''$DbPassword''';
  END IF;
END $$;
"@ 
  & psql -U $AdminUser -h $AdminHost -p $AdminPort -d postgres -c $cmdUser
  $summary += "User '$DbUser' created."
} else {
  $summary += "User '$DbUser' existed."
}

# Optional: create database if missing (standalone)
$checkDbSql = @"
SELECT 1 FROM pg_database WHERE datname = '$DbName';
"@ 
$dbExists = $false
 try {
  $dout = & psql -U $AdminUser -h $AdminHost -p $AdminPort -d postgres -t -A -c $checkDbSql 2>&1
  if ($LASTEXITCODE -eq 0 -and $dout.Trim() -eq '1') { $dbExists = $true }
 } catch {
  # ignore
 }
 if (-not $dbExists) {
  $cmdDb = "CREATE DATABASE $DbName OWNER $DbUser;"
  & psql -U $AdminUser -h $AdminHost -p $AdminPort -d postgres -c $cmdDb
  $summary += "Database '$DbName' created."
} else {
  $summary += "Database '$DbName' existed."
}

# 3) Grants
$cmdGrants = @"
GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
GRANT ALL ON SCHEMA public TO $DbUser;
GRANT ALL ON ALL TABLES IN SCHEMA public TO $DbUser;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DbUser;
"@ 
& psql -U $AdminUser -h $AdminHost -p $AdminPort -d $DbName -c $cmdGrants
$summary += "Privileges granted to '$DbUser'."

$envLine = "DATABASE_URL=postgresql://$DbUser:$DbPassword@$DbHost:$Port/$DbName?sslmode=disable"
$envLines = if (Test-Path $EnvFile) { Get-Content $EnvFile } else { @() }
$found = $false
for ($i = 0; $i -lt $envLines.Count; $i++) {
  if ($envLines[$i] -like 'DATABASE_URL=*') { $envLines[$i] = $envLine; $found = $true; break }
}
if (-not $found) { $envLines += $envLine }
$envLines | Set-Content $EnvFile
$summary += "Wrote DATABASE_URL to '$EnvFile'."

Write-Host "Local DB setup complete. Summary:" -ForegroundColor Green
foreach ($entry in $summary) { Write-Host "- $entry" -ForegroundColor Yellow }
