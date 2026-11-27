#!/usr/bin/env bash
set -euo pipefail

base=bba97ce9b6535ed3fd5882501464806560585cdb
base_tree=95a36849ed10cde535096c7a300999d7dbe32f4c
head=$(git rev-parse HEAD)
test "$head" = "${1:?Pass the exact tested head SHA}"
test "$(git rev-parse "$base^{tree}")" = "$base_tree"
git merge-base --is-ancestor "$base" "$head"
test "$(git rev-list --parents -n 1 "$head")" = "$head $base"

expected=$(cat <<'PATHS'
.github/workflows/assignment-36-owner-recovery-HOLD.yml
scripts/assignment-36/README.md
scripts/assignment-36/audit-auth36.mjs
scripts/assignment-36/browser.mjs
scripts/assignment-36/check-scope.sh
scripts/assignment-36/historical.mjs
PATHS
)
actual=$(git diff --no-renames --name-status "$base" "$head")
test "$actual" = "$(printf '%s\n' "$expected" | sed $'s/^/A\t/')"
printf '%s\n' "Verified cumulative base $base and exact isolated head $head"
