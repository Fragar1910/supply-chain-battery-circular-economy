// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BatteryRegistry.sol";
import "./RoleManager.sol";

/**
 * @title RecyclingManager
 * @notice Manages battery end-of-life recycling and material recovery tracking
 * @dev Complies with EU Battery Regulation recycling efficiency requirements
 *
 * EU RECYCLING TARGETS (Regulation 2023/1542):
 * - By 2025: 65% collection rate, 50% recycling efficiency
 * - By 2030: 70% collection rate, 80% recycling efficiency
 * - Material recovery targets:
 *   - Lithium: 50% (2027), 80% (2031)
 *   - Cobalt: 90% (2027), 95% (2031)
 *   - Nickel: 90% (2027), 95% (2031)
 *   - Copper: 90% (2027), 95% (2031)
 *
 * TRACKED MATERIALS:
 * - Lithium (Li)
 * - Cobalt (Co)
 * - Nickel (Ni)
 * - Copper (Cu)
 * - Manganese (Mn)
 * - Aluminum (Al)
 * - Graphite (C)
 */
contract RecyclingManager is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Recyclable materials in batteries
     */
    enum MaterialType {
        Lithium,        // 0: Li
        Cobalt,         // 1: Co
        Nickel,         // 2: Ni
        Copper,         // 3: Cu
        Manganese,      // 4: Mn
        Aluminum,       // 5: Al
        Graphite,       // 6: C (anode material)
        Other           // 7: Other materials
    }

    /**
     * @notice Recycling process status
     */
    enum RecyclingStatus {
        NotStarted,         // 0: Not yet in recycling
        Received,           // 1: Battery received at facility
        Disassembled,       // 2: Pack disassembled
        MaterialsSorted,    // 3: Materials separated
        Processing,         // 4: Chemical processing
        Completed,          // 5: Recovery completed
        Audited             // 6: Third-party verified
    }

    /**
     * @notice Recycling method
     */
    enum RecyclingMethod {
        Pyrometallurgical,  // 0: High-temperature smelting
        Hydrometallurgical, // 1: Chemical leaching
        DirectRecycling,    // 2: Physical separation
        Hybrid              // 3: Combined methods
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Material recovery record
     * @dev Storage optimized
     */
    struct MaterialRecovery {
        MaterialType material;          // 1 byte
        uint32 recoveredKg;             // 4 bytes - kg recovered (max 4,294,967 kg)
        uint32 inputKg;                 // 4 bytes - kg input to process
        uint16 recoveryRate;            // 2 bytes - percentage * 100 (0-10000)
        uint64 recoveryDate;            // 8 bytes
        address recoveredBy;            // 20 bytes
        // Total: 39 bytes (2 slots)
    }

    /**
     * @notice Recycling process data
     */
    struct RecyclingData {
        bytes32 bin;                        // Battery ID
        RecyclingStatus status;             // Current status
        RecyclingMethod method;             // Recycling method used
        address recycler;                   // Recycling facility
        uint64 receivedDate;                // When received
        uint64 completionDate;              // When completed
        uint32 totalInputWeightKg;          // Total battery weight
        uint32 totalRecoveredWeightKg;      // Total recovered material
        uint16 overallRecoveryRate;         // Overall efficiency %
        bytes32 facilityHash;               // IPFS hash of facility certifications
        bytes32 processHash;                // IPFS hash of process documentation
        bool isAudited;                     // Third-party audit completed
    }

    /**
     * @notice Batch material recovery
     */
    struct MaterialBatch {
        MaterialType material;
        uint32 recoveredKg;
        uint32 inputKg;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice BatteryRegistry contract reference
    BatteryRegistry public batteryRegistry;

    /// @notice RoleManager contract reference
    RoleManager public roleManager;

    /// @notice Nested mapping: BIN => RecyclingData
    mapping(bytes32 => RecyclingData) private recyclingRecords;

    /// @notice Nested mapping: BIN => MaterialType => MaterialRecovery[]
    mapping(bytes32 => mapping(MaterialType => MaterialRecovery[])) private materialRecoveries;

    /// @notice Nested mapping: BIN => MaterialType => total kg recovered
    mapping(bytes32 => mapping(MaterialType => uint256)) private totalMaterialRecovered;

    /// @notice Track if battery is in recycling
    mapping(bytes32 => bool) public isInRecycling;

    /// @notice Global material recovery totals (MaterialType => kg)
    mapping(MaterialType => uint256) public globalMaterialRecovery;

    /// @notice Total batteries recycled
    uint256 public totalBatteriesRecycled;

    /// @notice Total batteries currently in recycling
    uint256 public totalBatteriesInRecycling;

    // ============================================
    // EVENTS (INDEXED FOR THE GRAPH)
    // ============================================

    event RecyclingStarted(
        bytes32 indexed bin,
        address indexed recycler,
        RecyclingMethod method,
        uint32 inputWeightKg,
        uint64 timestamp
    );

    event RecyclingStatusUpdated(
        bytes32 indexed bin,
        RecyclingStatus indexed oldStatus,
        RecyclingStatus indexed newStatus,
        address updatedBy
    );

    event MaterialRecovered(
        bytes32 indexed bin,
        MaterialType indexed material,
        uint32 recoveredKg,
        uint16 recoveryRate,
        address indexed recoveredBy
    );

    event BatchMaterialsRecovered(
        bytes32 indexed bin,
        uint256 materialCount,
        uint32 totalRecoveredKg,
        address indexed recoveredBy
    );

    event RecyclingCompleted(
        bytes32 indexed bin,
        uint32 totalRecoveredKg,
        uint16 overallRecoveryRate,
        address indexed recycler,
        uint64 timestamp
    );

    event RecyclingAudited(
        bytes32 indexed bin,
        address indexed auditor,
        bool approved,
        uint64 timestamp
    );

    event GlobalRecoveryMilestone(
        MaterialType indexed material,
        uint256 totalRecoveredKg,
        uint64 timestamp
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryExists(bytes32 bin) {
        require(batteryRegistry.binExists(bin), "RecyclingManager: Battery does not exist");
        _;
    }

    modifier notInRecycling(bytes32 bin) {
        require(!isInRecycling[bin], "RecyclingManager: Already in recycling");
        _;
    }

    modifier inRecycling(bytes32 bin) {
        require(isInRecycling[bin], "RecyclingManager: Not in recycling");
        _;
    }

    modifier validWeight(uint32 weight) {
        require(weight > 0, "RecyclingManager: Weight must be positive");
        require(weight <= 10_000, "RecyclingManager: Weight exceeds maximum (10,000 kg)");
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
     * @param _batteryRegistry BatteryRegistry contract address
     * @param _roleManager RoleManager contract address
     */
    function initialize(
        address admin,
        address _batteryRegistry,
        address _roleManager
    ) public initializer {
        __AccessControl_init();

        require(_batteryRegistry != address(0), "RecyclingManager: Invalid BatteryRegistry");
        require(_roleManager != address(0), "RecyclingManager: Invalid RoleManager");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        // Note: RECYCLER_ROLE is NOT granted to admin - only to specific recyclers via grantRecyclerRole()

        batteryRegistry = BatteryRegistry(_batteryRegistry);
        roleManager = RoleManager(_roleManager);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Start recycling process
     * @param bin Battery ID
     * @param method Recycling method to use
     * @param inputWeightKg Total battery weight
     * @param facilityHash IPFS hash of facility documentation
     */
    function startRecycling(
        bytes32 bin,
        RecyclingMethod method,
        uint32 inputWeightKg,
        bytes32 facilityHash
    )
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
        notInRecycling(bin)
        validWeight(inputWeightKg)
    {
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);

        // Verify battery is in appropriate state for recycling
        require(
            battery.state == BatteryRegistry.BatteryState.EndOfLife ||
            battery.state == BatteryRegistry.BatteryState.SecondLife,
            "RecyclingManager: Battery must be EndOfLife or SecondLife"
        );

        // Create recycling record
        recyclingRecords[bin] = RecyclingData({
            bin: bin,
            status: RecyclingStatus.Received,
            method: method,
            recycler: msg.sender,
            receivedDate: uint64(block.timestamp),
            completionDate: 0,
            totalInputWeightKg: inputWeightKg,
            totalRecoveredWeightKg: 0,
            overallRecoveryRate: 0,
            facilityHash: facilityHash,
            processHash: bytes32(0),
            isAudited: false
        });

        isInRecycling[bin] = true;
        totalBatteriesInRecycling++;

        emit RecyclingStarted(bin, msg.sender, method, inputWeightKg, uint64(block.timestamp));
    }

    /**
     * @notice Update recycling status
     * @param bin Battery ID
     * @param newStatus New status
     */
    function updateRecyclingStatus(bytes32 bin, RecyclingStatus newStatus)
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
        inRecycling(bin)
    {
        RecyclingData storage data = recyclingRecords[bin];
        require(data.recycler == msg.sender, "RecyclingManager: Not the assigned recycler");

        RecyclingStatus oldStatus = data.status;
        require(newStatus != oldStatus, "RecyclingManager: Same status");

        data.status = newStatus;

        emit RecyclingStatusUpdated(bin, oldStatus, newStatus, msg.sender);
    }

    /**
     * @notice Record material recovery
     * @param bin Battery ID
     * @param material Material type
     * @param recoveredKg Amount recovered (kg)
     * @param inputKg Amount input to process (kg)
     */
    function recordMaterialRecovery(
        bytes32 bin,
        MaterialType material,
        uint32 recoveredKg,
        uint32 inputKg
    )
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
        inRecycling(bin)
        validWeight(recoveredKg)
        validWeight(inputKg)
    {
        require(recoveredKg <= inputKg, "RecyclingManager: Recovered exceeds input");

        RecyclingData storage data = recyclingRecords[bin];
        require(data.recycler == msg.sender, "RecyclingManager: Not the assigned recycler");

        // Calculate recovery rate (percentage * 100)
        uint16 recoveryRate = uint16((uint256(recoveredKg) * 10_000) / uint256(inputKg));

        // Create recovery record
        MaterialRecovery memory recovery = MaterialRecovery({
            material: material,
            recoveredKg: recoveredKg,
            inputKg: inputKg,
            recoveryRate: recoveryRate,
            recoveryDate: uint64(block.timestamp),
            recoveredBy: msg.sender
        });

        materialRecoveries[bin][material].push(recovery);
        totalMaterialRecovered[bin][material] += recoveredKg;
        globalMaterialRecovery[material] += recoveredKg;

        emit MaterialRecovered(bin, material, recoveredKg, recoveryRate, msg.sender);

        // Check for milestone (every 1000 kg)
        if (globalMaterialRecovery[material] % 1000 == 0) {
            emit GlobalRecoveryMilestone(material, globalMaterialRecovery[material], uint64(block.timestamp));
        }
    }

    /**
     * @notice Record multiple materials in batch (gas optimization)
     * @param bin Battery ID
     * @param materials Array of material recoveries
     */
    function batchRecordMaterials(bytes32 bin, MaterialBatch[] calldata materials)
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
        inRecycling(bin)
    {
        require(materials.length > 0 && materials.length <= 8, "RecyclingManager: Invalid batch size");

        RecyclingData storage data = recyclingRecords[bin];
        require(data.recycler == msg.sender, "RecyclingManager: Not the assigned recycler");

        uint32 totalRecovered = 0;

        for (uint256 i = 0; i < materials.length; i++) {
            MaterialBatch calldata mat = materials[i];

            require(mat.recoveredKg > 0 && mat.recoveredKg <= 10_000, "RecyclingManager: Invalid weight");
            require(mat.inputKg > 0 && mat.inputKg <= 10_000, "RecyclingManager: Invalid weight");
            require(mat.recoveredKg <= mat.inputKg, "RecyclingManager: Recovered exceeds input");

            uint16 recoveryRate = uint16((uint256(mat.recoveredKg) * 10_000) / uint256(mat.inputKg));

            MaterialRecovery memory recovery = MaterialRecovery({
                material: mat.material,
                recoveredKg: mat.recoveredKg,
                inputKg: mat.inputKg,
                recoveryRate: recoveryRate,
                recoveryDate: uint64(block.timestamp),
                recoveredBy: msg.sender
            });

            materialRecoveries[bin][mat.material].push(recovery);
            totalMaterialRecovered[bin][mat.material] += mat.recoveredKg;
            globalMaterialRecovery[mat.material] += mat.recoveredKg;

            totalRecovered += mat.recoveredKg;
        }

        emit BatchMaterialsRecovered(bin, materials.length, totalRecovered, msg.sender);
    }

    /**
     * @notice Complete recycling process
     * @param bin Battery ID
     * @param processHash IPFS hash of process documentation
     */
    function completeRecycling(bytes32 bin, bytes32 processHash)
        external
        onlyRole(RECYCLER_ROLE)
        batteryExists(bin)
        inRecycling(bin)
    {
        RecyclingData storage data = recyclingRecords[bin];
        require(data.recycler == msg.sender, "RecyclingManager: Not the assigned recycler");
        require(data.status != RecyclingStatus.Completed, "RecyclingManager: Already completed");

        // Calculate total recovered weight
        uint32 totalRecovered = 0;
        for (uint256 i = 0; i <= uint256(type(MaterialType).max); i++) {
            totalRecovered += uint32(totalMaterialRecovered[bin][MaterialType(i)]);
        }

        // Calculate overall recovery rate
        uint16 overallRate = 0;
        if (data.totalInputWeightKg > 0) {
            overallRate = uint16((uint256(totalRecovered) * 10_000) / uint256(data.totalInputWeightKg));
        }

        data.totalRecoveredWeightKg = totalRecovered;
        data.overallRecoveryRate = overallRate;
        data.completionDate = uint64(block.timestamp);
        data.processHash = processHash;
        data.status = RecyclingStatus.Completed;

        totalBatteriesInRecycling--;
        totalBatteriesRecycled++;

        emit RecyclingCompleted(bin, totalRecovered, overallRate, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Audit recycling process (third-party verification)
     * @param bin Battery ID
     * @param approved Audit result
     */
    function auditRecycling(bytes32 bin, bool approved)
        external
        onlyRole(AUDITOR_ROLE)
        batteryExists(bin)
        inRecycling(bin)
    {
        RecyclingData storage data = recyclingRecords[bin];
        require(data.status == RecyclingStatus.Completed, "RecyclingManager: Recycling not completed");

        data.isAudited = true;
        if (approved) {
            data.status = RecyclingStatus.Audited;
        }

        emit RecyclingAudited(bin, msg.sender, approved, uint64(block.timestamp));
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get recycling data
     * @param bin Battery ID
     */
    function getRecyclingData(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (RecyclingData memory)
    {
        return recyclingRecords[bin];
    }

    /**
     * @notice Get material recovery history
     * @param bin Battery ID
     * @param material Material type
     */
    function getMaterialRecoveryHistory(bytes32 bin, MaterialType material)
        external
        view
        batteryExists(bin)
        returns (MaterialRecovery[] memory)
    {
        return materialRecoveries[bin][material];
    }

    /**
     * @notice Get total recovered for a material
     * @param bin Battery ID
     * @param material Material type
     */
    function getTotalMaterialRecovered(bytes32 bin, MaterialType material)
        external
        view
        batteryExists(bin)
        returns (uint256)
    {
        return totalMaterialRecovered[bin][material];
    }

    /**
     * @notice Get material recovery breakdown
     * @param bin Battery ID
     */
    function getMaterialBreakdown(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (
            uint256 lithium,
            uint256 cobalt,
            uint256 nickel,
            uint256 copper,
            uint256 manganese,
            uint256 aluminum,
            uint256 graphite
        )
    {
        return (
            totalMaterialRecovered[bin][MaterialType.Lithium],
            totalMaterialRecovered[bin][MaterialType.Cobalt],
            totalMaterialRecovered[bin][MaterialType.Nickel],
            totalMaterialRecovered[bin][MaterialType.Copper],
            totalMaterialRecovered[bin][MaterialType.Manganese],
            totalMaterialRecovered[bin][MaterialType.Aluminum],
            totalMaterialRecovered[bin][MaterialType.Graphite]
        );
    }

    /**
     * @notice Get global recovery statistics
     */
    function getGlobalRecoveryStats()
        external
        view
        returns (
            uint256 lithium,
            uint256 cobalt,
            uint256 nickel,
            uint256 copper,
            uint256 totalBatteries
        )
    {
        return (
            globalMaterialRecovery[MaterialType.Lithium],
            globalMaterialRecovery[MaterialType.Cobalt],
            globalMaterialRecovery[MaterialType.Nickel],
            globalMaterialRecovery[MaterialType.Copper],
            totalBatteriesRecycled
        );
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update BatteryRegistry reference
     */
    function setBatteryRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "RecyclingManager: Invalid address");
        batteryRegistry = BatteryRegistry(newRegistry);
    }

    /**
     * @notice Update RoleManager reference
     */
    function setRoleManager(address newRoleManager) external onlyRole(ADMIN_ROLE) {
        require(newRoleManager != address(0), "RecyclingManager: Invalid address");
        roleManager = RoleManager(newRoleManager);
    }

    /**
     * @notice Grant recycler role
     */
    function grantRecyclerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RECYCLER_ROLE, account);
    }

    /**
     * @notice Grant auditor role
     */
    function grantAuditorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, account);
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
