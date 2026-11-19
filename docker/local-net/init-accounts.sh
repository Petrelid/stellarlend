#!/usr/bin/env bash
set -euo pipefail

wait_for_friendbot() {
  until curl -sf "http://soroban:8000/health" >/dev/null 2>&1; do
    sleep 2
  done
}

add_account() {
  local name="$1" secret="$2"
  stellar keys add "${name}" --secret-key "${secret}" 2>/dev/null || true
  local address
  address="$(stellar keys address "${name}")"
  curl -sf "${FRIENDBOT_URL}?addr=${address}" >/dev/null
  printf '%s=%s\n' "${name}" "${address}"
}

wait_for_friendbot
add_account admin "${SOROBAN_ADMIN_SECRET_KEY}"
add_account alice "${SOROBAN_ALICE_SECRET_KEY}"
add_account bob "${SOROBAN_BOB_SECRET_KEY}"
