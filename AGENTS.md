# MiawPOS UI

Start with `../meawpos-api/AGENTS.md` and its canonical documentation chain. That sibling's private docs submodule is the project architecture/progress authority. This repository is the separate public React presentation client; the API remains authoritative.

`AGENTS.md` is only a bootstrap map. Do not copy mutable phase position into this file and then trust it indefinitely. Before source edits, resolve the current `ACTIVE_PHASE`, `EXACT_NEXT`, `AUTHORIZATION_STATE`, `ACTIVE_HANDOFF`, and `MODEL_AND_REASONING_GUIDANCE` from the backend canonical chain, especially `docs/transition/0003_phase_execution_ledger.md` and the active handoff it names. If local prose here conflicts with newer canonical state, the canonical chain wins.

`docs` is intentionally a symlink into the private canonical documentation surface; never vendor/copy private docs content into this public repository. Read the active R6 blueprint, current ledger, active execution handoff, and directly relevant evidence before changing implementation. Dated handoff status text is historical when newer ledger state exists.

Dependency direction: presentation -> application -> domain; adapters implement application ports. Keep React, HTTP, storage, localization and query libraries out of domain/application. Prefer additive, localized capability units and change shared files only when they are legitimate wiring/composition/router/shared-contract boundaries. Do not introduce generic abstraction layers without demonstrated need.

Do not put credentials or authoritative ROOT access state in Web Storage, query data, logs, traces, or fixtures exported from a live session. The only currently accepted saved browser preference is `miawpos.locale`. A selected ROOT is client context only; server-owned ROOT membership/role/permission remains authoritative on ROOT-scoped requests.

Use exact dependencies and `pnpm-lock.yaml`. Run `pnpm check`; browser-chain changes additionally need the strongest relevant existing browser proof. Read canonical evidence before changing toolchain versions. No generated component refresh as part of CI. Copy only components actually needed, preserve attribution, and use the accepted accessibility/touch baseline.

Production human login uses Google OIDC. Manual email/password remains backend debug/test compatibility only when `AUTH_DEBUG_ENABLED`; never render a manual form or password lifecycle in production UI. Google remains authoritative for account selection in the provider flow. Do not infer full R6 closure from a bounded checkpoint.

Execution style: inspect the minimum necessary evidence, implement the largest safe bounded slice, prove it, and continue deterministic links in the same accepted chain. Do not stop merely to report routine audit findings. Stop when continuing requires a genuinely new product/security decision, unsupported assumption, destructive migration, contract break, or scope widening.
