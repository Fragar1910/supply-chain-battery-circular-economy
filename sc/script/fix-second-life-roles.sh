#!/bin/bash

echo "=== FIXING SECOND LIFE SETUP ==="
echo ""

# Contract addresses
SECOND_LIFE="0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
AFTERMARKET_USER="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ADMIN_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "1. Granting AFTERMARKET_USER_ROLE to $AFTERMARKET_USER..."
cast send $SECOND_LIFE \
  "grantAftermarketUserRole(address)" \
  $AFTERMARKET_USER \
  --private-key $ADMIN_KEY \
  --rpc-url http://localhost:8545

echo ""
echo "2. Verifying role grant..."
AFTERMARKET_ROLE=$(cast keccak "AFTERMARKET_USER_ROLE()")
HAS_ROLE=$(cast call $SECOND_LIFE "hasRole(bytes32,address)(bool)" $AFTERMARKET_ROLE $AFTERMARKET_USER --rpc-url http://localhost:8545)

if [ "$HAS_ROLE" = "true" ]; then
  echo "✅ SUCCESS: Aftermarket User now has AFTERMARKET_USER_ROLE"
else
  echo "❌ FAILED: Role was not granted correctly"
  exit 1
fi

echo ""
echo "=== ROLE FIX COMPLETE ==="
echo ""
echo "Now you can use the StartSecondLifeForm with Account #3"
echo "Make sure to:"
echo "1. Have a battery with SOH between 70-80%"
echo "2. The battery must NOT already be in second life"
echo "3. Connect MetaMask with Account #3: $AFTERMARKET_USER"
echo ""
