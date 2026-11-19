#!/usr/bin/env bash
# Checks the built site in docs/ before it is deployed (run by .github/workflows/build.yaml).
# The checks are structural, so a new release doesn't need this file edited:
#   - the home page exists and the schedule and office hours actually rendered (the sheets loaded),
#   - every local page the home page links to was built,
#   - every released homework or lab page has its notebook button, and each notebook preview it embeds loads.
set -euo pipefail
cd "${1:-docs}"

fail() { echo "ERROR: $*"; exit 1; }

[ -s index.html ] || fail "required page index.html is missing or empty"
grep -q 'table class="table[^"]*schedule\|class="schedule' index.html || fail "home page has no schedule table"
grep -q 'lab_01.html' index.html || fail "home page schedule does not link Lab 01 (schedule sheet empty?)"
grep -q 'oh-calendar' index.html || fail "home page has no office hours calendar (semester info sheet empty?)"

# Every local .html page linked from the home page must exist.
missing=0
for link in $(grep -oE 'href="[A-Za-z0-9_./-]+\.html(#[^"]*)?"' index.html | sed -E 's/^href="//; s/(#.*)?"$//' | sort -u); do
  case "$link" in http*|//*) continue ;; esac
  if [ ! -s "${link#./}" ]; then
    echo "ERROR: home page links $link, which was not built"
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

# Released homework and lab pages (those embedding a preview) must have a notebook link, and the
# preview (light and dark) must load. Pages without a link yet show "not yet available" and are skipped.
shopt -s nullglob
for page in homework_[0-9][0-9].html lab_[0-9][0-9].html; do
  grep -q 'data-src-light=' "$page" || continue
  grep -qE 'href="https?://[^"]+">(OPEN A COPY IN GOOGLE COLAB|OPEN NOTEBOOK)' "$page" \
    || fail "$page embeds a preview but has no notebook link (Assignments sheet row empty?)"
  for preview in $(grep -oE 'data-src-(light|dark)="[^"]+"' "$page" | sed -E 's/^data-src-(light|dark)="//; s/"$//' | sort -u); do
    case "$preview" in
      http*) curl -fsSIL --retry 3 --retry-delay 5 -o /dev/null "$preview" || fail "$page preview $preview is not reachable" ;;
      *) [ -s "$preview" ] || fail "$page preview $preview was not built" ;;
    esac
  done
done

hw=(homework_[0-9][0-9].html); labs=(lab_[0-9][0-9].html); readings=(reading_[0-9][0-9].html)
echo "Build verification passed (${#hw[@]} homework, ${#labs[@]} lab, ${#readings[@]} reading pages)"
