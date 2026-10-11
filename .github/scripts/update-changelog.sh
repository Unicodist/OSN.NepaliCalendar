#!/usr/bin/env bash
# Adds a release's notes to the top of CHANGELOG.md, below the marker line.
#
# Usage: update-changelog.sh <title> <notes-file>
set -euo pipefail

title="$1"
notes="$2"
marker='<!-- New releases are added below this line'
date="$(date -u +%Y-%m-%d)"

# A release whose entry was written by hand in its version bump is already listed.
if grep -q "^## $title (" CHANGELOG.md; then
  echo "CHANGELOG.md already has $title."
  exit 0
fi

entry="$(mktemp)"
{
  echo
  echo "## $title ($date)"
  echo
  if grep -q "^## What's Changed" "$notes"; then
    # GitHub's generated notes: the release title replaces "## What's Changed", the sections
    # under it are already ### headings, and "## New Contributors" becomes one of them.
    grep -v "^## What's Changed" "$notes" | sed -e '/./,$!d' -e 's/^## /### /'
  else
    # Notes written by hand: every heading moves one level down to sit under the release title.
    sed -e '/./,$!d' -e 's/^#/##/' "$notes"
  fi
} > "$entry"

awk -v marker="$marker" -v entry="$entry" '
  { print }
  index($0, marker) == 1 { while ((getline line < entry) > 0) print line }
' CHANGELOG.md > CHANGELOG.md.new
mv CHANGELOG.md.new CHANGELOG.md
