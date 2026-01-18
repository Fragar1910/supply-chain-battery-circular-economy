// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/SupplyChainTracker.sol";
import "../src/RoleManager.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SupplyChainTrackerTest is Test {
    SupplyChainTracker public tracker;
    RoleManager public roleManager;

    address public admin = address(1);
    address public manufacturer = address(2);
    address public oem = address(3);
    address public fleetOp = address(4);
    address public recycler = address(5);

    bytes32 public constant TEST_BIN = keccak256("BATTERY-001");
    bytes32 public constant TEST_LOCATION = keccak256("GPS:40.7128N,74.0060W");
    bytes32 public constant TEST_DOC = keccak256("QmDoc123");

    event BatteryJourneyStarted(
        bytes32 indexed bin,
        address indexed initialCustodian,
        RoleManager.Role initialRole,
        uint64 timestamp
    );

    event BatteryTransferred(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        RoleManager.Role fromRole,
        RoleManager.Role toRole,
        uint64 timestamp
    );

    function setUp() public {
        // Deploy RoleManager
        RoleManager roleImpl = new RoleManager();
        bytes memory roleInitData = abi.encodeWithSelector(
            RoleManager.initialize.selector,
            admin
        );
        ERC1967Proxy roleProxy = new ERC1967Proxy(address(roleImpl), roleInitData);
        roleManager = RoleManager(address(roleProxy));

        // Deploy SupplyChainTracker
        SupplyChainTracker trackerImpl = new SupplyChainTracker();
        bytes memory trackerInitData = abi.encodeWithSelector(
            SupplyChainTracker.initialize.selector,
            admin,
            address(roleManager)
        );
        ERC1967Proxy trackerProxy = new ERC1967Proxy(address(trackerImpl), trackerInitData);
        tracker = SupplyChainTracker(address(trackerProxy));

        // Register actors in RoleManager
        vm.startPrank(admin);
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Battery Factory",
            "QmCert1"
        );
        roleManager.registerActor(
            oem,
            RoleManager.Role.OEM,
            "Tesla Motors",
            "QmCert2"
        );
        roleManager.registerActor(
            fleetOp,
            RoleManager.Role.FleetOperator,
            "Uber Fleet",
            "QmCert3"
        );
        roleManager.registerActor(
            recycler,
            RoleManager.Role.Recycler,
            "Green Recycling",
            "QmCert4"
        );
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public view {
        assertTrue(tracker.hasRole(tracker.ADMIN_ROLE(), admin));
        assertTrue(tracker.hasRole(tracker.TRACKER_ROLE(), admin));
        assertEq(address(tracker.roleManager()), address(roleManager));
        assertEq(tracker.totalBatteriesTracked(), 0);
        assertEq(tracker.totalTransfers(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                    JOURNEY START TESTS
    //////////////////////////////////////////////////////////////*/

    function test_StartBatteryJourney() public {
        vm.startPrank(admin);

        vm.expectEmit(true, true, false, true);
        emit BatteryJourneyStarted(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            uint64(block.timestamp)
        );

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.stopPrank();

        assertTrue(tracker.isTracked(TEST_BIN));
        assertEq(tracker.totalBatteriesTracked(), 1);

        SupplyChainTracker.BatteryJourney memory journey = tracker.getBatteryJourney(TEST_BIN);
        assertEq(journey.bin, TEST_BIN);
        assertEq(journey.totalTransfers, 0);
        assertEq(journey.currentCustodian, manufacturer);
        assertEq(uint8(journey.currentRole), uint8(RoleManager.Role.ComponentManufacturer));
        assertFalse(journey.isInTransit);
    }

    function test_RevertWhen_StartingWithNonManufacturer() public {
        vm.prank(admin);
        vm.expectRevert("SupplyChainTracker: Must start with manufacturer");
        tracker.startBatteryJourney(
            TEST_BIN,
            oem,
            RoleManager.Role.OEM
        );
    }

    function test_RevertWhen_StartingAlreadyTrackedBattery() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.expectRevert("SupplyChainTracker: Battery already tracked");
        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferBattery() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.expectEmit(true, true, true, true);
        emit BatteryTransferred(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.ComponentManufacturer,
            RoleManager.Role.OEM,
            uint64(block.timestamp)
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        assertEq(tracker.totalTransfers(), 1);

        SupplyChainTracker.BatteryJourney memory journey = tracker.getBatteryJourney(TEST_BIN);
        assertEq(journey.currentCustodian, oem);
        assertEq(uint8(journey.currentRole), uint8(RoleManager.Role.OEM));
        assertEq(journey.totalTransfers, 1);
    }

    function test_TransferMultipleTimes() public {
        vm.startPrank(admin);

        // Start: Manufacturer
        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        // Transfer 1: Manufacturer -> OEM
        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        // Transfer 2: OEM -> FleetOperator
        tracker.transferBattery(
            TEST_BIN,
            oem,
            fleetOp,
            RoleManager.Role.FleetOperator,
            TEST_LOCATION,
            TEST_DOC
        );

        // Transfer 3: FleetOperator -> Recycler
        tracker.transferBattery(
            TEST_BIN,
            fleetOp,
            recycler,
            RoleManager.Role.Recycler,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        assertEq(tracker.totalTransfers(), 3);
        assertEq(tracker.getTransferCount(TEST_BIN), 3);

        SupplyChainTracker.BatteryJourney memory journey = tracker.getBatteryJourney(TEST_BIN);
        assertEq(journey.currentCustodian, recycler);
        assertEq(uint8(journey.currentRole), uint8(RoleManager.Role.Recycler));
        assertEq(journey.totalTransfers, 3);
    }

    function test_RevertWhen_InvalidCurrentCustodian() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.expectRevert("SupplyChainTracker: Invalid current custodian");
        tracker.transferBattery(
            TEST_BIN,
            oem, // Wrong! Should be manufacturer
            fleetOp,
            RoleManager.Role.FleetOperator,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();
    }

    function test_RevertWhen_InvalidRoleTransition() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.expectRevert("SupplyChainTracker: Invalid role transition");
        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            recycler, // Invalid: Manufacturer -> Recycler
            RoleManager.Role.Recycler,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();
    }

    function test_RevertWhen_RecipientDoesNotHaveRole() public {
        address fakeOem = address(99);

        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.expectRevert("SupplyChainTracker: Recipient does not have claimed role");
        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            fakeOem, // Not registered with OEM role
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    TRANSFER HISTORY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetTransferHistory() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        SupplyChainTracker.Transfer[] memory history = tracker.getTransferHistory(TEST_BIN);
        assertEq(history.length, 1);
        assertEq(history[0].from, manufacturer);
        assertEq(history[0].to, oem);
        assertEq(uint8(history[0].fromRole), uint8(RoleManager.Role.ComponentManufacturer));
        assertEq(uint8(history[0].toRole), uint8(RoleManager.Role.OEM));
        assertEq(history[0].location, TEST_LOCATION);
        assertEq(history[0].documentHash, TEST_DOC);
    }

    function test_GetSpecificTransfer() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        tracker.transferBattery(
            TEST_BIN,
            oem,
            fleetOp,
            RoleManager.Role.FleetOperator,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        SupplyChainTracker.Transfer memory transfer = tracker.getTransfer(TEST_BIN, 1);
        assertEq(transfer.from, oem);
        assertEq(transfer.to, fleetOp);
    }

    /*//////////////////////////////////////////////////////////////
                    LOCATION UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateLocation() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            bytes32(0), // No location initially
            TEST_DOC
        );

        bytes32 newLocation = keccak256("GPS:34.0522N,118.2437W");
        tracker.updateLocation(TEST_BIN, newLocation);

        vm.stopPrank();

        SupplyChainTracker.Transfer memory transfer = tracker.getTransfer(TEST_BIN, 0);
        assertEq(transfer.location, newLocation);
    }

    function test_RevertWhen_UpdatingWithInvalidLocation() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.expectRevert("SupplyChainTracker: Invalid location");
        tracker.updateLocation(TEST_BIN, bytes32(0));

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    DOCUMENT UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddTransferDocument() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            bytes32(0) // No document initially
        );

        bytes32 newDoc = keccak256("QmNewDoc456");
        tracker.addTransferDocument(TEST_BIN, 0, newDoc);

        vm.stopPrank();

        SupplyChainTracker.Transfer memory transfer = tracker.getTransfer(TEST_BIN, 0);
        assertEq(transfer.documentHash, newDoc);
    }

    /*//////////////////////////////////////////////////////////////
                CUSTODY CHAIN VERIFICATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_VerifyCustodyChain_ValidChain() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        vm.warp(block.timestamp + 1 days);
        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.warp(block.timestamp + 2 days); // Advance to 3 days total
        tracker.transferBattery(
            TEST_BIN,
            oem,
            fleetOp,
            RoleManager.Role.FleetOperator,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        assertTrue(tracker.verifyCustodyChain(TEST_BIN));
    }

    function test_VerifyCustodyChain_EmptyHistory() public {
        vm.prank(admin);
        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        assertTrue(tracker.verifyCustodyChain(TEST_BIN));
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetCurrentCustodian() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        assertEq(tracker.getCurrentCustodian(TEST_BIN), oem);
    }

    function test_GetCurrentRole() public {
        vm.startPrank(admin);

        tracker.startBatteryJourney(
            TEST_BIN,
            manufacturer,
            RoleManager.Role.ComponentManufacturer
        );

        tracker.transferBattery(
            TEST_BIN,
            manufacturer,
            oem,
            RoleManager.Role.OEM,
            TEST_LOCATION,
            TEST_DOC
        );

        vm.stopPrank();

        assertEq(
            uint8(tracker.getCurrentRole(TEST_BIN)),
            uint8(RoleManager.Role.OEM)
        );
    }

    /*//////////////////////////////////////////////////////////////
                    ADMIN FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetRoleManager() public {
        RoleManager newRoleManager = new RoleManager();

        vm.prank(admin);
        tracker.setRoleManager(address(newRoleManager));

        assertEq(address(tracker.roleManager()), address(newRoleManager));
    }

    function test_RevertWhen_NonAdminSetsRoleManager() public {
        RoleManager newRoleManager = new RoleManager();

        vm.prank(manufacturer);
        vm.expectRevert();
        tracker.setRoleManager(address(newRoleManager));
    }

    function test_GrantTrackerRole() public {
        address newTracker = address(99);

        vm.prank(admin);
        tracker.grantTrackerRole(newTracker);

        assertTrue(tracker.hasRole(tracker.TRACKER_ROLE(), newTracker));
    }
}
