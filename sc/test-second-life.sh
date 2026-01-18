#!/bin/bash

# Test script para startSecondLife
# Este script prueba la función directamente con cast para verificar si el problema es el nonce

set -e

echo "=== Testing Start Second Life ==="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Direcciones de contratos (actualiza con las de deployments/local.json)
# Using addresses from actual deployed contracts (verified with cast code)
SECOND_LIFE_MANAGER="0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
BATTERY_REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# Cuentas
AFTERMARKET_USER="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
AFTERMARKET_KEY="0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"

# Batería de prueba
BIN="NV-2024-006789"
APPLICATION_TYPE=1  # Residential Storage
INSTALLATION_HASH="0x0000000000000000000000000000000000000000000000000000000000000000"

echo -e "${YELLOW}1. Verificando batería...${NC}"
echo "BIN: $BIN"

# Convertir BIN a bytes32
BIN_HEX=$(cast --from-utf8 "$BIN")
BIN_BYTES32=$(cast --to-bytes32 "$BIN_HEX")
echo "BIN (bytes32): $BIN_BYTES32"

echo ""
echo -e "${YELLOW}2. Obteniendo SOH de batería...${NC}"
SOH=$(cast call $BATTERY_REGISTRY "batteries(bytes32)" $BIN_BYTES32 --rpc-url http://localhost:8545 | head -c 66)
echo "SOH raw: $SOH"

echo ""
echo -e "${YELLOW}3. Verificando nonce de la cuenta...${NC}"
NONCE=$(cast nonce $AFTERMARKET_USER --rpc-url http://localhost:8545)
echo "Nonce actual de $AFTERMARKET_USER: $NONCE"

echo ""
echo -e "${YELLOW}4. Intentando iniciar second life...${NC}"
echo "Cuenta: $AFTERMARKET_USER"
echo "Contrato: $SECOND_LIFE_MANAGER"
echo "Función: startSecondLife(bytes32,uint8,bytes32)"
echo "Args: $BIN_BYTES32, $APPLICATION_TYPE, $INSTALLATION_HASH"

# Intentar la transacción
echo ""
echo -e "${YELLOW}Ejecutando transacción...${NC}"

TX_HASH=$(cast send $SECOND_LIFE_MANAGER \
  "startSecondLife(bytes32,uint8,bytes32)" \
  $BIN_BYTES32 \
  $APPLICATION_TYPE \
  $INSTALLATION_HASH \
  --private-key $AFTERMARKET_KEY \
  --rpc-url http://localhost:8545 \
  --legacy \
  2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Transacción exitosa!${NC}"
  echo "TX Hash: $TX_HASH"
else
  echo -e "${RED}✗ Error en transacción:${NC}"
  echo "$TX_HASH"
  exit 1
fi

echo ""
echo -e "${YELLOW}5. Verificando nuevo nonce...${NC}"
NEW_NONCE=$(cast nonce $AFTERMARKET_USER --rpc-url http://localhost:8545)
echo "Nuevo nonce: $NEW_NONCE"
echo "Incremento: $((NEW_NONCE - NONCE))"

echo ""
echo -e "${GREEN}=== Test completado ===${NC}"
