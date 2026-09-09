# MiawPOS UI

Start with `../meawpos-api/AGENTS.md` and its canonical documentation chain. That sibling's docs submodule is the project architecture/progress authority. This repository is the separate React presentation client; the API remains authoritative.

Active scope: R6 Google browser login/session correction only. Read `docs/r6-session-proof.md` and `README.md` for local implementation facts and proof. Do not implement ROOT, catalog, sales, or reports without the next explicit scope.

Dependency direction: presentation → application → domain; adapters implement application ports. Keep React, HTTP, storage, localization and query libraries out of domain/application. Do not put credentials in Web Storage, query data, logs, traces or fixtures exported from a live session. The only saved browser preference is `miawpos.locale`.

Use exact dependencies and `pnpm-lock.yaml`. Run `pnpm check`; session changes additionally need `pnpm proof:browser`. Read the proof document's compiler compatibility exception before changing toolchain versions. No generated component refresh as part of CI. Copy only components actually needed, preserve attribution, and use 44px controls.

Production human login uses Google OIDC. Manual email/password remains backend debug/test compatibility only when AUTH_DEBUG_ENABLED; never render a manual form or password lifecycle in production UI. Keep changes uncommitted until local owner visually accepts the Google login screen.
