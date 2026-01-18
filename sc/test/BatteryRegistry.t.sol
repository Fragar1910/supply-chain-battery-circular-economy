// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/BatteryRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract BatteryRegistryTest is Test {
    BatteryRegistry public registry;
    BatteryRegistry public implementation;

    address public admin = address(1);
    address public manufacturer = address(2);
    address public oem = address(3);
    address public operator = address(4);
    address public recycler = address(5);
    address public user = address(6);

    bytes32 public constant TEST_BIN = keccak256("BATTERY-001");
    bytes32 public constant TEST_VIN = keccak256("VEHICLE-001");
    bytes32 public constant TEST_IPFS = keccak256("QmTest123");

    event BatteryRegistered(
        bytes32 indexed bin,
        address indexed manufacturer,
        BatteryRegistry.Chemistry chemistry,
        uint32 capacityKwh,
        uint64 manufactureDate
    );

    event BatteryIntegrated(
        bytes32 indexed bin,
        bytes32 indexed vin,
        address indexed oem,
        uint64 integrationDate
    );

    event BatteryStateChanged(
        bytes32 indexed bin,
        BatteryRegistry.BatteryState previousState,
        BatteryRegistry.BatteryState newState,
        address indexed changedBy
    );

    function setUp() public {
        // Deploy implementation
        implementation = new BatteryRegistry();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            BatteryRegistry.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        registry = BatteryRegistry(address(proxy));

        // Grant roles
        vm.startPrank(admin);
        registry.grantManufacturerRole(manufacturer);
        registry.grantOEMRole(oem);
        registry.grantOperatorRole(operator);
        registry.grantRecyclerRole(recycler);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public view {
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), admin));
        assertEq(registry.totalBatteriesRegistered(), 0);
    }

    function test_CannotInitializeTwice() public {
        vm.expectRevert();
        registry.initialize(admin);
    }

    /*//////////////////////////////////////////////////////////////
                    BATTERY REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterBattery() public {
        vm.startPrank(manufacturer);

        vm.expectEmit(true, true, false, true);
        emit BatteryRegistered(
            TEST_BIN,
            manufacturer,
            BatteryRegistry.Chemistry.NMC,
            50_000, // 50 kWh
            uint64(block.timestamp)
        );

        registry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            50_000,
            1500, // 1500 kg CO2e
            TEST_IPFS
        );

        vm.stopPrank();

        assertTrue(registry.binExists(TEST_BIN));
        assertEq(registry.totalBatteriesRegistered(), 1);

        BatteryRegistry.BatteryData memory battery = registry.getBattery(TEST_BIN);
        assertEq(battery.bin, TEST_BIN);
        assertEq(battery.manufacturer, manufacturer);
        assertEq(battery.currentOwner, manufacturer);
        assertEq(uint8(battery.state), uint8(BatteryRegistry.BatteryState.Manufactured));
        assertEq(uint8(battery.chemistry), uint8(BatteryRegistry.Chemistry.NMC));
        assertEq(battery.capacityKwh, 50_000);
        assertEq(battery.sohManufacture, 10_000); // 100%
        assertEq(battery.sohCurrent, 10_000);
        assertEq(battery.cyclesCompleted, 0);
        assertEq(battery.carbonFootprintTotal, 1500);
    }

    function test_RevertWhen_NonManufacturerRegisters() public {
        vm.prank(user);
        vm.expectRevert();
        registry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            50_000,
            1500,
            TEST_IPFS
        );
    }

    function test_RevertWhen_RegisteringDuplicateBIN() public {
        vm.startPrank(manufacturer);

        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.expectRevert("BatteryRegistry: Battery already exists");
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.LFP, 60_000, 1800, TEST_IPFS);

        vm.stopPrank();
    }

    function test_RevertWhen_RegisteringWithZeroBIN() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Invalid BIN");
        registry.registerBattery(
            bytes32(0),
            BatteryRegistry.Chemistry.NMC,
            50_000,
            1500,
            TEST_IPFS
        );
    }

    function test_RevertWhen_RegisteringWithZeroCapacity() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Invalid capacity");
        registry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            0,
            1500,
            TEST_IPFS
        );
    }

    /*//////////////////////////////////////////////////////////////
                    BATTERY INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IntegrateBattery() public {
        // First register
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        // Then integrate
        vm.startPrank(oem);

        vm.expectEmit(true, true, true, true);
        emit BatteryIntegrated(TEST_BIN, TEST_VIN, oem, uint64(block.timestamp));

        registry.integrateBattery(TEST_BIN, TEST_VIN);

        vm.stopPrank();

        BatteryRegistry.BatteryData memory battery = registry.getBattery(TEST_BIN);
        assertEq(battery.vin, TEST_VIN);
        assertEq(uint8(battery.state), uint8(BatteryRegistry.BatteryState.Integrated));
        assertTrue(battery.integrationDate > 0);
    }

    function test_RevertWhen_NonOEMIntegrates() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(user);
        vm.expectRevert();
        registry.integrateBattery(TEST_BIN, TEST_VIN);
    }

    function test_RevertWhen_IntegratingNonManufacturedBattery() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        // Change state to FirstLife
        vm.prank(operator);
        registry.changeBatteryState(TEST_BIN, BatteryRegistry.BatteryState.FirstLife);

        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: Battery must be in Manufactured state");
        registry.integrateBattery(TEST_BIN, TEST_VIN);
    }

    /*//////////////////////////////////////////////////////////////
                        SOH UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateSOH() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(operator);
        registry.updateSOH(TEST_BIN, 9500, 100); // 95% SOH, 100 cycles

        BatteryRegistry.BatteryData memory battery = registry.getBattery(TEST_BIN);
        assertEq(battery.sohCurrent, 9500);
        assertEq(battery.cyclesCompleted, 100);
    }

    function test_RevertWhen_SOHExceeds100Percent() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(operator);
        vm.expectRevert("BatteryRegistry: SOH cannot exceed 100%");
        registry.updateSOH(TEST_BIN, 10_001, 100);
    }

    /*//////////////////////////////////////////////////////////////
                        STATE CHANGE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ChangeBatteryState() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit BatteryStateChanged(
            TEST_BIN,
            BatteryRegistry.BatteryState.Manufactured,
            BatteryRegistry.BatteryState.FirstLife,
            operator
        );

        registry.changeBatteryState(TEST_BIN, BatteryRegistry.BatteryState.FirstLife);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.FirstLife)
        );
    }

    function test_RevertWhen_ChangingToSameState() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(operator);
        vm.expectRevert("BatteryRegistry: Same state");
        registry.changeBatteryState(TEST_BIN, BatteryRegistry.BatteryState.Manufactured);
    }

    /*//////////////////////////////////////////////////////////////
                    OWNERSHIP TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferOwnership() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(manufacturer);
        registry.transferOwnership(TEST_BIN, oem);

        assertEq(registry.getOwner(TEST_BIN), oem);
    }

    function test_AdminCanTransferOwnership() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(admin);
        registry.transferOwnership(TEST_BIN, oem);

        assertEq(registry.getOwner(TEST_BIN), oem);
    }

    function test_RevertWhen_NonOwnerTransfers() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(user);
        vm.expectRevert("BatteryRegistry: Not authorized");
        registry.transferOwnership(TEST_BIN, oem);
    }

    /*//////////////////////////////////////////////////////////////
                        RECYCLING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecycleBattery() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        // Set to EndOfLife
        vm.prank(operator);
        registry.changeBatteryState(TEST_BIN, BatteryRegistry.BatteryState.EndOfLife);

        // Recycle
        vm.prank(recycler);
        registry.recycleBattery(TEST_BIN);

        BatteryRegistry.BatteryData memory battery = registry.getBattery(TEST_BIN);
        assertEq(uint8(battery.state), uint8(BatteryRegistry.BatteryState.Recycled));
        assertTrue(battery.recyclingDate > 0);
    }

    function test_RevertWhen_RecyclingNonEndOfLifeBattery() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(recycler);
        vm.expectRevert("BatteryRegistry: Battery must be EndOfLife or SecondLife");
        registry.recycleBattery(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetBattery() public {
        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        BatteryRegistry.BatteryData memory battery = registry.getBattery(TEST_BIN);
        assertEq(battery.bin, TEST_BIN);
    }

    function test_RevertWhen_GettingNonExistentBattery() public {
        vm.expectRevert("BatteryRegistry: Battery does not exist");
        registry.getBattery(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                    FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RegisterBattery(uint16 capacity, uint256 carbonFootprint) public {
        vm.assume(capacity > 0 && capacity < 65535);
        vm.assume(carbonFootprint < type(uint256).max);

        bytes32 bin = keccak256(abi.encodePacked("FUZZ", capacity));

        vm.prank(manufacturer);
        registry.registerBattery(
            bin,
            BatteryRegistry.Chemistry.NMC,
            capacity,
            carbonFootprint,
            TEST_IPFS
        );

        assertTrue(registry.binExists(bin));
    }

    function testFuzz_UpdateSOH(uint16 newSOH) public {
        vm.assume(newSOH <= 10_000);

        vm.prank(manufacturer);
        registry.registerBattery(TEST_BIN, BatteryRegistry.Chemistry.NMC, 50_000, 1500, TEST_IPFS);

        vm.prank(operator);
        registry.updateSOH(TEST_BIN, newSOH, 100);

        assertEq(registry.getCurrentSOH(TEST_BIN), newSOH);
    }
}
