// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BatteryRegistry
 * @notice Central registry for battery lifecycle tracking compliant with EU Battery Passport 2027
 * @dev Stores ONLY critical on-chain data, uses OpenZeppelin upgradeable contracts
 *
 * STORAGE OPTIMIZATION:
 * - Uses bytes32 for identifiers (BIN, VIN) to save gas
 * - Struct packing: groups variables by size to minimize storage slots
 * - Enums for state management (uint8 size)
 */
contract BatteryRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");

    /// @notice Transfer expiration time (7 days)
    uint256 public constant TRANSFER_EXPIRATION = 7 days;

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Battery lifecycle states according to EU regulations
     */
    enum BatteryState {
        Manufactured,    // 0: Just produced
        Integrated,      // 1: Installed in vehicle (OEM)
        FirstLife,       // 2: Active in vehicle
        SecondLife,      // 3: Repurposed (energy storage, etc.)
        EndOfLife,       // 4: Marked for recycling
        Recycled         // 5: Materials recovered
    }

    /**
     * @notice Battery chemistry types (NMC, LFP, etc.)
     */
    enum Chemistry {
        Unknown,    // 0
        NMC,        // 1: Nickel Manganese Cobalt
        NCA,        // 2: Nickel Cobalt Aluminum
        LFP,        // 3: Lithium Iron Phosphate
        LTO,        // 4: Lithium Titanate Oxide
        LiMetal     // 5: Lithium Metal
    }

    // ============================================
    // STRUCTS (STORAGE OPTIMIZED)
    // ============================================

    /**
     * @notice Core battery data - CRITICAL on-chain parameters only
     * @dev Struct optimized for storage packing (slots aligned by variable size)
     *
     * SLOT LAYOUT (each slot = 32 bytes):
     * Slot 0: bin (bytes32)
     * Slot 1: vin (bytes32)
     * Slot 2: manufacturer (address - 20 bytes) + state (uint8) + chemistry (uint8) + sohManufacture (uint16) = 24 bytes
     * Slot 3: capacityKwh (uint32) + currentOwner (address - 20 bytes) + sohCurrent (uint16) + cyclesCompleted (uint32) = 30 bytes
     * Slot 4: carbonFootprintTotal (uint256)
     * Slot 5: manufactureDate (uint64) + integrationDate (uint64) + recyclingDate (uint64) = 24 bytes
     * Slot 6: ipfsCertHash (bytes32)
     */
    struct BatteryData {
        // Identifiers (Slot 0-1)
        bytes32 bin;                    // Battery Identification Number (unique)
        bytes32 vin;                    // Vehicle Identification Number (if integrated)

        // Manufacturer & State info (Slot 2 - packed)
        address manufacturer;           // 20 bytes - Who produced it
        BatteryState state;             // 1 byte (uint8 enum)
        Chemistry chemistry;            // 1 byte (uint8 enum)
        uint16 sohManufacture;          // 2 bytes - State of Health at manufacture (0-10000 = 0.00%-100.00%)
        uint32 capacityKwh;             // 4 bytes - Nominal capacity in Wh (max 4,294,967 Wh = 4,294 kWh)

        // Ownership & Current State (Slot 3 - packed)
        address currentOwner;           // 20 bytes - Current legal owner
        uint16 sohCurrent;              // 2 bytes - Current SOH (0-10000)
        uint32 cyclesCompleted;         // 4 bytes - Total charge cycles (max 4.2 billion)

        // Carbon footprint (Slot 4)
        uint256 carbonFootprintTotal;   // 32 bytes - Total kg CO2e (accumulated through lifecycle)

        // Timestamps (Slot 5 - packed)
        uint64 manufactureDate;         // 8 bytes - Unix timestamp
        uint64 integrationDate;         // 8 bytes - When installed in vehicle
        uint64 recyclingDate;           // 8 bytes - When recycled

        // Off-chain data reference (Slot 6)
        bytes32 ipfsCertHash;           // 32 bytes - IPFS CID hash for certificates/detailed data
    }

    /**
     * @notice Pending transfer data for two-step ownership transfer
     * @dev Storage optimized: ~2 slots
     */
    struct PendingTransfer {
        address from;                   // 20 bytes - Current owner initiating transfer
        address to;                     // 20 bytes - Intended recipient
        BatteryState newState;          // 1 byte - State after transfer
        uint64 initiatedAt;             // 8 bytes - Timestamp of initiation
        bool isActive;                  // 1 byte - Transfer is active/valid
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Mapping from BIN to battery data
    mapping(bytes32 => BatteryData) private batteries;

    /// @notice Track if a BIN exists
    mapping(bytes32 => bool) public binExists;

    /// @notice Mapping from BIN to pending transfer
    mapping(bytes32 => PendingTransfer) public pendingTransfers;

    /// @notice Counter of total batteries registered
    uint256 public totalBatteriesRegistered;

    /// @notice Counter of total pending transfers
    uint256 public totalPendingTransfers;

    // ============================================
    // EVENTS
    // ============================================

    event BatteryRegistered(
        bytes32 indexed bin,
        address indexed manufacturer,
        Chemistry chemistry,
        uint32 capacityKwh,
        uint64 manufactureDate
    );

    event BatteryStateChanged(
        bytes32 indexed bin,
        BatteryState previousState,
        BatteryState newState,
        address indexed changedBy
    );

    event BatteryIntegrated(
        bytes32 indexed bin,
        bytes32 indexed vin,
        address indexed oem,
        uint64 integrationDate
    );

    event BatteryOwnershipTransferred(
        bytes32 indexed bin,
        address indexed previousOwner,
        address indexed newOwner
    );

    event BatterySOHUpdated(
        bytes32 indexed bin,
        uint16 previousSOH,
        uint16 newSOH,
        uint32 cycles
    );

    event BatteryRecycled(
        bytes32 indexed bin,
        address indexed recycler,
        uint64 recyclingDate
    );

    event TransferInitiated(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        BatteryState newState,
        uint64 timestamp
    );

    event TransferAccepted(
        bytes32 indexed bin,
        address indexed from,
        address indexed to,
        BatteryState newState,
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

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryExists(bytes32 bin) {
        require(binExists[bin], "BatteryRegistry: Battery does not exist");
        _;
    }

    modifier batteryNotExists(bytes32 bin) {
        require(!binExists[bin], "BatteryRegistry: Battery already exists");
        _;
    }

    // ============================================
    // INITIALIZER (UUPS PROXY PATTERN)
    // ============================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract (replaces constructor for upgradeable contracts)
     * @param admin Address to grant admin role
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Register a new battery (Manufacturer only)
     * @param bin Battery Identification Number
     * @param chemistry Battery chemistry type
     * @param capacityKwh Nominal capacity in kWh
     * @param carbonFootprint Manufacturing carbon footprint (kg CO2e)
     * @param ipfsCertHash IPFS hash of certificates
     */
    function registerBattery(
        bytes32 bin,
        Chemistry chemistry,
        uint32 capacityKwh,
        uint256 carbonFootprint,
        bytes32 ipfsCertHash
    ) external onlyRole(MANUFACTURER_ROLE) batteryNotExists(bin) {
        require(bin != bytes32(0), "BatteryRegistry: Invalid BIN");
        require(capacityKwh > 0, "BatteryRegistry: Invalid capacity");

        BatteryData storage battery = batteries[bin];
        battery.bin = bin;
        battery.manufacturer = msg.sender;
        battery.currentOwner = msg.sender;
        battery.state = BatteryState.Manufactured;
        battery.chemistry = chemistry;
        battery.capacityKwh = capacityKwh;
        battery.sohManufacture = 10_000; // 100.00% SOH at manufacture
        battery.sohCurrent = 10_000;
        battery.cyclesCompleted = 0;
        battery.carbonFootprintTotal = carbonFootprint;
        battery.manufactureDate = uint64(block.timestamp);
        battery.ipfsCertHash = ipfsCertHash;

        binExists[bin] = true;
        totalBatteriesRegistered++;

        emit BatteryRegistered(bin, msg.sender, chemistry, capacityKwh, uint64(block.timestamp));
    }

    /**
     * @notice Integrate battery into vehicle (OEM only)
     * @param bin Battery ID
     * @param vin Vehicle ID
     */
    function integrateBattery(bytes32 bin, bytes32 vin)
        external
        onlyRole(OEM_ROLE)
        batteryExists(bin)
    {
        require(vin != bytes32(0), "BatteryRegistry: Invalid VIN");
        BatteryData storage battery = batteries[bin];

        // Allow integration from Manufactured or FirstLife state
        // FirstLife state occurs when OEM accepts a transfer from manufacturer
        require(
            battery.state == BatteryState.Manufactured || battery.state == BatteryState.FirstLife,
            "BatteryRegistry: Battery must be in Manufactured or FirstLife state"
        );

        address previousOwner = battery.currentOwner;

        battery.vin = vin;
        battery.integrationDate = uint64(block.timestamp);
        // Transfer ownership to the integrating OEM
        // This ensures the OEM who integrates the battery becomes its owner
        battery.currentOwner = msg.sender;

        BatteryState previousState = battery.state;
        battery.state = BatteryState.Integrated;

        emit BatteryIntegrated(bin, vin, msg.sender, uint64(block.timestamp));
        emit BatteryStateChanged(bin, previousState, BatteryState.Integrated, msg.sender);

        // Emit ownership transfer event if owner changed
        if (previousOwner != msg.sender) {
            emit BatteryOwnershipTransferred(bin, previousOwner, msg.sender);
        }
    }

    /**
     * @notice Update battery State of Health and cycles
     * @param bin Battery ID
     * @param newSOH New SOH value (0-10000 = 0.00%-100.00%)
     * @param newCycles New cycle count
     */
    function updateSOH(bytes32 bin, uint16 newSOH, uint32 newCycles)
        external
        onlyRole(OPERATOR_ROLE)
        batteryExists(bin)
    {
        require(newSOH <= 10_000, "BatteryRegistry: SOH cannot exceed 100%");

        BatteryData storage battery = batteries[bin];
        uint16 previousSOH = battery.sohCurrent;

        battery.sohCurrent = newSOH;
        battery.cyclesCompleted = newCycles;

        emit BatterySOHUpdated(bin, previousSOH, newSOH, newCycles);
    }

    /**
     * @notice Change battery state
     * @param bin Battery ID
     * @param newState New state
     */
    function changeBatteryState(bytes32 bin, BatteryState newState)
        external
        onlyRole(OPERATOR_ROLE)
        batteryExists(bin)
    {
        BatteryData storage battery = batteries[bin];
        BatteryState previousState = battery.state;

        require(newState != previousState, "BatteryRegistry: Same state");

        battery.state = newState;

        emit BatteryStateChanged(bin, previousState, newState, msg.sender);
    }

    /**
     * @notice Transfer battery ownership (DEPRECATED - use initiateTransfer + acceptTransfer)
     * @dev Kept for backward compatibility, will be removed in future versions
     * @param bin Battery ID
     * @param newOwner New owner address
     */
    function transferOwnership(bytes32 bin, address newOwner)
        external
        batteryExists(bin)
    {
        require(newOwner != address(0), "BatteryRegistry: Invalid address");

        BatteryData storage battery = batteries[bin];
        require(
            battery.currentOwner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "BatteryRegistry: Not authorized"
        );

        address previousOwner = battery.currentOwner;
        battery.currentOwner = newOwner;

        emit BatteryOwnershipTransferred(bin, previousOwner, newOwner);
    }

    /**
     * @notice Internal function to set owner (used by authorized contracts)
     * @param bin Battery ID
     * @param newOwner New owner address
     * @dev Only callable by authorized contracts (SecondLifeManager, RecyclingManager, etc.)
     */
    function setOwner(bytes32 bin, address newOwner)
        external
        batteryExists(bin)
    {
        require(newOwner != address(0), "BatteryRegistry: Invalid address");

        // Only ADMIN_ROLE or authorized system contracts can call this
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "BatteryRegistry: Only admin or authorized contracts"
        );

        BatteryData storage battery = batteries[bin];
        address previousOwner = battery.currentOwner;
        battery.currentOwner = newOwner;

        emit BatteryOwnershipTransferred(bin, previousOwner, newOwner);
    }

    // ============================================
    // TWO-STEP OWNERSHIP TRANSFER SYSTEM
    // ============================================

    /**
     * @notice Initiate a battery ownership transfer (Step 1 of 2)
     * @dev Recipient must accept the transfer within TRANSFER_EXPIRATION time
     * @param bin Battery ID
     * @param newOwner Intended new owner address
     * @param newState Battery state after transfer (Integrated, FirstLife, SecondLife, EndOfLife, etc.)
     */
    function initiateTransfer(
        bytes32 bin,
        address newOwner,
        BatteryState newState
    )
        external
        batteryExists(bin)
    {
        require(newOwner != address(0), "BatteryRegistry: Invalid address");
        require(newOwner != msg.sender, "BatteryRegistry: Cannot transfer to yourself");

        BatteryData storage battery = batteries[bin];
        require(
            battery.currentOwner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "BatteryRegistry: Not authorized"
        );

        // Check if there's already a pending transfer
        PendingTransfer storage pending = pendingTransfers[bin];
        require(!pending.isActive, "BatteryRegistry: Transfer already pending");

        // Validate state transition
        _validateStateTransition(battery.state, newState);

        // Create pending transfer
        pendingTransfers[bin] = PendingTransfer({
            from: msg.sender,
            to: newOwner,
            newState: newState,
            initiatedAt: uint64(block.timestamp),
            isActive: true
        });

        totalPendingTransfers++;

        emit TransferInitiated(bin, msg.sender, newOwner, newState, uint64(block.timestamp));
    }

    /**
     * @notice Accept a pending battery transfer (Step 2 of 2)
     * @dev Must be called by the intended recipient
     * @param bin Battery ID
     */
    function acceptTransfer(bytes32 bin)
        external
        batteryExists(bin)
    {
        PendingTransfer storage pending = pendingTransfers[bin];
        require(pending.isActive, "BatteryRegistry: No active transfer");
        require(pending.to == msg.sender, "BatteryRegistry: Not the recipient");
        require(
            block.timestamp <= pending.initiatedAt + TRANSFER_EXPIRATION,
            "BatteryRegistry: Transfer expired"
        );

        BatteryData storage battery = batteries[bin];
        address previousOwner = battery.currentOwner;
        BatteryState previousState = battery.state;

        // Execute transfer
        battery.currentOwner = pending.to;
        battery.state = pending.newState;

        // Clean up pending transfer
        address transferTo = pending.to;
        BatteryState transferState = pending.newState;
        delete pendingTransfers[bin];
        totalPendingTransfers--;

        emit BatteryOwnershipTransferred(bin, previousOwner, transferTo);
        emit BatteryStateChanged(bin, previousState, transferState, msg.sender);
        emit TransferAccepted(bin, previousOwner, transferTo, transferState, uint64(block.timestamp));
    }

    /**
     * @notice Reject a pending battery transfer
     * @dev Can be called by the intended recipient
     * @param bin Battery ID
     */
    function rejectTransfer(bytes32 bin)
        external
        batteryExists(bin)
    {
        PendingTransfer storage pending = pendingTransfers[bin];
        require(pending.isActive, "BatteryRegistry: No active transfer");
        require(pending.to == msg.sender, "BatteryRegistry: Not the recipient");

        address from = pending.from;
        address to = pending.to;

        // Clean up pending transfer
        delete pendingTransfers[bin];
        totalPendingTransfers--;

        emit TransferRejected(bin, from, to, uint64(block.timestamp));
    }

    /**
     * @notice Cancel a pending battery transfer
     * @dev Can be called by the initiator or admin
     * @param bin Battery ID
     */
    function cancelTransfer(bytes32 bin)
        external
        batteryExists(bin)
    {
        PendingTransfer storage pending = pendingTransfers[bin];
        require(pending.isActive, "BatteryRegistry: No active transfer");
        require(
            pending.from == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "BatteryRegistry: Not authorized"
        );

        address from = pending.from;
        address to = pending.to;

        // Clean up pending transfer
        delete pendingTransfers[bin];
        totalPendingTransfers--;

        emit TransferCancelled(bin, from, to, uint64(block.timestamp));
    }

    /**
     * @notice Clear an expired transfer
     * @dev Can be called by anyone to clean up expired transfers
     * @param bin Battery ID
     */
    function clearExpiredTransfer(bytes32 bin)
        external
        batteryExists(bin)
    {
        PendingTransfer storage pending = pendingTransfers[bin];
        require(pending.isActive, "BatteryRegistry: No active transfer");
        require(
            block.timestamp > pending.initiatedAt + TRANSFER_EXPIRATION,
            "BatteryRegistry: Transfer not expired yet"
        );

        address from = pending.from;
        address to = pending.to;

        // Clean up pending transfer
        delete pendingTransfers[bin];
        totalPendingTransfers--;

        emit TransferExpired(bin, from, to, uint64(block.timestamp));
    }

    /**
     * @notice Validate state transition is allowed
     * @dev Internal function to check if state transition is valid
     * @param currentState Current battery state
     * @param newState Intended new state
     */
    function _validateStateTransition(BatteryState currentState, BatteryState newState) internal pure {
        // Manufactured can go to Integrated or FirstLife
        if (currentState == BatteryState.Manufactured) {
            require(
                newState == BatteryState.Integrated || newState == BatteryState.FirstLife,
                "BatteryRegistry: Invalid state transition from Manufactured"
            );
        }
        // Integrated can go to FirstLife
        else if (currentState == BatteryState.Integrated) {
            require(
                newState == BatteryState.FirstLife,
                "BatteryRegistry: Invalid state transition from Integrated"
            );
        }
        // FirstLife can go to SecondLife or EndOfLife
        else if (currentState == BatteryState.FirstLife) {
            require(
                newState == BatteryState.SecondLife || newState == BatteryState.EndOfLife,
                "BatteryRegistry: Invalid state transition from FirstLife"
            );
        }
        // SecondLife can go to EndOfLife
        else if (currentState == BatteryState.SecondLife) {
            require(
                newState == BatteryState.EndOfLife,
                "BatteryRegistry: Invalid state transition from SecondLife"
            );
        }
        // EndOfLife can go to Recycled
        else if (currentState == BatteryState.EndOfLife) {
            require(
                newState == BatteryState.Recycled,
                "BatteryRegistry: Invalid state transition from EndOfLife"
            );
        }
        // Recycled is final state
        else if (currentState == BatteryState.Recycled) {
            revert("BatteryRegistry: Cannot transition from Recycled state");
        }
    }

    /**
     * @notice Mark battery as recycled
     * @param bin Battery ID
     */
    function recycleBattery(bytes32 bin)
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
    {
        BatteryData storage battery = batteries[bin];
        require(
            battery.state == BatteryState.EndOfLife || battery.state == BatteryState.SecondLife,
            "BatteryRegistry: Battery must be EndOfLife or SecondLife"
        );

        battery.state = BatteryState.Recycled;
        battery.recyclingDate = uint64(block.timestamp);

        emit BatteryRecycled(bin, msg.sender, uint64(block.timestamp));
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get complete battery data
     * @param bin Battery ID
     * @return Battery data struct
     */
    function getBattery(bytes32 bin) external view batteryExists(bin) returns (BatteryData memory) {
        return batteries[bin];
    }

    /**
     * @notice Get battery current owner
     * @param bin Battery ID
     */
    function getOwner(bytes32 bin) external view batteryExists(bin) returns (address) {
        return batteries[bin].currentOwner;
    }

    /**
     * @notice Get battery current state
     * @param bin Battery ID
     */
    function getBatteryState(bytes32 bin) external view batteryExists(bin) returns (BatteryState) {
        return batteries[bin].state;
    }

    /**
     * @notice Get battery current SOH
     * @param bin Battery ID
     */
    function getCurrentSOH(bytes32 bin) external view batteryExists(bin) returns (uint16) {
        return batteries[bin].sohCurrent;
    }

    /**
     * @notice Get pending transfer for a battery
     * @param bin Battery ID
     * @return PendingTransfer struct
     */
    function getPendingTransfer(bytes32 bin) external view returns (PendingTransfer memory) {
        return pendingTransfers[bin];
    }

    /**
     * @notice Check if a battery has an active pending transfer
     * @param bin Battery ID
     * @return True if transfer is pending and active
     */
    function hasPendingTransfer(bytes32 bin) external view returns (bool) {
        return pendingTransfers[bin].isActive;
    }

    /**
     * @notice Check if a pending transfer has expired
     * @param bin Battery ID
     * @return True if transfer exists and has expired
     */
    function isTransferExpired(bytes32 bin) external view returns (bool) {
        PendingTransfer storage pending = pendingTransfers[bin];
        if (!pending.isActive) return false;
        return block.timestamp > pending.initiatedAt + TRANSFER_EXPIRATION;
    }

    /**
     * @notice Get time remaining for a pending transfer
     * @param bin Battery ID
     * @return Seconds remaining (0 if expired or no transfer)
     */
    function getTransferTimeRemaining(bytes32 bin) external view returns (uint256) {
        PendingTransfer storage pending = pendingTransfers[bin];
        if (!pending.isActive) return 0;

        uint256 expirationTime = pending.initiatedAt + TRANSFER_EXPIRATION;
        if (block.timestamp >= expirationTime) return 0;

        return expirationTime - block.timestamp;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Grant manufacturer role
     */
    function grantManufacturerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    /**
     * @notice Grant OEM role
     */
    function grantOEMRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(OEM_ROLE, account);
    }

    /**
     * @notice Grant operator role
     */
    function grantOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, account);
    }

    /**
     * @notice Grant recycler role
     */
    function grantRecyclerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RECYCLER_ROLE, account);
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
