#!/usr/bin/env bash
# Adds a release's notes to the top of CHANGELOG.md, below the marker line.
#
# Usage: update-changelog.sh <title> <notes-file>
set -euo pipefail

title="$1"
notes="$2"
marker='<!-- New releases are added below this line'
date="$(date -u +%Y-%m-%d)"

entry="$(mktemp)"
{
  echo
  echo "## $title ($date)"
  echo
  # GitHub's notes open with a "## What's Changed" heading; the release title replaces it, and the
  # other headings move one level down so they sit under the release title.
  grep -v "^## What's Changed" "$notes" | sed -e '/./,$!d' -e 's/^#/##/'
} > "$entry"

awk -v marker="$marker" -v entry="$entry" '
  { print }
  index($0, marker) == 1 { while ((getline line < entry) > 0) print line }
' CHANGELOG.md > CHANGELOG.md.new
mv CHANGELOG.md.new CHANGELOG.md
