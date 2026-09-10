# MiawPOS UI

Responsive browser client for the authoritative sibling `meawpos-api`. The R6 client chain now connects Google login/session to ROOT context, catalog/pricing, a single-item Cash sale, authoritative readback, and full reversal. The chain is locally proven; full R6 remains open.

Canonical rules: [AGENTS.md](AGENTS.md), then the backend's private docs chain. In a local workspace with the private docs checkout initialized, the business-chain checkpoint is `docs/evidence/0009_r6_root_cash_client_chain.md`; the earlier authentication proof remains in `docs/evidence/0008_r6_login_session_client_slice.md`. The `docs` path is intentionally a symlink into the private canonical documentation surface; private docs content is not vendored into this public repository.

## Run locally

Use Node **24.20.0** and pnpm **12.3.4** (see `.node-version` and `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Start the sibling backend on `127.0.0.1:8081` with its documented PostgreSQL and Google OIDC configuration. Set `AUTH_GOOGLE_REDIRECT_URL` to the same browser origin as Vite, using the legacy callback path; the backend derives `/api/auth/browser/google/callback` on that allowlisted origin, and both exact callback URIs must be registered with Google. `AUTH_DEBUG_ENABLED` is not needed by this UI. `APP_ENV=local` permits cookies on local HTTP; every non-local environment requires HTTPS.

Open the Vite URL. The browser calls relative `/api`; Vite forwards it to the backend with the original origin. No production `VITE_*` variable or browser API key is needed.

## Boundaries

- `domain/`: principal, ROOT context, catalog/sale projections, safe integer input, and semantic outcomes.
- `application/`: session/ROOT/catalog/sales ports, validated commands, and memory-only stable Cash retry identity.
- `adapters/`: native-fetch HTTP decoding, memory-only bearer session lifecycle, locale catalogs/preference.
- `presentation/` and `components/ui/`: Google login, locale selector, outcome feedback, ROOT selection/creation, catalog detail, Cash and reversal forms, owned shadcn source.
- `app/`: composition, React Router `BrowserRouter`, and memory-only TanStack Query lifecycle.

ESLint restricts outward imports and browser globals in domain/application. Refresh credentials belong exclusively to the HttpOnly cookie; access tokens stay in private adapter memory. Only `miawpos.locale` may be saved to Web Storage. Indonesian and English are bundled. Neutral CSS variables prepare the design for later theming; R6 supports light mode only.

## First business chain

From `/account`, open the workspace. No accessible ROOT offers first-ROOT creation; one activates automatically; multiple require explicit selection. Selection is session-memory client context, never server authorization. Every scoped operation uses the existing backend authority boundary.

Create an item with an optional positive integer Rupiah price, then read it from the server. A priced item supports quantity plus Cash received; totals/change come from the posted sale and a fresh GET. Reversal requires a reason and reads back the full server-owned refund. This minimum UI uses the existing create/read-by-ID contracts; it does not invent catalog/sales listing or a dashboard.

An uncertain Cash submission keeps the same immutable body and idempotency key across retries/navigation within the live client session. Do not reload, close the tab, or log out until the result is known: no pending-sale state is persisted, and crash/reload reconciliation of an unknown sale is not implemented. A warning guards ordinary tab unload while an attempt is pending; it cannot guarantee recovery after a crash. Known sale URLs remain readback routes, with ROOT selection still required when multiple ROOTs are accessible.

## Verify

```sh
pnpm check
pnpm exec playwright install chromium
pnpm proof:browser
pnpm audit --audit-level=high
GITLEAKS_BIN=/path/to/gitleaks-8.30.1 bash scripts/security-secrets.sh
```

`check` verifies exact dependencies, frozen lockfile installation, typecheck, ESLint, Vitest/RTL, production build, and dist audit. Commands are also available separately through `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

`proof:browser` requires Go, PostgreSQL CLI tools (`initdb`, `pg_ctl`, `createdb`, `psql`), OpenSSL, curl, the initialized backend docs submodule, and free ports 55437/8081/4173/4184. Run as a non-root user able to initialize PostgreSQL. It starts a disposable cluster, runs the backend-owned security/financial integration gate, and starts the real API with `catalog.core,catalog.pricing,sales,payment.cash` plus a deterministic external OIDC test boundary. The backend still performs discovery, state/nonce/PKCE checks, signed ID-token verification, account/identity persistence, and session creation. The harness serves the **existing** `dist` through a test-only HTTPS reverse proxy. Tablet proof covers first ROOT, catalog, a lost response after Cash commit, same-key replay, persisted readback/reversal, multiple ROOT selection, cross-ROOT denials, and logout. Desktop/mobile cover the business chain in English and 320px reflow. The harness removes its temporary database, keys, and logs. Screenshots remain in ignored `test-results/`; credential-bearing traces and storage state are never exported.

Proof hashes in each private checkpoint identify only that checkpoint's exact browser-tested artifact, not later builds.

## Static hosting

Publish the exact passed `dist` behind HTTPS, same-origin `/api`, and SPA fallback. [deploy/nginx.conf](deploy/nginx.conf) provides a reference configuration; adapt host, certificate paths, static root, and upstream. Keep API errors upstream-owned and never replace them with `index.html`. A Node application server is not a production dependency.

Local HTTPS simulation and the minimum ROOT/catalog/Cash/readback/reversal chain passed. A deployed production host, remote CI/provenance where required by the release contract, representative physical-tablet validation, and full accessibility/release closure remain R6 proof obligations. Local Chromium emulation is not physical-device or production proof.

## License and component source

AGPL-3.0-only; see [LICENSE](LICENSE). Copied shadcn source retains attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Layouts were composed for this login slice using the public visual direction of [Shadcn UI Kit](https://shadcnuikit.com); no premium template was copied.
