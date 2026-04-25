#!/usr/bin/env bash
# ============================================================
# Backfill tribe slugs — runs against the production sqld
# ============================================================
# Usage: ./scripts/backfill-slugs.sh
#
# This script:
#   1. Connects to sqld on the production server
#   2. Finds all tribes with NULL slug
#   3. Generates a URL-safe slug from the name
#   4. Updates each row
#
# Safe to run multiple times (idempotent).
# ============================================================

set -euo pipefail

# ── Configuration (same as deploy.sh) ─────────────────────────
REMOTE_HOST="root@5.78.189.222"
SQLD_CONTAINER="tribes-sqld-1"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'
log()  { echo -e "${CYAN}[backfill]${NC} $1"; }
ok()   { echo -e "${GREEN}[  ✓  ]${NC} $1"; }
warn() { echo -e "${YELLOW}[ warn]${NC} $1"; }

# ── Resolve sqld endpoint ────────────────────────────────────
log "Resolving sqld endpoint..."
SQLD_IP=$(ssh -o StrictHostKeyChecking=no "$REMOTE_HOST" \
  "docker inspect $SQLD_CONTAINER --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
SQLD_URL="http://${SQLD_IP}:8080"
log "  sqld endpoint: $SQLD_URL"

# ── Helper: run SQL against sqld ─────────────────────────────
run_sql() {
  local sql="$1"
  local escaped_sql
  escaped_sql=$(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))')
  ssh -o StrictHostKeyChecking=no "$REMOTE_HOST" \
    "curl -sf -X POST '${SQLD_URL}/v2/pipeline' \
      -H 'Content-Type: application/json' \
      -d '{\"requests\":[{\"type\":\"execute\",\"stmt\":{\"sql\":${escaped_sql}}}]}'" 2>/dev/null
}

# ── Step 1: Find tribes without slugs ────────────────────────
log "Finding tribes without slugs..."
RESULT=$(run_sql "SELECT id, name FROM tribes WHERE slug IS NULL")

# Parse the JSON result to extract rows
# Each row is: [[id_value, name_value], ...]
ROWS=$(echo "$RESULT" | python3 -c '
import sys, json, re

data = json.load(sys.stdin)
results = data.get("results", [])
if not results:
    sys.exit(0)

resp = results[0].get("response", {}).get("result", {})
rows = resp.get("rows", [])

for row in rows:
    tribe_id = row[0].get("value", "") if isinstance(row[0], dict) else str(row[0])
    name = row[1].get("value", "") if isinstance(row[1], dict) else str(row[1])
    # Generate slug from name
    slug = name.lower()
    # Strip diacritics (basic ASCII fold)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    slug = slug[:60]
    print(f"{tribe_id}\t{slug}")
' 2>/dev/null)

if [ -z "$ROWS" ]; then
  ok "All tribes already have slugs. Nothing to do."
  exit 0
fi

ROW_COUNT=$(echo "$ROWS" | wc -l | tr -d ' ')
log "Found $ROW_COUNT tribe(s) needing slugs."

# ── Step 2: Get existing slugs (for collision detection) ─────
EXISTING_SLUGS=$(run_sql "SELECT slug FROM tribes WHERE slug IS NOT NULL" | python3 -c '
import sys, json
data = json.load(sys.stdin)
results = data.get("results", [])
if not results: sys.exit(0)
rows = results[0].get("response", {}).get("result", {}).get("rows", [])
for row in rows:
    val = row[0].get("value", "") if isinstance(row[0], dict) else str(row[0])
    if val:
        print(val)
' 2>/dev/null || true)

# Build a list of used slugs (newline-separated for grep)
SLUG_FILE=$(mktemp)
echo "$EXISTING_SLUGS" > "$SLUG_FILE"
trap 'rm -f "$SLUG_FILE"' EXIT

is_slug_used() {
  grep -qxF "$1" "$SLUG_FILE" 2>/dev/null
}

add_slug() {
  echo "$1" >> "$SLUG_FILE"
}

# ── Step 3: Update each tribe ────────────────────────────────
UPDATED=0
while IFS=$'\t' read -r tribe_id base_slug; do
  # Collision detection
  candidate="$base_slug"
  suffix=2
  while is_slug_used "$candidate"; do
    candidate="${base_slug}-${suffix}"
    suffix=$((suffix + 1))
  done

  # Apply the slug
  escaped_slug=$(echo "$candidate" | sed "s/'/''/g")
  escaped_id=$(echo "$tribe_id" | sed "s/'/''/g")
  run_sql "UPDATE tribes SET slug = '${escaped_slug}' WHERE id = '${escaped_id}'" > /dev/null

  add_slug "$candidate"
  UPDATED=$((UPDATED + 1))
  ok "  ${tribe_id} → /t/${candidate}"
done <<< "$ROWS"

echo ""
ok "Backfilled ${UPDATED} tribe slug(s)."
