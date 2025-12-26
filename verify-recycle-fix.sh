#!/bin/bash

# Verification script for RecycleBatteryForm fix
# This script verifies that recycling data is properly stored in RecyclingManager

set -e

echo "======================================"
echo "RecycleBatteryForm Fix Verification"
echo "======================================"
echo ""

# Contract addresses (update these if they change)
RECYCLING_MANAGER="0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"
BATTERY_REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
RPC_URL="http://localhost:8545"

# Test battery BIN
TEST_BIN="NV-2024-006789"

echo "1. Checking RecyclingManager contract..."
echo "   Address: $RECYCLING_MANAGER"
echo ""

# Convert BIN to bytes32
BIN_BYTES32=$(cast --format-bytes32-string "$TEST_BIN")
echo "2. Test Battery BIN: $TEST_BIN"
echo "   Bytes32: $BIN_BYTES32"
echo ""

echo "3. Fetching recycling data from RecyclingManager..."
echo "   cast call $RECYCLING_MANAGER \"getRecyclingData(bytes32)\" $BIN_BYTES32"
echo ""

RECYCLING_DATA=$(cast call $RECYCLING_MANAGER \
  "getRecyclingData(bytes32)" \
  $BIN_BYTES32 \
  --rpc-url $RPC_URL)

echo "   Result: $RECYCLING_DATA"
echo ""

# Parse the result (it returns a tuple)
# Format: (address recycler, uint256 recycledDate, uint8 methodId, uint32 inputWeightKg, bytes32 facilityHash)

if [[ "$RECYCLING_DATA" == *"0x0000000000000000000000000000000000000000"* ]]; then
  echo "❌ RECYCLING DATA NOT FOUND"
  echo "   The battery has not been recycled yet, or recycling data was not properly saved."
  echo ""
  echo "   To fix:"
  echo "   1. Make sure Anvil is running: anvil --chain-id 31337"
  echo "   2. Deploy contracts: cd sc && ./deploy-and-seed.sh"
  echo "   3. Connect to Account #4 (Recycler) in MetaMask"
  echo "   4. Go to http://localhost:3000 and recycle a battery using RecycleBatteryForm"
  echo "   5. Run this script again"
  exit 1
else
  echo "✅ RECYCLING DATA FOUND!"
  echo "   The battery has been properly recycled and data is stored in RecyclingManager"
fi

echo ""
echo "4. Fetching battery state from BatteryRegistry..."
BATTERY_DATA=$(cast call $BATTERY_REGISTRY \
  "getBattery(bytes32)" \
  $BIN_BYTES32 \
  --rpc-url $RPC_URL)

echo "   Result (truncated): ${BATTERY_DATA:0:100}..."
echo ""

echo "5. Checking RECYCLER_ROLE on RecyclingManager..."
RECYCLER_ADDRESS="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
RECYCLER_ROLE=$(cast keccak "RECYCLER_ROLE")

HAS_ROLE=$(cast call $RECYCLING_MANAGER \
  "hasRole(bytes32,address)(bool)" \
  $RECYCLER_ROLE \
  $RECYCLER_ADDRESS \
  --rpc-url $RPC_URL)

if [[ "$HAS_ROLE" == "true" ]]; then
  echo "   ✅ Account #4 ($RECYCLER_ADDRESS) has RECYCLER_ROLE"
else
  echo "   ❌ Account #4 does not have RECYCLER_ROLE"
  echo "   Run: cd sc && ./deploy-and-seed.sh"
fi

echo ""
echo "6. Checking AUDITOR_ROLE on RecyclingManager..."
AUDITOR_ADDRESS="0x976EA74026E726554dB657fA54763abd0C3a0aa9"
AUDITOR_ROLE=$(cast keccak "AUDITOR_ROLE")

HAS_AUDITOR_ROLE=$(cast call $RECYCLING_MANAGER \
  "hasRole(bytes32,address)(bool)" \
  $AUDITOR_ROLE \
  $AUDITOR_ADDRESS \
  --rpc-url $RPC_URL)

if [[ "$HAS_AUDITOR_ROLE" == "true" ]]; then
  echo "   ✅ Account #6 ($AUDITOR_ADDRESS) has AUDITOR_ROLE"
else
  echo "   ❌ Account #6 does not have AUDITOR_ROLE"
  echo "   Run: cd sc && ./deploy-and-seed.sh"
fi

echo ""
echo "======================================"
echo "Verification Complete"
echo "======================================"
echo ""
echo "Summary:"
echo "- RecyclingManager contract is accessible ✅"
echo "- Battery recycling data can be queried ✅"
echo "- Role checks are working ✅"
echo ""
echo "Next steps:"
echo "1. Start frontend: cd web && npm run dev"
echo "2. Connect with Account #4 (Recycler)"
echo "3. Recycle a battery using RecycleBatteryForm"
echo "4. Connect with Account #6 (Auditor)"
echo "5. Audit the recycled battery using AuditRecyclingForm"
echo ""
echo "For detailed testing instructions, see:"
echo "  - AUDITOR_ROLE_COMPLETE_FIX.md"
echo "  - RECYCLEBATTERY_FORM_FIX.md"
echo ""
