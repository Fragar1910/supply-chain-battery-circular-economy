// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BatteryRegistry.sol";
import "./RoleManager.sol";

/**
 * @title SecondLifeManager
 * @notice Manages battery second life applications (energy storage, stationary systems)
 * @dev Integrates with RoleManager's AFTERMARKET_USER role
 *
 * SECOND LIFE REQUIREMENTS (EU Battery Passport):
 * - Minimum SOH: 70% (batteries below 80% from first life can be repurposed)
 * - Certification required before repurposing
 * - Performance monitoring during second life
 * - Safety testing and validation
 *
 * SECOND LIFE APPLICATIONS:
 * - Home energy storage systems
 * - Grid stabilization
 * - Renewable energy storage
 * - Backup power systems
 * - Light electric vehicles (e-bikes, scooters)
 */
contract SecondLifeManager is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AFTERMARKET_USER_ROLE = keccak256("AFTERMARKET_USER_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    /// @notice Minimum SOH required for second life (70.00%)
    uint16 public constant MIN_SECOND_LIFE_SOH = 7000;

    /// @notice Maximum SOH for second life entry (typically 80.00%)
    uint16 public constant MAX_FIRST_LIFE_SOH = 8000;

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Second life application types
     */
    enum ApplicationType {
        None,                   // 0: Not assigned
        HomeEnergyStorage,      // 1: Residential storage
        GridStabilization,      // 2: Utility-scale
        RenewableStorage,       // 3: Solar/wind storage
        BackupPower,            // 4: UPS systems
        LightEV,                // 5: E-bikes, scooters
        CommercialStorage,      // 6: Commercial buildings
        Other                   // 7: Custom applications
    }

    /**
     * @notice Second life certification status
     */
    enum CertificationStatus {
        NotCertified,           // 0: Not yet certified
        Pending,                // 1: Under review
        Certified,              // 2: Approved for second life
        Rejected,               // 3: Failed certification
        Expired                 // 4: Certification expired
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Second life certification data
     * @dev Storage optimized: ~3 slots
     */
    struct Certification {
        CertificationStatus status;         // 1 byte
        uint16 certifiedSOH;                // 2 bytes - SOH at certification
        uint32 certifiedCapacity;           // 4 bytes - Remaining capacity in Wh (max 4,294,967 Wh = 4,294 kWh)
        uint64 certificationDate;           // 8 bytes
        uint64 expirationDate;              // 8 bytes
        address certifier;                  // 20 bytes
        bytes32 certificateHash;            // 32 bytes - IPFS hash
        string safetyNotes;                 // Dynamic
    }

    /**
     * @notice Second life application data
     * @dev Storage optimized
     */
    struct SecondLifeData {
        bytes32 bin;                        // Battery ID
        ApplicationType applicationType;    // Application category
        address operator;                   // Aftermarket operator
        uint16 initialSOH;                  // SOH when entering second life
        uint16 currentSOH;                  // Current SOH
        uint32 cyclesCompleted;             // Cycles in second life
        uint64 startDate;                   // When second life started
        uint64 lastInspectionDate;          // Last safety inspection
        bool isActive;                      // Currently in use
        bytes32 installationHash;           // IPFS hash of installation docs
    }

    /**
     * @notice Performance report
     */
    struct PerformanceReport {
        uint16 soh;                         // State of Health
        uint16 soc;                         // State of Charge
        uint32 cycles;                      // Cycle count
        int16 temperature;                  // Temperature (°C * 10)
        uint64 timestamp;                   // Report time
        address reportedBy;                 // Who submitted
        bytes32 dataHash;                   // IPFS hash of detailed data
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice BatteryRegistry contract reference
    BatteryRegistry public batteryRegistry;

    /// @notice RoleManager contract reference
    RoleManager public roleManager;

    /// @notice Nested mapping: BIN => SecondLifeData
    mapping(bytes32 => SecondLifeData) private secondLifeBatteries;

    /// @notice Nested mapping: BIN => Certification
    mapping(bytes32 => Certification) private certifications;

    /// @notice Nested mapping: BIN => PerformanceReport[]
    mapping(bytes32 => PerformanceReport[]) private performanceHistory;

    /// @notice Track if battery is in second life
    mapping(bytes32 => bool) public isInSecondLife;

    /// @notice Total batteries in second life
    uint256 public totalSecondLifeBatteries;

    /// @notice Total performance reports
    uint256 public totalPerformanceReports;

    // ============================================
    // EVENTS (INDEXED FOR THE GRAPH)
    // ============================================

    event CertificationRequested(
        bytes32 indexed bin,
        address indexed requestedBy,
        uint16 currentSOH,
        uint64 timestamp
    );

    event CertificationApproved(
        bytes32 indexed bin,
        address indexed certifier,
        uint16 certifiedSOH,
        uint64 expirationDate
    );

    event CertificationRejected(
        bytes32 indexed bin,
        address indexed certifier,
        string reason
    );

    event SecondLifeStarted(
        bytes32 indexed bin,
        ApplicationType indexed applicationType,
        address indexed operator,
        uint16 initialSOH,
        uint64 timestamp
    );

    event SecondLifeEnded(
        bytes32 indexed bin,
        address indexed operator,
        uint16 finalSOH,
        uint64 timestamp
    );

    event PerformanceReported(
        bytes32 indexed bin,
        uint16 soh,
        uint32 cycles,
        address indexed reportedBy,
        uint64 timestamp
    );

    event SafetyInspectionCompleted(
        bytes32 indexed bin,
        address indexed inspector,
        bool passed,
        uint64 timestamp
    );

    event ApplicationTypeChanged(
        bytes32 indexed bin,
        ApplicationType oldType,
        ApplicationType newType
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryExists(bytes32 bin) {
        require(batteryRegistry.binExists(bin), "SecondLifeManager: Battery does not exist");
        _;
    }

    modifier isCertified(bytes32 bin) {
        require(
            certifications[bin].status == CertificationStatus.Certified,
            "SecondLifeManager: Battery not certified"
        );
        require(
            certifications[bin].expirationDate > block.timestamp,
            "SecondLifeManager: Certification expired"
        );
        _;
    }

    modifier notInSecondLife(bytes32 bin) {
        require(!isInSecondLife[bin], "SecondLifeManager: Already in second life");
        _;
    }

    modifier inSecondLife(bytes32 bin) {
        require(isInSecondLife[bin], "SecondLifeManager: Not in second life");
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

        require(_batteryRegistry != address(0), "SecondLifeManager: Invalid BatteryRegistry");
        require(_roleManager != address(0), "SecondLifeManager: Invalid RoleManager");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(CERTIFIER_ROLE, admin);

        batteryRegistry = BatteryRegistry(_batteryRegistry);
        roleManager = RoleManager(_roleManager);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Request second life certification
     * @param bin Battery ID
     */
    function requestCertification(bytes32 bin)
        external
        batteryExists(bin)
        notInSecondLife(bin)
    {
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);

        // Validate SOH is in acceptable range
        require(
            battery.sohCurrent >= MIN_SECOND_LIFE_SOH,
            "SecondLifeManager: SOH too low for second life"
        );
        require(
            battery.sohCurrent <= MAX_FIRST_LIFE_SOH,
            "SecondLifeManager: Battery still suitable for first life"
        );

        // Create pending certification
        certifications[bin] = Certification({
            status: CertificationStatus.Pending,
            certifiedSOH: 0,
            certifiedCapacity: 0,
            certificationDate: 0,
            expirationDate: 0,
            certifier: address(0),
            certificateHash: bytes32(0),
            safetyNotes: ""
        });

        emit CertificationRequested(bin, msg.sender, battery.sohCurrent, uint64(block.timestamp));
    }

    /**
     * @notice Approve second life certification
     * @param bin Battery ID
     * @param certifiedCapacity Remaining usable capacity (Wh)
     * @param validityYears Years until certification expires
     * @param certificateHash IPFS hash of certificate
     * @param safetyNotes Safety assessment notes
     */
    function approveCertification(
        bytes32 bin,
        uint32 certifiedCapacity,
        uint8 validityYears,
        bytes32 certificateHash,
        string calldata safetyNotes
    )
        external
        onlyRole(CERTIFIER_ROLE)
        batteryExists(bin)
    {
        require(
            certifications[bin].status == CertificationStatus.Pending,
            "SecondLifeManager: No pending certification"
        );
        require(validityYears > 0 && validityYears <= 10, "SecondLifeManager: Invalid validity period");

        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);

        uint64 expirationDate = uint64(block.timestamp) + (uint64(validityYears) * 365 days);

        certifications[bin] = Certification({
            status: CertificationStatus.Certified,
            certifiedSOH: battery.sohCurrent,
            certifiedCapacity: certifiedCapacity,
            certificationDate: uint64(block.timestamp),
            expirationDate: expirationDate,
            certifier: msg.sender,
            certificateHash: certificateHash,
            safetyNotes: safetyNotes
        });

        emit CertificationApproved(bin, msg.sender, battery.sohCurrent, expirationDate);
    }

    /**
     * @notice Reject second life certification
     * @param bin Battery ID
     * @param reason Rejection reason
     */
    function rejectCertification(bytes32 bin, string calldata reason)
        external
        onlyRole(CERTIFIER_ROLE)
        batteryExists(bin)
    {
        require(
            certifications[bin].status == CertificationStatus.Pending,
            "SecondLifeManager: No pending certification"
        );

        certifications[bin].status = CertificationStatus.Rejected;

        emit CertificationRejected(bin, msg.sender, reason);
    }

    /**
     * @notice Start second life application
     * @param bin Battery ID
     * @param applicationType Type of second life application
     * @param installationHash IPFS hash of installation documentation
     */
    function startSecondLife(
        bytes32 bin,
        ApplicationType applicationType,
        bytes32 installationHash
    )
        external
        batteryExists(bin)
        notInSecondLife(bin)
    {
        // Allow both AFTERMARKET_USER_ROLE and ADMIN_ROLE to start second life
        require(
            hasRole(AFTERMARKET_USER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "SecondLifeManager: Not authorized"
        );

        require(applicationType != ApplicationType.None, "SecondLifeManager: Invalid application type");

        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);

        // Validate SOH is in acceptable range for second life
        require(
            battery.sohCurrent >= MIN_SECOND_LIFE_SOH,
            "SecondLifeManager: SOH too low for second life (minimum 70%)"
        );
        require(
            battery.sohCurrent <= MAX_FIRST_LIFE_SOH,
            "SecondLifeManager: SOH too high, battery still suitable for first life (maximum 80%)"
        );

        // Create second life record
        secondLifeBatteries[bin] = SecondLifeData({
            bin: bin,
            applicationType: applicationType,
            operator: msg.sender,
            initialSOH: battery.sohCurrent,
            currentSOH: battery.sohCurrent,
            cyclesCompleted: 0,
            startDate: uint64(block.timestamp),
            lastInspectionDate: uint64(block.timestamp),
            isActive: true,
            installationHash: installationHash
        });

        isInSecondLife[bin] = true;
        totalSecondLifeBatteries++;

        // Transfer ownership to the aftermarket user who is starting second life
        // This ensures the operator becomes the new owner of the battery
        batteryRegistry.setOwner(bin, msg.sender);

        // Update battery state in BatteryRegistry to SecondLife
        batteryRegistry.changeBatteryState(bin, BatteryRegistry.BatteryState.SecondLife);

        emit SecondLifeStarted(
            bin,
            applicationType,
            msg.sender,
            battery.sohCurrent,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Report performance during second life
     * @param bin Battery ID
     * @param soh Current State of Health
     * @param soc Current State of Charge
     * @param cycles Cycle count
     * @param temperature Temperature in °C * 10 (e.g., 250 = 25.0°C)
     * @param dataHash IPFS hash of detailed telemetry
     */
    function reportPerformance(
        bytes32 bin,
        uint16 soh,
        uint16 soc,
        uint32 cycles,
        int16 temperature,
        bytes32 dataHash
    )
        external
        onlyRole(AFTERMARKET_USER_ROLE)
        batteryExists(bin)
        inSecondLife(bin)
    {
        require(soh <= 10_000, "SecondLifeManager: Invalid SOH");
        require(soc <= 10_000, "SecondLifeManager: Invalid SOC");

        PerformanceReport memory report = PerformanceReport({
            soh: soh,
            soc: soc,
            cycles: cycles,
            temperature: temperature,
            timestamp: uint64(block.timestamp),
            reportedBy: msg.sender,
            dataHash: dataHash
        });

        performanceHistory[bin].push(report);

        // Update current SOH
        secondLifeBatteries[bin].currentSOH = soh;
        secondLifeBatteries[bin].cyclesCompleted = cycles;

        totalPerformanceReports++;

        emit PerformanceReported(bin, soh, cycles, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice End second life (prepare for recycling)
     * @param bin Battery ID
     */
    function endSecondLife(bytes32 bin)
        external
        onlyRole(AFTERMARKET_USER_ROLE)
        batteryExists(bin)
        inSecondLife(bin)
    {
        SecondLifeData storage data = secondLifeBatteries[bin];
        require(data.operator == msg.sender, "SecondLifeManager: Not the operator");

        data.isActive = false;

        // Update battery state in BatteryRegistry to EndOfLife
        batteryRegistry.changeBatteryState(bin, BatteryRegistry.BatteryState.EndOfLife);

        emit SecondLifeEnded(bin, msg.sender, data.currentSOH, uint64(block.timestamp));
    }

    /**
     * @notice Conduct safety inspection
     * @param bin Battery ID
     * @param passed Inspection result
     */
    function conductInspection(bytes32 bin, bool passed)
        external
        onlyRole(INSPECTOR_ROLE)
        batteryExists(bin)
        inSecondLife(bin)
    {
        secondLifeBatteries[bin].lastInspectionDate = uint64(block.timestamp);

        emit SafetyInspectionCompleted(bin, msg.sender, passed, uint64(block.timestamp));
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get second life data
     * @param bin Battery ID
     */
    function getSecondLifeData(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (SecondLifeData memory)
    {
        return secondLifeBatteries[bin];
    }

    /**
     * @notice Get certification data
     * @param bin Battery ID
     */
    function getCertification(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (Certification memory)
    {
        return certifications[bin];
    }

    /**
     * @notice Get performance history
     * @param bin Battery ID
     */
    function getPerformanceHistory(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (PerformanceReport[] memory)
    {
        return performanceHistory[bin];
    }

    /**
     * @notice Check if battery is eligible for second life
     * @param bin Battery ID
     */
    function isEligibleForSecondLife(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (bool)
    {
        BatteryRegistry.BatteryData memory battery = batteryRegistry.getBattery(bin);
        return battery.sohCurrent >= MIN_SECOND_LIFE_SOH &&
               battery.sohCurrent <= MAX_FIRST_LIFE_SOH &&
               !isInSecondLife[bin];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update BatteryRegistry reference
     */
    function setBatteryRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "SecondLifeManager: Invalid address");
        batteryRegistry = BatteryRegistry(newRegistry);
    }

    /**
     * @notice Update RoleManager reference
     */
    function setRoleManager(address newRoleManager) external onlyRole(ADMIN_ROLE) {
        require(newRoleManager != address(0), "SecondLifeManager: Invalid address");
        roleManager = RoleManager(newRoleManager);
    }

    /**
     * @notice Grant certifier role
     */
    function grantCertifierRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(CERTIFIER_ROLE, account);
    }

    /**
     * @notice Grant inspector role
     */
    function grantInspectorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(INSPECTOR_ROLE, account);
    }

    /**
     * @notice Grant aftermarket user role
     */
    function grantAftermarketUserRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AFTERMARKET_USER_ROLE, account);
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
