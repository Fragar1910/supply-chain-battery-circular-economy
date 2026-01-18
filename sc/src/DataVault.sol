// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BatteryRegistry.sol";

/**
 * @title DataVault
 * @notice Secure storage for battery traceability parameters (ONLY critical on-chain data)
 * @dev Uses nested mappings for gas efficiency and indexed events for The Graph
 *
 * DESIGN PRINCIPLES:
 * - Nested mappings: bin => parameterKey => value
 * - Access control per parameter type
 * - Batch operations for multiple updates
 * - Integration with BatteryRegistry for validation
 *
 * PARAMETER CATEGORIES:
 * - Manufacturing: cell_voltage, module_config, pack_serial
 * - Chemistry: cathode_material, anode_material, electrolyte_type
 * - Compliance: eu_passport_id, certification_number, warranty_id
 * - Performance: max_charge_rate, max_discharge_rate, thermal_limit
 */
contract DataVault is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ============================================
    // CONSTANTS & ROLES
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DATA_WRITER_ROLE = keccak256("DATA_WRITER_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant FLEET_OPERATOR_ROLE = keccak256("FLEET_OPERATOR_ROLE");
    bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");

    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Parameter categories for access control
     */
    enum ParameterCategory {
        Manufacturing,  // 0: Production parameters
        Chemistry,      // 1: Material composition
        Compliance,     // 2: Regulatory data
        Performance,    // 3: Operational limits
        Maintenance,    // 4: Service history
        Safety          // 5: Safety certifications
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Parameter metadata
     * @dev Optimized for storage packing
     */
    struct ParameterMetadata {
        ParameterCategory category;     // 1 byte (uint8)
        bool exists;                    // 1 byte
        uint64 lastUpdated;             // 8 bytes
        address lastUpdatedBy;          // 20 bytes
        // Total: 30 bytes (fits in 1 slot with padding)
    }

    /**
     * @notice Batch update structure
     */
    struct ParameterUpdate {
        bytes32 key;        // Parameter name (hashed)
        bytes32 value;      // Parameter value
        ParameterCategory category;
    }

    /**
     * @notice Telemetry record for fleet operations
     */
    struct TelemetryRecord {
        uint16 soc;              // State of Charge (0-10000 = 0%-100%)
        uint16 soh;              // State of Health (0-10000 = 0%-100%)
        uint32 mileage;          // Total kilometers
        uint32 chargeCycles;     // Total charge cycles
        int16 avgTemperature;    // Average temp in °C * 10 (-400 to 1000 = -40°C to 100°C)
        int16 maxTemperature;    // Maximum temp in °C * 10
        uint16 depthOfDischarge; // DoD (0-10000 = 0%-100%)
        uint16 chargeRate;       // C-rate * 100 (50 = 0.5C, 100 = 1.0C, 200 = 2.0C)
        uint64 timestamp;        // When recorded
        address recordedBy;      // Who recorded
    }

    /**
     * @notice Maintenance service record
     */
    struct MaintenanceRecord {
        uint8 maintenanceType;   // 0=Preventive, 1=Corrective, 2=Inspection, 3=Software, 4=Component
        string description;      // Service description
        string componentsReplaced; // Components replaced (if any)
        string bmsUpdate;        // BMS version/update info
        string technicianId;     // Technician identifier
        uint64 serviceDate;      // Service date timestamp
        uint64 recordedAt;       // When recorded on-chain
        address recordedBy;      // Who recorded
    }

    /**
     * @notice Critical event record
     */
    struct CriticalEvent {
        uint8 eventType;         // 0=Overheating, 1=Overcharge, 2=DeepDischarge, 3=Accident, 4=BMSFailure, 5=RapidDeg, 6=ThermalRunaway, 7=Other
        uint8 severity;          // 0=Low, 1=Medium, 2=High
        string description;      // Event description
        int16 temperature;       // Temp at event (°C * 10)
        uint16 chargeLevel;      // SOC at event (0-10000)
        string location;         // Location description
        uint64 eventDate;        // When event occurred
        uint64 recordedAt;       // When recorded on-chain
        address recordedBy;      // Who recorded
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice BatteryRegistry contract reference
    BatteryRegistry public batteryRegistry;

    /// @notice Nested mapping: BIN => parameterKey => value
    mapping(bytes32 => mapping(bytes32 => bytes32)) private vaultData;

    /// @notice Nested mapping: BIN => parameterKey => metadata
    mapping(bytes32 => mapping(bytes32 => ParameterMetadata)) private parameterMetadata;

    /// @notice Track all parameter keys for a battery
    mapping(bytes32 => bytes32[]) private batteryParameters;

    /// @notice Count of parameters per battery
    mapping(bytes32 => uint256) public parameterCount;

    /// @notice Total parameters stored across all batteries
    uint256 public totalParametersStored;

    /// @notice Telemetry records: bin => array of records
    mapping(bytes32 => TelemetryRecord[]) private telemetryRecords;

    /// @notice Maintenance records: bin => array of records
    mapping(bytes32 => MaintenanceRecord[]) private maintenanceRecords;

    /// @notice Critical events: bin => array of events
    mapping(bytes32 => CriticalEvent[]) private criticalEvents;

    /// @notice Count of telemetry records per battery
    mapping(bytes32 => uint256) public telemetryCount;

    /// @notice Count of maintenance records per battery
    mapping(bytes32 => uint256) public maintenanceCount;

    /// @notice Count of critical events per battery
    mapping(bytes32 => uint256) public criticalEventCount;

    // ============================================
    // EVENTS (INDEXED FOR THE GRAPH)
    // ============================================

    event ParameterStored(
        bytes32 indexed bin,
        bytes32 indexed parameterKey,
        bytes32 value,
        ParameterCategory indexed category,
        address updatedBy,
        uint64 timestamp
    );

    event ParameterUpdated(
        bytes32 indexed bin,
        bytes32 indexed parameterKey,
        bytes32 oldValue,
        bytes32 newValue,
        address updatedBy,
        uint64 timestamp
    );

    event BatchParametersStored(
        bytes32 indexed bin,
        uint256 parameterCount,
        address indexed updatedBy,
        uint64 timestamp
    );

    event ParameterDeleted(
        bytes32 indexed bin,
        bytes32 indexed parameterKey,
        address indexed deletedBy
    );

    event BatteryRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry,
        address updatedBy
    );

    event TelemetryRecorded(
        bytes32 indexed bin,
        uint256 indexed recordIndex,
        uint16 soh,
        uint16 soc,
        uint32 mileage,
        uint32 chargeCycles,
        address indexed recordedBy,
        uint64 timestamp
    );

    event MaintenanceRecorded(
        bytes32 indexed bin,
        uint256 indexed recordIndex,
        uint8 maintenanceType,
        string technicianId,
        uint64 serviceDate,
        address indexed recordedBy,
        uint64 timestamp
    );

    event CriticalEventRecorded(
        bytes32 indexed bin,
        uint256 indexed recordIndex,
        uint8 eventType,
        uint8 severity,
        uint64 eventDate,
        address indexed recordedBy,
        uint64 timestamp
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier batteryExists(bytes32 bin) {
        require(batteryRegistry.binExists(bin), "DataVault: Battery does not exist");
        _;
    }

    modifier validParameter(bytes32 key, bytes32 value) {
        require(key != bytes32(0), "DataVault: Invalid parameter key");
        require(value != bytes32(0), "DataVault: Invalid parameter value");
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

        require(_batteryRegistry != address(0), "DataVault: Invalid BatteryRegistry");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(DATA_WRITER_ROLE, admin);

        batteryRegistry = BatteryRegistry(_batteryRegistry);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Store a single parameter
     * @param bin Battery ID
     * @param parameterKey Parameter name (hashed)
     * @param value Parameter value
     * @param category Parameter category
     */
    function storeParameter(
        bytes32 bin,
        bytes32 parameterKey,
        bytes32 value,
        ParameterCategory category
    )
        external
        onlyRole(DATA_WRITER_ROLE)
        batteryExists(bin)
        validParameter(parameterKey, value)
    {
        bool isNewParameter = !parameterMetadata[bin][parameterKey].exists;
        bytes32 oldValue = vaultData[bin][parameterKey];

        // Store value
        vaultData[bin][parameterKey] = value;

        // Update metadata
        parameterMetadata[bin][parameterKey] = ParameterMetadata({
            category: category,
            exists: true,
            lastUpdated: uint64(block.timestamp),
            lastUpdatedBy: msg.sender
        });

        // Track new parameters
        if (isNewParameter) {
            batteryParameters[bin].push(parameterKey);
            parameterCount[bin]++;
            totalParametersStored++;

            emit ParameterStored(bin, parameterKey, value, category, msg.sender, uint64(block.timestamp));
        } else {
            emit ParameterUpdated(bin, parameterKey, oldValue, value, msg.sender, uint64(block.timestamp));
        }
    }

    /**
     * @notice Store multiple parameters in a single transaction (gas optimization)
     * @param bin Battery ID
     * @param updates Array of parameter updates
     */
    function batchStoreParameters(bytes32 bin, ParameterUpdate[] calldata updates)
        external
        onlyRole(DATA_WRITER_ROLE)
        batteryExists(bin)
    {
        require(updates.length > 0, "DataVault: Empty updates array");
        require(updates.length <= 50, "DataVault: Too many parameters (max 50)");

        uint256 newParametersCount = 0;

        for (uint256 i = 0; i < updates.length; i++) {
            ParameterUpdate calldata update = updates[i];

            require(update.key != bytes32(0), "DataVault: Invalid parameter key");
            require(update.value != bytes32(0), "DataVault: Invalid parameter value");

            bool isNewParameter = !parameterMetadata[bin][update.key].exists;

            // Store value
            vaultData[bin][update.key] = update.value;

            // Update metadata
            parameterMetadata[bin][update.key] = ParameterMetadata({
                category: update.category,
                exists: true,
                lastUpdated: uint64(block.timestamp),
                lastUpdatedBy: msg.sender
            });

            if (isNewParameter) {
                batteryParameters[bin].push(update.key);
                newParametersCount++;
            }
        }

        parameterCount[bin] += newParametersCount;
        totalParametersStored += newParametersCount;

        emit BatchParametersStored(bin, updates.length, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Delete a parameter (admin only)
     * @param bin Battery ID
     * @param parameterKey Parameter to delete
     */
    function deleteParameter(bytes32 bin, bytes32 parameterKey)
        external
        onlyRole(ADMIN_ROLE)
        batteryExists(bin)
    {
        require(parameterMetadata[bin][parameterKey].exists, "DataVault: Parameter does not exist");

        delete vaultData[bin][parameterKey];
        delete parameterMetadata[bin][parameterKey];

        // Remove from array (gas intensive, use sparingly)
        _removeFromParameterArray(bin, parameterKey);

        parameterCount[bin]--;
        totalParametersStored--;

        emit ParameterDeleted(bin, parameterKey, msg.sender);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get parameter value
     * @param bin Battery ID
     * @param parameterKey Parameter name
     */
    function getParameter(bytes32 bin, bytes32 parameterKey)
        external
        view
        batteryExists(bin)
        returns (bytes32)
    {
        require(parameterMetadata[bin][parameterKey].exists, "DataVault: Parameter does not exist");
        return vaultData[bin][parameterKey];
    }

    /**
     * @notice Get parameter with metadata
     * @param bin Battery ID
     * @param parameterKey Parameter name
     */
    function getParameterWithMetadata(bytes32 bin, bytes32 parameterKey)
        external
        view
        batteryExists(bin)
        returns (bytes32 value, ParameterMetadata memory metadata)
    {
        require(parameterMetadata[bin][parameterKey].exists, "DataVault: Parameter does not exist");
        return (vaultData[bin][parameterKey], parameterMetadata[bin][parameterKey]);
    }

    /**
     * @notice Get all parameter keys for a battery
     * @param bin Battery ID
     */
    function getBatteryParameters(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (bytes32[] memory)
    {
        return batteryParameters[bin];
    }

    /**
     * @notice Get multiple parameters in one call (gas optimization)
     * @param bin Battery ID
     * @param keys Array of parameter keys
     */
    function getBatchParameters(bytes32 bin, bytes32[] calldata keys)
        external
        view
        batteryExists(bin)
        returns (bytes32[] memory values)
    {
        values = new bytes32[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            values[i] = vaultData[bin][keys[i]];
        }
        return values;
    }

    /**
     * @notice Check if parameter exists
     * @param bin Battery ID
     * @param parameterKey Parameter name
     */
    function parameterExists(bytes32 bin, bytes32 parameterKey) external view returns (bool) {
        return parameterMetadata[bin][parameterKey].exists;
    }

    /**
     * @notice Get parameters by category
     * @param bin Battery ID
     * @param category Category to filter
     */
    function getParametersByCategory(bytes32 bin, ParameterCategory category)
        external
        view
        batteryExists(bin)
        returns (bytes32[] memory keys, bytes32[] memory values)
    {
        bytes32[] memory allKeys = batteryParameters[bin];
        uint256 categoryCount = 0;

        // Count parameters in category
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (parameterMetadata[bin][allKeys[i]].category == category) {
                categoryCount++;
            }
        }

        // Build result arrays
        keys = new bytes32[](categoryCount);
        values = new bytes32[](categoryCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allKeys.length; i++) {
            if (parameterMetadata[bin][allKeys[i]].category == category) {
                keys[index] = allKeys[i];
                values[index] = vaultData[bin][allKeys[i]];
                index++;
            }
        }

        return (keys, values);
    }

    // ============================================
    // TELEMETRY, MAINTENANCE & CRITICAL EVENTS
    // ============================================

    /**
     * @notice Record battery telemetry data
     * @param bin Battery ID
     * @param soc State of Charge (0-10000 = 0%-100%)
     * @param soh State of Health (0-10000 = 0%-100%)
     * @param mileage Total kilometers
     * @param chargeCycles Total charge cycles
     * @param avgTemperature Average temp in °C * 10
     * @param maxTemperature Max temp in °C * 10
     * @param depthOfDischarge DoD (0-10000 = 0%-100%)
     * @param chargeRate C-rate * 100
     */
    function recordTelemetry(
        bytes32 bin,
        uint16 soc,
        uint16 soh,
        uint32 mileage,
        uint32 chargeCycles,
        int16 avgTemperature,
        int16 maxTemperature,
        uint16 depthOfDischarge,
        uint16 chargeRate
    ) external batteryExists(bin) {
        // Only FLEET_OPERATOR_ROLE, OEM_ROLE, or ADMIN_ROLE can record telemetry
        require(
            hasRole(FLEET_OPERATOR_ROLE, msg.sender) ||
            hasRole(OEM_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "DataVault: Not authorized to record telemetry"
        );

        require(soc <= 10000, "DataVault: Invalid SOC value");
        require(soh <= 10000, "DataVault: Invalid SOH value");
        require(depthOfDischarge <= 10000, "DataVault: Invalid DoD value");

        TelemetryRecord memory record = TelemetryRecord({
            soc: soc,
            soh: soh,
            mileage: mileage,
            chargeCycles: chargeCycles,
            avgTemperature: avgTemperature,
            maxTemperature: maxTemperature,
            depthOfDischarge: depthOfDischarge,
            chargeRate: chargeRate,
            timestamp: uint64(block.timestamp),
            recordedBy: msg.sender
        });

        telemetryRecords[bin].push(record);
        uint256 recordIndex = telemetryRecords[bin].length - 1;
        telemetryCount[bin]++;

        emit TelemetryRecorded(
            bin,
            recordIndex,
            soh,
            soc,
            mileage,
            chargeCycles,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Record maintenance service
     * @param bin Battery ID
     * @param maintenanceType 0=Preventive, 1=Corrective, 2=Inspection, 3=Software, 4=Component
     * @param description Service description
     * @param componentsReplaced Components replaced
     * @param bmsUpdate BMS update info
     * @param technicianId Technician identifier
     * @param serviceDate Service date timestamp
     */
    function recordMaintenance(
        bytes32 bin,
        uint8 maintenanceType,
        string calldata description,
        string calldata componentsReplaced,
        string calldata bmsUpdate,
        string calldata technicianId,
        uint64 serviceDate
    ) external batteryExists(bin) {
        // Only FLEET_OPERATOR_ROLE, OEM_ROLE, or ADMIN_ROLE can record maintenance
        require(
            hasRole(FLEET_OPERATOR_ROLE, msg.sender) ||
            hasRole(OEM_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "DataVault: Not authorized to record maintenance"
        );

        require(maintenanceType <= 4, "DataVault: Invalid maintenance type");
        require(bytes(description).length > 0, "DataVault: Description required");
        require(bytes(technicianId).length > 0, "DataVault: Technician ID required");
        require(serviceDate <= block.timestamp, "DataVault: Invalid service date");

        MaintenanceRecord memory record = MaintenanceRecord({
            maintenanceType: maintenanceType,
            description: description,
            componentsReplaced: componentsReplaced,
            bmsUpdate: bmsUpdate,
            technicianId: technicianId,
            serviceDate: serviceDate,
            recordedAt: uint64(block.timestamp),
            recordedBy: msg.sender
        });

        maintenanceRecords[bin].push(record);
        uint256 recordIndex = maintenanceRecords[bin].length - 1;
        maintenanceCount[bin]++;

        emit MaintenanceRecorded(
            bin,
            recordIndex,
            maintenanceType,
            technicianId,
            serviceDate,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Record critical event
     * @param bin Battery ID
     * @param eventType 0=Overheating, 1=Overcharge, 2=DeepDischarge, 3=Accident, 4=BMSFailure, 5=RapidDeg, 6=ThermalRunaway, 7=Other
     * @param severity 0=Low, 1=Medium, 2=High
     * @param description Event description
     * @param temperature Temperature at event (°C * 10)
     * @param chargeLevel SOC at event (0-10000)
     * @param location Location description
     * @param eventDate When event occurred
     */
    function recordCriticalEvent(
        bytes32 bin,
        uint8 eventType,
        uint8 severity,
        string calldata description,
        int16 temperature,
        uint16 chargeLevel,
        string calldata location,
        uint64 eventDate
    ) external batteryExists(bin) {
        // Only FLEET_OPERATOR_ROLE, OEM_ROLE, or ADMIN_ROLE can record events
        require(
            hasRole(FLEET_OPERATOR_ROLE, msg.sender) ||
            hasRole(OEM_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "DataVault: Not authorized to record events"
        );

        require(eventType <= 7, "DataVault: Invalid event type");
        require(severity <= 2, "DataVault: Invalid severity");
        require(bytes(description).length > 0, "DataVault: Description required");
        require(chargeLevel <= 10000, "DataVault: Invalid charge level");
        require(eventDate <= block.timestamp, "DataVault: Invalid event date");

        CriticalEvent memory eventRecord = CriticalEvent({
            eventType: eventType,
            severity: severity,
            description: description,
            temperature: temperature,
            chargeLevel: chargeLevel,
            location: location,
            eventDate: eventDate,
            recordedAt: uint64(block.timestamp),
            recordedBy: msg.sender
        });

        criticalEvents[bin].push(eventRecord);
        uint256 recordIndex = criticalEvents[bin].length - 1;
        criticalEventCount[bin]++;

        emit CriticalEventRecorded(
            bin,
            recordIndex,
            eventType,
            severity,
            eventDate,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Get telemetry records for a battery
     * @param bin Battery ID
     * @param startIndex Start index (for pagination)
     * @param count Number of records to return
     */
    function getTelemetryRecords(bytes32 bin, uint256 startIndex, uint256 count)
        external
        view
        batteryExists(bin)
        returns (TelemetryRecord[] memory)
    {
        require(startIndex < telemetryRecords[bin].length, "DataVault: Invalid start index");

        uint256 endIndex = startIndex + count;
        if (endIndex > telemetryRecords[bin].length) {
            endIndex = telemetryRecords[bin].length;
        }

        uint256 resultCount = endIndex - startIndex;
        TelemetryRecord[] memory records = new TelemetryRecord[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = telemetryRecords[bin][startIndex + i];
        }

        return records;
    }

    /**
     * @notice Get latest telemetry record
     * @param bin Battery ID
     */
    function getLatestTelemetry(bytes32 bin)
        external
        view
        batteryExists(bin)
        returns (TelemetryRecord memory)
    {
        require(telemetryRecords[bin].length > 0, "DataVault: No telemetry records");
        return telemetryRecords[bin][telemetryRecords[bin].length - 1];
    }

    /**
     * @notice Get maintenance records for a battery
     * @param bin Battery ID
     * @param startIndex Start index (for pagination)
     * @param count Number of records to return
     */
    function getMaintenanceRecords(bytes32 bin, uint256 startIndex, uint256 count)
        external
        view
        batteryExists(bin)
        returns (MaintenanceRecord[] memory)
    {
        require(startIndex < maintenanceRecords[bin].length, "DataVault: Invalid start index");

        uint256 endIndex = startIndex + count;
        if (endIndex > maintenanceRecords[bin].length) {
            endIndex = maintenanceRecords[bin].length;
        }

        uint256 resultCount = endIndex - startIndex;
        MaintenanceRecord[] memory records = new MaintenanceRecord[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = maintenanceRecords[bin][startIndex + i];
        }

        return records;
    }

    /**
     * @notice Get critical events for a battery
     * @param bin Battery ID
     * @param startIndex Start index (for pagination)
     * @param count Number of events to return
     */
    function getCriticalEvents(bytes32 bin, uint256 startIndex, uint256 count)
        external
        view
        batteryExists(bin)
        returns (CriticalEvent[] memory)
    {
        require(startIndex < criticalEvents[bin].length, "DataVault: Invalid start index");

        uint256 endIndex = startIndex + count;
        if (endIndex > criticalEvents[bin].length) {
            endIndex = criticalEvents[bin].length;
        }

        uint256 resultCount = endIndex - startIndex;
        CriticalEvent[] memory events = new CriticalEvent[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            events[i] = criticalEvents[bin][startIndex + i];
        }

        return events;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update BatteryRegistry reference
     * @param newRegistry New BatteryRegistry address
     */
    function setBatteryRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "DataVault: Invalid address");
        address oldRegistry = address(batteryRegistry);
        batteryRegistry = BatteryRegistry(newRegistry);

        emit BatteryRegistryUpdated(oldRegistry, newRegistry, msg.sender);
    }

    /**
     * @notice Grant data writer role
     */
    function grantDataWriterRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(DATA_WRITER_ROLE, account);
    }

    /**
     * @notice Grant manufacturer role
     */
    function grantManufacturerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    /**
     * @notice Grant auditor role
     */
    function grantAuditorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, account);
    }

    /**
     * @notice Grant fleet operator role
     */
    function grantFleetOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(FLEET_OPERATOR_ROLE, account);
    }

    /**
     * @notice Grant OEM role
     */
    function grantOEMRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(OEM_ROLE, account);
    }

    // ============================================
    // COUNTER FUNCTIONS
    // ============================================

    /**
     * @notice Get total number of telemetry records for a battery
     * @param bin Battery identification number
     * @return Total count of telemetry records
     */
    function getTelemetryCount(bytes32 bin) external view returns (uint256) {
        return telemetryCount[bin];
    }

    /**
     * @notice Get total number of maintenance records for a battery
     * @param bin Battery identification number
     * @return Total count of maintenance records
     */
    function getMaintenanceCount(bytes32 bin) external view returns (uint256) {
        return maintenanceCount[bin];
    }

    /**
     * @notice Get total number of critical events for a battery
     * @param bin Battery identification number
     * @return Total count of critical events
     */
    function getCriticalEventCount(bytes32 bin) external view returns (uint256) {
        return criticalEventCount[bin];
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Remove parameter key from array
     * @param bin Battery ID
     * @param parameterKey Key to remove
     */
    function _removeFromParameterArray(bytes32 bin, bytes32 parameterKey) internal {
        bytes32[] storage keys = batteryParameters[bin];
        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == parameterKey) {
                keys[i] = keys[keys.length - 1];
                keys.pop();
                break;
            }
        }
    }

    // ============================================
    // UUPS UPGRADE AUTHORIZATION
    // ============================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
