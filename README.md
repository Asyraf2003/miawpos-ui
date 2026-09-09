# MiawPOS UI

Responsive browser client for the authoritative sibling `meawpos-api`. The bounded R6 authentication slice uses Google OIDC for production human login, then recovers the authoritative MiawPOS session after reload and revokes it on logout. The login/session slice is implemented, locally proven, committed, and pushed; full R6 remains open.

Canonical rules: [AGENTS.md](AGENTS.md), then the backend's private docs chain. Current implementation/proof checkpoint: [R6 session proof](docs/evidence/0008_r6_login_session_client_slice.md). The `docs` path is intentionally a symlink into the private canonical documentation surface; private docs content is not vendored into this public repository.

## Run locally

Use Node **24.20.0** and pnpm **12.3.4** (see `.node-version` and `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Start the sibling backend on `127.0.0.1:8081` with its documented PostgreSQL and Google OIDC configuration. Set `AUTH_GOOGLE_REDIRECT_URL` to the same browser origin as Vite, using the legacy callback path; the backend derives `/api/auth/browser/google/callback` on that allowlisted origin, and both exact callback URIs must be registered with Google. `AUTH_DEBUG_ENABLED` is not needed by this UI. `APP_ENV=local` permits cookies on local HTTP; every non-local environment requires HTTPS.

Open the Vite URL. The browser calls relative `/api`; Vite forwards it to the backend with the original origin. No production `VITE_*` variable or browser API key is needed.

## Boundaries

- `domain/`: principal and semantic outcomes, independent of browser/frameworks.
- `application/`: session port and bootstrap/logout orchestration.
- `adapters/`: native-fetch HTTP decoding, memory-only bearer session lifecycle, locale catalogs/preference.
- `presentation/` and `components/ui/`: Google login action, owned locale selector/dropdown, outcome feedback, responsive shell, owned shadcn source.
- `app/`: composition, React Router `BrowserRouter`, and memory-only TanStack Query lifecycle.

ESLint restricts outward imports and browser globals in domain/application. Refresh credentials belong exclusively to the HttpOnly cookie; access tokens stay in private adapter memory. Only `miawpos.locale` may be saved to Web Storage. Indonesian and English are bundled. Neutral CSS variables prepare the design for later theming; R6 supports light mode only.

## Verify

```sh
pnpm check
pnpm exec playwright install chromium
pnpm proof:browser
pnpm audit --audit-level=high
GITLEAKS_BIN=/path/to/gitleaks-8.30.1 bash scripts/security-secrets.sh
```

`check` verifies exact dependencies, frozen lockfile installation, typecheck, ESLint, Vitest/RTL, production build, and dist audit. Commands are also available separately through `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

`proof:browser` requires Go, PostgreSQL CLI tools (`initdb`, `pg_ctl`, `createdb`, `psql`), OpenSSL, curl, the initialized backend docs submodule, and free ports 55437/8081/4173/4184. Run as a non-root user able to initialize PostgreSQL. It starts a disposable cluster, the real sibling backend, and a deterministic external OIDC test boundary. The backend still performs discovery, state/nonce/PKCE checks, signed ID-token verification, account/identity persistence, and session creation. The harness serves the **existing** `dist` through a test-only HTTPS reverse proxy, executes the tablet session chain plus desktop/mobile smoke, and removes its temporary database, keys, and logs. Screenshots remain in ignored `test-results/`; credential-bearing traces and storage state are never exported.

The proof hashes recorded in `docs/evidence/0008_r6_login_session_client_slice.md` identify the exact earlier browser-tested artifact. A later presentation-only locale-dropdown refinement is committed on `main`; do not silently treat the earlier hashes as hashes for a later build.

## Static hosting

Publish the exact passed `dist` behind HTTPS, same-origin `/api`, and SPA fallback. [deploy/nginx.conf](deploy/nginx.conf) provides a reference configuration; adapt host, certificate paths, static root, and upstream. Keep API errors upstream-owned and never replace them with `index.html`. A Node application server is not a production dependency.

Local HTTPS simulation passed; a deployed production host, remote CI/provenance where required by the release contract, representative physical-tablet validation, and the later ROOT/catalog/sales/readback/reversal chain remain R6 proof obligations. This login/session slice does not close the full R6 MVP. ROOT is the next sequence position but requires a separately authorized bounded scope.

## License and component source

AGPL-3.0-only; see [LICENSE](LICENSE). Copied shadcn source retains attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Layouts were composed for this login slice using the public visual direction of [Shadcn UI Kit](https://shadcnuikit.com); no premium template was copied.
