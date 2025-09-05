#!/usr/bin/env bash
# sync-local-idls.sh
# Ensures all local IDLs exist by copying from mainnet (or another source env).
# Supports two layouts:
#  1) Subdir layout: idls/<env>/*.json
#  2) Flat layout:  idls/*.json  => creates idls/*_<to_env>.json
#
# Usage:
#   ./sync-local-idls.sh              # defaults: --dir idls --from mainnet --to localnet
#   ./sync-local-idls.sh --dir path/to/idls --from devnet --to localnet

set -euo pipefail

IDLS_DIR="idls"
FROM_ENV="mainnet"
TO_ENV="localnet"

# --- arg parsing (very lightweight) ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)    IDLS_DIR="${2:-idls}"; shift 2 ;;
    --from)   FROM_ENV="${2:-mainnet}"; shift 2 ;;
    --to)     TO_ENV="${2:-localnet}"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--dir idls] [--from mainnet] [--to localnet]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ "$FROM_ENV" == "$TO_ENV" ]]; then
  echo "FROM and TO environments are the same ($FROM_ENV). Nothing to do."
  exit 0
fi

copied=0
skipped=0

SUBDIR_FROM="$IDLS_DIR/$FROM_ENV"
SUBDIR_TO="$IDLS_DIR/$TO_ENV"

if [[ -d "$SUBDIR_FROM" ]]; then
  # --- Subdir layout ---
  mkdir -p "$SUBDIR_TO"
  shopt -s nullglob
  files=( "$SUBDIR_FROM"/*.json )
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No IDLs found in $SUBDIR_FROM" >&2
    exit 1
  fi
  for src in "${files[@]}"; do
    base="$(basename "$src")"
    dst="$SUBDIR_TO/$base"
    if [[ -f "$dst" ]]; then
      echo "✓ exists: $dst"
      ((skipped++)) || true
    else
      cp -n "$src" "$dst"
      echo "→ copied: $src -> $dst"
      ((copied++)) || true
    fi
  done
  shopt -u nullglob
else
  # --- Flat layout with suffix ---
  shopt -s nullglob
  files=( "$IDLS_DIR"/*.json )
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No IDLs found in $IDLS_DIR" >&2
    exit 1
  fi

  for src in "${files[@]}"; do
    base="$(basename "$src")"
    # Skip already-suffixed files
    case "$base" in
      *_localnet.json|*_devnet.json|*_mainnet.json)
        echo "• skip suffixed: $src"
        ((skipped++)) || true
        continue
        ;;
    esac

    name="${base%.json}"
    dst="$IDLS_DIR/${name}_${TO_ENV}.json"
    if [[ -f "$dst" ]]; then
      echo "✓ exists: $dst"
      ((skipped++)) || true
    else
      cp -n "$src" "$dst"
      echo "→ copied: $src -> $dst"
      ((copied++)) || true
    fi
  done
  shopt -u nullglob
fi

echo
echo "Done. Copied: $copied, skipped: $skipped."
