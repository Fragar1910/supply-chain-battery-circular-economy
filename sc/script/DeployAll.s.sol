// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Import all contracts
import {BatteryRegistry} from "../src/BatteryRegistry.sol";
import {RoleManager} from "../src/RoleManager.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";
import {DataVault} from "../src/DataVault.sol";
import {CarbonFootprint} from "../src/CarbonFootprint.sol";
import {SecondLifeManager} from "../src/SecondLifeManager.sol";
import {RecyclingManager} from "../src/RecyclingManager.sol";

/**
 * @title DeployAll
 * @notice Comprehensive deployment script for all 7 battery supply chain contracts
 * @dev Deploys with UUPS proxy pattern for upgradeability
 *
 * DEPLOYMENT ORDER:
 * 1. BatteryRegistry (core registry)
 * 2. RoleManager (role management)
 * 3. SupplyChainTracker (requires RoleManager)
 * 4. DataVault (requires BatteryRegistry)
 * 5. CarbonFootprint (requires BatteryRegistry)
 * 6. SecondLifeManager (requires BatteryRegistry + RoleManager)
 * 7. RecyclingManager (requires BatteryRegistry + RoleManager)
 *
 * USAGE:
 * Local deployment (Anvil):
 *   forge script script/DeployAll.s.sol:DeployAll --rpc-url http://localhost:8545 --broadcast
 *
 * Testnet deployment (Polygon Mumbai):
 *   forge script script/DeployAll.s.sol:DeployAll --rpc-url $MUMBAI_RPC_URL --broadcast --verify
 *
 * Mainnet deployment (Polygon):
 *   forge script script/DeployAll.s.sol:DeployAll --rpc-url $POLYGON_RPC_URL --broadcast --verify --slow
 */
