#!/bin/bash

# Default: Run all tests
TEST_FILE=""

# Parse --program-name argument
while [[ "$#" -gt 0 ]]; do
  case "$1" in
  --program-name)
    if [[ "$2" == "effect_migration" ]]; then
      TEST_FILE="tests/suites/migration.spec.ts"
    elif [[ "$2" == "effect_staking" ]]; then
      TEST_FILE="tests/suites/staking.spec.ts"
    elif [[ "$2" == "effect_payment" ]]; then
      echo "Running payment tests"
      TEST_FILE="tests/suites/payment.spec.ts"
    fi
    shift 2
    ;;
  *)
    shift
    ;;
  esac
done

# Run Vitest with the selected test file (or all tests if none specified)
if [[ -n "$TEST_FILE" ]]; then
  echo "Running tests for: $TEST_FILE"
  pnpm vitest run "$TEST_FILE"
else
  echo "Running all tests"
  pnpm vitest run
fi
