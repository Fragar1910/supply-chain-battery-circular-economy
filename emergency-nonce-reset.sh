#!/bin/bash

# Emergency Nonce Reset Script
# Use this when nonce errors are blocking all transactions

set -e

echo "🚨 EMERGENCY NONCE RESET PROCEDURE"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Anvil is running
echo -e "${YELLOW}Step 1: Checking Anvil status...${NC}"
if pgrep -x "anvil" > /dev/null; then
    echo -e "${GREEN}✓ Anvil is running${NC}"
    ANVIL_PID=$(pgrep -x "anvil")
    echo "  PID: $ANVIL_PID"
else
    echo -e "${RED}✗ Anvil is NOT running${NC}"
    echo "  Please start Anvil first: cd sc && anvil"
    exit 1
fi

# Step 2: Check current nonce
echo ""
echo -e "${YELLOW}Step 2: Checking current nonce for Account #3...${NC}"
ACCOUNT="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
CURRENT_NONCE=$(cast nonce $ACCOUNT --rpc-url http://localhost:8545 2>/dev/null || echo "ERROR")

if [ "$CURRENT_NONCE" = "ERROR" ]; then
    echo -e "${RED}✗ Could not fetch nonce from blockchain${NC}"
    echo "  Is Anvil running on port 8545?"
    exit 1
fi

echo -e "${GREEN}✓ Current nonce: $CURRENT_NONCE${NC}"

# Step 3: Options
echo ""
echo -e "${YELLOW}What would you like to do?${NC}"
echo "1. Keep current blockchain state (nonce=$CURRENT_NONCE)"
echo "2. Reset Anvil completely (WARNING: loses all data)"
echo ""
read -p "Enter choice [1-2]: " choice

if [ "$choice" = "2" ]; then
    echo ""
    echo -e "${RED}⚠️  WARNING: This will DELETE all blockchain data!${NC}"
    read -p "Are you sure? Type 'yes' to continue: " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi

    echo ""
    echo -e "${YELLOW}Step 3: Killing Anvil...${NC}"
    pkill anvil || true
    sleep 2
    echo -e "${GREEN}✓ Anvil stopped${NC}"

    echo ""
    echo -e "${YELLOW}Step 4: Starting fresh Anvil...${NC}"
    cd sc
    anvil > /dev/null 2>&1 &
    sleep 3
    echo -e "${GREEN}✓ Anvil restarted${NC}"

    echo ""
    echo -e "${YELLOW}Step 5: Redeploying contracts...${NC}"
    forge script script/DeployAll.s.sol --rpc-url localhost --broadcast > /dev/null 2>&1
    echo -e "${GREEN}✓ Contracts deployed${NC}"

    NEW_NONCE=$(cast nonce $ACCOUNT --rpc-url http://localhost:8545)
    echo -e "${GREEN}✓ New nonce: $NEW_NONCE${NC}"
fi

# Step 4: Frontend instructions
echo ""
echo -e "${YELLOW}==================================="
echo "FRONTEND CLEANUP INSTRUCTIONS"
echo "===================================${NC}"
echo ""
echo "1. Open your browser to http://localhost:3000"
echo ""
echo "2. Click the yellow 'Clear Wagmi Cache' button (bottom-right corner)"
echo "   - Wait for page reload"
echo ""
echo "3. OR do a hard refresh:"
echo "   - Mac: Cmd + Shift + R"
echo "   - Windows: Ctrl + Shift + R"
echo ""
echo "4. Reconnect your wallet"
echo ""
echo "5. Reset MetaMask account (IMPORTANT):"
echo "   - MetaMask → Settings → Advanced → Reset Account"
echo "   - This clears MetaMask's nonce cache"
echo ""
echo "6. Try your transaction again"
echo ""
echo -e "${GREEN}✅ Backend is ready (nonce=${CURRENT_NONCE:-$NEW_NONCE})${NC}"
echo ""
echo -e "${YELLOW}If problems persist:${NC}"
echo "  - Close browser completely"
echo "  - Clear browser cache: DevTools → Application → Clear storage"
echo "  - Restart browser"
echo "  - Try transaction in incognito/private mode"
echo ""
