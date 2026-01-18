// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/RoleManager.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RoleManagerTest is Test {
    RoleManager public roleManager;
    RoleManager public implementation;

    address public admin = address(1);
    address public supplier = address(2);
    address public manufacturer = address(3);
    address public oem = address(4);
    address public user = address(5);

    event ActorRegistered(
        address indexed actor,
        RoleManager.Role indexed role,
        string companyName,
        uint64 registeredDate
    );

    event ActorRoleChanged(
        address indexed actor,
        RoleManager.Role indexed previousRole,
        RoleManager.Role indexed newRole,
        address changedBy
    );

    event ActorDeactivated(
        address indexed actor,
        address indexed deactivatedBy,
        uint64 deactivationDate
    );

    function setUp() public {
        // Deploy implementation
        implementation = new RoleManager();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            RoleManager.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        roleManager = RoleManager(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public view {
        assertTrue(roleManager.hasRole(roleManager.ADMIN_ROLE(), admin));
        assertEq(roleManager.totalActors(), 1); // Admin is first actor
    }

    function test_AdminActorProfile() public view {
        RoleManager.ActorProfile memory profile = roleManager.getActorProfile(admin);
        assertEq(profile.actorAddress, admin);
        assertEq(uint8(profile.role), uint8(RoleManager.Role.None));
        assertEq(profile.companyName, "System Administrator");
        assertTrue(profile.isActive);
    }

    /*//////////////////////////////////////////////////////////////
                    ACTOR REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterActor() public {
        vm.startPrank(admin);

        vm.expectEmit(true, true, false, true);
        emit ActorRegistered(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Tesla Battery Factory",
            uint64(block.timestamp)
        );

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Tesla Battery Factory",
            "QmCert123"
        );

        vm.stopPrank();

        assertEq(roleManager.totalActors(), 2);

        RoleManager.ActorProfile memory profile = roleManager.getActorProfile(manufacturer);
        assertEq(profile.actorAddress, manufacturer);
        assertEq(uint8(profile.role), uint8(RoleManager.Role.ComponentManufacturer));
        assertEq(profile.companyName, "Tesla Battery Factory");
        assertEq(profile.certificationHash, "QmCert123");
        assertTrue(profile.isActive);

        // Check blockchain role was granted
        assertTrue(roleManager.hasRole(roleManager.COMPONENT_MANUFACTURER_ROLE(), manufacturer));
    }

    function test_RegisterMultipleActors() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            supplier,
            RoleManager.Role.RawMaterialSupplier,
            "Lithium Mine Co",
            "QmCert1"
        );

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Battery Factory",
            "QmCert2"
        );

        roleManager.registerActor(
            oem,
            RoleManager.Role.OEM,
            "Tesla Motors",
            "QmCert3"
        );

        vm.stopPrank();

        assertEq(roleManager.totalActors(), 4); // Admin + 3 new actors
    }

    function test_RevertWhen_NonAdminRegistersActor() public {
        vm.prank(user);
        vm.expectRevert();
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );
    }

    function test_RevertWhen_RegisteringDuplicateActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory 1",
            "QmCert1"
        );

        vm.expectRevert("RoleManager: Actor already registered");
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.OEM,
            "Factory 2",
            "QmCert2"
        );

        vm.stopPrank();
    }

    function test_RevertWhen_RegisteringWithInvalidAddress() public {
        vm.prank(admin);
        vm.expectRevert("RoleManager: Invalid address");
        roleManager.registerActor(
            address(0),
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );
    }

    function test_RevertWhen_RegisteringWithNoRole() public {
        vm.prank(admin);
        vm.expectRevert("RoleManager: Invalid role");
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.None,
            "Factory",
            "QmCert"
        );
    }

    function test_RevertWhen_RegisteringWithEmptyCompanyName() public {
        vm.prank(admin);
        vm.expectRevert("RoleManager: Company name required");
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "",
            "QmCert"
        );
    }

    /*//////////////////////////////////////////////////////////////
                    ROLE CHANGE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ChangeActorRole() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        vm.expectEmit(true, true, true, true);
        emit ActorRoleChanged(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            RoleManager.Role.OEM,
            admin
        );

        roleManager.changeActorRole(manufacturer, RoleManager.Role.OEM);

        vm.stopPrank();

        RoleManager.ActorProfile memory profile = roleManager.getActorProfile(manufacturer);
        assertEq(uint8(profile.role), uint8(RoleManager.Role.OEM));

        // Old role revoked
        assertFalse(roleManager.hasRole(roleManager.COMPONENT_MANUFACTURER_ROLE(), manufacturer));
        // New role granted
        assertTrue(roleManager.hasRole(roleManager.OEM_ROLE(), manufacturer));
    }

    function test_RevertWhen_ChangingToSameRole() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        vm.expectRevert("RoleManager: Same role");
        roleManager.changeActorRole(manufacturer, RoleManager.Role.ComponentManufacturer);

        vm.stopPrank();
    }

    function test_RevertWhen_NonAdminChangesRole() public {
        vm.prank(admin);
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        vm.prank(user);
        vm.expectRevert();
        roleManager.changeActorRole(manufacturer, RoleManager.Role.OEM);
    }

    /*//////////////////////////////////////////////////////////////
                    DEACTIVATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DeactivateActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        vm.expectEmit(true, true, false, true);
        emit ActorDeactivated(manufacturer, admin, uint64(block.timestamp));

        roleManager.deactivateActor(manufacturer);

        vm.stopPrank();

        RoleManager.ActorProfile memory profile = roleManager.getActorProfile(manufacturer);
        assertFalse(profile.isActive);

        // Role should be revoked
        assertFalse(roleManager.hasRole(roleManager.COMPONENT_MANUFACTURER_ROLE(), manufacturer));
    }

    function test_ReactivateActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        roleManager.deactivateActor(manufacturer);
        roleManager.reactivateActor(manufacturer);

        vm.stopPrank();

        RoleManager.ActorProfile memory profile = roleManager.getActorProfile(manufacturer);
        assertTrue(profile.isActive);

        // Role should be re-granted
        assertTrue(roleManager.hasRole(roleManager.COMPONENT_MANUFACTURER_ROLE(), manufacturer));
    }

    function test_RevertWhen_DeactivatingAlreadyInactiveActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        roleManager.deactivateActor(manufacturer);

        vm.expectRevert("RoleManager: Actor already inactive");
        roleManager.deactivateActor(manufacturer);

        vm.stopPrank();
    }

    function test_RevertWhen_ReactivatingAlreadyActiveActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        vm.expectRevert("RoleManager: Actor already active");
        roleManager.reactivateActor(manufacturer);

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    VIEW FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetRoleMembers() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            supplier,
            RoleManager.Role.ComponentManufacturer,
            "Factory 1",
            "QmCert1"
        );

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory 2",
            "QmCert2"
        );

        vm.stopPrank();

        address[] memory members = roleManager.getRoleMembers(RoleManager.Role.ComponentManufacturer);
        assertEq(members.length, 2);
        assertEq(members[0], supplier);
        assertEq(members[1], manufacturer);
    }

    function test_HasActorRole() public {
        vm.prank(admin);
        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        assertTrue(roleManager.hasActorRole(manufacturer, RoleManager.Role.ComponentManufacturer));
        assertFalse(roleManager.hasActorRole(manufacturer, RoleManager.Role.OEM));
    }

    function test_HasActorRole_ReturnsFalseForInactiveActor() public {
        vm.startPrank(admin);

        roleManager.registerActor(
            manufacturer,
            RoleManager.Role.ComponentManufacturer,
            "Factory",
            "QmCert"
        );

        roleManager.deactivateActor(manufacturer);

        vm.stopPrank();

        assertFalse(roleManager.hasActorRole(manufacturer, RoleManager.Role.ComponentManufacturer));
    }

    /*//////////////////////////////////////////////////////////////
                ROLE TRANSITION VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IsValidRoleTransition() public view {
        // Valid transitions
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.RawMaterialSupplier,
                RoleManager.Role.ComponentManufacturer
            )
        );
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.ComponentManufacturer,
                RoleManager.Role.OEM
            )
        );
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.OEM,
                RoleManager.Role.FleetOperator
            )
        );
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.FleetOperator,
                RoleManager.Role.AftermarketUser
            )
        );
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.AftermarketUser,
                RoleManager.Role.Recycler
            )
        );

        // Direct recycling
        assertTrue(
            roleManager.isValidRoleTransition(
                RoleManager.Role.FleetOperator,
                RoleManager.Role.Recycler
            )
        );

        // Invalid transitions
        assertFalse(
            roleManager.isValidRoleTransition(
                RoleManager.Role.OEM,
                RoleManager.Role.RawMaterialSupplier
            )
        );
        assertFalse(
            roleManager.isValidRoleTransition(
                RoleManager.Role.Recycler,
                RoleManager.Role.FleetOperator
            )
        );
    }

    /*//////////////////////////////////////////////////////////////
                    ROLE IDENTIFIER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetRoleIdentifier() public view {
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.RawMaterialSupplier),
            roleManager.RAW_MATERIAL_SUPPLIER_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.ComponentManufacturer),
            roleManager.COMPONENT_MANUFACTURER_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.OEM),
            roleManager.OEM_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.FleetOperator),
            roleManager.FLEET_OPERATOR_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.AftermarketUser),
            roleManager.AFTERMARKET_USER_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.Recycler),
            roleManager.RECYCLER_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.Auditor),
            roleManager.AUDITOR_ROLE()
        );
        assertEq(
            roleManager.getRoleIdentifier(RoleManager.Role.None),
            bytes32(0)
        );
    }
}
