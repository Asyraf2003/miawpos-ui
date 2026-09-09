# MiawPOS UI

Start with `../meawpos-api/AGENTS.md` and its canonical documentation chain. That sibling's private docs submodule is the project architecture/progress authority. This repository is the separate public React presentation client; the API remains authoritative.

The bounded R6 Google browser login/session slice is implemented, locally proven, committed, and pushed. Read `docs/evidence/0008_r6_login_session_client_slice.md` and `README.md` for the current checkpoint. `docs` is intentionally a symlink into the private canonical documentation surface; never vendor/copy private docs content into this public repository. ROOT is the next R6 sequence step but must not be implemented without the next explicit bounded scope.

Dependency direction: presentation → application → domain; adapters implement application ports. Keep React, HTTP, storage, localization and query libraries out of domain/application. Do not put credentials in Web Storage, query data, logs, traces or fixtures exported from a live session. The only saved browser preference is `miawpos.locale`.

Use exact dependencies and `pnpm-lock.yaml`. Run `pnpm check`; session changes additionally need `pnpm proof:browser`. Read the evidence checkpoint's compiler compatibility exception before changing toolchain versions. No generated component refresh as part of CI. Copy only components actually needed, preserve attribution, and use 44px controls.

Production human login uses Google OIDC. Manual email/password remains backend debug/test compatibility only when `AUTH_DEBUG_ENABLED`; never render a manual form or password lifecycle in production UI. Google remains authoritative for account selection in the provider flow. Do not infer full R6 closure from this bounded login/session checkpoint.
