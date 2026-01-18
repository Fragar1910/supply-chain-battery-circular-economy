#!/bin/bash

# Script para verificar el estado de una batería
# Uso: ./check-battery-status.sh NV-2024-001234

set -e

BIN=$1
REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
RPC_URL="http://localhost:8545"

if [ -z "$BIN" ]; then
    echo "Error: Debes proporcionar un BIN"
    echo "Uso: ./check-battery-status.sh NV-2024-001234"
    exit 1
fi

# Convertir BIN a bytes32
BIN_HEX=$(echo -n "$BIN" | xxd -p | tr -d '\n')
BIN_PADDED=$(printf "0x%-64s" "$BIN_HEX" | tr ' ' '0')

echo "========================================"
echo "  ESTADO DE LA BATERÍA: $BIN"
echo "========================================"
echo ""
echo "BIN (bytes32): $BIN_PADDED"
echo ""

# Verificar si existe
echo "🔍 Verificando existencia..."
EXISTS=$(cast call $REGISTRY "binExists(bytes32)(bool)" $BIN_PADDED --rpc-url $RPC_URL 2>/dev/null || echo "false")
if [ "$EXISTS" = "false" ]; then
    echo "❌ Error: Esta batería NO existe en el registro"
    exit 1
fi
echo "✅ Batería existe"
echo ""

# Owner
echo "👤 Propietario Actual:"
OWNER=$(cast call $REGISTRY "getOwner(bytes32)(address)" $BIN_PADDED --rpc-url $RPC_URL)
echo "   $OWNER"

# Verificar si es admin (account 0)
if [ "$OWNER" = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" ]; then
    echo "   (Account 0 - Admin/Manufacturer)"
elif [ "$OWNER" = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" ]; then
    echo "   (Account 1 - Manufacturer)"
elif [ "$OWNER" = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" ]; then
    echo "   (Account 2 - OEM)"
elif [ "$OWNER" = "0x90F79bf6EB2c4f870365E785982E1f101E93b906" ]; then
    echo "   (Account 3 - Aftermarket User)"
elif [ "$OWNER" = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" ]; then
    echo "   (Account 4 - Recycler)"
elif [ "$OWNER" = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" ]; then
    echo "   (Account 5 - Fleet Operator)"
fi
echo ""

# Estado
echo "📊 Estado de la Batería:"
STATE=$(cast call $REGISTRY "getBatteryState(bytes32)(uint8)" $BIN_PADDED --rpc-url $RPC_URL)
STATE_NUM=$(echo $STATE | tr -d '\n')

case $STATE_NUM in
    0)
        echo "   Manufactured (0)"
        echo "   ℹ️  Puede transicionar a: Integrated, FirstLife"
        ;;
    1)
        echo "   Integrated (1)"
        echo "   ℹ️  Puede transicionar a: FirstLife"
        ;;
    2)
        echo "   FirstLife (2)"
        echo "   ℹ️  Puede transicionar a: SecondLife, EndOfLife"
        ;;
    3)
        echo "   SecondLife (3)"
        echo "   ℹ️  Puede transicionar a: EndOfLife"
        ;;
    4)
        echo "   EndOfLife (4)"
        echo "   ℹ️  Puede transicionar a: Recycled"
        ;;
    5)
        echo "   Recycled (5)"
        echo "   ⚠️  Estado final - No más transiciones permitidas"
        ;;
    *)
        echo "   Unknown ($STATE_NUM)"
        ;;
esac
echo ""

# SOH
echo "🔋 State of Health (SOH):"
SOH=$(cast call $REGISTRY "getCurrentSOH(bytes32)(uint16)" $BIN_PADDED --rpc-url $RPC_URL)
SOH_NUM=$(echo $SOH | tr -d '\n')
SOH_PERCENT=$(echo "scale=2; $SOH_NUM/100" | bc 2>/dev/null || python3 -c "print($SOH_NUM/100)" 2>/dev/null || echo "$SOH_NUM (raw value)")
echo "   $SOH_PERCENT%"
echo ""

# Transferencia Pendiente
echo "📤 Transferencia Pendiente:"
HAS_PENDING=$(cast call $REGISTRY "hasPendingTransfer(bytes32)(bool)" $BIN_PADDED --rpc-url $RPC_URL)

if [ "$HAS_PENDING" = "true" ]; then
    echo "   ⚠️  SÍ hay una transferencia pendiente"
    echo ""
    echo "   📋 Detalles de la transferencia:"

    PENDING=$(cast call $REGISTRY "getPendingTransfer(bytes32)" $BIN_PADDED --rpc-url $RPC_URL)

    # Parsear resultado (esto es aproximado, cast devuelve una tupla)
    echo "   $PENDING"
    echo ""
    echo "   ⏰ Tiempo restante:"
    TIME_LEFT=$(cast call $REGISTRY "getTransferTimeRemaining(bytes32)(uint256)" $BIN_PADDED --rpc-url $RPC_URL)
    TIME_LEFT_NUM=$(echo $TIME_LEFT | tr -d '\n')

    if [ "$TIME_LEFT_NUM" = "0" ]; then
        echo "   ❌ Expirada (puede ser limpiada con clearExpiredTransfer)"
    else
        DAYS=$((TIME_LEFT_NUM / 86400))
        HOURS=$(((TIME_LEFT_NUM % 86400) / 3600))
        echo "   ${DAYS}d ${HOURS}h restantes"
    fi
else
    echo "   ✅ No hay transferencias pendientes"
fi

echo ""
echo "========================================"
echo "  ACCIONES DISPONIBLES"
echo "========================================"
echo ""

if [ "$HAS_PENDING" = "true" ]; then
    echo "Como EMISOR (owner actual):"
    echo "  - Cancelar transferencia: cancelTransfer($BIN)"
    echo ""
    echo "Como RECEPTOR (destinatario):"
    echo "  - Aceptar transferencia: acceptTransfer($BIN)"
    echo "  - Rechazar transferencia: rejectTransfer($BIN)"
else
    echo "Como OWNER ($OWNER):"
    echo "  - Iniciar transferencia: initiateTransfer($BIN, newOwner, newState)"
fi

echo ""
echo "========================================"
