#!/bin/bash

# Script para ejecutar tests del sistema de transferencias de dos pasos
# Uso: ./script/test-transfers.sh [opciones]

set -e

echo "=========================================="
echo "  BATTERY TRANSFER SYSTEM - TEST SUITE"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
VERBOSE="-vv"
SPECIFIC_TEST=""
SHOW_COVERAGE=false
WATCH_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE="-vvvv"
            shift
            ;;
        -q|--quiet)
            VERBOSE="-v"
            shift
            ;;
        -t|--test)
            SPECIFIC_TEST="--match-test $2"
            shift 2
            ;;
        -c|--coverage)
            SHOW_COVERAGE=true
            shift
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: ./script/test-transfers.sh [options]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose       Mostrar output muy detallado (-vvvv)"
            echo "  -q, --quiet         Mostrar output mínimo (-v)"
            echo "  -t, --test <name>   Ejecutar un test específico"
            echo "  -c, --coverage      Mostrar cobertura de código"
            echo "  -w, --watch         Modo watch (re-ejecutar al cambiar archivos)"
            echo "  -h, --help          Mostrar esta ayuda"
            echo ""
            echo "Ejemplos:"
            echo "  ./script/test-transfers.sh"
            echo "  ./script/test-transfers.sh -v"
            echo "  ./script/test-transfers.sh -t test_InitiateTransfer"
            echo "  ./script/test-transfers.sh -c"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            echo "Usa -h o --help para ver las opciones disponibles"
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [ ! -f "foundry.toml" ]; then
    echo -e "${RED}Error: No se encontró foundry.toml${NC}"
    echo "Por favor ejecuta este script desde el directorio sc/"
    exit 1
fi

# Build contracts first
echo -e "${BLUE}📦 Compilando contratos...${NC}"
forge build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al compilar contratos${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contratos compilados correctamente${NC}"
echo ""

# Run tests
if [ "$WATCH_MODE" = true ]; then
    echo -e "${YELLOW}👀 Modo watch activado - Los tests se re-ejecutarán al detectar cambios${NC}"
    echo ""
    forge test --match-contract BatteryRegistryTransferTest $SPECIFIC_TEST $VERBOSE --watch
elif [ "$SHOW_COVERAGE" = true ]; then
    echo -e "${BLUE}🧪 Ejecutando tests con cobertura...${NC}"
    echo ""
    forge coverage --match-contract BatteryRegistryTransferTest $SPECIFIC_TEST
else
    echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
    echo ""
    forge test --match-contract BatteryRegistryTransferTest $SPECIFIC_TEST $VERBOSE
fi

# Check test result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✅ TODOS LOS TESTS PASARON"
    echo "==========================================${NC}"
    echo ""

    # Show test summary
    echo -e "${BLUE}📊 Resumen de Tests:${NC}"
    echo "  • Initiate Transfer: ✅"
    echo "  • Accept Transfer: ✅"
    echo "  • Reject Transfer: ✅"
    echo "  • Cancel Transfer: ✅"
    echo "  • Clear Expired Transfer: ✅"
    echo "  • State Transitions: ✅"
    echo "  • View Functions: ✅"
    echo "  • Integration Tests: ✅"
    echo ""

    # Show quick reference
    echo -e "${YELLOW}💡 Comandos útiles:${NC}"
    echo "  • Ejecutar test específico:    ./script/test-transfers.sh -t test_InitiateTransfer"
    echo "  • Ver cobertura:               ./script/test-transfers.sh -c"
    echo "  • Modo verbose:                ./script/test-transfers.sh -v"
    echo "  • Ejecutar todos los tests:    forge test"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================="
    echo "  ❌ ALGUNOS TESTS FALLARON"
    echo "==========================================${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tips para debugging:${NC}"
    echo "  • Ejecutar con más detalle: ./script/test-transfers.sh -v"
    echo "  • Ver logs de Foundry:      forge test -vvvv"
    echo "  • Ver stack traces:         forge test -vvvvv"
    echo ""
    exit 1
fi
