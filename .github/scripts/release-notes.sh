#!/usr/bin/env bash
# Writes GitHub's generated release notes for a tag to release-notes.md. The notes cover the pull
# requests merged since the previous tag of the same kind (nuget-v* or npm-v*), so the NuGet and
# npm releases each get their own history. If .github/release-notes/<tag>.md exists, it is used
# as written instead.
#
# Usage: release-notes.sh <tag>   (needs GH_TOKEN and GITHUB_REPOSITORY)
set -euo pipefail

tag="$1"
prefix="${tag%%v*}v" # nuget-v or npm-v

written=".github/release-notes/$tag.md"
if [[ -f "$written" ]]; then
  echo "Using the release notes written in $written."
  cp "$written" release-notes.md
  cat release-notes.md
  exit 0
fi

previous="$(git tag --list "${prefix}*" --sort=-v:refname | grep -vx "$tag" | head -n 1 || true)"

args=(-f "tag_name=$tag")
if [[ -n "$previous" ]]; then
  args+=(-f "previous_tag_name=$previous")
  echo "Generating notes for $tag since $previous."
else
  echo "Generating notes for $tag (first ${prefix}* tag, so it covers the whole history)."
fi

# Drop GitHub's "generated using configuration" comment, which would show as text on nuget.org.
gh api "repos/$GITHUB_REPOSITORY/releases/generate-notes" "${args[@]}" --jq .body \
  | grep -v '^<!-- Release notes generated' | sed -e '/./,$!d' > release-notes.md
cat release-notes.md
