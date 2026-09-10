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
# Reuse the backend-owned bounded authority/financial checks on this database.
(cd "$api_dir" && bash scripts/audit_security_integration.sh)
(cd "$api_dir" && GOCACHE="${GOCACHE:-/tmp/go-build-cache}" go build -o "$proof_dir/api" ./cmd/api)
# A developer API may already own 8081. Select a disposable backend port;
# readiness below must still fail closed if another process wins the bind race.
PROOF_API_PORT="$(node --input-type=module -e '
import net from "node:net";
const server = net.createServer();
server.on("error", error => { console.error(error.message); process.exit(1) });
server.listen(0, "127.0.0.1", () => { console.log(server.address().port); server.close() });
')"
export PROOF_API_PORT
export APP_ENV=testing HTTP_PORT="$PROOF_API_PORT" AUTH_DEBUG_ENABLED=false BUSINESS_COMPONENTS=catalog.core,catalog.pricing,sales,payment.cash
export AUTH_GOOGLE_CLIENT_ID=miawpos-browser-proof AUTH_GOOGLE_CLIENT_SECRET="$(openssl rand -hex 32)"
export AUTH_GOOGLE_ISSUER=http://127.0.0.1:4184 AUTH_GOOGLE_REDIRECT_URL=https://localhost:4173/api/auth/google/callback
export PROOF_READY_DIR="$proof_dir"
node scripts/oidc-proof-server.mjs > "$proof_dir/oidc.log" 2>&1 &
oidc_pid=$!
wait_ready() {
  local pid="$1" url="$2" log="$3" marker="${4:-}"
  for ((attempt = 0; attempt < 100; attempt++)); do
    if ! kill -0 "$pid" 2>/dev/null; then cat "$log"; return 1; fi
    if [[ -z "$marker" || -f "$marker" ]] && curl --silent --fail --insecure --max-time 1 "$url" > /dev/null; then
      if kill -0 "$pid" 2>/dev/null; then return 0; fi
      cat "$log"; return 1
    fi
    sleep 0.1
  done
  echo "Readiness timed out: $url" >&2
  cat "$log"
  return 1
}
wait_ready "$oidc_pid" "$AUTH_GOOGLE_ISSUER/.well-known/openid-configuration" "$proof_dir/oidc.log" "$proof_dir/oidc.ready"
export AUTH_JWT_SECRET="$(openssl rand -hex 32)"
export AUTH_JWT_ISSUER=miawpos-ui-proof AUTH_JWT_AUDIENCE=miawpos-ui-proof AUTH_JWT_KID=ephemeral-proof
export AUTH_JWT_TTL_MINUTES=15 AUTH_SESSION_TTL_HOURS=1
(cd "$proof_dir" && exec "$proof_dir/api") > "$proof_dir/api.log" 2>&1 &
api_pid=$!
wait_ready "$api_pid" "http://127.0.0.1:$PROOF_API_PORT/api/health" "$proof_dir/api.log"
export PROOF_TLS_KEY="$proof_dir/localhost.key" PROOF_TLS_CERT="$proof_dir/localhost.crt"
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$PROOF_TLS_KEY" -out "$PROOF_TLS_CERT" -days 1 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' > "$proof_dir/tls.log" 2>&1
node scripts/static-proof-server.mjs > "$proof_dir/host.log" 2>&1 &
host_pid=$!
wait_ready "$host_pid" https://localhost:4173/api/health "$proof_dir/host.log" "$proof_dir/host.ready"
# Prove the actual auth route reaches this run's configured external boundary.
# Never print the response headers: Location/state cookies contain login material.
node --input-type=module <<'JS'
import https from 'node:https'
const req = https.get('https://localhost:4173/api/auth/browser/google/start', { rejectUnauthorized: false }, res => {
  const url = new URL(res.headers.location ?? '/', 'https://localhost:4173')
  if (res.statusCode !== 303 || url.origin !== process.env.AUTH_GOOGLE_ISSUER || url.pathname !== '/authorize' ||
      url.searchParams.get('client_id') !== process.env.AUTH_GOOGLE_CLIENT_ID ||
      url.searchParams.get('redirect_uri') !== 'https://localhost:4173/api/auth/browser/google/callback') {
    console.error(`Auth readiness failed: HTTP ${res.statusCode}; expected this run's OIDC redirect`)
    process.exitCode = 1
  }
  res.resume()
})
req.setTimeout(5000, () => req.destroy(new Error('Auth readiness timed out')))
req.on('error', error => { console.error(error.message); process.exitCode = 1 })
JS
for pid in "$api_pid" "$oidc_pid" "$host_pid"; do
  if ! kill -0 "$pid" 2>/dev/null; then cat "$proof_dir/api.log" "$proof_dir/oidc.log" "$proof_dir/host.log"; exit 1; fi
done
echo 'Testing exact existing dist via HTTPS, same-origin /api, and disposable PostgreSQL.'
pnpm test:e2e
