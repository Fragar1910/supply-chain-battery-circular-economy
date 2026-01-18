// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title RoleManager
 * @notice Centralized role management for the battery supply chain
 * @dev Manages roles for all actors in the supply chain according to EU Battery Passport requirements
 *
 * ROLES HIERARCHY:
 * - ADMIN_ROLE: System administrator (can grant/revoke all roles)
 * - RAW_MATERIAL_SUPPLIER_ROLE: Mines and processes raw materials
 * - COMPONENT_MANUFACTURER_ROLE: Manufactures battery cells and modules
 * - OEM_ROLE: Vehicle manufacturers (integrates batteries)
 * - FLEET_OPERATOR_ROLE: First life operators (taxi fleets, delivery companies)
 * - AFTERMARKET_USER_ROLE: Second life operators (energy storage, etc.)
 * - RECYCLER_ROLE: End-of-life battery recyclers
 * - AUDITOR_ROLE: Third-party auditors (read-only verification)
 */
contract RoleManager is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // ROLE IDENTIFIERS
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RAW_MATERIAL_SUPPLIER_ROLE = keccak256("RAW_MATERIAL_SUPPLIER_ROLE");
    bytes32 public constant COMPONENT_MANUFACTURER_ROLE = keccak256("COMPONENT_MANUFACTURER_ROLE");
    bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");
    bytes32 public constant FLEET_OPERATOR_ROLE = keccak256("FLEET_OPERATOR_ROLE");
    bytes32 public constant AFTERMARKET_USER_ROLE = keccak256("AFTERMARKET_USER_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Supply chain role types
     */
    enum Role {
        None,                   // 0: No role assigned
        RawMaterialSupplier,    // 1: Mines lithium, cobalt, nickel, etc.
        ComponentManufacturer,  // 2: Produces battery cells and modules
        OEM,                    // 3: Vehicle manufacturers
        FleetOperator,          // 4: First life users (taxi, delivery)
        AftermarketUser,        // 5: Second life applications
        Recycler,               // 6: End-of-life processors
        Auditor                 // 7: Third-party verifiers
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Actor profile information
     */
    struct ActorProfile {
        address actorAddress;       // Ethereum address
        Role role;                  // Primary role in supply chain
        string companyName;         // Off-chain company name
        string certificationHash;   // IPFS hash of certifications
        uint64 registeredDate;      // When registered
        bool isActive;              // Active status
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Mapping from address to actor profile
    mapping(address => ActorProfile) public actors;

    /// @notice Mapping from role to list of addresses with that role
    mapping(Role => address[]) private roleMembers;

    /// @notice Total actors registered
    uint256 public totalActors;

    // ============================================
    // EVENTS
    // ============================================

    event ActorRegistered(
        address indexed actor,
        Role indexed role,
        string companyName,
        uint64 registeredDate
    );

    event ActorRoleChanged(
        address indexed actor,
        Role indexed previousRole,
        Role indexed newRole,
        address changedBy
    );

    event ActorDeactivated(
        address indexed actor,
        address indexed deactivatedBy,
        uint64 deactivationDate
    );

    event ActorReactivated(
        address indexed actor,
        address indexed reactivatedBy,
        uint64 reactivationDate
    );

    event RoleGranted(
        address indexed actor,
        bytes32 indexed role,
        address indexed grantedBy
    );

    event RoleRevoked(
        address indexed actor,
        bytes32 indexed role,
        address indexed revokedBy
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier actorExists(address actor) {
        require(actors[actor].actorAddress != address(0), "RoleManager: Actor not registered");
        _;
    }

    modifier actorNotExists(address actor) {
        require(actors[actor].actorAddress == address(0), "RoleManager: Actor already registered");
        _;
    }

    modifier onlyActiveActor(address actor) {
        require(actors[actor].isActive, "RoleManager: Actor is not active");
        _;
    }

    // ============================================
    // INITIALIZER
    // ============================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address to grant admin role
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        // Register admin as first actor
        actors[admin] = ActorProfile({
            actorAddress: admin,
            role: Role.None,
            companyName: "System Administrator",
            certificationHash: "",
            registeredDate: uint64(block.timestamp),
            isActive: true
        });
        totalActors = 1;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Register a new actor in the supply chain
     * @param actor Address of the actor
     * @param role Primary role
     * @param companyName Company name
     * @param certificationHash IPFS hash of certifications
     */
    function registerActor(
        address actor,
        Role role,
        string calldata companyName,
        string calldata certificationHash
    ) external onlyRole(ADMIN_ROLE) actorNotExists(actor) {
        require(actor != address(0), "RoleManager: Invalid address");
        require(role != Role.None, "RoleManager: Invalid role");
        require(bytes(companyName).length > 0, "RoleManager: Company name required");

        actors[actor] = ActorProfile({
            actorAddress: actor,
            role: role,
            companyName: companyName,
            certificationHash: certificationHash,
            registeredDate: uint64(block.timestamp),
            isActive: true
        });

        roleMembers[role].push(actor);
        totalActors++;

        // Grant corresponding blockchain role
        bytes32 blockchainRole = getRoleIdentifier(role);
        _grantRole(blockchainRole, actor);

        emit ActorRegistered(actor, role, companyName, uint64(block.timestamp));
        emit RoleGranted(actor, blockchainRole, msg.sender);
    }

    /**
     * @notice Change actor's primary role
     * @param actor Address to change
     * @param newRole New role
     */
    function changeActorRole(address actor, Role newRole)
        external
        onlyRole(ADMIN_ROLE)
        actorExists(actor)
    {
        require(newRole != Role.None, "RoleManager: Invalid role");

        ActorProfile storage profile = actors[actor];
        Role previousRole = profile.role;
        require(previousRole != newRole, "RoleManager: Same role");

        // Revoke old blockchain role
        bytes32 oldBlockchainRole = getRoleIdentifier(previousRole);
        _revokeRole(oldBlockchainRole, actor);

        // Grant new blockchain role
        bytes32 newBlockchainRole = getRoleIdentifier(newRole);
        _grantRole(newBlockchainRole, actor);

        // Update profile
        profile.role = newRole;

        // Update role members lists
        _removeFromRoleMembers(previousRole, actor);
        roleMembers[newRole].push(actor);

        emit ActorRoleChanged(actor, previousRole, newRole, msg.sender);
        emit RoleRevoked(actor, oldBlockchainRole, msg.sender);
        emit RoleGranted(actor, newBlockchainRole, msg.sender);
    }

    /**
     * @notice Deactivate an actor (suspend permissions)
     * @param actor Address to deactivate
     */
    function deactivateActor(address actor)
        external
        onlyRole(ADMIN_ROLE)
        actorExists(actor)
    {
        require(actors[actor].isActive, "RoleManager: Actor already inactive");

        actors[actor].isActive = false;

        // Revoke blockchain role (but keep profile)
        bytes32 roleId = getRoleIdentifier(actors[actor].role);
        _revokeRole(roleId, actor);

        emit ActorDeactivated(actor, msg.sender, uint64(block.timestamp));
        emit RoleRevoked(actor, roleId, msg.sender);
    }

    /**
     * @notice Reactivate a deactivated actor
     * @param actor Address to reactivate
     */
    function reactivateActor(address actor)
        external
        onlyRole(ADMIN_ROLE)
        actorExists(actor)
    {
        require(!actors[actor].isActive, "RoleManager: Actor already active");

        actors[actor].isActive = true;

        // Re-grant blockchain role
        bytes32 roleId = getRoleIdentifier(actors[actor].role);
        _grantRole(roleId, actor);

        emit ActorReactivated(actor, msg.sender, uint64(block.timestamp));
        emit RoleGranted(actor, roleId, msg.sender);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get actor profile
     * @param actor Address to query
     */
    function getActorProfile(address actor)
        external
        view
        actorExists(actor)
        returns (ActorProfile memory)
    {
        return actors[actor];
    }

    /**
     * @notice Get all addresses with a specific role
     * @param role Role to query
     */
    function getRoleMembers(Role role) external view returns (address[] memory) {
        return roleMembers[role];
    }

    /**
     * @notice Check if address has a specific role
     * @param actor Address to check
     * @param role Role to verify
     */
    function hasActorRole(address actor, Role role) external view returns (bool) {
        return actors[actor].role == role && actors[actor].isActive;
    }

    /**
     * @notice Get role identifier (bytes32) from Role enum
     * @param role Role enum value
     */
    function getRoleIdentifier(Role role) public pure returns (bytes32) {
        if (role == Role.RawMaterialSupplier) return RAW_MATERIAL_SUPPLIER_ROLE;
        if (role == Role.ComponentManufacturer) return COMPONENT_MANUFACTURER_ROLE;
        if (role == Role.OEM) return OEM_ROLE;
        if (role == Role.FleetOperator) return FLEET_OPERATOR_ROLE;
        if (role == Role.AftermarketUser) return AFTERMARKET_USER_ROLE;
        if (role == Role.Recycler) return RECYCLER_ROLE;
        if (role == Role.Auditor) return AUDITOR_ROLE;
        return bytes32(0);
    }

    /**
     * @notice Validate if a role transition is allowed in the supply chain flow
     * @param fromRole Current role
     * @param toRole Next role
     * @return bool True if transition is valid
     */
    function isValidRoleTransition(Role fromRole, Role toRole) public pure returns (bool) {
        // Supply chain flow validation:
        // RawMaterial -> Manufacturer -> OEM -> FleetOperator -> AftermarketUser -> Recycler

        if (fromRole == Role.RawMaterialSupplier && toRole == Role.ComponentManufacturer) return true;
        if (fromRole == Role.ComponentManufacturer && toRole == Role.OEM) return true;
        if (fromRole == Role.OEM && toRole == Role.FleetOperator) return true;
        if (fromRole == Role.FleetOperator && toRole == Role.AftermarketUser) return true;
        if (fromRole == Role.AftermarketUser && toRole == Role.Recycler) return true;
        if (fromRole == Role.FleetOperator && toRole == Role.Recycler) return true; // Direct recycling

        return false;
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Remove an address from role members array
     * @param role Role to remove from
     * @param actor Address to remove
     */
    function _removeFromRoleMembers(Role role, address actor) internal {
        address[] storage members = roleMembers[role];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == actor) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
