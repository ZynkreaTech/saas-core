#!/usr/bin/env bash
# Do This At First Time After Cloning Repo:
# chmod +x scripts/generate-barrels.sh
# ./scripts/generate-barrels.sh packages/ui/src/components/ui

# ****
# Usage: ./scripts/generate-barrels.sh packages/ui/src/components/ui
# Writes an index.ts one level ABOVE the target folder, re-exporting every
# .ts/.tsx file inside it (skipping any existing index.ts).
set -e

TARGET_DIR="$1"
if [ -z "$TARGET_DIR" ]; then
  echo "Usage: $0 <folder-to-scan>"
  exit 1
fi

OUT_FILE="$(dirname "$TARGET_DIR")/index.ts"
FOLDER_NAME="$(basename "$TARGET_DIR")"

{
  echo "// Auto-generated barrel — do not edit by hand, re-run generate-barrels.sh instead."
  for f in "$TARGET_DIR"/*.tsx "$TARGET_DIR"/*.ts; do
    [ -e "$f" ] || continue
    name="$(basename "$f")"
    name="${name%.*}"
    [ "$name" = "index" ] && continue
    echo "export * from \"./${FOLDER_NAME}/${name}\";"
  done
} > "$OUT_FILE"

echo "✅ Barrel written to $OUT_FILE"
