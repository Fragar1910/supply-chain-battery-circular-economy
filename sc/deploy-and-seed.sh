#!/bin/bash

# deploy-and-seed.sh
# Unified script to deploy all contracts and seed test data
# Usage: ./deploy-and-seed.sh [--skip-deploy] [--skip-seed]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default flags
SKIP_DEPLOY=false
SKIP_SEED=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    --skip-seed)
      SKIP_SEED=true
      shift
      ;;
    *)
      ;;
  esac
done

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Battery Supply Chain - Deploy & Seed Script  ${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if anvil is running
if ! nc -z localhost 8545 2>/dev/null; then
  echo -e "${RED}ERROR: Anvil is not running on localhost:8545${NC}"
  echo -e "${YELLOW}Please start anvil in another terminal: anvil${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Anvil is running${NC}\n"

# Step 1: Deploy contracts
if [ "$SKIP_DEPLOY" = false ]; then
  echo -e "${BLUE}Step 1/3: Deploying all contracts...${NC}"
  forge script script/DeployAll.s.sol:DeployAll \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --legacy

  echo -e "${GREEN}✓ Contracts deployed successfully${NC}"
  echo -e "${GREEN}✓ Addresses exported to:${NC}"
  echo -e "  - deployments/local.json"
  echo -e "  - web/src/config/deployed-addresses.json\n"
else
  echo -e "${YELLOW}⊘ Skipping deployment (--skip-deploy flag set)${NC}\n"
fi

# Step 2: Update frontend contracts.ts
echo -e "${BLUE}Step 2/3: Updating frontend configuration...${NC}"

if [ -f "deployments/local.json" ]; then
  # Copy deployment addresses and roles to web config directory
  mkdir -p ../web/src/config
  cp deployments/local.json ../web/src/config/deployed-addresses.json
  echo -e "${GREEN}✓ Copied deployment addresses to web/src/config/deployed-addresses.json${NC}"

  if [ -f "deployments/roles.json" ]; then
    cp deployments/roles.json ../web/src/config/deployed-roles.json
    echo -e "${GREEN}✓ Copied role hashes to web/src/config/deployed-roles.json${NC}\n"
  else
    echo -e "${YELLOW}⚠ Warning: deployments/roles.json not found${NC}\n"
  fi
else
  echo -e "${RED}ERROR: deployments/local.json not found${NC}"
  echo -e "${YELLOW}Run without --skip-deploy first${NC}"
  exit 1
fi

# Step 3: Seed test data
if [ "$SKIP_SEED" = false ]; then
  echo -e "${BLUE}Step 3/3: Seeding test data...${NC}"
  forge script script/SeedData.s.sol:SeedData \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --legacy

  echo -e "${GREEN}✓ Test data seeded successfully${NC}\n"
else
  echo -e "${YELLOW}⊘ Skipping seed (--skip-seed flag set)${NC}\n"
fi

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}================================================${NC}\n"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Start the web app: cd ../web && npm run dev"
echo "2. Open browser: http://localhost:3000"
echo "3. Connect MetaMask to Anvil Local (Chain ID: 31337)"
echo "4. Import test accounts (see web/MANUAL_TESTING_GUIDE.md)"
echo ""
echo -e "${GREEN}Test battery passport:${NC}"
echo "http://localhost:3000/passport/NV-2024-001234"
echo ""
echo -e "${YELLOW}Contract addresses:${NC}"
echo "See: deployments/local.json"
echo ""
