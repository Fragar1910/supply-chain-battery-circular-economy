// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/BatteryRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title BatteryRegistryTransferTest
 * @notice Comprehensive test suite for the two-step battery transfer system
 * @dev Tests for initiateTransfer, acceptTransfer, rejectTransfer, cancelTransfer, and clearExpiredTransfer
 */
contract BatteryRegistryTransferTest is Test {
    BatteryRegistry public registry;
    BatteryRegistry public implementation;

    address public admin = address(1);
    address public manufacturer = address(2);
    address public oem = address(3);
    address public customer = address(4);
    address public secondLifeOperator = address(5);
    address public recycler = address(6);
    address public unauthorized = address(99);

    bytes32 public constant TEST_BIN = keccak256("BATTERY-TRANSFER-001");
    bytes32 public constant TEST_IPFS = keccak256("QmTest123");

    // Transfer expiration constant (must match contract)
    uint256 public constant TRANSFER_EXPIRATION = 7 days;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TransferInitiated(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        BatteryRegistry.BatteryState newState,
        uint64 timestamp
    );

    event TransferAccepted(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        BatteryRegistry.BatteryState newState,
        uint64 timestamp
    );

    event TransferRejected(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        uint64 timestamp
    );

    event TransferCancelled(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        uint64 timestamp
    );

    event TransferExpired(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        uint64 timestamp
    );

    event BatteryOwnershipTransferred(
        bytes32 indexed bin,
        address indexed previousOwner,
        address indexed newOwner
    );

    event BatteryStateChanged(
        bytes32 indexed bin,
        BatteryRegistry.BatteryState previousState,
        BatteryRegistry.BatteryState newState,
        address indexed changedBy
    );

    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/

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
        registry.grantOperatorRole(customer);
        registry.grantOperatorRole(secondLifeOperator);
        registry.grantRecyclerRole(recycler);
        vm.stopPrank();

        // Register a test battery as manufacturer
        vm.prank(manufacturer);
        registry.registerBattery(
            TEST_BIN,
            BatteryRegistry.Chemistry.NMC,
            50_000, // 50 kWh
            1500,   // 1500 kg CO2e
            TEST_IPFS
        );
    }

    /*//////////////////////////////////////////////////////////////
                    INITIATE TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test basic transfer initiation
    function test_InitiateTransfer() public {
        vm.startPrank(manufacturer);

        vm.expectEmit(true, true, true, true);
        emit TransferInitiated(
            TEST_BIN,
            manufacturer,
            oem,
            BatteryRegistry.BatteryState.Integrated,
            uint64(block.timestamp)
        );

        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        vm.stopPrank();

        // Verify pending transfer exists
        assertTrue(registry.hasPendingTransfer(TEST_BIN));

        // Verify transfer details
        BatteryRegistry.PendingTransfer memory transfer = registry.getPendingTransfer(TEST_BIN);

        assertEq(transfer.from, manufacturer);
        assertEq(transfer.to, oem);
        assertEq(uint8(transfer.newState), uint8(BatteryRegistry.BatteryState.Integrated));
        assertEq(transfer.initiatedAt, uint64(block.timestamp));
        assertTrue(transfer.isActive);

        // Verify owner and state have NOT changed yet
        assertEq(registry.getOwner(TEST_BIN), manufacturer);
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Manufactured)
        );
    }

    /// @notice Test that admin can initiate transfer
    function test_AdminCanInitiateTransfer() public {
        vm.prank(admin);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        assertTrue(registry.hasPendingTransfer(TEST_BIN));
    }

    /// @notice Test revert when non-owner tries to initiate transfer
    function test_RevertWhen_NonOwnerInitiatesTransfer() public {
        vm.prank(unauthorized);
        vm.expectRevert("BatteryRegistry: Not authorized");
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );
    }

    /// @notice Test revert when trying to transfer to self
    function test_RevertWhen_TransferToSelf() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Cannot transfer to yourself");
        registry.initiateTransfer(
            TEST_BIN,
            manufacturer,
            BatteryRegistry.BatteryState.Integrated
        );
    }

    /// @notice Test revert when trying to transfer to zero address
    function test_RevertWhen_TransferToZeroAddress() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Invalid address");
        registry.initiateTransfer(
            TEST_BIN,
            address(0),
            BatteryRegistry.BatteryState.Integrated
        );
    }

    /// @notice Test revert when battery has pending transfer
    function test_RevertWhen_BatteryHasPendingTransfer() public {
        vm.startPrank(manufacturer);

        // Initiate first transfer
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Try to initiate second transfer
        vm.expectRevert("BatteryRegistry: Transfer already pending");
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );

        vm.stopPrank();
    }

    /// @notice Test revert when invalid state transition
    function test_RevertWhen_InvalidStateTransition() public {
        vm.prank(manufacturer);
        // Cannot go directly from Manufactured to Recycled
        vm.expectRevert("BatteryRegistry: Invalid state transition from Manufactured");
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.Recycled
        );
    }

    /*//////////////////////////////////////////////////////////////
                    ACCEPT TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test successful transfer acceptance
    function test_AcceptTransfer() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Accept transfer
        vm.startPrank(oem);

        vm.expectEmit(true, true, true, true);
        emit BatteryOwnershipTransferred(TEST_BIN, manufacturer, oem);

        vm.expectEmit(true, false, false, true);
        emit BatteryStateChanged(
            TEST_BIN,
            BatteryRegistry.BatteryState.Manufactured,
            BatteryRegistry.BatteryState.Integrated,
            oem
        );

        vm.expectEmit(true, true, true, true);
        emit TransferAccepted(
            TEST_BIN,
            manufacturer,
            oem,
            BatteryRegistry.BatteryState.Integrated,
            uint64(block.timestamp)
        );

        registry.acceptTransfer(TEST_BIN);

        vm.stopPrank();

        // Verify ownership changed
        assertEq(registry.getOwner(TEST_BIN), oem);

        // Verify state changed
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Integrated)
        );

        // Verify pending transfer removed
        assertFalse(registry.hasPendingTransfer(TEST_BIN));
    }

    /// @notice Test revert when non-recipient tries to accept
    function test_RevertWhen_NotRecipient() public {
        // Initiate transfer to oem
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Try to accept as customer (not the recipient)
        vm.prank(customer);
        vm.expectRevert("BatteryRegistry: Not the recipient");
        registry.acceptTransfer(TEST_BIN);
    }

    /// @notice Test revert when no pending transfer exists
    function test_RevertWhen_NoPendingTransferToAccept() public {
        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: No active transfer");
        registry.acceptTransfer(TEST_BIN);
    }

    /// @notice Test revert when transfer has expired
    function test_RevertWhen_TransferExpired() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Fast forward time past expiration (7 days + 1 second)
        vm.warp(block.timestamp + TRANSFER_EXPIRATION + 1);

        // Try to accept expired transfer
        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: Transfer expired");
        registry.acceptTransfer(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                    REJECT TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test successful transfer rejection
    function test_RejectTransfer() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Reject transfer
        vm.startPrank(oem);

        vm.expectEmit(true, true, true, true);
        emit TransferRejected(
            TEST_BIN,
            manufacturer,
            oem,
            uint64(block.timestamp)
        );

        registry.rejectTransfer(TEST_BIN);

        vm.stopPrank();

        // Verify ownership did NOT change
        assertEq(registry.getOwner(TEST_BIN), manufacturer);

        // Verify state did NOT change
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Manufactured)
        );

        // Verify pending transfer removed
        assertFalse(registry.hasPendingTransfer(TEST_BIN));
    }

    /// @notice Test revert when non-recipient tries to reject
    function test_RevertWhen_NonRecipientRejects() public {
        // Initiate transfer to oem
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Try to reject as customer (not the recipient)
        vm.prank(customer);
        vm.expectRevert("BatteryRegistry: Not the recipient");
        registry.rejectTransfer(TEST_BIN);
    }

    /// @notice Test revert when no pending transfer to reject
    function test_RevertWhen_NoPendingTransferToReject() public {
        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: No active transfer");
        registry.rejectTransfer(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                    CANCEL TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test sender can cancel transfer
    function test_CancelTransfer() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Cancel transfer
        vm.startPrank(manufacturer);

        vm.expectEmit(true, true, true, true);
        emit TransferCancelled(
            TEST_BIN,
            manufacturer,
            oem,
            uint64(block.timestamp)
        );

        registry.cancelTransfer(TEST_BIN);

        vm.stopPrank();

        // Verify pending transfer removed
        assertFalse(registry.hasPendingTransfer(TEST_BIN));

        // Verify ownership unchanged
        assertEq(registry.getOwner(TEST_BIN), manufacturer);
    }

    /// @notice Test admin can cancel transfer
    function test_AdminCanCancelTransfer() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Admin cancels
        vm.prank(admin);
        registry.cancelTransfer(TEST_BIN);

        assertFalse(registry.hasPendingTransfer(TEST_BIN));
    }

    /// @notice Test revert when non-sender tries to cancel
    function test_RevertWhen_NonSenderCancels() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Try to cancel as unauthorized user
        vm.prank(unauthorized);
        vm.expectRevert("BatteryRegistry: Not authorized");
        registry.cancelTransfer(TEST_BIN);
    }

    /// @notice Test revert when no pending transfer to cancel
    function test_RevertWhen_NoPendingTransferToCancel() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: No active transfer");
        registry.cancelTransfer(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                    CLEAR EXPIRED TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test clearing expired transfer
    function test_ClearExpiredTransfer() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Fast forward past expiration
        vm.warp(block.timestamp + TRANSFER_EXPIRATION + 1);

        // Anyone can clear expired transfer
        vm.prank(unauthorized);

        vm.expectEmit(true, true, true, true);
        emit TransferExpired(
            TEST_BIN,
            manufacturer,
            oem,
            uint64(block.timestamp)
        );

        registry.clearExpiredTransfer(TEST_BIN);

        // Verify transfer removed
        assertFalse(registry.hasPendingTransfer(TEST_BIN));

        // Verify ownership unchanged
        assertEq(registry.getOwner(TEST_BIN), manufacturer);
    }

    /// @notice Test revert when transfer not expired
    function test_RevertWhen_TransferNotExpired() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Try to clear before expiration
        vm.prank(unauthorized);
        vm.expectRevert("BatteryRegistry: Transfer not expired yet");
        registry.clearExpiredTransfer(TEST_BIN);
    }

    /// @notice Test revert when no pending transfer to clear
    function test_RevertWhen_NoPendingTransferToClear() public {
        vm.prank(unauthorized);
        vm.expectRevert("BatteryRegistry: No active transfer");
        registry.clearExpiredTransfer(TEST_BIN);
    }

    /*//////////////////////////////////////////////////////////////
                    VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test getPendingTransfer view function
    function test_GetPendingTransfer() public {
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        BatteryRegistry.PendingTransfer memory transfer = registry.getPendingTransfer(TEST_BIN);

        assertEq(transfer.from, manufacturer);
        assertEq(transfer.to, oem);
        assertEq(uint8(transfer.newState), uint8(BatteryRegistry.BatteryState.Integrated));
        assertTrue(transfer.isActive);
        assertGt(transfer.initiatedAt, 0);
    }

    /// @notice Test hasPendingTransfer view function
    function test_HasPendingTransfer() public {
        assertFalse(registry.hasPendingTransfer(TEST_BIN));

        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        assertTrue(registry.hasPendingTransfer(TEST_BIN));
    }

    /// @notice Test isTransferExpired view function
    function test_IsTransferExpired() public {
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        assertFalse(registry.isTransferExpired(TEST_BIN));

        // Fast forward past expiration
        vm.warp(block.timestamp + TRANSFER_EXPIRATION + 1);

        assertTrue(registry.isTransferExpired(TEST_BIN));
    }

    /// @notice Test getTransferTimeRemaining view function
    function test_GetTransferTimeRemaining() public {
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        uint256 timeRemaining = registry.getTransferTimeRemaining(TEST_BIN);
        assertEq(timeRemaining, TRANSFER_EXPIRATION);

        // Fast forward 3 days
        vm.warp(block.timestamp + 3 days);

        timeRemaining = registry.getTransferTimeRemaining(TEST_BIN);
        assertEq(timeRemaining, 4 days);

        // Fast forward past expiration
        vm.warp(block.timestamp + 5 days);

        timeRemaining = registry.getTransferTimeRemaining(TEST_BIN);
        assertEq(timeRemaining, 0);
    }

    /*//////////////////////////////////////////////////////////////
                    STATE TRANSITION VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test valid state transition: Manufactured -> Integrated
    function test_ValidTransition_Manufactured_To_Integrated() public {
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        vm.prank(oem);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Integrated)
        );
    }

    /// @notice Test valid state transition: Manufactured -> FirstLife
    function test_ValidTransition_Manufactured_To_FirstLife() public {
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );

        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.FirstLife)
        );
    }

    /// @notice Test valid state transition: Integrated -> FirstLife
    function test_ValidTransition_Integrated_To_FirstLife() public {
        // First transition to Integrated
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        vm.prank(oem);
        registry.acceptTransfer(TEST_BIN);

        // Then transition to FirstLife
        vm.prank(oem);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );

        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.FirstLife)
        );
    }

    /// @notice Test valid state transition: FirstLife -> SecondLife
    function test_ValidTransition_FirstLife_To_SecondLife() public {
        // Move to FirstLife
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        // Transition to SecondLife
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            secondLifeOperator,
            BatteryRegistry.BatteryState.SecondLife
        );

        vm.prank(secondLifeOperator);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.SecondLife)
        );
    }

    /// @notice Test valid state transition: FirstLife -> EndOfLife
    function test_ValidTransition_FirstLife_To_EndOfLife() public {
        // Move to FirstLife
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        // Transition to EndOfLife
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );

        vm.prank(recycler);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.EndOfLife)
        );
    }

    /// @notice Test valid state transition: SecondLife -> EndOfLife
    function test_ValidTransition_SecondLife_To_EndOfLife() public {
        // Move to FirstLife
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        // Move to SecondLife
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            secondLifeOperator,
            BatteryRegistry.BatteryState.SecondLife
        );
        vm.prank(secondLifeOperator);
        registry.acceptTransfer(TEST_BIN);

        // Transition to EndOfLife
        vm.prank(secondLifeOperator);
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );

        vm.prank(recycler);
        registry.acceptTransfer(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.EndOfLife)
        );
    }

    /// @notice Test valid state transition: EndOfLife -> Recycled
    function test_ValidTransition_EndOfLife_To_Recycled() public {
        // Move to FirstLife
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        // Move to EndOfLife
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );
        vm.prank(recycler);
        registry.acceptTransfer(TEST_BIN);

        // Recycle battery (use recycleBattery function, not transfer)
        vm.prank(recycler);
        registry.recycleBattery(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Recycled)
        );
    }

    /// @notice Test invalid state transition: Manufactured -> SecondLife
    function test_InvalidTransition_Manufactured_To_SecondLife() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Invalid state transition from Manufactured");
        registry.initiateTransfer(
            TEST_BIN,
            secondLifeOperator,
            BatteryRegistry.BatteryState.SecondLife
        );
    }

    /// @notice Test invalid state transition: Manufactured -> EndOfLife
    function test_InvalidTransition_Manufactured_To_EndOfLife() public {
        vm.prank(manufacturer);
        vm.expectRevert("BatteryRegistry: Invalid state transition from Manufactured");
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );
    }

    /// @notice Test invalid state transition: Integrated -> SecondLife
    function test_InvalidTransition_Integrated_To_SecondLife() public {
        // Move to Integrated
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );
        vm.prank(oem);
        registry.acceptTransfer(TEST_BIN);

        // Try invalid transition
        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: Invalid state transition from Integrated");
        registry.initiateTransfer(
            TEST_BIN,
            secondLifeOperator,
            BatteryRegistry.BatteryState.SecondLife
        );
    }

    /// @notice Test invalid state transition from Recycled
    function test_InvalidTransition_From_Recycled() public {
        // Move to FirstLife
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        // Move to EndOfLife
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );
        vm.prank(recycler);
        registry.acceptTransfer(TEST_BIN);

        // Use recycleBattery function instead of transfer (recycled is special)
        vm.prank(recycler);
        registry.recycleBattery(TEST_BIN);

        // Try to transfer from Recycled (should fail)
        vm.prank(recycler);
        vm.expectRevert("BatteryRegistry: Cannot transition from Recycled state");
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
    }

    /*//////////////////////////////////////////////////////////////
                    INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Test complete lifecycle with transfers
    function test_CompleteLifecycleWithTransfers() public {
        // 1. Manufacturer -> OEM (Integrated)
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );
        vm.prank(oem);
        registry.acceptTransfer(TEST_BIN);

        assertEq(registry.getOwner(TEST_BIN), oem);
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Integrated)
        );

        // 2. OEM -> Customer (FirstLife)
        vm.prank(oem);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );
        vm.prank(customer);
        registry.acceptTransfer(TEST_BIN);

        assertEq(registry.getOwner(TEST_BIN), customer);
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.FirstLife)
        );

        // 3. Customer -> SecondLife Operator (SecondLife)
        vm.prank(customer);
        registry.initiateTransfer(
            TEST_BIN,
            secondLifeOperator,
            BatteryRegistry.BatteryState.SecondLife
        );
        vm.prank(secondLifeOperator);
        registry.acceptTransfer(TEST_BIN);

        assertEq(registry.getOwner(TEST_BIN), secondLifeOperator);
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.SecondLife)
        );

        // 4. SecondLife -> Recycler (EndOfLife)
        vm.prank(secondLifeOperator);
        registry.initiateTransfer(
            TEST_BIN,
            recycler,
            BatteryRegistry.BatteryState.EndOfLife
        );
        vm.prank(recycler);
        registry.acceptTransfer(TEST_BIN);

        assertEq(registry.getOwner(TEST_BIN), recycler);
        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.EndOfLife)
        );

        // 5. Recycler recycles battery (Recycled)
        vm.prank(recycler);
        registry.recycleBattery(TEST_BIN);

        assertEq(
            uint8(registry.getBatteryState(TEST_BIN)),
            uint8(BatteryRegistry.BatteryState.Recycled)
        );
    }

    /// @notice Test rejection then new initiation
    function test_RejectThenReinitiate() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Reject transfer
        vm.prank(oem);
        registry.rejectTransfer(TEST_BIN);

        // Owner can initiate a new transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );

        assertTrue(registry.hasPendingTransfer(TEST_BIN));

        BatteryRegistry.PendingTransfer memory transfer = registry.getPendingTransfer(TEST_BIN);
        assertEq(transfer.from, manufacturer);
        assertEq(transfer.to, customer);
    }

    /// @notice Test cancel then new initiation
    function test_CancelThenReinitiate() public {
        // Initiate transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        // Cancel transfer
        vm.prank(manufacturer);
        registry.cancelTransfer(TEST_BIN);

        // Initiate new transfer
        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            customer,
            BatteryRegistry.BatteryState.FirstLife
        );

        assertTrue(registry.hasPendingTransfer(TEST_BIN));
    }

    /*//////////////////////////////////////////////////////////////
                    FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Fuzz test: Transfer time remaining
    function testFuzz_TransferTimeRemaining(uint256 elapsedTime) public {
        vm.assume(elapsedTime <= TRANSFER_EXPIRATION);

        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        vm.warp(block.timestamp + elapsedTime);

        uint256 timeRemaining = registry.getTransferTimeRemaining(TEST_BIN);
        assertEq(timeRemaining, TRANSFER_EXPIRATION - elapsedTime);
    }

    /// @notice Fuzz test: Cannot accept after arbitrary time past expiration
    function testFuzz_CannotAcceptAfterExpiration(uint256 extraTime) public {
        vm.assume(extraTime > 0 && extraTime < 365 days);

        vm.prank(manufacturer);
        registry.initiateTransfer(
            TEST_BIN,
            oem,
            BatteryRegistry.BatteryState.Integrated
        );

        vm.warp(block.timestamp + TRANSFER_EXPIRATION + extraTime);

        vm.prank(oem);
        vm.expectRevert("BatteryRegistry: Transfer expired");
        registry.acceptTransfer(TEST_BIN);
    }
}
