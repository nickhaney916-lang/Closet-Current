#!/usr/bin/env bash
set -euo pipefail

# Supply the reviewed immutable candidate SHA independently of this checkout.
expected_head=${1:?expected candidate head required}
reviewed_parent=a16f55d2230afab907957ddffa8c5af968b39f20
reviewed_tree=6da92efa33c652f1bb6d044ae7274519d89c0b46
[[ "$expected_head" =~ ^[a-f0-9]{40}$ ]]
test "$(git rev-parse HEAD)" = "$expected_head"
git merge-base --is-ancestor "$reviewed_parent" HEAD
git log --format=%T "$reviewed_parent..HEAD" --first-parent | grep -Fx "$reviewed_tree" >/dev/null
git diff --exit-code HEAD --
git diff --exit-code "$reviewed_tree" HEAD -- . \
  ':(exclude).github/workflows/1452-wardrobe-integration-no-deploy.yml' \
  ':(exclude)scripts/check-1452-integration-source.sh' \
  ':(exclude)scripts/check-1452-journey-receipts.mjs' \
  ':(exclude)tests/auth-review-session-36.test.mjs' \
  ':(exclude)tests/automatic-indexing.test.cjs' \
  ':(exclude)tests/mission3-private-wardrobe-hydration-save-epoch.test.cjs'
