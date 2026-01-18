// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

// Import contracts
import {BatteryRegistry} from "../src/BatteryRegistry.sol";
import {RoleManager} from "../src/RoleManager.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";
import {DataVault} from "../src/DataVault.sol";
import {CarbonFootprint} from "../src/CarbonFootprint.sol";
import {SecondLifeManager} from "../src/SecondLifeManager.sol";
import {RecyclingManager} from "../src/RecyclingManager.sol";

/**
 * @title SeedData
 * @notice Seeds Anvil local blockchain with test battery data for E2E testing
 * @dev Assumes contracts are already deployed via DeployAll.s.sol
 *
 * USAGE:
 *   1. First deploy contracts:
 *      forge script script/DeployAll.s.sol:DeployAll --rpc-url http://localhost:8545 --broadcast
 *
 *   2. Then seed data (update addresses from deployment):
 *      forge script script/SeedData.s.sol:SeedData --rpc-url http://localhost:8545 --broadcast
 *
 * This script creates 16 test batteries with different states:
 *
 * Original 9 batteries:
 * - NV-2024-001234: Manufactured battery (ready for OEM integration)
 * - NV-2024-002345: Used battery (FirstLife, SOH 85%)
 * - NV-2024-003456: Second life battery (SOH 72%)
 * - NV-2024-004567: End of second life (SOH 52%)
 * - NV-2024-005678: Recycled battery
 * - NV-2024-006789: Available for second life (SOH 78%)
 * - NV-2024-007890: Available for second life (SOH 75%)
 * - NV-2024-008901: Available for second life (SOH 73%)
 * - NV-2024-009012: Available for second life (SOH 77%)
 *
 * New batteries for vehicle integration (Integrated state with VINs):
 * - NV-2024-001236: Tesla Model 3 (VIN: 5YJ3E1EA1KF000001)
 * - NV-2024-001237: Tesla Model Y (VIN: 5YJYGDEE0MF000002)
 * - NV-2024-001238: Ford Mustang Mach-E (VIN: 3FMTK3SU5MMA00003)
 * - NV-2024-001239: Tesla Model 3 (VIN: 5YJ3E1EA2KF000004)
 *
 * New batteries for recycling (older batteries):
 * - NV-2023-000123: Old battery ready for recycling (SOH 35%)
 * - NV-2023-000124: Old battery ready for recycling (SOH 38%)
 * - NV-2023-000125: Old battery ready for recycling (SOH 42%)
 */
