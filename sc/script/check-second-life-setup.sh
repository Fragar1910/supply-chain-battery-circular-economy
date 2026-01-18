#!/bin/bash

# Check Second Life Manager Setup
# Run this to diagnose issues with StartSecondLifeForm

echo "=== SECOND LIFE MANAGER DIAGNOSTIC ==="
echo ""

# Contract addresses
SECOND_LIFE="0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
AFTERMARKET_USER="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "Contract Address: $SECOND_LIFE"
echo "Aftermarket User: $AFTERMARKET_USER"
echo "Admin: $ADMIN"
echo ""

# Check if Aftermarket User has the AFTERMARKET_USER_ROLE
echo "1. Checking AFTERMARKET_USER_ROLE for account $AFTERMARKET_USER..."
AFTERMARKET_ROLE=$(cast keccak "AFTERMARKET_USER_ROLE()")
echo "   Role Hash: $AFTERMARKET_ROLE"

HAS_ROLE=$(cast call $SECOND_LIFE "hasRole(bytes32,address)(bool)" $AFTERMARKET_ROLE $AFTERMARKET_USER)
echo "   Has Role: $HAS_ROLE"
echo ""

# Check if Admin has ADMIN_ROLE
echo "2. Checking ADMIN_ROLE for account $ADMIN..."
ADMIN_ROLE=$(cast keccak "ADMIN_ROLE()")
echo "   Role Hash: $ADMIN_ROLE"

HAS_ADMIN=$(cast call $SECOND_LIFE "hasRole(bytes32,address)(bool)" $ADMIN_ROLE $ADMIN)
echo "   Has Role: $HAS_ADMIN"
echo ""

# Check MIN and MAX SOH constants
echo "3. Checking SOH requirements..."
MIN_SOH=$(cast call $SECOND_LIFE "MIN_SECOND_LIFE_SOH()(uint16)")
MAX_SOH=$(cast call $SECOND_LIFE "MAX_FIRST_LIFE_SOH()(uint16)")
echo "   MIN_SECOND_LIFE_SOH: $MIN_SOH (should be 7000 = 70%)"
echo "   MAX_FIRST_LIFE_SOH: $MAX_SOH (should be 8000 = 80%)"
echo ""

# Check a test battery (NV-2024-006789 should have SOH 78%)
echo "4. Checking test battery NV-2024-006789..."
BIN=$(cast --from-utf8 "NV-2024-006789" | cast --to-bytes32)
echo "   BIN (bytes32): $BIN"

# Get battery data from BatteryRegistry
BATTERY_REGISTRY="0x5FbDB2315678afecb367f032d93F642f64180aa3"
BATTERY_DATA=$(cast call $BATTERY_REGISTRY "getBattery(bytes32)" $BIN)
echo "   Battery exists: $([ -n "$BATTERY_DATA" ] && echo "Yes" || echo "No")"

# Check if battery is already in second life
IS_IN_SECOND_LIFE=$(cast call $SECOND_LIFE "isInSecondLife(bytes32)(bool)" $BIN)
echo "   Is in second life: $IS_IN_SECOND_LIFE"
echo ""

echo "=== RECOMMENDATIONS ==="
echo ""

if [ "$HAS_ROLE" = "false" ]; then
  echo "❌ ISSUE: Aftermarket User doesn't have AFTERMARKET_USER_ROLE"
  echo "   FIX: Run the following command:"
  echo "   cast send $SECOND_LIFE \"grantAftermarketUserRole(address)\" $AFTERMARKET_USER --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  echo ""
fi

if [ "$IS_IN_SECOND_LIFE" = "true" ]; then
  echo "❌ ISSUE: Battery NV-2024-006789 is already in second life"
  echo "   FIX: Use a different battery or reset the blockchain"
  echo ""
fi

echo "=== TESTING INSTRUCTIONS ==="
echo ""
echo "To test StartSecondLifeForm:"
echo "1. Connect MetaMask with Account #3: $AFTERMARKET_USER"
echo "2. Use battery BIN: NV-2024-006789 (SOH: 78%)"
echo "3. Select any Application Type (1-7)"
echo "4. Submit the form"
echo ""
echo "Expected result: Transaction should succeed without nonce errors"
echo ""
