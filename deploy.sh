#!/usr/bin/env bash
# Build the downloadable assets, then ship CheckTOS to Vercel production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
mkdir -p downloads

# 1. Rebuild the skill zip from checktos-skill/ (unzips to a checktos/ folder).
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/checktos"
cp -R checktos-skill/. "$STAGE/checktos/"
rm -f downloads/checktos-skill.zip
( cd "$STAGE" && zip -q -r -X "$ROOT/downloads/checktos-skill.zip" checktos )
echo "built downloads/checktos-skill.zip"

# 2. Refresh each product's downloadable analysis + extracted terms from the run records.
for c in instinct lovable jev; do
  [ -f "TOS files/$c/analysis.md" ]   && cp "TOS files/$c/analysis.md"   "downloads/$c-analysis.md"
  [ -f "TOS files/$c/extraction.md" ] && cp "TOS files/$c/extraction.md" "downloads/$c-extraction.md"
done
echo "refreshed per-product download files"

# 2b. Bundle the shared template + skill prompt so the peek functions can read them.
cp checktos-skill/breakdown-template.html api/_breakdown-template.html
cp checktos-skill/PORTABLE.md api/_peek-prompt.md
echo "bundled template + prompt for peek functions"

# 3. Deploy to production.
vercel deploy --prod --yes
