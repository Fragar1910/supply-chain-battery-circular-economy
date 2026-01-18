// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BatteryRegistry.sol";

/**
 * @title CarbonFootprint
 * @notice Tracks and aggregates CO2 emissions across battery lifecycle
 * @dev Complies with EU Battery Passport carbon footprint reporting requirements
 *
 * LIFECYCLE PHASES (EU Battery Regulation 2023/1542):
 * 1. Raw Material Extraction: Mining lithium, cobalt, nickel, graphite
 * 2. Manufacturing: Cell production, module assembly, pack integration
 * 3. Transportation: Shipping between supply chain actors
 * 4. First Life Usage: Operational emissions (charging from grid)
 * 5. Second Life: Repurposing and operation
 * 6. Recycling: End-of-life processing
 *
 * CARBON FOOTPRINT CALCULATION:
 * Total = Σ(emissions per phase) in kg CO2e
 */
contract CarbonFootprint is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Maximum reasonable CO2 emission per entry (100 tons)
    uint256 public constant MAX_SINGLE_EMISSION = 100_000; // kg CO2e

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Battery lifecycle phases for carbon tracking
     */
    enum LifecyclePhase {
        RawMaterialExtraction,  // 0: Mining and processing
        Manufacturing,          // 1: Cell, module, pack production
        Transportation,         // 2: Shipping and logistics
        FirstLifeUsage,        // 3: Operation in vehicle
        SecondLifeUsage,       // 4: Repurposed applications
        Recycling              // 5: End-of-life processing
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Emission record
     * @dev Storage optimized: 3 slots
     */
    struct EmissionRecord {
        uint256 kgCO2e;                 // 32 bytes - CO2 equivalent in kg (Slot 0)
        LifecyclePhase phase;           // 1 byte
        uint64 timestamp;               // 8 bytes
        address recordedBy;             // 20 bytes (Slot 1: 29 bytes total)
        bytes32 evidenceHash;           // 32 bytes - IPFS hash of supporting documents (Slot 2)
        string description;             // Dynamic - stored separately
    }

    /**
     * @notice Aggregated footprint per phase
     */
    struct PhaseFootprint {
        uint256 totalKgCO2e;            // Total emissions
        uint256 recordCount;            // Number of emission records
        uint64 lastUpdated;             // Last emission timestamp
    }

    /**
     * @notice Battery total carbon footprint summary
     */
    struct CarbonSummary {
        uint256 totalLifecycleEmissions;    // Sum of all phases
        uint256 rawMaterialEmissions;
        uint256 manufacturingEmissions;
        uint256 transportationEmissions;
        uint256 firstLifeEmissions;
        uint256 secondLifeEmissions;
        uint256 recyclingEmissions;
        uint64 lastCalculated;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice BatteryRegistry contract reference
    BatteryRegistry public batteryRegistry;

    /// @notice Nested mapping: BIN => LifecyclePhase => total emissions
    mapping(bytes32 => mapping(LifecyclePhase => PhaseFootprint)) private phaseEmissions;

    /// @notice Nested mapping: BIN => LifecyclePhase => EmissionRecord[]
    mapping(bytes32 => mapping(LifecyclePhase => EmissionRecord[])) private emissionHistory;

    /// @notice Battery total footprint cache
    mapping(bytes32 => CarbonSummary) private carbonSummaries;

    /// @notice Track if battery has emissions recorded
    mapping(bytes32 => bool) public hasEmissions;

    /// @notice Total emissions across all batteries (kg CO2e)
    uint256 public globalTotalEmissions;

    /// @notice Total emission records stored
    uint256 public totalEmissionRecords;

    // ============================================
    // EVENTS (INDEXED FOR THE GRAPH)
    // ============================================

    event EmissionAdded(
        bytes32 indexed bin,
        LifecyclePhase indexed phase,
        uint256 kgCO2e,
        address indexed recordedBy,
        uint64 timestamp
    );

    event BatchEmissionsAdded(
        bytes32 indexed bin,
        uint256 totalKgCO2e,
        uint256 recordCount,
        address indexed recordedBy
    );

    event FootprintCalculated(
        bytes32 indexed bin,
        uint256 totalEmissions,
        uint64 timestamp
    );

    event FootprintUpdatedInRegistry(
        bytes32 indexed bin,
        uint256 newTotalFootprint,
        address indexed updatedBy
    );

    event EmissionCorrected(
        bytes32 indexed bin,
        LifecyclePhase indexed phase,
        uint256 oldValue,
        uint256 newValue,
        address indexed correctedBy
    );

    event BatteryRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryExists(bytes32 bin) {
        require(batteryRegistry.binExists(bin), "CarbonFootprint: Battery does not exist");
        _;
    }

    modifier validEmission(uint256 kgCO2e) {
        require(kgCO2e > 0, "CarbonFootprint: Emission must be positive");
        require(kgCO2e <= MAX_SINGLE_EMISSION, "CarbonFootprint: Emission exceeds maximum");
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
     */
    function initialize(address admin, address _batteryRegistry) public initializer {
        __AccessControl_init();

        require(_batteryRegistry != address(0), "CarbonFootprint: Invalid BatteryRegistry");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        batteryRegistry = BatteryRegistry(_batteryRegistry);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Add CO2 emission for a specific lifecycle phase
     * @param bin Battery ID
     * @param phase Lifecycle phase
     * @param kgCO2e Emission amount in kg CO2e
     * @param evidenceHash IPFS hash of supporting evidence
     * @param description Human-readable description
     */
    function addEmission(
        bytes32 bin,
        LifecyclePhase phase,
        uint256 kgCO2e,
        bytes32 evidenceHash,
        string calldata description
    )
        external
        onlyRole(AUDITOR_ROLE)
        batteryExists(bin)
        validEmission(kgCO2e)
    {
        // Create emission record
        EmissionRecord memory record = EmissionRecord({
            kgCO2e: kgCO2e,
            phase: phase,
            timestamp: uint64(block.timestamp),
            recordedBy: msg.sender,
            evidenceHash: evidenceHash,
            description: description
        });

        // Store record
        emissionHistory[bin][phase].push(record);

        // Update phase totals
        PhaseFootprint storage phaseTotal = phaseEmissions[bin][phase];
        phaseTotal.totalKgCO2e += kgCO2e;
        phaseTotal.recordCount++;
        phaseTotal.lastUpdated = uint64(block.timestamp);

        // Update global tracking
        hasEmissions[bin] = true;
        globalTotalEmissions += kgCO2e;
        totalEmissionRecords++;

        // Recalculate total footprint
        _recalculateTotalFootprint(bin);

        emit EmissionAdded(bin, phase, kgCO2e, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Add multiple emissions in batch (gas optimization)
     * @param bin Battery ID
     * @param phases Array of lifecycle phases
     * @param emissions Array of emission amounts
     * @param evidenceHashes Array of evidence hashes
     */
    function batchAddEmissions(
        bytes32 bin,
        LifecyclePhase[] calldata phases,
        uint256[] calldata emissions,
        bytes32[] calldata evidenceHashes
    )
        external
        onlyRole(AUDITOR_ROLE)
        batteryExists(bin)
    {
        require(phases.length == emissions.length, "CarbonFootprint: Array length mismatch");
        require(phases.length == evidenceHashes.length, "CarbonFootprint: Array length mismatch");
        require(phases.length > 0 && phases.length <= 20, "CarbonFootprint: Invalid batch size");

        uint256 batchTotal = 0;

        for (uint256 i = 0; i < phases.length; i++) {
            uint256 kgCO2e = emissions[i];
            require(kgCO2e > 0 && kgCO2e <= MAX_SINGLE_EMISSION, "CarbonFootprint: Invalid emission");

            // Create emission record
            EmissionRecord memory record = EmissionRecord({
                kgCO2e: kgCO2e,
                phase: phases[i],
                timestamp: uint64(block.timestamp),
                recordedBy: msg.sender,
                evidenceHash: evidenceHashes[i],
                description: ""
            });

            emissionHistory[bin][phases[i]].push(record);

            // Update phase totals
            PhaseFootprint storage phaseTotal = phaseEmissions[bin][phases[i]];
            phaseTotal.totalKgCO2e += kgCO2e;
            phaseTotal.recordCount++;
            phaseTotal.lastUpdated = uint64(block.timestamp);

            batchTotal += kgCO2e;
        }

        hasEmissions[bin] = true;
        globalTotalEmissions += batchTotal;
        totalEmissionRecords += phases.length;

        // Recalculate total footprint
        _recalculateTotalFootprint(bin);

        emit BatchEmissionsAdded(bin, batchTotal, phases.length, msg.sender);
    }

    /**
     * @notice Calculate and cache total carbon footprint
     * @param bin Battery ID
     * @return Total emissions in kg CO2e
     */
    function calculateTotalFootprint(bytes32 bin)
        external
        batteryExists(bin)
        returns (uint256)
    {
        return _recalculateTotalFootprint(bin);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get total emissions for a specific phase
     * @param bin Battery ID
     * @param phase Lifecycle phase
     */
    function getPhaseEmissions(bytes32 bin, LifecyclePhase phase)
        external
        view
        batteryExists(bin)
        returns (PhaseFootprint memory)
    {
        return phaseEmissions[bin][phase];
    }

    /**
     * @notice Get emission history for a phase
     * @param bin Battery ID
     * @param phase Lifecycle phase
     */
    function getEmissionHistory(bytes32 bin, LifecyclePhase phase)
        external
        view
        batteryExists(bin)
        returns (EmissionRecord[] memory)
    {
        return emissionHistory[bin][phase];
    }

    /**
     * @notice Get complete carbon summary
     * @param bin Battery ID
     */
    function getCarbonSummary(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (CarbonSummary memory)
    {
        return carbonSummaries[bin];
    }

    /**
     * @notice Get total lifecycle footprint
     * @param bin Battery ID
     */
    function getTotalFootprint(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (uint256)
    {
        return carbonSummaries[bin].totalLifecycleEmissions;
    }

    /**
     * @notice Get emissions breakdown by all phases
     * @param bin Battery ID
     */
    function getEmissionsBreakdown(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (
            uint256 rawMaterial,
            uint256 manufacturing,
            uint256 transportation,
            uint256 firstLife,
            uint256 secondLife,
            uint256 recycling
        )
    {
        CarbonSummary memory summary = carbonSummaries[bin];
        return (
            summary.rawMaterialEmissions,
            summary.manufacturingEmissions,
            summary.transportationEmissions,
            summary.firstLifeEmissions,
            summary.secondLifeEmissions,
            summary.recyclingEmissions
        );
    }

    /**
     * @notice Calculate emissions per kWh of capacity
     * @param bin Battery ID
     * @return Emissions intensity (g CO2e per kWh)
     */
    function getEmissionsPerKwh(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (uint256)
    {
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);
        require(battery.capacityKwh > 0, "CarbonFootprint: Invalid capacity");

        uint256 totalEmissions = carbonSummaries[bin].totalLifecycleEmissions;
        // Convert to grams and divide by kWh
        return (totalEmissions * 1000) / battery.capacityKwh;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update BatteryRegistry reference
     * @param newRegistry New BatteryRegistry address
     */
    function setBatteryRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "CarbonFootprint: Invalid address");
        address oldRegistry = address(batteryRegistry);
        batteryRegistry = BatteryRegistry(newRegistry);

        emit BatteryRegistryUpdated(oldRegistry, newRegistry);
    }

    /**
     * @notice Grant carbon auditor role
     */
    function grantCarbonAuditorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, account);
    }

    /**
     * @notice Correct an emission entry (admin only, for data errors)
     * @param bin Battery ID
     * @param phase Lifecycle phase
     * @param recordIndex Index of emission record to correct
     * @param newKgCO2e Corrected value
     */
    function correctEmission(
        bytes32 bin,
        LifecyclePhase phase,
        uint256 recordIndex,
        uint256 newKgCO2e
    )
        external
        onlyRole(ADMIN_ROLE)
        batteryExists(bin)
        validEmission(newKgCO2e)
    {
        EmissionRecord[] storage records = emissionHistory[bin][phase];
        require(recordIndex < records.length, "CarbonFootprint: Invalid record index");

        uint256 oldValue = records[recordIndex].kgCO2e;
        records[recordIndex].kgCO2e = newKgCO2e;

        // Update phase total
        PhaseFootprint storage phaseTotal = phaseEmissions[bin][phase];
        phaseTotal.totalKgCO2e = phaseTotal.totalKgCO2e - oldValue + newKgCO2e;

        // Update global total
        globalTotalEmissions = globalTotalEmissions - oldValue + newKgCO2e;

        // Recalculate total
        _recalculateTotalFootprint(bin);

        emit EmissionCorrected(bin, phase, oldValue, newKgCO2e, msg.sender);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Recalculate and cache total carbon footprint
     * @param bin Battery ID
     */
    function _recalculateTotalFootprint(bytes32 bin) internal returns (uint256) {
        uint256 rawMaterial = phaseEmissions[bin][LifecyclePhase.RawMaterialExtraction].totalKgCO2e;
        uint256 manufacturing = phaseEmissions[bin][LifecyclePhase.Manufacturing].totalKgCO2e;
        uint256 transportation = phaseEmissions[bin][LifecyclePhase.Transportation].totalKgCO2e;
        uint256 firstLife = phaseEmissions[bin][LifecyclePhase.FirstLifeUsage].totalKgCO2e;
        uint256 secondLife = phaseEmissions[bin][LifecyclePhase.SecondLifeUsage].totalKgCO2e;
        uint256 recycling = phaseEmissions[bin][LifecyclePhase.Recycling].totalKgCO2e;

        uint256 total = rawMaterial + manufacturing + transportation + firstLife + secondLife + recycling;

        // Cache summary
        carbonSummaries[bin] = CarbonSummary({
            totalLifecycleEmissions: total,
            rawMaterialEmissions: rawMaterial,
            manufacturingEmissions: manufacturing,
            transportationEmissions: transportation,
            firstLifeEmissions: firstLife,
            secondLifeEmissions: secondLife,
            recyclingEmissions: recycling,
            lastCalculated: uint64(block.timestamp)
        });

        emit FootprintCalculated(bin, total, uint64(block.timestamp));

        return total;
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
