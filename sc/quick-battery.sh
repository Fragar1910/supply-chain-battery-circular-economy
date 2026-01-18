#!/bin/bash
BATTERY_REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
ADMIN_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BIN="NV-2024-TEST-SL"
BIN_BYTES=$(cast --from-utf8 "$BIN" | cast --to-bytes32)
echo "Creating battery: $BIN"
cast send $BATTERY_REGISTRY "registerBattery(bytes32,uint8,uint32,string,uint64)" $BIN_BYTES 1 60 "Test" 1735343000 --private-key $ADMIN_KEY --rpc-url http://localhost:8545
echo "Setting SOH to 75%"
cast send $BATTERY_REGISTRY "updateSOH(bytes32,uint16)" $BIN_BYTES 7500 --private-key $ADMIN_KEY --rpc-url http://localhost:8545
echo "✅ Battery $BIN created with SOH 75%"
