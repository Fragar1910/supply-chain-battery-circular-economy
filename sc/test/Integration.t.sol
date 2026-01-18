// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {BatteryRegistry} from "../src/BatteryRegistry.sol";
import {RoleManager} from "../src/RoleManager.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";
import {DataVault} from "../src/DataVault.sol";
import {CarbonFootprint} from "../src/CarbonFootprint.sol";
import {SecondLifeManager} from "../src/SecondLifeManager.sol";
import {RecyclingManager} from "../src/RecyclingManager.sol";

/**
 * @title Integration Test
 * @notice Tests complete battery lifecycle across all 7 contracts
 *
 * LIFECYCLE FLOW:
 * 1. Register battery (BatteryRegistry)
 * 2. Store manufacturing parameters (DataVault)
 * 3. Add manufacturing emissions (CarbonFootprint)
 * 4. Start tracking journey (SupplyChainTracker)
 * 5. Integrate into vehicle (BatteryRegistry)
 * 6. Update SOH during first life (BatteryRegistry)
 * 7. Certify for second life (SecondLifeManager)
 * 8. Start second life application (SecondLifeManager)
 * 9. Report second life performance (SecondLifeManager)
 * 10. Start recycling (RecyclingManager)
 * 11. Record material recovery (RecyclingManager)
 * 12. Complete recycling (RecyclingManager)
 */
