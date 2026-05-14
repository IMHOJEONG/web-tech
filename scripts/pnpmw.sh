#!/bin/sh

if command -v pnpm >/dev/null 2>&1; then
    exec pnpm "$@"
fi

PNPM_MISE_BIN_DIR="$HOME/.local/share/mise/installs/node/24.12.0/bin"

if [ -x "$PNPM_MISE_BIN_DIR/pnpm" ]; then
    export PATH="$PNPM_MISE_BIN_DIR:$PATH"
    exec "$PNPM_MISE_BIN_DIR/pnpm" "$@"
fi

if command -v corepack >/dev/null 2>&1; then
    exec corepack pnpm "$@"
fi

echo "[ERROR] pnpm command not found. Install pnpm or expose it in PATH." >&2
exit 127
