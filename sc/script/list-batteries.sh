#!/bin/bash

BATTERY_REGISTRY="0x5FbDB2315678afecb367f032d93F642f64180aa3"
SECOND_LIFE="0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"

echo "=== Checking existing batteries ==="
echo ""

for bin in "NV-2024-001234" "NV-2024-002345" "NV-2024-003456" "NV-2024-006789" "NV-2024-007890" "NV-2024-008901"; do
  echo "Battery: $bin"
  BIN_BYTES=$(cast --from-utf8 "$bin" | cast --to-bytes32)

  EXISTS=$(cast call $BATTERY_REGISTRY "binExists(bytes32)(bool)" $BIN_BYTES --rpc-url http://localhost:8545 2>&1)

  if echo "$EXISTS" | grep -q "true"; then
    echo "  ✅ Exists in registry"

    # Get battery data
    BATTERY_DATA=$(cast call $BATTERY_REGISTRY "getBattery(bytes32)" $BIN_BYTES --rpc-url http://localhost:8545)

    # Extract SOH (it's one of the fields in the tuple)
    echo "  SOH data: $BATTERY_DATA"

    # Check if in second life
    IN_SECOND_LIFE=$(cast call $SECOND_LIFE "isInSecondLife(bytes32)(bool)" $BIN_BYTES --rpc-url http://localhost:8545 2>&1)
    if echo "$IN_SECOND_LIFE" | grep -q "true"; then
      echo "  ⚠️  Already in second life"
    else
      echo "  ✅ Available for second life"
    fi
  else
    echo "  ❌ Does not exist"
  fi
  echo ""
done
