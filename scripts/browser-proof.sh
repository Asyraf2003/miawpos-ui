#!/usr/bin/env bash
# Real browser proof with the sibling backend and a fresh disposable PostgreSQL cluster.
set -euo pipefail
cd "$(dirname "$0")/.."
ui_dir="$PWD"
api_dir="${MIAWPOS_API_REPO:-$ui_dir/../meawpos-api}"
proof_dir="$(mktemp -d /tmp/miawpos-ui-proof.XXXXXX)"
api_pid=''
host_pid=''
oidc_pid=''
cleanup() {
  if [[ -n "$oidc_pid" ]]; then kill "$oidc_pid" 2>/dev/null || true; wait "$oidc_pid" 2>/dev/null || true; fi
  if [[ -n "$host_pid" ]]; then kill "$host_pid" 2>/dev/null || true; wait "$host_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then kill "$api_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true; fi
  pg_ctl -D "$proof_dir/pg" -m fast stop >/dev/null 2>&1 || true
  # Only this run's mktemp directory; never a caller-supplied data directory.
  if [[ "$proof_dir" == /tmp/miawpos-ui-proof.* ]]; then rm -rf -- "$proof_dir"; fi
}
trap cleanup EXIT
test -f dist/index.html || { echo 'Run pnpm check before browser proof.'; exit 1; }
initdb -D "$proof_dir/pg" -U miawpos_test --auth=trust --no-locale --encoding=UTF8 > "$proof_dir/initdb.log"
pg_ctl -D "$proof_dir/pg" -l "$proof_dir/postgres.log" -o "-h 127.0.0.1 -p 55437 -k $proof_dir" start
createdb -h 127.0.0.1 -p 55437 -U miawpos_test miawpos_ui_proof
export DATABASE_URL='postgres://miawpos_test@127.0.0.1:55437/miawpos_ui_proof?sslmode=disable'
(cd "$api_dir" && bash scripts/db_migrate.sh) > "$proof_dir/migrate.log"
(cd "$api_dir" && GOCACHE="${GOCACHE:-/tmp/go-build-cache}" go build -o "$proof_dir/api" ./cmd/api)
export APP_ENV=testing HTTP_PORT=8081 AUTH_DEBUG_ENABLED=false BUSINESS_COMPONENTS=none
export AUTH_GOOGLE_CLIENT_ID=miawpos-browser-proof AUTH_GOOGLE_CLIENT_SECRET="$(openssl rand -hex 32)"
export AUTH_GOOGLE_ISSUER=http://127.0.0.1:4184 AUTH_GOOGLE_REDIRECT_URL=https://localhost:4173/api/auth/google/callback
node scripts/oidc-proof-server.mjs > "$proof_dir/oidc.log" 2>&1 &
oidc_pid=$!
for ((attempt = 0; attempt < 100; attempt++)); do
  if curl --silent --fail "$AUTH_GOOGLE_ISSUER/.well-known/openid-configuration" > /dev/null; then break; fi
  sleep 0.1
done
export AUTH_JWT_SECRET="$(openssl rand -hex 32)"
export AUTH_JWT_ISSUER=miawpos-ui-proof AUTH_JWT_AUDIENCE=miawpos-ui-proof AUTH_JWT_KID=ephemeral-proof
export AUTH_JWT_TTL_MINUTES=15 AUTH_SESSION_TTL_HOURS=1
(cd "$proof_dir" && exec "$proof_dir/api") > "$proof_dir/api.log" 2>&1 &
api_pid=$!
api_ready=false
for ((attempt = 0; attempt < 100; attempt++)); do
  if ! kill -0 "$api_pid" 2>/dev/null; then
    cat "$proof_dir/api.log"
    exit 1
  fi
  if curl --silent --fail http://127.0.0.1:8081/api/health > /dev/null; then
    api_ready=true
    break
  fi
  sleep 0.1
done
if [[ "$api_ready" != true ]]; then cat "$proof_dir/api.log"; exit 1; fi
export PROOF_TLS_KEY="$proof_dir/localhost.key" PROOF_TLS_CERT="$proof_dir/localhost.crt"
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$PROOF_TLS_KEY" -out "$PROOF_TLS_CERT" -days 1 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' > "$proof_dir/tls.log" 2>&1
node scripts/static-proof-server.mjs > "$proof_dir/host.log" 2>&1 &
host_pid=$!
ready=false
for ((attempt = 0; attempt < 100; attempt++)); do
  if curl --silent --fail --insecure https://localhost:4173/api/health > /dev/null; then ready=true; break; fi
  sleep 0.1
done
if [[ "$ready" != true ]]; then cat "$proof_dir/api.log" "$proof_dir/host.log"; exit 1; fi
echo 'Testing exact existing dist via HTTPS, same-origin /api, and disposable PostgreSQL.'
pnpm test:e2e
