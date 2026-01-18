#!/bin/bash

echo "=== Creating test battery for second life ==="
echo ""

# Contract addresses
BATTERY_REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
MANUFACTURER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MANUFACTURER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Battery details
BIN="NV-2024-TEST-SECONDLIFE"
CHEMISTRY=1  # NMC
CAPACITY=60  # 60 kWh
MANUFACTURER_NAME="Test Manufacturer"
MANUFACTURE_DATE=$(date +%s)

echo "1. Creating battery with BIN: $BIN..."
BIN_BYTES=$(cast --from-utf8 "$BIN" | cast --to-bytes32)
echo "   BIN (bytes32): $BIN_BYTES"

# Register battery
cast send $BATTERY_REGISTRY \
  "registerBattery(bytes32,uint8,uint32,string,uint64)" \
  $BIN_BYTES \
  $CHEMISTRY \
  $CAPACITY \
  "$MANUFACTURER_NAME" \
  $MANUFACTURE_DATE \
  --private-key $MANUFACTURER_KEY \
  --rpc-url http://localhost:8545

echo ""
echo "2. Setting SOH to 75% (7500 basis points)..."

# Update SOH to 75%
cast send $BATTERY_REGISTRY \
  "updateSOH(bytes32,uint16)" \
  $BIN_BYTES \
  7500 \
  --private-key $MANUFACTURER_KEY \
  --rpc-url http://localhost:8545

echo ""
echo "3. Verifying battery..."

# Check if battery exists
EXISTS=$(cast call $BATTERY_REGISTRY "binExists(bytes32)(bool)" $BIN_BYTES --rpc-url http://localhost:8545)
echo "   Exists: $EXISTS"

if [ "$EXISTS" = "true" ]; then
  echo ""
  echo "✅ SUCCESS: Battery created and ready for second life!"
  echo ""
  echo "Battery Details:"
  echo "  BIN: $BIN"
  echo "  Chemistry: NMC"
  echo "  Capacity: 60 kWh"
  echo "  SOH: 75% (perfect for second life)"
  echo ""
  echo "To use in StartSecondLifeForm:"
  echo "1. Connect with Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  echo "2. Enter BIN: $BIN"
  echo "3. Select Application Type (1-7)"
  echo "4. Submit!"
  echo ""
else
  echo "❌ FAILED: Battery not created"
fi
