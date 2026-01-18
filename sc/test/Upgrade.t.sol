// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {BatteryRegistry} from "../src/BatteryRegistry.sol";
import {RoleManager} from "../src/RoleManager.sol";
import {DataVault} from "../src/DataVault.sol";

/**
 * @title UpgradeTest
 * @notice Tests UUPS upgrade mechanism for all contracts
 * @dev Verifies that:
 *  - Only admin can upgrade
 *  - State is preserved after upgrade
 *  - New functionality works after upgrade
 */
contract UpgradeTest is Test {
    // ============================================
    // STATE VARIABLES
    // ============================================

    address public admin;
    address public user;

    BatteryRegistry public batteryRegistry;
    RoleManager public roleManager;
    DataVault public dataVault;

    bytes32 public constant TEST_BIN = keccak256("TEST_BATTERY_001");

    // ============================================
    // SETUP
    // ============================================

    function setUp() public {
        admin = address(this);
        user = makeAddr("user");

        // Deploy BatteryRegistry with proxy
        BatteryRegistry batteryRegistryImpl = new BatteryRegistry();
        bytes memory initData = abi.encodeWithSelector(
            BatteryRegistry.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(batteryRegistryImpl), initData);
        batteryRegistry = BatteryRegistry(address(proxy));

        // Deploy RoleManager with proxy
        RoleManager roleManagerImpl = new RoleManager();
        initData = abi.encodeWithSelector(
            RoleManager.initialize.selector,
            admin
        );
        proxy = new ERC1967Proxy(address(roleManagerImpl), initData);
        roleManager = RoleManager(address(proxy));

        // Deploy DataVault with proxy
        DataVault dataVaultImpl = new DataVault();
        initData = abi.encodeWithSelector(
            DataVault.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        proxy = new ERC1967Proxy(address(dataVaultImpl), initData);
        dataVault = DataVault(address(proxy));

        console2.log("==============================================");
        console2.log("UPGRADE TEST SETUP COMPLETE");
        console2.log("==============================================");
    }

    // ============================================
    // UPGRADE TESTS - BATTERY REGISTRY
    // ============================================

    function test_UpgradeBatteryRegistry() public {
        console2.log("\n--- TEST: Upgrade BatteryRegistry ---");

        // 1. Setup initial state
        batteryRegistry.grantManufacturerRole(admin);
        batteryRegistry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            100_000, // 100 kWh
            500,     // 500 kg CO2e
            keccak256("QmInitialCert")
        );

        console2.log("[OK] Battery registered in v1");

        // 2. Verify initial state
        BatteryRegistry.BatteryData memory batteryBefore = batteryRegistry.getBattery(TEST_BIN);
        assertEq(batteryBefore.capacityKwh, 100_000);
        assertEq(batteryBefore.carbonFootprintTotal, 500);

        // 3. Deploy new implementation (same contract for test)
        BatteryRegistry newImpl = new BatteryRegistry();
        console2.log("[OK] New implementation deployed");

        // 4. Upgrade
        UUPSUpgradeable(address(batteryRegistry)).upgradeToAndCall(
            address(newImpl),
            ""
        );
        console2.log("[OK] Upgrade completed");

        // 5. Verify state is preserved
        BatteryRegistry.BatteryData memory batteryAfterUpgrade = batteryRegistry.getBattery(TEST_BIN);
        assertEq(batteryAfterUpgrade.bin, TEST_BIN);
        assertEq(batteryAfterUpgrade.capacityKwh, 100_000);
        assertEq(batteryAfterUpgrade.carbonFootprintTotal, 500);
        assertEq(batteryAfterUpgrade.manufacturer, admin);

        console2.log("[OK] State preserved after upgrade");

        // 6. Verify new functionality still works
        batteryRegistry.grantOperatorRole(admin); // Grant role after upgrade
        batteryRegistry.updateSOH(TEST_BIN, 9500, 100);
        BatteryRegistry.BatteryData memory batteryUpdated = batteryRegistry.getBattery(TEST_BIN);
        assertEq(batteryUpdated.sohCurrent, 9500);
        assertEq(batteryUpdated.cyclesCompleted, 100);

        console2.log("[OK] New functionality works");
        console2.log("[SUCCESS] BatteryRegistry upgrade test passed\n");
    }

    function test_RevertWhen_NonAdminUpgradesBatteryRegistry() public {
        console2.log("\n--- TEST: Non-admin cannot upgrade BatteryRegistry ---");

        BatteryRegistry newImpl = new BatteryRegistry();

        vm.prank(user);
        vm.expectRevert();
        UUPSUpgradeable(address(batteryRegistry)).upgradeToAndCall(
            address(newImpl),
            ""
        );

        console2.log("[OK] Non-admin upgrade reverted");
        console2.log("[SUCCESS] Authorization test passed\n");
    }

    // ============================================
    // UPGRADE TESTS - ROLE MANAGER
    // ============================================

    function test_UpgradeRoleManager() public {
        console2.log("\n--- TEST: Upgrade RoleManager ---");

        // 1. Setup initial state
        roleManager.registerActor(
            user,
            RoleManager.Role.ComponentManufacturer,
            "Test Company",
            "QmTestCert"
        );

        console2.log("[OK] Actor registered in v1");

        // 2. Verify initial state
        RoleManager.ActorProfile memory profileBefore = roleManager.getActorProfile(user);
        assertEq(profileBefore.actorAddress, user);
        assertEq(uint(profileBefore.role), uint(RoleManager.Role.ComponentManufacturer));

        // 3. Deploy new implementation
        RoleManager newImpl = new RoleManager();
        console2.log("[OK] New implementation deployed");

        // 4. Upgrade
        UUPSUpgradeable(address(roleManager)).upgradeToAndCall(
            address(newImpl),
            ""
        );
        console2.log("[OK] Upgrade completed");

        // 5. Verify state is preserved
        RoleManager.ActorProfile memory profileAfterUpgrade = roleManager.getActorProfile(user);
        assertEq(profileAfterUpgrade.actorAddress, user);
        assertEq(uint(profileAfterUpgrade.role), uint(RoleManager.Role.ComponentManufacturer));
        assertTrue(profileAfterUpgrade.isActive);

        console2.log("[OK] State preserved after upgrade");
        console2.log("[SUCCESS] RoleManager upgrade test passed\n");
    }

    // ============================================
    // UPGRADE TESTS - DATA VAULT
    // ============================================

    function test_UpgradeDataVault() public {
        console2.log("\n--- TEST: Upgrade DataVault ---");

        // 1. Setup initial state
        batteryRegistry.grantManufacturerRole(admin);
        batteryRegistry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            100_000,
            500,
            keccak256("QmCert")
        );

        dataVault.grantDataWriterRole(admin);
        dataVault.storeParameter(
            TEST_BIN,
            keccak256("test_param"),
            bytes32(uint256(12345)),
            DataVault.ParameterCategory.Manufacturing
        );

        console2.log("[OK] Parameter stored in v1");

        // 2. Verify initial state
        bytes32 valueBefore = dataVault.getParameter(TEST_BIN, keccak256("test_param"));
        assertEq(uint256(valueBefore), 12345);

        // 3. Deploy new implementation
        DataVault newImpl = new DataVault();
        console2.log("[OK] New implementation deployed");

        // 4. Upgrade
        UUPSUpgradeable(address(dataVault)).upgradeToAndCall(
            address(newImpl),
            ""
        );
        console2.log("[OK] Upgrade completed");

        // 5. Verify state is preserved
        bytes32 valueAfterUpgrade = dataVault.getParameter(TEST_BIN, keccak256("test_param"));
        assertEq(uint256(valueAfterUpgrade), 12345);

        // 6. Verify parameter count preserved
        assertEq(dataVault.parameterCount(TEST_BIN), 1);

        console2.log("[OK] State preserved after upgrade");

        // 7. Verify new functionality works
        dataVault.storeParameter(
            TEST_BIN,
            keccak256("new_param"),
            bytes32(uint256(67890)),
            DataVault.ParameterCategory.Performance
        );
        assertEq(dataVault.parameterCount(TEST_BIN), 2);

        console2.log("[OK] New functionality works");
        console2.log("[SUCCESS] DataVault upgrade test passed\n");
    }

    // ============================================
    // MULTIPLE UPGRADE TEST
    // ============================================

    function test_MultipleUpgrades() public {
        console2.log("\n--- TEST: Multiple Sequential Upgrades ---");

        // 1. First upgrade
        BatteryRegistry newImpl1 = new BatteryRegistry();
        UUPSUpgradeable(address(batteryRegistry)).upgradeToAndCall(
            address(newImpl1),
            ""
        );
        console2.log("[OK] First upgrade completed");

        // 2. Second upgrade
        BatteryRegistry newImpl2 = new BatteryRegistry();
        UUPSUpgradeable(address(batteryRegistry)).upgradeToAndCall(
            address(newImpl2),
            ""
        );
        console2.log("[OK] Second upgrade completed");

        // 3. Verify still works
        batteryRegistry.grantManufacturerRole(admin);
        batteryRegistry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.LFP,
            90_000,
            400,
            keccak256("QmCert")
        );

        assertTrue(batteryRegistry.binExists(TEST_BIN));

        console2.log("[OK] Multiple upgrades work correctly");
        console2.log("[SUCCESS] Multiple upgrade test passed\n");
    }

    // ============================================
    // STORAGE COLLISION TEST
    // ============================================

    function test_NoStorageCollision() public {
        console2.log("\n--- TEST: No Storage Collision After Upgrade ---");

        // 1. Setup complex state
        batteryRegistry.grantManufacturerRole(admin);
        batteryRegistry.grantOEMRole(admin);
        batteryRegistry.grantOperatorRole(admin);

        batteryRegistry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            100_000,
            500,
            keccak256("QmCert")
        );

        batteryRegistry.integrateBattery(TEST_BIN, keccak256("VIN_001"));
        batteryRegistry.updateSOH(TEST_BIN, 9800, 50);

        console2.log("[OK] Complex state setup");

        // 2. Get all values before upgrade
        BatteryRegistry.BatteryData memory before = batteryRegistry.getBattery(TEST_BIN);

        // 3. Upgrade
        BatteryRegistry newImpl = new BatteryRegistry();
        UUPSUpgradeable(address(batteryRegistry)).upgradeToAndCall(
            address(newImpl),
            ""
        );
        console2.log("[OK] Upgrade completed");

        // 4. Verify ALL fields are preserved
        BatteryRegistry.BatteryData memory afterUpgrade = batteryRegistry.getBattery(TEST_BIN);

        assertEq(afterUpgrade.bin, before.bin);
        assertEq(afterUpgrade.vin, before.vin);
        assertEq(afterUpgrade.manufacturer, before.manufacturer);
        assertEq(uint(afterUpgrade.state), uint(before.state));
        assertEq(uint(afterUpgrade.chemistry), uint(before.chemistry));
        assertEq(afterUpgrade.sohManufacture, before.sohManufacture);
        assertEq(afterUpgrade.capacityKwh, before.capacityKwh);
        assertEq(afterUpgrade.currentOwner, before.currentOwner);
        assertEq(afterUpgrade.sohCurrent, before.sohCurrent);
        assertEq(afterUpgrade.cyclesCompleted, before.cyclesCompleted);
        assertEq(afterUpgrade.carbonFootprintTotal, before.carbonFootprintTotal);
        assertEq(afterUpgrade.manufactureDate, before.manufactureDate);
        assertEq(afterUpgrade.integrationDate, before.integrationDate);
        assertEq(afterUpgrade.ipfsCertHash, before.ipfsCertHash);

        console2.log("[OK] All storage slots preserved correctly");
        console2.log("[SUCCESS] No storage collision test passed\n");
    }
}
