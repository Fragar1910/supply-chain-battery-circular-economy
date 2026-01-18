const fs = require('fs');
const path = require('path');

// Contract names to extract
const contracts = [
  'BatteryRegistry',
  'RoleManager',
  'SupplyChainTracker',
  'DataVault',
  'CarbonFootprint',
  'SecondLifeManager',
  'RecyclingManager'
];

const scDir = path.join(__dirname, '../sc/out');
const outputDir = path.join(__dirname, 'src/lib/contracts');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

contracts.forEach(contractName => {
  try {
    // Read the contract JSON file
    const contractPath = path.join(scDir, `${contractName}.sol/${contractName}.json`);
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Extract the ABI
    const abi = contractJson.abi;

    // Create TypeScript file content
    const tsContent = `// Auto-generated file - do not edit manually
// Generated from ${contractName}.sol

export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;

export type ${contractName}ABI = typeof ${contractName}ABI;
`;

    // Write the TypeScript file
    const outputPath = path.join(outputDir, `${contractName}.ts`);
    fs.writeFileSync(outputPath, tsContent);

    console.log(`✓ Extracted ABI for ${contractName}`);
  } catch (error) {
    console.error(`✗ Failed to extract ABI for ${contractName}:`, error.message);
  }
});

// Create index file to export all ABIs
const indexContent = contracts.map(name =>
  `export { ${name}ABI } from './${name}';`
).join('\n') + '\n';

fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
console.log('\n✓ Created index.ts with all exports');
console.log(`\nSuccessfully extracted ${contracts.length} contract ABIs!`);
