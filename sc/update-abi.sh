#!/bin/bash

# Script para actualizar automáticamente los ABIs en el frontend después de compilar
# Uso: ./update-abi.sh

set -e

echo "🔨 Compiling contracts..."
forge build --force

echo ""
echo "📝 Updating ABIs in frontend..."
node << 'EOF'
const fs = require('fs');
const path = require('path');

const contracts = [
  'BatteryRegistry',
  'RoleManager',
  'SupplyChainTracker',
  'DataVault',
  'CarbonFootprint',
  'SecondLifeManager',
  'RecyclingManager'
];

let successCount = 0;
let errorCount = 0;

contracts.forEach(contract => {
  try {
    const jsonPath = `./out/${contract}.sol/${contract}.json`;
    const tsPath = `../web/src/lib/contracts/${contract}.ts`;

    if (fs.existsSync(jsonPath)) {
      const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const abi = json.abi;

      const content = `// Auto-generated file - do not edit manually
// Generated from ${contract}.sol

export const ${contract}ABI = ${JSON.stringify(abi, null, 2)} as const;

export type ${contract}ABI = typeof ${contract}ABI;
`;

      fs.writeFileSync(tsPath, content, 'utf8');
      console.log(`✅ Updated ${contract} ABI`);
      successCount++;
    } else {
      console.log(`⚠️  ${contract}.json not found, skipping`);
      errorCount++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${contract}: ${error.message}`);
    errorCount++;
  }
});

console.log('');
console.log(`✅ Successfully updated ${successCount} ABIs`);
if (errorCount > 0) {
  console.log(`⚠️  ${errorCount} ABIs had errors or were skipped`);
}
EOF

echo ""
echo "✅ All ABIs updated successfully"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your development server: cd ../web && npm run dev"
echo "   2. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   3. Test the AcceptTransferForm with a pending transfer"
