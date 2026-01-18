// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {DataVault} from "../src/DataVault.sol";
import {BatteryRegistry} from "../src/BatteryRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DataVaultTest
 * @notice Comprehensive test suite for DataVault contract
 * @dev Tests telemetry, maintenance, and critical event recording functionality
 */
contract DataVaultTest is Test {
    DataVault public dataVault;
    BatteryRegistry public batteryRegistry;

    address public admin = address(0x1);
    address public manufacturer = address(0x2);
    address public oem = address(0x3);
    address public fleetOperator = address(0x4);
    address public auditor = address(0x5);
    address public unauthorized = address(0x6);

    bytes32 public testBin = keccak256("NV-2024-001234");

    // Events to test
    event TelemetryRecorded(bytes32 indexed bin, uint256 indexed recordIndex, address indexed recordedBy);
    event MaintenanceRecorded(bytes32 indexed bin, uint256 indexed recordIndex, address indexed recordedBy);
    event CriticalEventRecorded(bytes32 indexed bin, uint256 indexed recordIndex, uint8 severity, address indexed recordedBy);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy BatteryRegistry
        BatteryRegistry batteryRegistryImpl = new BatteryRegistry();
        bytes memory initData = abi.encodeWithSelector(BatteryRegistry.initialize.selector, admin);
        ERC1967Proxy batteryRegistryProxy = new ERC1967Proxy(address(batteryRegistryImpl), initData);
        batteryRegistry = BatteryRegistry(address(batteryRegistryProxy));

        // Deploy DataVault
        DataVault dataVaultImpl = new DataVault();
        bytes memory dataVaultInitData = abi.encodeWithSelector(
            DataVault.initialize.selector,
            admin,
            address(batteryRegistry)
        );
        ERC1967Proxy dataVaultProxy = new ERC1967Proxy(address(dataVaultImpl), dataVaultInitData);
        dataVault = DataVault(address(dataVaultProxy));

        // Setup roles
        batteryRegistry.grantManufacturerRole(manufacturer);
        batteryRegistry.grantManufacturerRole(admin); // Admin needs manufacturer role to register battery
        batteryRegistry.grantOEMRole(oem);
        dataVault.grantOEMRole(oem);
        dataVault.grantFleetOperatorRole(fleetOperator);
        dataVault.grantAuditorRole(auditor);
        dataVault.grantManufacturerRole(manufacturer);

        // Register a test battery
        batteryRegistry.registerBattery(
            testBin,
            BatteryRegistry.Chemistry.NMC,
            75000,    // 75 kWh
            50000,    // 50 kg CO2e
            bytes32(0) // No IPFS hash
        );

        vm.stopPrank();
    }

    // ============================================
    // INITIALIZATION TESTS
    // ============================================

    function testInitialization() public view {
        assertEq(address(dataVault.batteryRegistry()), address(batteryRegistry));
        assertTrue(dataVault.hasRole(dataVault.ADMIN_ROLE(), admin));
    }

    function testCannotInitializeTwice() public {
        vm.expectRevert();
        dataVault.initialize(admin, address(batteryRegistry));
    }

    // ============================================
    // ROLE MANAGEMENT TESTS
    // ============================================

    function testGrantOEMRole() public {
        address newOEM = address(0x10);

        vm.prank(admin);
        dataVault.grantOEMRole(newOEM);

        assertTrue(dataVault.hasRole(dataVault.OEM_ROLE(), newOEM));
    }

    function testGrantFleetOperatorRole() public {
        address newOperator = address(0x11);

        vm.prank(admin);
        dataVault.grantFleetOperatorRole(newOperator);

        assertTrue(dataVault.hasRole(dataVault.FLEET_OPERATOR_ROLE(), newOperator));
    }

    function testOnlyAdminCanGrantRoles() public {
        address newOEM = address(0x10);

        vm.prank(unauthorized);
        vm.expectRevert();
        dataVault.grantOEMRole(newOEM);
    }

    // ============================================
    // TELEMETRY RECORDING TESTS
    // ============================================

    function testRecordTelemetry() public {
        vm.prank(fleetOperator);

        // Expect event emission
        vm.expectEmit(true, true, true, false);
        emit TelemetryRecorded(testBin, 0, fleetOperator);

        dataVault.recordTelemetry(
            testBin,
            8500,  // SOC 85%
            9200,  // SOH 92%
            45230, // mileage
            342,   // charge cycles
            325,   // avg temp 32.5°C
            450,   // max temp 45.0°C
            8000,  // DoD 80%
            150    // C-rate 1.5
        );

        // Verify counter
        assertEq(dataVault.getTelemetryCount(testBin), 1);
    }

    function testRecordTelemetryAsOEM() public {
        vm.prank(oem);

        dataVault.recordTelemetry(
            testBin,
            7500,  // SOC 75%
            9000,  // SOH 90%
            50000, // mileage
            400,   // charge cycles
            300,   // avg temp 30°C
            420,   // max temp 42°C
            7500,  // DoD 75%
            100    // C-rate 1.0
        );

        assertEq(dataVault.getTelemetryCount(testBin), 1);
    }

    function testUnauthorizedCannotRecordTelemetry() public {
        vm.prank(unauthorized);

        vm.expectRevert();
        dataVault.recordTelemetry(
            testBin,
            8500, 9200, 45230, 342, 325, 450, 8000, 150
        );
    }

    function testRecordMultipleTelemetryEntries() public {
        vm.startPrank(fleetOperator);

        // Record 3 telemetry entries
        for (uint i = 0; i < 3; i++) {
            dataVault.recordTelemetry(
                testBin,
                8000 + uint16(i * 100),  // Increasing SOC
                9000 + uint16(i * 50),   // Increasing SOH
                40000 + uint32(i * 1000), // Increasing mileage
                300 + uint32(i * 10),    // Increasing cycles
                320,
                440,
                8000,
                150
            );
        }

        vm.stopPrank();

        assertEq(dataVault.getTelemetryCount(testBin), 3);
    }

    function testGetTelemetryRecords() public {
        vm.startPrank(fleetOperator);

        // Record 2 telemetry entries
        dataVault.recordTelemetry(testBin, 8500, 9200, 45230, 342, 325, 450, 8000, 150);
        dataVault.recordTelemetry(testBin, 8000, 9100, 46000, 350, 330, 455, 8100, 150);

        vm.stopPrank();

        // Get records
        DataVault.TelemetryRecord[] memory records = dataVault.getTelemetryRecords(testBin, 0, 2);

        assertEq(records.length, 2);
        assertEq(records[0].soc, 8500);
        assertEq(records[0].soh, 9200);
        assertEq(records[0].recordedBy, fleetOperator);
        assertEq(records[1].soc, 8000);
        assertEq(records[1].soh, 9100);
    }

    function testGetLatestTelemetry() public {
        vm.startPrank(fleetOperator);

        dataVault.recordTelemetry(testBin, 8500, 9200, 45230, 342, 325, 450, 8000, 150);
        dataVault.recordTelemetry(testBin, 8000, 9100, 46000, 350, 330, 455, 8100, 150);

        vm.stopPrank();

        // Get latest
        DataVault.TelemetryRecord memory latest = dataVault.getLatestTelemetry(testBin);

        assertEq(latest.soc, 8000);
        assertEq(latest.soh, 9100);
        assertEq(latest.mileage, 46000);
    }

    function testTelemetryPagination() public {
        vm.startPrank(fleetOperator);

        // Record 5 entries
        for (uint i = 0; i < 5; i++) {
            dataVault.recordTelemetry(
                testBin,
                8000 + uint16(i * 100),
                9000,
                40000,
                300,
                320,
                440,
                8000,
                150
            );
        }

        vm.stopPrank();

        // Test pagination
        DataVault.TelemetryRecord[] memory page1 = dataVault.getTelemetryRecords(testBin, 0, 3);
        DataVault.TelemetryRecord[] memory page2 = dataVault.getTelemetryRecords(testBin, 3, 2);

        assertEq(page1.length, 3);
        assertEq(page2.length, 2);
        assertEq(page1[0].soc, 8000);
        assertEq(page2[0].soc, 8300);
    }

    // ============================================
    // MAINTENANCE RECORDING TESTS
    // ============================================

    function testRecordMaintenance() public {
        vm.prank(fleetOperator);

        vm.expectEmit(true, true, true, false);
        emit MaintenanceRecorded(testBin, 0, fleetOperator);

        dataVault.recordMaintenance(
            testBin,
            0, // Preventive
            "Routine inspection and coolant check",
            "Coolant filter",
            "v2.3.1",
            "TECH-042",
            uint64(block.timestamp)
        );

        assertEq(dataVault.getMaintenanceCount(testBin), 1);
    }

    function testRecordMaintenanceAllTypes() public {
        vm.startPrank(fleetOperator);

        // Test all maintenance types
        dataVault.recordMaintenance(testBin, 0, "Preventive maintenance", "", "", "TECH-01", uint64(block.timestamp));
        dataVault.recordMaintenance(testBin, 1, "Corrective maintenance", "Battery cell A3", "", "TECH-02", uint64(block.timestamp));
        dataVault.recordMaintenance(testBin, 2, "Inspection", "", "", "TECH-03", uint64(block.timestamp));
        dataVault.recordMaintenance(testBin, 3, "Software update", "", "v3.0.0", "TECH-04", uint64(block.timestamp));
        dataVault.recordMaintenance(testBin, 4, "Component replacement", "Thermal sensor", "", "TECH-05", uint64(block.timestamp));

        vm.stopPrank();

        assertEq(dataVault.getMaintenanceCount(testBin), 5);
    }

    function testGetMaintenanceRecords() public {
        vm.startPrank(fleetOperator);

        dataVault.recordMaintenance(testBin, 0, "First maintenance", "", "", "TECH-01", uint64(block.timestamp));
        dataVault.recordMaintenance(testBin, 1, "Second maintenance", "Part A", "", "TECH-02", uint64(block.timestamp));

        vm.stopPrank();

        DataVault.MaintenanceRecord[] memory records = dataVault.getMaintenanceRecords(testBin, 0, 2);

        assertEq(records.length, 2);
        assertEq(records[0].maintenanceType, 0);
        assertEq(records[0].description, "First maintenance");
        assertEq(records[1].maintenanceType, 1);
        assertEq(records[1].componentsReplaced, "Part A");
    }

    function testUnauthorizedCannotRecordMaintenance() public {
        vm.prank(unauthorized);

        vm.expectRevert();
        dataVault.recordMaintenance(testBin, 0, "Unauthorized", "", "", "TECH-99", uint64(block.timestamp));
    }

    // ============================================
    // CRITICAL EVENT RECORDING TESTS
    // ============================================

    function testRecordCriticalEvent() public {
        vm.prank(fleetOperator);

        vm.expectEmit(true, true, true, false);
        emit CriticalEventRecorded(testBin, 0, 2, fleetOperator); // Severity 2 = High

        dataVault.recordCriticalEvent(
            testBin,
            0, // Overheating
            2, // High severity
            "Battery temperature exceeded safe limits during fast charging",
            550, // 55°C
            9500, // 95% charge
            "Charging Station A, Highway M-25",
            uint64(block.timestamp)
        );

        assertEq(dataVault.getCriticalEventCount(testBin), 1);
    }

    function testRecordCriticalEventAllTypes() public {
        vm.startPrank(fleetOperator);

        // Test all event types with different severities
        dataVault.recordCriticalEvent(testBin, 0, 2, "Overheating", 600, 9000, "Location A", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 1, 1, "Overcharge", 350, 10000, "Location B", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 2, 1, "Deep discharge", 300, 500, "Location C", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 3, 2, "Accident", 400, 7500, "Location D", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 4, 2, "BMS failure", 350, 8000, "Location E", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 5, 1, "Rapid degradation", 320, 7000, "Location F", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 6, 2, "Thermal runaway warning", 700, 9500, "Location G", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 7, 0, "Other event", 300, 7500, "Location H", uint64(block.timestamp));

        vm.stopPrank();

        assertEq(dataVault.getCriticalEventCount(testBin), 8);
    }

    function testGetCriticalEvents() public {
        vm.startPrank(fleetOperator);

        dataVault.recordCriticalEvent(testBin, 0, 2, "High severity event", 550, 9500, "Location A", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 1, 1, "Medium severity event", 400, 8500, "Location B", uint64(block.timestamp));
        dataVault.recordCriticalEvent(testBin, 2, 0, "Low severity event", 350, 7500, "Location C", uint64(block.timestamp));

        vm.stopPrank();

        DataVault.CriticalEvent[] memory events = dataVault.getCriticalEvents(testBin, 0, 3);

        assertEq(events.length, 3);
        assertEq(events[0].eventType, 0);
        assertEq(events[0].severity, 2);
        assertEq(events[0].temperature, 550);
        assertEq(events[1].severity, 1);
        assertEq(events[2].severity, 0);
    }

    function testUnauthorizedCannotRecordCriticalEvent() public {
        vm.prank(unauthorized);

        vm.expectRevert();
        dataVault.recordCriticalEvent(testBin, 0, 2, "Unauthorized event", 500, 9000, "Location", uint64(block.timestamp));
    }

    // ============================================
    // INTEGRATION TESTS
    // ============================================

    function testCompleteLifecycleRecording() public {
        // Simulate complete battery lifecycle with all types of records

        // 1. Initial telemetry (Fleet Operator)
        vm.prank(fleetOperator);
        dataVault.recordTelemetry(testBin, 10000, 10000, 0, 0, 250, 300, 0, 100);

        // 2. Regular telemetry updates
        vm.startPrank(fleetOperator);
        for (uint i = 0; i < 5; i++) {
            dataVault.recordTelemetry(
                testBin,
                9000 - uint16(i * 100),
                9500 - uint16(i * 50),
                10000 + uint32(i * 5000),
                50 + uint32(i * 20),
                300,
                400,
                8000,
                150
            );
        }
        vm.stopPrank();

        // 3. Preventive maintenance
        vm.prank(fleetOperator);
        dataVault.recordMaintenance(testBin, 0, "Regular checkup", "", "v2.0", "TECH-01", uint64(block.timestamp));

        // 4. Critical event (overheating)
        vm.prank(fleetOperator);
        dataVault.recordCriticalEvent(testBin, 0, 1, "Overheating during fast charge", 500, 9000, "Station A", uint64(block.timestamp));

        // 5. Corrective maintenance after event
        vm.prank(fleetOperator);
        dataVault.recordMaintenance(testBin, 1, "Coolant system repair", "Coolant pump", "", "TECH-02", uint64(block.timestamp));

        // 6. Post-repair telemetry (OEM check)
        vm.prank(oem);
        dataVault.recordTelemetry(testBin, 8500, 9200, 35000, 150, 280, 350, 7500, 100);

        // Verify all records
        assertEq(dataVault.getTelemetryCount(testBin), 7);
        assertEq(dataVault.getMaintenanceCount(testBin), 2);
        assertEq(dataVault.getCriticalEventCount(testBin), 1);

        // Verify latest telemetry shows post-repair state
        DataVault.TelemetryRecord memory latest = dataVault.getLatestTelemetry(testBin);
        assertEq(latest.soh, 9200);
        assertEq(latest.recordedBy, oem);
    }

    function testMultipleBatteriesIndependentRecords() public {
        bytes32 bin1 = keccak256("NV-2024-001");
        bytes32 bin2 = keccak256("NV-2024-002");

        // Register batteries
        vm.startPrank(admin);
        batteryRegistry.grantManufacturerRole(admin);
        batteryRegistry.registerBattery(bin1, BatteryRegistry.Chemistry.NMC, 75000, 50000, bytes32(0));
        batteryRegistry.registerBattery(bin2, BatteryRegistry.Chemistry.NMC, 75000, 50000, bytes32(0));
        vm.stopPrank();

        // Record different data for each battery
        vm.startPrank(fleetOperator);

        // Battery 1: 3 telemetry records
        for (uint i = 0; i < 3; i++) {
            dataVault.recordTelemetry(bin1, 9000, 9500, 10000, 100, 300, 400, 8000, 150);
        }

        // Battery 2: 5 telemetry records
        for (uint i = 0; i < 5; i++) {
            dataVault.recordTelemetry(bin2, 8500, 9200, 20000, 200, 320, 420, 8500, 150);
        }

        vm.stopPrank();

        // Verify independence
        assertEq(dataVault.getTelemetryCount(bin1), 3);
        assertEq(dataVault.getTelemetryCount(bin2), 5);

        DataVault.TelemetryRecord memory latest1 = dataVault.getLatestTelemetry(bin1);
        DataVault.TelemetryRecord memory latest2 = dataVault.getLatestTelemetry(bin2);

        assertEq(latest1.soh, 9500);
        assertEq(latest2.soh, 9200);
    }

    // ============================================
    // EDGE CASE TESTS
    // ============================================

    function testEmptyRecordsReturnsEmptyArray() public view {
        bytes32 newBin = keccak256("NV-2024-EMPTY");

        DataVault.TelemetryRecord[] memory telemetry = dataVault.getTelemetryRecords(newBin, 0, 10);
        DataVault.MaintenanceRecord[] memory maintenance = dataVault.getMaintenanceRecords(newBin, 0, 10);
        DataVault.CriticalEvent[] memory events = dataVault.getCriticalEvents(newBin, 0, 10);

        assertEq(telemetry.length, 0);
        assertEq(maintenance.length, 0);
        assertEq(events.length, 0);
    }

    function testPaginationBeyondAvailableRecords() public {
        vm.startPrank(fleetOperator);

        // Only record 2 entries
        dataVault.recordTelemetry(testBin, 9000, 9500, 10000, 100, 300, 400, 8000, 150);
        dataVault.recordTelemetry(testBin, 8900, 9400, 11000, 110, 305, 405, 8100, 150);

        vm.stopPrank();

        // Request more than available (offset 0, limit 10 but only 2 exist)
        DataVault.TelemetryRecord[] memory records = dataVault.getTelemetryRecords(testBin, 0, 10);
        assertEq(records.length, 2);

        // Request with offset beyond available
        DataVault.TelemetryRecord[] memory emptyRecords = dataVault.getTelemetryRecords(testBin, 10, 5);
        assertEq(emptyRecords.length, 0);
    }

    function testExtremeTemperatureValues() public {
        vm.prank(fleetOperator);

        // Test extreme temperatures (both positive and negative)
        dataVault.recordTelemetry(
            testBin,
            5000,  // 50% SOC
            8000,  // 80% SOH
            10000,
            50,
            -200,  // -20°C (cold weather)
            800,   // 80°C (very hot)
            5000,
            100
        );

        DataVault.TelemetryRecord memory record = dataVault.getLatestTelemetry(testBin);
        assertEq(record.avgTemperature, -200);
        assertEq(record.maxTemperature, 800);
    }

    // ============================================
    // FUZZ TESTS
    // ============================================

    function testFuzz_RecordTelemetry(
        uint16 soc,
        uint16 soh,
        uint32 mileage,
        uint32 chargeCycles,
        int16 avgTemp,
        int16 maxTemp,
        uint16 dod,
        uint16 chargeRate
    ) public {
        vm.prank(fleetOperator);

        dataVault.recordTelemetry(
            testBin,
            soc,
            soh,
            mileage,
            chargeCycles,
            avgTemp,
            maxTemp,
            dod,
            chargeRate
        );

        assertEq(dataVault.getTelemetryCount(testBin), 1);

        DataVault.TelemetryRecord memory record = dataVault.getLatestTelemetry(testBin);
        assertEq(record.soc, soc);
        assertEq(record.soh, soh);
        assertEq(record.mileage, mileage);
    }

    function testFuzz_RecordMaintenance(uint8 maintenanceType, uint64 serviceDate) public {
        vm.assume(maintenanceType <= 4); // Valid range 0-4

        vm.prank(fleetOperator);

        dataVault.recordMaintenance(
            testBin,
            maintenanceType,
            "Fuzz test maintenance",
            "",
            "",
            "TECH-FUZZ",
            serviceDate
        );

        assertEq(dataVault.getMaintenanceCount(testBin), 1);
    }

    function testFuzz_RecordCriticalEvent(uint8 eventType, uint8 severity) public {
        vm.assume(eventType <= 7); // Valid range 0-7
        vm.assume(severity <= 2);  // Valid range 0-2

        vm.prank(fleetOperator);

        dataVault.recordCriticalEvent(
            testBin,
            eventType,
            severity,
            "Fuzz test critical event",
            400,
            8000,
            "Fuzz location",
            uint64(block.timestamp)
        );

        assertEq(dataVault.getCriticalEventCount(testBin), 1);
    }
}
