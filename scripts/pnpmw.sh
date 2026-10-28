#!/bin/sh

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1

if command -v mise >/dev/null 2>&1; then
    mise exec -- node "$SCRIPT_DIR/check-node-runtime.mts" || exit $?
    exec mise exec -- pnpm "$@"
fi

node "$SCRIPT_DIR/check-node-runtime.mts" || exit $?

if command -v pnpm >/dev/null 2>&1; then
    exec pnpm "$@"
fi

if command -v corepack >/dev/null 2>&1; then
    exec corepack pnpm "$@"
fi

echo "[ERROR] pnpm command not found. Install pnpm or expose it in PATH." >&2
exit 127
