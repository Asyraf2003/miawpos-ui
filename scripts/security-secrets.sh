#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
gitleaks_bin="${GITLEAKS_BIN:-gitleaks}"
[[ "$("$gitleaks_bin" version)" == '8.30.1' ]] || { echo 'Gitleaks 8.30.1 required'; exit 1; }
scan_dir="$(mktemp -d /tmp/miawpos-ui-source-scan.XXXXXX)"
trap 'rm -rf -- "$scan_dir"' EXIT
# Snapshot every tracked and untracked non-ignored source file, including dotfiles.
# Dependencies, local credentials, and generated artifacts are not source history.
while IFS= read -r -d '' file; do
  if [[ -f "$file" ]]; then mkdir -p "$scan_dir/$(dirname "$file")"; cp "$file" "$scan_dir/$file"; fi
done < <(git ls-files --cached --others --exclude-standard -z)
"$gitleaks_bin" dir --no-banner --no-color --redact "$scan_dir"
"$gitleaks_bin" dir --no-banner --no-color --redact dist
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  [[ "$(git rev-parse --is-shallow-repository)" == 'false' ]] || { echo 'Full source history is required'; exit 1; }
  "$gitleaks_bin" git --no-banner --no-color --redact .
else
  echo 'GAP: initial repository has no commit history to scan yet.'
fi