contract IntegrationTest is Test {
    // ============================================
    // CONTRACTS
    // ============================================

    BatteryRegistry public batteryRegistry;
    RoleManager public roleManager;
    SupplyChainTracker public supplyChainTracker;
    DataVault public dataVault;
    CarbonFootprint public carbonFootprint;
    SecondLifeManager public secondLifeManager;
    RecyclingManager public recyclingManager;

    // ============================================
    // TEST ACCOUNTS
    // ============================================

    address public admin;
    address public manufacturer;
    address public oem;
    address public operator;
    address public aftermarketUser;
    address public recycler;
    address public auditor;

    // ============================================
    // TEST DATA
    // ============================================

    bytes32 public testBin = keccak256("BATTERY_BIN_12345");
    bytes32 public testVin = keccak256("VEHICLE_VIN_67890");

    // ============================================
    // SETUP
    // ============================================

    function setUp() public {
        // Setup test accounts
        admin = address(this);
        manufacturer = makeAddr("manufacturer");
        oem = makeAddr("oem");
        operator = makeAddr("operator");
        aftermarketUser = makeAddr("aftermarketUser");
        recycler = makeAddr("recycler");
        auditor = makeAddr("auditor");

        // Deploy all contracts with proxies
        _deployAllContracts();

        // Setup roles
        _setupRoles();

        console2.log("==============================================");
        console2.log("INTEGRATION TEST SETUP COMPLETE");
        console2.log("==============================================");
    }

    // ============================================
    // DEPLOYMENT HELPERS
    // ============================================

    function _deployAllContracts() internal {
        // 1. BatteryRegistry
        BatteryRegistry batteryRegistryImpl = new BatteryRegistry();
        bytes memory initData = abi.encodeWithSelector(BatteryRegistry.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(batteryRegistryImpl), initData);
        batteryRegistry = BatteryRegistry(address(proxy));

        // 2. RoleManager
        RoleManager roleManagerImpl = new RoleManager();
        initData = abi.encodeWithSelector(RoleManager.initialize.selector, admin);
        proxy = new ERC1967Proxy(address(roleManagerImpl), initData);
        roleManager = RoleManager(address(proxy));

        // 3. SupplyChainTracker
        SupplyChainTracker supplyChainTrackerImpl = new SupplyChainTracker();
        initData = abi.encodeWithSelector(
            SupplyChainTracker.initialize.selector,
            admin,
            address(roleManager)
        );
        proxy = new ERC1967Proxy(address(supplyChainTrackerImpl), initData);
        supplyChainTracker = SupplyChainTracker(address(proxy));

        // 4. DataVault
        DataVault dataVaultImpl = new DataVault();
        initData = abi.encodeWithSelector(
            DataVault.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        proxy = new ERC1967Proxy(address(dataVaultImpl), initData);
        dataVault = DataVault(address(proxy));

        // 5. CarbonFootprint
        CarbonFootprint carbonFootprintImpl = new CarbonFootprint();
        initData = abi.encodeWithSelector(
            CarbonFootprint.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        proxy = new ERC1967Proxy(address(carbonFootprintImpl), initData);
        carbonFootprint = CarbonFootprint(address(proxy));

        // 6. SecondLifeManager
        SecondLifeManager secondLifeManagerImpl = new SecondLifeManager();
        initData = abi.encodeWithSelector(
            SecondLifeManager.initialize.selector,
            admin,
            address(batteryRegistry),
            address(roleManager)
        );
        proxy = new ERC1967Proxy(address(secondLifeManagerImpl), initData);
        secondLifeManager = SecondLifeManager(address(proxy));

        // 7. RecyclingManager
        RecyclingManager recyclingManagerImpl = new RecyclingManager();
        initData = abi.encodeWithSelector(
            RecyclingManager.initialize.selector,
            admin,
            address(batteryRegistry),
            address(roleManager)
        );
        proxy = new ERC1967Proxy(address(recyclingManagerImpl), initData);
        recyclingManager = RecyclingManager(address(proxy));
    }

    function _setupRoles() internal {
        // Grant manufacturer role
        batteryRegistry.grantManufacturerRole(manufacturer);
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "CATL Battery Co.",
            "QmManufacturerCert123"
        );

        // Grant OEM role
        batteryRegistry.grantOEMRole(oem);
        roleManager.registerActor(
            oem,
            RoleManager.Role.OEM,
            "Tesla Inc.",
            "QmOEMCert456"
        );

        // Grant operator role
        batteryRegistry.grantOperatorRole(operator);
        roleManager.registerActor(
            operator,
            RoleManager.Role.FleetOperator,
            "Uber Fleet",
            "QmOperatorCert789"
        );

        // Grant aftermarket role
        secondLifeManager.grantAftermarketUserRole(aftermarketUser);
        roleManager.registerActor(
            aftermarketUser,
            RoleManager.Role.AftermarketUser,
            "Home Energy Solutions",
            "QmAftermarketCert321"
        );

        // Grant recycler role
        batteryRegistry.grantRecyclerRole(recycler);
        recyclingManager.grantRecyclerRole(recycler);
        roleManager.registerActor(
            recycler,
            RoleManager.Role.Recycler,
            "Li-Cycle Corp.",
            "QmRecyclerCert654"
        );

        // Grant tracking roles
        supplyChainTracker.grantTrackerRole(admin);
        dataVault.grantDataWriterRole(admin);
        carbonFootprint.grantCarbonAuditorRole(admin);
        secondLifeManager.grantCertifierRole(admin);
        recyclingManager.grantAuditorRole(admin);
    }

    // ============================================
    // INTEGRATION TEST
    // ============================================

    function test_FullLifecycleIntegration() public {
        console2.log("\n==============================================");
        console2.log("FULL BATTERY LIFECYCLE INTEGRATION TEST");
        console2.log("==============================================\n");

        // PHASE 1: MANUFACTURING
        console2.log("--- PHASE 1: MANUFACTURING ---");
        _testManufacturing();

        // PHASE 2: VEHICLE INTEGRATION (OEM)
        console2.log("\n--- PHASE 2: VEHICLE INTEGRATION ---");
        _testVehicleIntegration();

        // PHASE 3: FIRST LIFE OPERATION
        console2.log("\n--- PHASE 3: FIRST LIFE OPERATION ---");
        _testFirstLifeOperation();

        // PHASE 4: SECOND LIFE
        console2.log("\n--- PHASE 4: SECOND LIFE ---");
        _testSecondLife();

        // PHASE 5: RECYCLING
        console2.log("\n--- PHASE 5: RECYCLING ---");
        _testRecycling();

        console2.log("\n==============================================");
        console2.log("[SUCCESS] FULL LIFECYCLE TEST PASSED");
        console2.log("==============================================\n");
    }

    function _testManufacturing() internal {
        // 1. Register battery
        vm.prank(manufacturer);
        batteryRegistry.registerBattery(
            testBin,
            BatteryRegistry.Chemistry.NMC,
            100_000, // 100 kWh (100,000 Wh) - Tesla Model S/X equivalent
            500,    // 500 kg CO2e manufacturing
            keccak256("QmBatteryCert123")
        );
        console2.log("[OK] Battery registered");

        // 2. Store manufacturing parameters
        DataVault.ParameterUpdate[] memory params = new DataVault.ParameterUpdate[](3);
        params[0] = DataVault.ParameterUpdate({
            key: keccak256("cell_voltage"),
            value: bytes32(uint256(3_700)), // 3.7V
            category: DataVault.ParameterCategory.Manufacturing
        });
        params[1] = DataVault.ParameterUpdate({
            key: keccak256("cathode_material"),
            value: keccak256("NMC811"),
            category: DataVault.ParameterCategory.Chemistry
        });
        params[2] = DataVault.ParameterUpdate({
            key: keccak256("eu_passport_id"),
            value: keccak256("EU-BP-2027-12345"),
            category: DataVault.ParameterCategory.Compliance
        });
        dataVault.batchStoreParameters(testBin, params);
        console2.log("[OK] Manufacturing parameters stored");

        // 3. Add manufacturing emissions
        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.Manufacturing,
            500, // kg CO2e
            keccak256("QmEmissionsCert"),
            "Cell production emissions"
        );
        console2.log("[OK] Manufacturing emissions recorded");

        // 4. Start tracking
        supplyChainTracker.startBatteryJourney(
            testBin,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );
        console2.log("[OK] Battery journey started");

        // Verify state
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(testBin);
        assertEq(uint(battery.state), uint(BatteryRegistry.BatteryState.Manufactured));
        assertEq(battery.sohCurrent, 10_000); // 100%
    }

    function _testVehicleIntegration() internal {
        // 1. Transfer to OEM
        vm.prank(admin);
        supplyChainTracker.transferBattery(
            testBin,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            keccak256("Shanghai Factory"),
            keccak256("QmTransferDoc1")
        );
        console2.log("[OK] Battery transferred to OEM");

        // 2. Integrate into vehicle
        vm.prank(oem);
        batteryRegistry.integrateBattery(testBin, testVin);
        console2.log("[OK] Battery integrated into vehicle");

        // 3. Add transportation emissions
        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.Transportation,
            50, // kg CO2e
            keccak256("QmShippingDoc"),
            "Factory to assembly plant"
        );
        console2.log("[OK] Transportation emissions recorded");

        // Verify
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(testBin);
        assertEq(uint(battery.state), uint(BatteryRegistry.BatteryState.Integrated));
        assertEq(battery.vin, testVin);
    }

    function _testFirstLifeOperation() internal {
        // 1. Change to FirstLife state
        vm.prank(operator);
        batteryRegistry.changeBatteryState(testBin, BatteryRegistry.BatteryState.FirstLife);
        console2.log("[OK] Battery in first life operation");

        // 2. Simulate usage - update SOH over time
        vm.prank(operator);
        batteryRegistry.updateSOH(testBin, 7_500, 1000); // 75% SOH after 1000 cycles
        console2.log("[OK] SOH updated to 75%");

        // 3. Add operational emissions
        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.FirstLifeUsage,
            2000, // kg CO2e over vehicle lifetime
            keccak256("QmUsageData"),
            "Charging emissions (grid mix)"
        );
        console2.log("[OK] First life emissions recorded");

        // Verify
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(testBin);
        assertEq(battery.sohCurrent, 7_500);
        assertEq(battery.cyclesCompleted, 1000);
    }

    function _testSecondLife() internal {
        // 1. Request second life certification
        vm.prank(operator);
        secondLifeManager.requestCertification(testBin);
        console2.log("[OK] Second life certification requested");

        // 2. Approve certification
        secondLifeManager.approveCertification(
            testBin,
            75_000, // 75 kWh remaining (75% of 100 kWh)
            3,      // 3 years validity
            keccak256("QmSecondLifeCert"),
            "Battery suitable for stationary storage"
        );
        console2.log("[OK] Second life certification approved");

        // 3. Start second life application
        vm.prank(aftermarketUser);
        secondLifeManager.startSecondLife(
            testBin,
            SecondLifeManager.ApplicationType.HomeEnergyStorage,
            keccak256("QmInstallationDoc")
        );
        console2.log("[OK] Second life started (Home Energy Storage)");

        // 4. Report performance
        vm.prank(aftermarketUser);
        secondLifeManager.reportPerformance(
            testBin,
            7_200, // 72% SOH
            8_000, // 80% SOC
            200,   // 200 cycles in second life
            250,   // 25.0°C
            keccak256("QmTelemetryData")
        );
        console2.log("[OK] Second life performance reported");

        // 5. Change state and add emissions
        vm.prank(operator);
        batteryRegistry.changeBatteryState(testBin, BatteryRegistry.BatteryState.SecondLife);

        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.SecondLifeUsage,
            300, // kg CO2e
            keccak256("QmSecondLifeEmissions"),
            "Home energy storage usage"
        );
        console2.log("[OK] Second life emissions recorded");

        // Verify
        assertTrue(secondLifeManager.isInSecondLife(testBin));
    }

    function _testRecycling() internal {
        // 1. End second life
        vm.prank(aftermarketUser);
        secondLifeManager.endSecondLife(testBin);
        console2.log("[OK] Second life ended");

        // 2. Change to EndOfLife
        vm.prank(operator);
        batteryRegistry.changeBatteryState(testBin, BatteryRegistry.BatteryState.EndOfLife);
        console2.log("[OK] Battery marked as End of Life");

        // 3. Start recycling
        vm.prank(recycler);
        recyclingManager.startRecycling(
            testBin,
            RecyclingManager.RecyclingMethod.Hydrometallurgical,
            600, // 600 kg total weight
            keccak256("QmRecyclingFacilityCert")
        );
        console2.log("[OK] Recycling started");

        // 4. Record material recovery (batch)
        RecyclingManager.MaterialBatch[] memory materials = new RecyclingManager.MaterialBatch[](4);
        materials[0] = RecyclingManager.MaterialBatch({
            material: RecyclingManager.MaterialType.Lithium,
            recoveredKg: 40,  // 40 kg Li recovered
            inputKg: 50       // 80% recovery
        });
        materials[1] = RecyclingManager.MaterialBatch({
            material: RecyclingManager.MaterialType.Cobalt,
            recoveredKg: 45,  // 45 kg Co
            inputKg: 50       // 90% recovery
        });
        materials[2] = RecyclingManager.MaterialBatch({
            material: RecyclingManager.MaterialType.Nickel,
            recoveredKg: 90,  // 90 kg Ni
            inputKg: 100      // 90% recovery
        });
        materials[3] = RecyclingManager.MaterialBatch({
            material: RecyclingManager.MaterialType.Copper,
            recoveredKg: 95,  // 95 kg Cu
            inputKg: 100      // 95% recovery
        });

        vm.prank(recycler);
        recyclingManager.batchRecordMaterials(testBin, materials);
        console2.log("[OK] Material recovery recorded (Li, Co, Ni, Cu)");

        // 5. Complete recycling
        vm.prank(recycler);
        recyclingManager.completeRecycling(testBin, keccak256("QmRecyclingProcessDoc"));
        console2.log("[OK] Recycling completed");

        // 6. Add recycling emissions
        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.Recycling,
            100, // kg CO2e
            keccak256("QmRecyclingEmissions"),
            "Hydrometallurgical processing"
        );
        console2.log("[OK] Recycling emissions recorded");

        // 7. Calculate total carbon footprint
        uint256 totalFootprint = carbonFootprint.calculateTotalFootprint(testBin);
        console2.log("[OK] Total lifecycle carbon footprint:", totalFootprint, "kg CO2e");

        // Verify recycling
        RecyclingManager.RecyclingData memory recyclingData = recyclingManager.getRecyclingData(testBin);
        assertEq(uint(recyclingData.status), uint(RecyclingManager.RecyclingStatus.Completed));
        assertTrue(recyclingData.totalRecoveredWeightKg > 0);

        // Verify materials
        (uint256 li, uint256 co, uint256 ni, uint256 cu,,,) = recyclingManager.getMaterialBreakdown(testBin);
        assertEq(li, 40);
        assertEq(co, 45);
        assertEq(ni, 90);
        assertEq(cu, 95);

        // Verify total footprint
        assertEq(totalFootprint, 2950); // 500 + 50 + 2000 + 300 + 100
    }

    // ============================================
    // INDIVIDUAL FEATURE TESTS
    // ============================================

    function test_DataVaultParameterStorage() public {
        // Register battery first
        vm.prank(manufacturer);
        batteryRegistry.registerBattery(
            testBin,
            BatteryRegistry.Chemistry.LFP,
            90_000, // 90 kWh - BMW iX equivalent
            400,
            keccak256("cert")
        );

        // Store single parameter
        dataVault.storeParameter(
            testBin,
            keccak256("test_param"),
            bytes32(uint256(12345)),
            DataVault.ParameterCategory.Performance
        );

        // Retrieve parameter
        bytes32 value = dataVault.getParameter(testBin, keccak256("test_param"));
        assertEq(uint256(value), 12345);

        // Verify count
        assertEq(dataVault.parameterCount(testBin), 1);
    }

    function test_CarbonFootprintAggregation() public {
        vm.prank(manufacturer);
        batteryRegistry.registerBattery(testBin, BatteryRegistry.Chemistry.NMC, 107_000, 0, bytes32(0)); // 107 kWh - Mercedes EQS

        // Add emissions across phases
        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.Manufacturing,
            500,
            bytes32(0),
            ""
        );

        carbonFootprint.addEmission(
            testBin,
            CarbonFootprint.LifecyclePhase.Transportation,
            50,
            bytes32(0),
            ""
        );

        // Verify totals
        uint256 total = carbonFootprint.getTotalFootprint(testBin);
        assertEq(total, 550);

        (uint256 raw, uint256 mfg, uint256 transport,,,) = carbonFootprint.getEmissionsBreakdown(testBin);
        assertEq(mfg, 500);
        assertEq(transport, 50);
    }
}
