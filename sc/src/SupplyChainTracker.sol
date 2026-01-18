// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./RoleManager.sol";

/**
 * @title SupplyChainTracker
 * @notice Tracks battery movements and transfers between supply chain actors
 * @dev Validates role transitions according to EU Battery Passport requirements
 *
 * SUPPLY CHAIN FLOW:
 * RawMaterialSupplier → ComponentManufacturer → OEM → FleetOperator → AftermarketUser → Recycler
 *
 * CRITICAL ON-CHAIN DATA:
 * - Transfer history (from, to, timestamp)
 * - Role validation
 * - Battery location tracking
 * - Custody chain proof
 */
contract SupplyChainTracker is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Transfer record in the supply chain
     * @dev Storage optimized: 3 slots total
     */
    struct Transfer {
        address from;               // 20 bytes - Previous owner
        address to;                 // 20 bytes - New owner (Slot 1)
        RoleManager.Role fromRole;  // 1 byte
        RoleManager.Role toRole;    // 1 byte
        uint64 timestamp;           // 8 bytes
        bytes32 location;           // 32 bytes - Geographic location hash (Slot 2)
        bytes32 documentHash;       // 32 bytes - IPFS hash of transfer documents (Slot 3)
    }

    /**
     * @notice Battery journey summary
     */
    struct BatteryJourney {
        bytes32 bin;                        // Battery ID
        uint256 totalTransfers;             // Number of transfers
        address currentCustodian;           // Current holder
        RoleManager.Role currentRole;       // Current role in supply chain
        uint64 lastTransferTimestamp;       // Last movement
        bool isInTransit;                   // Currently being transferred
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice RoleManager contract reference
    RoleManager public roleManager;

    /// @notice Battery journey tracking: BIN => BatteryJourney
    mapping(bytes32 => BatteryJourney) public journeys;

    /// @notice Transfer history: BIN => Transfer[]
    mapping(bytes32 => Transfer[]) private transferHistory;

    /// @notice Check if battery is tracked
    mapping(bytes32 => bool) public isTracked;

    /// @notice Total batteries tracked
    uint256 public totalBatteriesTracked;

    /// @notice Total transfers recorded
    uint256 public totalTransfers;

    // ============================================
    // EVENTS
    // ============================================

    event BatteryTransferred(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        RoleManager.Role fromRole,
        RoleManager.Role toRole,
        uint64 timestamp
    );

    event BatteryJourneyStarted(
        bytes32 indexed bin,
        address indexed initialCustodian,
        RoleManager.Role initialRole,
        uint64 timestamp
    );

    event TransferDocumentAdded(
        bytes32 indexed bin,
        uint256 indexed transferIndex,
        bytes32 documentHash
    );

    event BatteryLocationUpdated(
        bytes32 indexed bin,
        bytes32 location,
        address indexed updatedBy
    );

    event TransferValidationFailed(
        bytes32 indexed bin,
        address from,
        address to,
        string reason
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryTracked(bytes32 bin) {
        require(isTracked[bin], "SupplyChainTracker: Battery not tracked");
        _;
    }

    modifier batteryNotTracked(bytes32 bin) {
        require(!isTracked[bin], "SupplyChainTracker: Battery already tracked");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "SupplyChainTracker: Invalid address");
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
     * @param admin Admin address
     * @param _roleManager RoleManager contract address
     */
    function initialize(address admin, address _roleManager) public initializer {
        __AccessControl_init();

        require(_roleManager != address(0), "SupplyChainTracker: Invalid RoleManager");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(TRACKER_ROLE, admin);

        roleManager = RoleManager(_roleManager);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Start tracking a battery's journey
     * @param bin Battery ID
     * @param initialCustodian First custodian (manufacturer)
     * @param initialRole Starting role
     */
    function startBatteryJourney(
        bytes32 bin,
        address initialCustodian,
        RoleManager.Role initialRole
    ) external onlyRole(TRACKER_ROLE) batteryNotTracked(bin) validAddress(initialCustodian) {
        require(bin != bytes32(0), "SupplyChainTracker: Invalid BIN");
        require(
            initialRole == RoleManager.Role.ComponentManufacturer,
            "SupplyChainTracker: Must start with manufacturer"
        );

        journeys[bin] = BatteryJourney({
            bin: bin,
            totalTransfers: 0,
            currentCustodian: initialCustodian,
            currentRole: initialRole,
            lastTransferTimestamp: uint64(block.timestamp),
            isInTransit: false
        });

        isTracked[bin] = true;
        totalBatteriesTracked++;

        emit BatteryJourneyStarted(bin, initialCustodian, initialRole, uint64(block.timestamp));
    }

    /**
     * @notice Transfer battery custody between supply chain actors
     * @param bin Battery ID
     * @param from Current custodian
     * @param to New custodian
     * @param toRole New custodian's role
     * @param location Geographic location (hash)
     * @param documentHash IPFS hash of transfer documents
     */
    function transferBattery(
        bytes32 bin,
        address from,
        address to,
        RoleManager.Role toRole,
        bytes32 location,
        bytes32 documentHash
    ) external onlyRole(TRACKER_ROLE) batteryTracked(bin) validAddress(to) {
        BatteryJourney storage journey = journeys[bin];

        // Validate current custodian
        require(journey.currentCustodian == from, "SupplyChainTracker: Invalid current custodian");
        require(!journey.isInTransit, "SupplyChainTracker: Battery already in transit");

        // Get from role
        RoleManager.Role fromRole = journey.currentRole;

        // Validate role transition
        bool isValidTransition = roleManager.isValidRoleTransition(fromRole, toRole);
        if (!isValidTransition) {
            emit TransferValidationFailed(bin, from, to, "Invalid role transition");
            revert("SupplyChainTracker: Invalid role transition");
        }

        // Validate that 'to' address has the claimed role
        require(
            roleManager.hasActorRole(to, toRole),
            "SupplyChainTracker: Recipient does not have claimed role"
        );

        // Record transfer
        Transfer memory newTransfer = Transfer({
            from: from,
            to: to,
            fromRole: fromRole,
            toRole: toRole,
            timestamp: uint64(block.timestamp),
            location: location,
            documentHash: documentHash
        });

        transferHistory[bin].push(newTransfer);

        // Update journey
        journey.currentCustodian = to;
        journey.currentRole = toRole;
        journey.totalTransfers++;
        journey.lastTransferTimestamp = uint64(block.timestamp);

        totalTransfers++;

        emit BatteryTransferred(bin, from, to, fromRole, toRole, uint64(block.timestamp));

        if (documentHash != bytes32(0)) {
            emit TransferDocumentAdded(bin, journey.totalTransfers - 1, documentHash);
        }
    }

    /**
     * @notice Update battery location
     * @param bin Battery ID
     * @param location New location hash
     */
    function updateLocation(bytes32 bin, bytes32 location)
        external
        onlyRole(TRACKER_ROLE)
        batteryTracked(bin)
    {
        require(location != bytes32(0), "SupplyChainTracker: Invalid location");

        // Add location update to most recent transfer
        if (transferHistory[bin].length > 0) {
            Transfer storage lastTransfer = transferHistory[bin][transferHistory[bin].length - 1];
            lastTransfer.location = location;
        }

        emit BatteryLocationUpdated(bin, location, msg.sender);
    }

    /**
     * @notice Add or update transfer document
     * @param bin Battery ID
     * @param transferIndex Index of transfer to update
     * @param documentHash IPFS hash
     */
    function addTransferDocument(bytes32 bin, uint256 transferIndex, bytes32 documentHash)
        external
        onlyRole(TRACKER_ROLE)
        batteryTracked(bin)
    {
        require(documentHash != bytes32(0), "SupplyChainTracker: Invalid document hash");
        require(
            transferIndex < transferHistory[bin].length,
            "SupplyChainTracker: Invalid transfer index"
        );

        transferHistory[bin][transferIndex].documentHash = documentHash;

        emit TransferDocumentAdded(bin, transferIndex, documentHash);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get complete journey for a battery
     * @param bin Battery ID
     */
    function getBatteryJourney(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (BatteryJourney memory)
    {
        return journeys[bin];
    }

    /**
     * @notice Get full transfer history
     * @param bin Battery ID
     */
    function getTransferHistory(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (Transfer[] memory)
    {
        return transferHistory[bin];
    }

    /**
     * @notice Get specific transfer
     * @param bin Battery ID
     * @param index Transfer index
     */
    function getTransfer(bytes32 bin, uint256 index)
        external
        view
        batteryTracked(bin)
        returns (Transfer memory)
    {
        require(index < transferHistory[bin].length, "SupplyChainTracker: Invalid index");
        return transferHistory[bin][index];
    }

    /**
     * @notice Get current custodian
     * @param bin Battery ID
     */
    function getCurrentCustodian(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (address)
    {
        return journeys[bin].currentCustodian;
    }

    /**
     * @notice Get current role in supply chain
     * @param bin Battery ID
     */
    function getCurrentRole(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (RoleManager.Role)
    {
        return journeys[bin].currentRole;
    }

    /**
     * @notice Get number of transfers for a battery
     * @param bin Battery ID
     */
    function getTransferCount(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (uint256)
    {
        return transferHistory[bin].length;
    }

    /**
     * @notice Verify custody chain integrity
     * @param bin Battery ID
     * @return bool True if chain is valid
     */
    function verifyCustodyChain(bytes32 bin)
        external
        view
        batteryTracked(bin)
        returns (bool)
    {
        Transfer[] memory history = transferHistory[bin];

        if (history.length == 0) return true;

        // Check chronological order and role progression
        for (uint256 i = 1; i < history.length; i++) {
            // Verify timestamps are increasing
            if (history[i].timestamp <= history[i - 1].timestamp) return false;

            // Verify custody chain continuity (to[i-1] == from[i])
            if (history[i - 1].to != history[i].from) return false;

            // Verify role transitions are valid
            if (!roleManager.isValidRoleTransition(history[i - 1].toRole, history[i].toRole)) {
                return false;
            }
        }

        return true;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update RoleManager address
     * @param newRoleManager New RoleManager address
     */
    function setRoleManager(address newRoleManager) external onlyRole(ADMIN_ROLE) {
        require(newRoleManager != address(0), "SupplyChainTracker: Invalid address");
        roleManager = RoleManager(newRoleManager);
    }

    /**
     * @notice Grant tracker role
     */
    function grantTrackerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(TRACKER_ROLE, account);
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