contract SeedData is Script {
    // ============================================
    // CONTRACT ADDRESSES (UPDATE AFTER DEPLOYMENT)
    // ============================================
    // TODO: Update these addresses after running DeployAll.s.sol

    address public batteryRegistryAddress;
    address public roleManagerAddress;
    address public supplyChainTrackerAddress;
    address public dataVaultAddress;
    address public carbonFootprintAddress;
    address public secondLifeManagerAddress;
    address public recyclingManagerAddress;

    // Contract instances
    BatteryRegistry public batteryRegistry;
    RoleManager public roleManager;
    SupplyChainTracker public supplyChainTracker;
    DataVault public dataVault;
    CarbonFootprint public carbonFootprint;
    SecondLifeManager public secondLifeManager;
    RecyclingManager public recyclingManager;

    // ============================================
    // ANVIL DEFAULT ACCOUNTS
    // ============================================
    // Account 0: Admin/Deployer (has all roles)
    address public admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    // Account 1: Manufacturer
    address public manufacturer = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    // Account 2: OEM
    address public oem = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    // Account 3: Aftermarket User
    address public aftermarketUser = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    // Account 4: Recycler
    address public recycler = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    // Account 5: Fleet Operator / First Owner
    address public fleetOperator = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

    // Account 6: Auditor
    address public auditor = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;

    // ============================================
    // BATTERY TEST DATA
    // ============================================

    struct TestBattery {
        bytes32 bin;
        string binString;
        BatteryRegistry.Chemistry chemistry;
        uint32 capacityWh;
        string manufacturer;
        uint16 initialSOH;
        uint16 currentSOH;
        BatteryRegistry.BatteryState state;
    }

    TestBattery[16] public testBatteries;

    // ============================================
    // MAIN SEED FUNCTION
    // ============================================

    function run() external {
        console2.log("\n==============================================");
        console2.log("SEEDING ANVIL WITH TEST BATTERY DATA");
        console2.log("==============================================\n");

        // Read contract addresses from environment or use defaults
        loadContractAddresses();

        // Initialize contract instances
        batteryRegistry = BatteryRegistry(batteryRegistryAddress);
        roleManager = RoleManager(roleManagerAddress);
        supplyChainTracker = SupplyChainTracker(supplyChainTrackerAddress);
        dataVault = DataVault(dataVaultAddress);
        carbonFootprint = CarbonFootprint(carbonFootprintAddress);
        secondLifeManager = SecondLifeManager(secondLifeManagerAddress);
        recyclingManager = RecyclingManager(recyclingManagerAddress);

        // Setup test battery data
        setupTestBatteries();

        // Private keys for different accounts
        uint256 adminKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Account 0
        uint256 manufacturerKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d; // Account 1
        uint256 oemKey = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a; // Account 2
        uint256 fleetOperatorKey = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba; // Account 5
        uint256 auditorKey = 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e; // Account 6 - Auditor (0x976EA74026E726554dB657fA54763abd0C3a0aa9)

        // 1. Grant roles to test accounts (using admin account)
        console2.log("Step 1: Granting roles to test accounts...");
        vm.startBroadcast(adminKey);
        grantRolesToAccounts();
        vm.stopBroadcast();

        // 2. Register batteries (using manufacturer account - has MANUFACTURER_ROLE)
        console2.log("\nStep 2: Registering test batteries...");
        vm.startBroadcast(manufacturerKey);
        registerAllBatteries();
        vm.stopBroadcast();

        // 3. Add carbon footprint data (using auditor account - has AUDITOR_ROLE)
        console2.log("\nStep 3: Adding carbon footprint data...");
        vm.startBroadcast(auditorKey);
        addCarbonFootprintData();
        vm.stopBroadcast();

        // 4. Simulate lifecycle transitions (using fleet operator account - has OPERATOR_ROLE)
        console2.log("\nStep 4: Simulating lifecycle transitions...");
        vm.startBroadcast(fleetOperatorKey);
        simulateLifecycleTransitions();
        vm.stopBroadcast();

        // 5. Integrate batteries into vehicles (using OEM account - has OEM_ROLE)
        console2.log("\nStep 5: Integrating batteries into vehicles with VINs...");
        vm.startBroadcast(oemKey);
        integrateVehicleBatteries();
        vm.stopBroadcast();

        // Print summary
        printSeedSummary();
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function loadContractAddresses() internal {
        // Read addresses from deployment JSON file
        string memory deploymentsPath = string.concat(vm.projectRoot(), "/deployments/local.json");

        // Check if file exists, otherwise try environment variables (backward compatibility)
        try vm.readFile(deploymentsPath) returns (string memory json) {
            // Parse JSON and extract addresses
            batteryRegistryAddress = vm.parseJsonAddress(json, ".BatteryRegistry");
            roleManagerAddress = vm.parseJsonAddress(json, ".RoleManager");
            supplyChainTrackerAddress = vm.parseJsonAddress(json, ".SupplyChainTracker");
            dataVaultAddress = vm.parseJsonAddress(json, ".DataVault");
            carbonFootprintAddress = vm.parseJsonAddress(json, ".CarbonFootprint");
            secondLifeManagerAddress = vm.parseJsonAddress(json, ".SecondLifeManager");
            recyclingManagerAddress = vm.parseJsonAddress(json, ".RecyclingManager");

            console2.log("Loaded addresses from deployments/local.json");
        } catch {
            // Fallback to environment variables
            console2.log("deployments/local.json not found, trying environment variables...");
            batteryRegistryAddress = vm.envOr("BATTERY_REGISTRY_ADDRESS", address(0));
            roleManagerAddress = vm.envOr("ROLE_MANAGER_ADDRESS", address(0));
            supplyChainTrackerAddress = vm.envOr("SUPPLY_CHAIN_TRACKER_ADDRESS", address(0));
            dataVaultAddress = vm.envOr("DATA_VAULT_ADDRESS", address(0));
            carbonFootprintAddress = vm.envOr("CARBON_FOOTPRINT_ADDRESS", address(0));
            secondLifeManagerAddress = vm.envOr("SECOND_LIFE_MANAGER_ADDRESS", address(0));
            recyclingManagerAddress = vm.envOr("RECYCLING_MANAGER_ADDRESS", address(0));
        }

        require(batteryRegistryAddress != address(0), "BatteryRegistry address not set! Run DeployAll.s.sol first");

        console2.log("Using contract addresses:");
        console2.log("  BatteryRegistry:    ", batteryRegistryAddress);
        console2.log("  RoleManager:        ", roleManagerAddress);
        console2.log("  SupplyChainTracker: ", supplyChainTrackerAddress);
        console2.log("  DataVault:          ", dataVaultAddress);
        console2.log("  CarbonFootprint:    ", carbonFootprintAddress);
        console2.log("  SecondLifeManager:  ", secondLifeManagerAddress);
        console2.log("  RecyclingManager:   ", recyclingManagerAddress);
        console2.log("");
    }

    function setupTestBatteries() internal {
        // Battery 1: Manufactured battery (ready for OEM integration)
        testBatteries[0] = TestBattery({
            bin: stringToBytes32("NV-2024-001234"),
            binString: "NV-2024-001234",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 75000, // 75 kWh
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 100,
            state: BatteryRegistry.BatteryState.Manufactured
        });

        // Battery 2: Used battery (FirstLife, SOH 85%)
        testBatteries[1] = TestBattery({
            bin: stringToBytes32("NV-2024-002345"),
            binString: "NV-2024-002345",
            chemistry: BatteryRegistry.Chemistry.LFP,
            capacityWh: 60000, // 60 kWh
            manufacturer: "Northvolt Zwei",
            initialSOH: 100,
            currentSOH: 85,
            state: BatteryRegistry.BatteryState.FirstLife
        });

        // Battery 3: Second life battery (SOH 72%)
        testBatteries[2] = TestBattery({
            bin: stringToBytes32("NV-2024-003456"),
            binString: "NV-2024-003456",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 50000, // 50 kWh
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 72,
            state: BatteryRegistry.BatteryState.SecondLife
        });

        // Battery 4: End of second life (SOH 52%)
        testBatteries[3] = TestBattery({
            bin: stringToBytes32("NV-2024-004567"),
            binString: "NV-2024-004567",
            chemistry: BatteryRegistry.Chemistry.NCA,
            capacityWh: 85000, // 85 kWh
            manufacturer: "Northvolt Drei",
            initialSOH: 100,
            currentSOH: 52,
            state: BatteryRegistry.BatteryState.SecondLife
        });

        // Battery 5: Recycled battery
        testBatteries[4] = TestBattery({
            bin: stringToBytes32("NV-2024-005678"),
            binString: "NV-2024-005678",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 70000, // 70 kWh
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 45,
            state: BatteryRegistry.BatteryState.Recycled
        });

        // Battery 6: Available for second life (SOH 78%)
        testBatteries[5] = TestBattery({
            bin: stringToBytes32("NV-2024-006789"),
            binString: "NV-2024-006789",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 75000, // 75 kWh
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 78,
            state: BatteryRegistry.BatteryState.FirstLife
        });

        // Battery 7: Available for second life (SOH 75%)
        testBatteries[6] = TestBattery({
            bin: stringToBytes32("NV-2024-007890"),
            binString: "NV-2024-007890",
            chemistry: BatteryRegistry.Chemistry.LFP,
            capacityWh: 80000, // 80 kWh
            manufacturer: "CATL",
            initialSOH: 100,
            currentSOH: 75,
            state: BatteryRegistry.BatteryState.FirstLife
        });

        // Battery 8: Available for second life (SOH 73%)
        testBatteries[7] = TestBattery({
            bin: stringToBytes32("NV-2024-008901"),
            binString: "NV-2024-008901",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 60000, // 60 kWh
            manufacturer: "Northvolt Zwei",
            initialSOH: 100,
            currentSOH: 73,
            state: BatteryRegistry.BatteryState.FirstLife
        });

        // Battery 9: Available for second life (SOH 77%)
        testBatteries[8] = TestBattery({
            bin: stringToBytes32("NV-2024-009012"),
            binString: "NV-2024-009012",
            chemistry: BatteryRegistry.Chemistry.NCA,
            capacityWh: 100000, // 100 kWh
            manufacturer: "Northvolt Drei",
            initialSOH: 100,
            currentSOH: 77,
            state: BatteryRegistry.BatteryState.FirstLife
        });

        // ============================================
        // NEW BATTERIES FOR VEHICLE INTEGRATION
        // ============================================

        // Battery 10: Tesla Model 3 (VIN: 5YJ3E1EA1KF000001)
        testBatteries[9] = TestBattery({
            bin: stringToBytes32("NV-2024-001236"),
            binString: "NV-2024-001236",
            chemistry: BatteryRegistry.Chemistry.NCA,
            capacityWh: 75000, // 75 kWh (Tesla Model 3 Long Range)
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 100,
            state: BatteryRegistry.BatteryState.Manufactured
        });

        // Battery 11: Tesla Model Y (VIN: 5YJYGDEE0MF000002)
        testBatteries[10] = TestBattery({
            bin: stringToBytes32("NV-2024-001237"),
            binString: "NV-2024-001237",
            chemistry: BatteryRegistry.Chemistry.NCA,
            capacityWh: 81000, // 81 kWh (Tesla Model Y Long Range)
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 100,
            state: BatteryRegistry.BatteryState.Manufactured
        });

        // Battery 12: Ford Mustang Mach-E (VIN: 3FMTK3SU5MMA00003)
        testBatteries[11] = TestBattery({
            bin: stringToBytes32("NV-2024-001238"),
            binString: "NV-2024-001238",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 91000, // 91 kWh (Ford Mustang Mach-E Extended Range)
            manufacturer: "CATL",
            initialSOH: 100,
            currentSOH: 100,
            state: BatteryRegistry.BatteryState.Manufactured
        });

        // Battery 13: Tesla Model 3 (VIN: 5YJ3E1EA2KF000004)
        testBatteries[12] = TestBattery({
            bin: stringToBytes32("NV-2024-001239"),
            binString: "NV-2024-001239",
            chemistry: BatteryRegistry.Chemistry.LFP,
            capacityWh: 60000, // 60 kWh (Tesla Model 3 Standard Range Plus)
            manufacturer: "CATL",
            initialSOH: 100,
            currentSOH: 100,
            state: BatteryRegistry.BatteryState.Manufactured
        });

        // ============================================
        // NEW BATTERIES FOR RECYCLING (OLDER MODELS)
        // ============================================

        // Battery 14: Old battery for recycling (SOH 35%)
        testBatteries[13] = TestBattery({
            bin: stringToBytes32("NV-2023-000123"),
            binString: "NV-2023-000123",
            chemistry: BatteryRegistry.Chemistry.NMC,
            capacityWh: 50000, // 50 kWh
            manufacturer: "Northvolt Ett",
            initialSOH: 100,
            currentSOH: 35,
            state: BatteryRegistry.BatteryState.EndOfLife
        });

        // Battery 15: Old battery for recycling (SOH 38%)
        testBatteries[14] = TestBattery({
            bin: stringToBytes32("NV-2023-000124"),
            binString: "NV-2023-000124",
            chemistry: BatteryRegistry.Chemistry.NCA,
            capacityWh: 60000, // 60 kWh
            manufacturer: "Northvolt Zwei",
            initialSOH: 100,
            currentSOH: 38,
            state: BatteryRegistry.BatteryState.EndOfLife
        });

        // Battery 16: Old battery for recycling (SOH 42%)
        testBatteries[15] = TestBattery({
            bin: stringToBytes32("NV-2023-000125"),
            binString: "NV-2023-000125",
            chemistry: BatteryRegistry.Chemistry.LFP,
            capacityWh: 55000, // 55 kWh
            manufacturer: "CATL",
            initialSOH: 100,
            currentSOH: 42,
            state: BatteryRegistry.BatteryState.EndOfLife
        });
    }

    function grantRolesToAccounts() internal {
        // Register actors in RoleManager (centralized role management)
        // Role enum: 0=None, 1=RawMaterialSupplier, 2=ComponentManufacturer, 3=OEM, 4=FleetOperator, 5=AftermarketUser, 6=Recycler, 7=Auditor

        // Register Manufacturer (account 1) - Role.ComponentManufacturer (2)
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Northvolt AB",
            "" // No certification hash for test
        );
        batteryRegistry.grantManufacturerRole(manufacturer);
        console2.log("  [OK] Manufacturer role granted to:", manufacturer);

        // Register OEM (account 2) - Role.OEM (3)
        roleManager.registerActor(
            oem,
            RoleManager.Role.OEM,
            "Tesla Inc",
            ""
        );
        batteryRegistry.grantOEMRole(oem);
        dataVault.grantOEMRole(oem);
        console2.log("  [OK] OEM role granted to:", oem);

        // Register Fleet Operator (account 5) - Role.FleetOperator (4)
        roleManager.registerActor(
            fleetOperator,
            RoleManager.Role.FleetOperator,
            "EV Fleet Solutions",
            ""
        );
        batteryRegistry.grantOperatorRole(fleetOperator);
        dataVault.grantFleetOperatorRole(fleetOperator);
        console2.log("  [OK] Fleet Operator role granted to:", fleetOperator);

        // Register Aftermarket User (account 3) - Role.AftermarketUser (5)
        roleManager.registerActor(
            aftermarketUser,
            RoleManager.Role.AftermarketUser,
            "Second Life Energy Storage",
            ""
        );
        secondLifeManager.grantAftermarketUserRole(aftermarketUser);
        console2.log("  [OK] Aftermarket User role granted to:", aftermarketUser);

        // Register Recycler (account 4) - Role.Recycler (6)
        roleManager.registerActor(
            recycler,
            RoleManager.Role.Recycler,
            "Redwood Materials",
            ""
        );
        batteryRegistry.grantRecyclerRole(recycler);
        recyclingManager.grantRecyclerRole(recycler);
        console2.log("  [OK] Recycler role granted to:", recycler);

        // Register Auditor (account 6) - Role.Auditor (7)
        roleManager.registerActor(
            auditor,
            RoleManager.Role.Auditor,
            "Environmental Audit Bureau",
            ""
        );
        recyclingManager.grantAuditorRole(auditor);
        dataVault.grantAuditorRole(auditor);
        console2.log("  [OK] Auditor role granted to:", auditor);
    }

    function registerAllBatteries() internal {
        for (uint256 i = 0; i < testBatteries.length; i++) {
            TestBattery memory battery = testBatteries[i];

            console2.log("  Registering battery:", battery.binString);

            batteryRegistry.registerBattery(
                battery.bin,
                battery.chemistry,
                battery.capacityWh / 1000, // Convert Wh to kWh
                0, // carbonFootprint (will be added separately via CarbonFootprint contract)
                bytes32(0) // ipfsCertHash (empty for now)
            );

            console2.log("    [OK] Battery registered with BIN:", battery.binString);
        }
    }

    function addCarbonFootprintData() internal {
        // Add carbon footprint for each battery
        for (uint256 i = 0; i < testBatteries.length; i++) {
            TestBattery memory battery = testBatteries[i];

            // Manufacturing phase (varies by chemistry)
            // Realistic values: 50-80 kg CO2e per kWh capacity
            // For 50-100 kWh batteries, total manufacturing emissions: 2,500-8,000 kg CO2e
            uint64 manufacturingCO2 = uint64(2500 + (i * 500)); // 2.5-6.5 tons CO2e

            carbonFootprint.addEmission(
                battery.bin,
                CarbonFootprint.LifecyclePhase.Manufacturing,
                manufacturingCO2,
                bytes32(0), // evidenceHash (empty for now)
                "Factory production emissions"
            );

            console2.log("    Carbon footprint added for:", battery.binString);
            console2.log("      CO2e:", manufacturingCO2, "kg");
        }
    }

    function simulateLifecycleTransitions() internal {
        // Battery 2: Update SOH to 85%
        batteryRegistry.updateSOH(testBatteries[1].bin, 8500, 500); // 85% SOH, 500 cycles
        console2.log("  Battery 2: SOH updated to 85%");

        // Battery 3: Transition to second life
        batteryRegistry.changeBatteryState(
            testBatteries[2].bin,
            BatteryRegistry.BatteryState.SecondLife
        );
        batteryRegistry.updateSOH(testBatteries[2].bin, 7200, 800); // 72% SOH, 800 cycles
        console2.log("  Battery 3: Transitioned to SecondLife (SOH 72%)");

        // Battery 4: Advanced second life
        batteryRegistry.changeBatteryState(
            testBatteries[3].bin,
            BatteryRegistry.BatteryState.SecondLife
        );
        batteryRegistry.updateSOH(testBatteries[3].bin, 5200, 1500); // 52% SOH, 1500 cycles
        console2.log("  Battery 4: In SecondLife (SOH 52%)");

        // Battery 5: Change state to Recycled
        // Note: Full recycling workflow (startRecycling, recordMaterials, completeRecycling)
        // is omitted for simplicity in seed data. Can be added if needed for E2E tests.
        batteryRegistry.changeBatteryState(
            testBatteries[4].bin,
            BatteryRegistry.BatteryState.Recycled
        );
        console2.log("  Battery 5: State changed to Recycled");

        // Batteries 6-9: Update SOH to second life range (70-80%)
        // These remain in FirstLife state but are eligible for second life
        batteryRegistry.updateSOH(testBatteries[5].bin, 7800, 2800); // 78% SOH, 2800 cycles
        console2.log("  Battery 6: SOH updated to 78% (available for second life)");

        batteryRegistry.updateSOH(testBatteries[6].bin, 7500, 3200); // 75% SOH, 3200 cycles
        console2.log("  Battery 7: SOH updated to 75% (available for second life)");

        batteryRegistry.updateSOH(testBatteries[7].bin, 7300, 2500); // 73% SOH, 2500 cycles
        console2.log("  Battery 8: SOH updated to 73% (available for second life)");

        batteryRegistry.updateSOH(testBatteries[8].bin, 7700, 2200); // 77% SOH, 2200 cycles
        console2.log("  Battery 9: SOH updated to 77% (available for second life)");

        // ============================================
        // NEW BATTERIES: VEHICLE INTEGRATION
        // ============================================
        // Batteries 10-13: Integrate into vehicles (Manufactured -> Integrated)
        // These will be transitioned by OEM (done in separate step with OEM key)
        console2.log("\n  [INFO] Batteries 10-13: Ready for OEM integration with VINs");
        console2.log("  [INFO] Integration will be done in Step 5 with OEM account");

        // ============================================
        // NEW BATTERIES: RECYCLING PREPARATION
        // ============================================
        // Batteries 14-16: Update SOH to show degradation (already EndOfLife)
        batteryRegistry.updateSOH(testBatteries[13].bin, 3500, 5000); // 35% SOH, 5000 cycles
        console2.log("  Battery 14 (NV-2023-000123): SOH 35% - ready for recycling");

        batteryRegistry.updateSOH(testBatteries[14].bin, 3800, 4800); // 38% SOH, 4800 cycles
        console2.log("  Battery 15 (NV-2023-000124): SOH 38% - ready for recycling");

        batteryRegistry.updateSOH(testBatteries[15].bin, 4200, 4500); // 42% SOH, 4500 cycles
        console2.log("  Battery 16 (NV-2023-000125): SOH 42% - ready for recycling");
    }

    function printSeedSummary() internal view {
        console2.log("\n==============================================");
        console2.log("SEED DATA SUMMARY");
        console2.log("==============================================");
        console2.log("\nTest Accounts:");
        console2.log("  Admin:            ", admin);
        console2.log("  Manufacturer:     ", manufacturer);
        console2.log("  OEM:              ", oem);
        console2.log("  Fleet Operator:   ", fleetOperator);
        console2.log("  Aftermarket User: ", aftermarketUser);
        console2.log("  Recycler:         ", recycler);

        console2.log("\nTest Batteries Registered:");
        for (uint256 i = 0; i < testBatteries.length; i++) {
            TestBattery memory battery = testBatteries[i];
            console2.log("  ", i+1, ".", battery.binString);
            console2.log("      Capacity:", battery.capacityWh / 1000, "kWh");
            console2.log("      SOH:", battery.currentSOH, "%");
            console2.log("      State:", getStateName(battery.state));
        }

        console2.log("\n==============================================");
        console2.log("[SUCCESS] SEED DATA CREATED SUCCESSFULLY");
        console2.log("==============================================");
        console2.log("\nYou can now test the web app at: http://localhost:3000");
        console2.log("Try viewing battery passport at: http://localhost:3000/passport/NV-2024-001234");
        console2.log("\nConnect with these accounts in MetaMask:");
        console2.log("  Manufacturer:    Import private key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
        console2.log("  OEM:             Import private key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
        console2.log("  Fleet Operator:  Import private key 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba");
        console2.log("==============================================\n");
    }

    function integrateVehicleBatteries() internal {
        // Battery 10: Tesla Model 3 (VIN: 5YJ3E1EA1KF000001)
        bytes32 vin1 = stringToBytes32("5YJ3E1EA1KF000001");
        batteryRegistry.integrateBattery(testBatteries[9].bin, vin1);
        console2.log("  Battery 10 (NV-2024-001236): Integrated into Tesla Model 3");
        console2.log("    VIN: 5YJ3E1EA1KF000001");

        // Battery 11: Tesla Model Y (VIN: 5YJYGDEE0MF000002)
        bytes32 vin2 = stringToBytes32("5YJYGDEE0MF000002");
        batteryRegistry.integrateBattery(testBatteries[10].bin, vin2);
        console2.log("  Battery 11 (NV-2024-001237): Integrated into Tesla Model Y");
        console2.log("    VIN: 5YJYGDEE0MF000002");

        // Battery 12: Ford Mustang Mach-E (VIN: 3FMTK3SU5MMA00003)
        bytes32 vin3 = stringToBytes32("3FMTK3SU5MMA00003");
        batteryRegistry.integrateBattery(testBatteries[11].bin, vin3);
        console2.log("  Battery 12 (NV-2024-001238): Integrated into Ford Mustang Mach-E");
        console2.log("    VIN: 3FMTK3SU5MMA00003");

        // Battery 13: Tesla Model 3 (VIN: 5YJ3E1EA2KF000004)
        bytes32 vin4 = stringToBytes32("5YJ3E1EA2KF000004");
        batteryRegistry.integrateBattery(testBatteries[12].bin, vin4);
        console2.log("  Battery 13 (NV-2024-001239): Integrated into Tesla Model 3");
        console2.log("    VIN: 5YJ3E1EA2KF000004");
    }

    function getStateName(BatteryRegistry.BatteryState state) internal pure returns (string memory) {
        if (state == BatteryRegistry.BatteryState.Manufactured) return "Manufactured";
        if (state == BatteryRegistry.BatteryState.Integrated) return "Integrated";
        if (state == BatteryRegistry.BatteryState.FirstLife) return "FirstLife";
        if (state == BatteryRegistry.BatteryState.SecondLife) return "SecondLife";
        if (state == BatteryRegistry.BatteryState.EndOfLife) return "EndOfLife";
        if (state == BatteryRegistry.BatteryState.Recycled) return "Recycled";
        return "Unknown";
    }

    /**
     * @notice Convert string to bytes32 with RIGHT-PADDING (to match viem/TypeScript behavior)
     * @dev This is critical for consistency with web app which uses viem's pad(..., {dir: 'right'})
     * @param source String to convert (max 32 characters)
     * @return result bytes32 with zeros padded on the RIGHT
     *
     * Example: "NV-2024-001234" → 0x4e562d323032342d303031323334000000000000000000000000000000000000
     * (Note: zeros are at the END, not at the beginning)
     */
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempBytes = bytes(source);
        require(tempBytes.length <= 32, "String too long for bytes32");

        // Copy bytes to result (this naturally right-pads with zeros)
        assembly {
            result := mload(add(tempBytes, 32))
        }
    }
}