contract DeployAll is Script {
    // ============================================
    // STATE VARIABLES
    // ============================================

    address public admin;

    // Implementation contracts
    BatteryRegistry public batteryRegistryImpl;
    RoleManager public roleManagerImpl;
    SupplyChainTracker public supplyChainTrackerImpl;
    DataVault public dataVaultImpl;
    CarbonFootprint public carbonFootprintImpl;
    SecondLifeManager public secondLifeManagerImpl;
    RecyclingManager public recyclingManagerImpl;

    // Proxy contracts
    BatteryRegistry public batteryRegistry;
    RoleManager public roleManager;
    SupplyChainTracker public supplyChainTracker;
    DataVault public dataVault;
    CarbonFootprint public carbonFootprint;
    SecondLifeManager public secondLifeManager;
    RecyclingManager public recyclingManager;

    // ============================================
    // MAIN DEPLOYMENT FUNCTION
    // ============================================

    function run() external {
        // Get deployer from environment or use default
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        admin = vm.addr(deployerPrivateKey);

        console2.log("==============================================");
        console2.log("DEPLOYING BATTERY SUPPLY CHAIN CONTRACTS");
        console2.log("==============================================");
        console2.log("Deployer:", admin);
        console2.log("Chain ID:", block.chainid);
        console2.log("==============================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy BatteryRegistry
        console2.log("1/7 Deploying BatteryRegistry...");
        deployBatteryRegistry();

        // 2. Deploy RoleManager
        console2.log("2/7 Deploying RoleManager...");
        deployRoleManager();

        // 3. Deploy SupplyChainTracker
        console2.log("3/7 Deploying SupplyChainTracker...");
        deploySupplyChainTracker();

        // 4. Deploy DataVault
        console2.log("4/7 Deploying DataVault...");
        deployDataVault();

        // 5. Deploy CarbonFootprint
        console2.log("5/7 Deploying CarbonFootprint...");
        deployCarbonFootprint();

        // 6. Deploy SecondLifeManager
        console2.log("6/7 Deploying SecondLifeManager...");
        deploySecondLifeManager();

        // 7. Deploy RecyclingManager
        console2.log("7/7 Deploying RecyclingManager...");
        deployRecyclingManager();

        // Setup roles and permissions
        console2.log("\nSetting up roles and permissions...");
        setupRolesAndPermissions();

        vm.stopBroadcast();

        // Print deployment summary
        printDeploymentSummary();

        // Export addresses to JSON files
        exportAddressesToJson();
    }

    // ============================================
    // INDIVIDUAL DEPLOYMENT FUNCTIONS
    // ============================================

    function deployBatteryRegistry() internal {
        // Deploy implementation
        batteryRegistryImpl = new BatteryRegistry();
        console2.log("  Implementation:", address(batteryRegistryImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            BatteryRegistry.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(batteryRegistryImpl), initData);
        batteryRegistry = BatteryRegistry(address(proxy));
        console2.log("  Proxy:", address(batteryRegistry));
        console2.log("  [OK] BatteryRegistry deployed\n");
    }

    function deployRoleManager() internal {
        // Deploy implementation
        roleManagerImpl = new RoleManager();
        console2.log("  Implementation:", address(roleManagerImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            RoleManager.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(roleManagerImpl), initData);
        roleManager = RoleManager(address(proxy));
        console2.log("  Proxy:", address(roleManager));
        console2.log("  [OK] RoleManager deployed\n");
    }

    function deploySupplyChainTracker() internal {
        // Deploy implementation
        supplyChainTrackerImpl = new SupplyChainTracker();
        console2.log("  Implementation:", address(supplyChainTrackerImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            SupplyChainTracker.initialize.selector,
            admin,
            address(roleManager)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(supplyChainTrackerImpl), initData);
        supplyChainTracker = SupplyChainTracker(address(proxy));
        console2.log("  Proxy:", address(supplyChainTracker));
        console2.log("  [OK] SupplyChainTracker deployed\n");
    }

    function deployDataVault() internal {
        // Deploy implementation
        dataVaultImpl = new DataVault();
        console2.log("  Implementation:", address(dataVaultImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            DataVault.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(dataVaultImpl), initData);
        dataVault = DataVault(address(proxy));
        console2.log("  Proxy:", address(dataVault));
        console2.log("  [OK] DataVault deployed\n");
    }

    function deployCarbonFootprint() internal {
        // Deploy implementation
        carbonFootprintImpl = new CarbonFootprint();
        console2.log("  Implementation:", address(carbonFootprintImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            CarbonFootprint.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(carbonFootprintImpl), initData);
        carbonFootprint = CarbonFootprint(address(proxy));
        console2.log("  Proxy:", address(carbonFootprint));
        console2.log("  [OK] CarbonFootprint deployed\n");
    }

    function deploySecondLifeManager() internal {
        // Deploy implementation
        secondLifeManagerImpl = new SecondLifeManager();
        console2.log("  Implementation:", address(secondLifeManagerImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            SecondLifeManager.initialize.selector,
            admin,
            address(batteryRegistry),
            address(roleManager)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(secondLifeManagerImpl), initData);
        secondLifeManager = SecondLifeManager(address(proxy));
        console2.log("  Proxy:", address(secondLifeManager));
        console2.log("  [OK] SecondLifeManager deployed\n");
    }

    function deployRecyclingManager() internal {
        // Deploy implementation
        recyclingManagerImpl = new RecyclingManager();
        console2.log("  Implementation:", address(recyclingManagerImpl));

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            RecyclingManager.initialize.selector,
            admin,
            address(batteryRegistry),
            address(roleManager)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(recyclingManagerImpl), initData);
        recyclingManager = RecyclingManager(address(proxy));
        console2.log("  Proxy:", address(recyclingManager));
        console2.log("  [OK] RecyclingManager deployed\n");
    }

    // ============================================
    // ROLE AND PERMISSION SETUP
    // ============================================

    function setupRolesAndPermissions() internal {
        // Grant admin all necessary roles across contracts

        // BatteryRegistry roles
        // Note: Operational roles (MANUFACTURER, OEM, OPERATOR, RECYCLER) are NOT granted to admin
        // These are granted only to specific actors via SeedData.s.sol or admin panel

        // SupplyChainTracker roles
        supplyChainTracker.grantTrackerRole(admin); // Admin can track for monitoring

        // DataVault roles
        dataVault.grantDataWriterRole(admin); // Admin can write data for system management
        dataVault.grantAuditorRole(admin); // Admin can audit data
        // Note: Operational roles (MANUFACTURER, OEM, FLEET_OPERATOR) are NOT granted to admin

        // CarbonFootprint roles
        // Only grant AUDITOR_ROLE to the dedicated auditor account (no admin privileges)
        carbonFootprint.grantCarbonAuditorRole(0x976EA74026E726554dB657fA54763abd0C3a0aa9); // Auditor (Account 6)

        // SecondLifeManager roles
        secondLifeManager.grantCertifierRole(admin); // Admin can certify batteries for second life
        secondLifeManager.grantInspectorRole(admin); // Admin can inspect batteries
        // Note: AFTERMARKET_USER_ROLE is NOT granted to admin - only to specific aftermarket actors

        // Grant SecondLifeManager contract ADMIN_ROLE in BatteryRegistry
        // This allows SecondLifeManager to transfer ownership when starting second life
        batteryRegistry.grantRole(batteryRegistry.ADMIN_ROLE(), address(secondLifeManager));

        // RecyclingManager roles
        recyclingManager.grantAuditorRole(admin); // Admin can audit recycling
        // Note: RECYCLER_ROLE is NOT granted to admin - only to specific recyclers

        console2.log("[OK] Roles and permissions configured");
    }

    // ============================================
    // DEPLOYMENT SUMMARY
    // ============================================

    function printDeploymentSummary() internal view {
        console2.log("\n==============================================");
        console2.log("DEPLOYMENT SUMMARY");
        console2.log("==============================================");
        console2.log("Admin:", admin);
        console2.log("\n--- CORE CONTRACTS ---");
        console2.log("BatteryRegistry:     ", address(batteryRegistry));
        console2.log("RoleManager:         ", address(roleManager));
        console2.log("SupplyChainTracker:  ", address(supplyChainTracker));
        console2.log("\n--- SPECIALIZED CONTRACTS ---");
        console2.log("DataVault:           ", address(dataVault));
        console2.log("CarbonFootprint:     ", address(carbonFootprint));
        console2.log("SecondLifeManager:   ", address(secondLifeManager));
        console2.log("RecyclingManager:    ", address(recyclingManager));
        console2.log("\n--- IMPLEMENTATION CONTRACTS ---");
        console2.log("BatteryRegistry Impl:", address(batteryRegistryImpl));
        console2.log("RoleManager Impl:    ", address(roleManagerImpl));
        console2.log("SupplyChainTracker Impl:", address(supplyChainTrackerImpl));
        console2.log("DataVault Impl:      ", address(dataVaultImpl));
        console2.log("CarbonFootprint Impl:", address(carbonFootprintImpl));
        console2.log("SecondLifeManager Impl:", address(secondLifeManagerImpl));
        console2.log("RecyclingManager Impl:", address(recyclingManagerImpl));
        console2.log("==============================================");
        console2.log("\n[SUCCESS] ALL CONTRACTS DEPLOYED SUCCESSFULLY");
        console2.log("==============================================\n");

        // Save addresses to file
        console2.log("IMPORTANT: Save these addresses for frontend integration!");
        console2.log("\nTo verify contracts on Polygonscan:");
        console2.log("forge verify-contract <address> <contract> --chain-id <chainid>");
    }

    // ============================================
    // JSON EXPORT FOR FRONTEND
    // ============================================

    function exportAddressesToJson() internal {
        string memory json = "deployment";

        // Add all contract addresses
        vm.serializeAddress(json, "BatteryRegistry", address(batteryRegistry));
        vm.serializeAddress(json, "RoleManager", address(roleManager));
        vm.serializeAddress(json, "SupplyChainTracker", address(supplyChainTracker));
        vm.serializeAddress(json, "DataVault", address(dataVault));
        vm.serializeAddress(json, "CarbonFootprint", address(carbonFootprint));
        vm.serializeAddress(json, "SecondLifeManager", address(secondLifeManager));
        string memory finalJson = vm.serializeAddress(json, "RecyclingManager", address(recyclingManager));

        // Write to deployments directory
        string memory deploymentsPath = string.concat(vm.projectRoot(), "/deployments/local.json");
        vm.writeJson(finalJson, deploymentsPath);

        // Export role hashes from RoleManager
        exportRoleHashes();

        console2.log("\n[SUCCESS] Contract addresses and roles exported to:");
        console2.log("  - deployments/local.json");
        console2.log("  - deployments/roles.json");
        console2.log("  (Frontend config will be updated by deploy script)");
    }

    function exportRoleHashes() internal {
        string memory rolesJson = "roles";

        // Get role hashes from RoleManager
        bytes32 adminRole = roleManager.ADMIN_ROLE();
        bytes32 componentManufacturerRole = roleManager.COMPONENT_MANUFACTURER_ROLE();
        bytes32 oemRole = roleManager.OEM_ROLE();
        bytes32 fleetOperatorRole = roleManager.FLEET_OPERATOR_ROLE();
        bytes32 aftermarketUserRole = roleManager.AFTERMARKET_USER_ROLE();
        bytes32 recyclerRole = roleManager.RECYCLER_ROLE();

        // Get AUDITOR_ROLE from CarbonFootprint contract
        bytes32 auditorRole = carbonFootprint.AUDITOR_ROLE();

        // Serialize roles
        vm.serializeBytes32(rolesJson, "ADMIN_ROLE", adminRole);
        vm.serializeBytes32(rolesJson, "COMPONENT_MANUFACTURER_ROLE", componentManufacturerRole);
        vm.serializeBytes32(rolesJson, "OEM_ROLE", oemRole);
        vm.serializeBytes32(rolesJson, "FLEET_OPERATOR_ROLE", fleetOperatorRole);
        vm.serializeBytes32(rolesJson, "AFTERMARKET_USER_ROLE", aftermarketUserRole);
        vm.serializeBytes32(rolesJson, "RECYCLER_ROLE", recyclerRole);
        string memory finalRolesJson = vm.serializeBytes32(rolesJson, "AUDITOR_ROLE", auditorRole);

        // Write to deployments directory
        string memory rolesPath = string.concat(vm.projectRoot(), "/deployments/roles.json");
        vm.writeJson(finalRolesJson, rolesPath);
    }
}
