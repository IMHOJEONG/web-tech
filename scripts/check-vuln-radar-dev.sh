#!/usr/bin/env bash

set -euo pipefail

FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:3000}"
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://localhost:4000}"

check_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  local body_file
  body_file="$(mktemp)"

  local status
  if ! status="$(curl -sS -o "$body_file" -w "%{http_code}" --max-time 10 "$url")"; then
    echo "[FAIL] $name"
    echo "url: $url"
    echo "reason: connection failed"
    rm -f "$body_file"
    return 1
  fi

  if [[ "$status" != "$expected_status" ]]; then
    echo "[FAIL] $name"
    echo "url: $url"
    echo "expected: $expected_status"
    echo "actual: $status"
    echo "body:"
    cat "$body_file"
    echo
    rm -f "$body_file"
    return 1
  fi

  echo "[PASS] $name"
  echo "url: $url"
  echo "status: $status"
  echo "body:"
  cat "$body_file"
  echo
  rm -f "$body_file"
}

echo "Checking vuln-radar local runtime"
echo "frontend: $FRONTEND_ORIGIN"
echo "backend: $BACKEND_ORIGIN"
echo

check_endpoint "backend health" "$BACKEND_ORIGIN/api/health" "200"
check_endpoint "frontend backend proxy" "$FRONTEND_ORIGIN/api/backend/health" "200"
check_endpoint "frontend root" "$FRONTEND_ORIGIN" "200"

echo "All checks passed."
