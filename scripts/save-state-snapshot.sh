#!/usr/bin/env bash
# PreCompact hook — save state.json snapshot before context compression
# Copies .maestro/state.json to a timestamped snapshot.
# Retains only the 3 most recent snapshots.
# Always exits 0 (never blocks compact).

set -euo pipefail

STATE_FILE=".maestro/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
SNAPSHOT_FILE=".maestro/state.snapshot-${TIMESTAMP}.json"

cp "$STATE_FILE" "$SNAPSHOT_FILE" 2>/dev/null || exit 0

# Keep only the 3 most recent snapshots
SNAPSHOTS=$(ls -1t .maestro/state.snapshot-*.json 2>/dev/null) || exit 0
COUNT=0
while IFS= read -r snapshot; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -gt 3 ]; then
    rm -f "$snapshot" 2>/dev/null || true
  fi
done <<< "$SNAPSHOTS"

exit 0
