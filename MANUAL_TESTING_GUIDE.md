# Manual Testing Guide - Battery Supply Chain Traceability

## 📋 Executive Summary

This comprehensive testing guide covers **12 forms** across the Battery Supply Chain Traceability application:
- **9 blockchain transaction forms** (smart contract interactions)
- **2 UI-only forms** (frontend validation only)
- **1 hybrid form** (telemetry with embedded blockchain calls)

### Quick Stats
- **Total Tests:** 12 comprehensive test scenarios
- **Estimated Time:** 2-3 hours for complete testing
- **Roles Required:** 6 different account roles
- **Priority Levels:** HIGH (5 tests), MEDIUM (6 tests), LOW (1 test)

### Test Categories
1. **Core Lifecycle** (Tests 1, 2, 3, 6, 11) - Battery creation, ownership, integration, recycling
2. **Operations** (Tests 4, 7, 8, 9, 10) - SOH updates, telemetry, maintenance, events, second life
3. **Administrative** (Tests 5, 12) - State changes, recycling audits

### 🚀 Quick Start Guide

**For Basic Testing (1 hour):**
- Test 1: Register Battery
- Test 2: Transfer Ownership
- Test 3: Accept Transfer
- Test 4: Update SOH
- Test 6: Integrate Battery

**For Complete Testing (2-3 hours):**
- Follow all 12 tests in order
- Complete the Cross-Flow lifecycle test
- Verify all checklist items

**For Specific Features:**
- **Two-Step Transfers:** Tests 2 & 3
- **Recycling Workflow:** Tests 11 & 12
- **Fleet Operations:** Tests 7, 8, 9
- **Admin Functions:** Test 5

---

## Prerequisites

Before starting manual testing, ensure:

1. **Local blockchain is running:**
   ```bash
   cd sc
   anvil --block-time 2
   ```

2. **Contracts are deployed and seeded:**
   ```bash
   cd sc
   ./deploy-and-seed.sh
   ```

3. **Web application is running:**
   ```bash
   cd web
   npm run dev
   ```

4. **MetaMask configured:**
   - Network: Anvil (localhost:8545, Chain ID: 31337)
   - Import at least 6 test accounts from Anvil for complete testing

   **Account Roles:**
   - **Account #0:** Admin/Manufacturer (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
     - Roles: ADMIN_ROLE, MANUFACTURER_ROLE, OPERATOR_ROLE
     - Can: Register batteries, change states, all admin functions

   - **Account #1:** Manufacturer (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
     - Roles: MANUFACTURER_ROLE
     - Can: Register batteries, transfer batteries

   - **Account #2:** OEM (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
     - Roles: OEM_ROLE
     - Can: Integrate batteries,

   - **Account #5:** Fleet Operator (0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc)
     - Roles: FLEET_OPERATOR_ROLE
     - Can: Update telemetry, record maintenance, record critical events

   - **Account #3:** Aftermarket (0x90F79bf6EB2c4f870365E785982E1f101E93b906)
     - Roles: AFTERMARKET_ROLE
     - Can: Change Battery Life and give second use application
   
   - **Account #4:** Recycler (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65)
     - Roles: RECYCLER_ROLE
     - Can: Recycle batteries with material tracking

   - **Account #6:** Auditor (0x976EA74026E726554dB657fA54763abd0C3a0aa9)
     - Roles: AUDITOR_ROLE
     - Can: Audit recycling processes
     - RemarK: No esta implementado en el código. Pendiente de implementar, usaremos Admin para esta función por falta de tiempo

   

   - **Account #7 or #8:** Transfer Recipients (for testing transfers)
     - No special roles
     - Can: Own batteries, transfer ownership, update SOH
     - No vemos necesarias estas cuentas de momento para el test

     - **Tenemos implementadas en Metamask y configurado las cuentas de Admin, Manufacturer, OEM, Aftermarket, Recycler, FleetOperator, y hemos importado la de Auditor pero no esta probado, la App no reconoce el ROLE.

     

5. **Browser:** Chrome/Brave with MetaMask extension

## Important Notes

### Toast Notifications
- All forms now have complete toast notification support
- Toasts show transaction lifecycle: Pending → Confirming → Success/Error
- Success toasts are **green** and show the transaction hash
- Toasts include action buttons (e.g., "View Passport")
- Duration: 10 seconds for success toasts, allowing time to click actions

### Auto-Refresh Passport
- Battery passport pages auto-refresh every **5 seconds**
- After transferring ownership, wait 5 seconds to see the new owner
- The passport also refreshes when you focus the browser tab
- Manual refresh: Simply reload the page (Cmd+R / Ctrl+R)

### Form Behavior After Success
- All submit buttons are **disabled** after successful transaction
- Success messages appear inline with green background
- Two action buttons appear: "View Passport" (green) and "[Action] Another"
- "View Passport" navigates to the battery's passport page
- "[Action] Another" resets the form for a new operation

---

## Test Suite Overview

| Test # | Form Name | Role Required | Dashboard Location | Priority |
|--------|-----------|---------------|-------------------|----------|
| 1 | RegisterBatteryForm | MANUFACTURER_ROLE | Manufacturer Dashboard | HIGH |
| 2 | TransferOwnershipForm | Any owner | General Dashboard → Transfers tab | HIGH |
| 3 | AcceptTransferForm | Transfer recipient | General Dashboard → Transfers tab | HIGH |
| 4 | UpdateSOHForm | FLEET_OPERATOR_ROLE | General Dashboard → Operations tab | MEDIUM |
| 5 | ChangeBatteryStateForm | OPERATOR_ROLE or ADMIN_ROLE | General Dashboard → Operations tab | LOW |
| 6 | IntegrateBatteryForm | OEM_ROLE | OEM Dashboard | HIGH |
| 7 | UpdateTelemetryForm | FLEET_OPERATOR_ROLE or OEM_ROLE | Fleet Operator Dashboard | HIGH |
| 8 | RecordMaintenanceForm | FLEET_OPERATOR_ROLE or OEM_ROLE | Fleet Operator Dashboard | MEDIUM |
| 9 | RecordCriticalEventForm | FLEET_OPERATOR_ROLE or OEM_ROLE | Fleet Operator Dashboard | MEDIUM |
| 10 | StartSecondLifeForm | Any owner | General Dashboard → Second Life tab | MEDIUM |
| 11 | RecycleBatteryForm | RECYCLER_ROLE | Recycler Dashboard | HIGH |
| 12 | AuditRecyclingForm | AUDITOR_ROLE | Auditor Dashboard (if exists) | MEDIUM |

---

## Test 1: Register Battery (Manufacturer Dashboard)

**Purpose:** Register a new battery in the blockchain registry

**Pre-conditions:**
- Connected with Account #0 (Manufacturer role)
- Navigate to: http://localhost:3000/dashboard/manufacturer

**Test Steps:**

1. **Click "Register Battery" button** in the page header
   - Form should appear below the button

2. **Fill in the form:**
   - BIN: Click "Generate" button OR enter manually (e.g., `NV-2024-999999`)
   - Chemistry: Select "NMC (Nickel Manganese Cobalt)"
   - Capacity: Enter `75` (kWh)
   - Manufacturer: Enter `Northvolt AB`
   - Manufacture Date: Leave as today's date

3. **Submit the form:**
   - Click "Register Battery" button
   - MetaMask should pop up requesting signature

4. **Confirm transaction in MetaMask**

**Expected Results:**

✅ **During transaction:**
- Button shows "Waiting for wallet..." → "Confirming transaction..."
- Button is disabled
- Toast notification appears: "Registering battery..."
- Toast updates to: "Confirming transaction..."

✅ **After success:**
- Green toast notification appears with:
  - Title: "Battery registered successfully!"
  - Description: "Battery [BIN] has been added to the blockchain. Tx: 0x1234...5678"
  - Action button: "View Passport"
- Inline green success message appears with:
  - "Battery Registered Successfully!"
  - Battery BIN confirmation
  - Transaction hash
  - Two buttons: "View Passport" (green) and "Register Another"
- Submit button shows "Registered!" with checkmark
- Submit button is disabled

✅ **Buttons work:**
- "View Passport" → Navigate to `/passport/[BIN]`
- "Register Another" → Reset form to initial state

**Error Scenarios to Test:**
- Empty BIN → Should show validation error
- Invalid BIN format (e.g., "123") → Should show format error
- Empty capacity → Should show validation error
- Reject transaction in MetaMask → Should show red error toast

---

## Test 2: Transfer Battery Ownership (General Dashboard)

**Purpose:** Transfer battery ownership to another address

**Pre-conditions:**
- Connected with Account #1 (Manufacturer owner of a battery. Always Registry as Manufacturer)
- Navigate to: http://localhost:3000/dashboard
- Click on "Transfers" tab

**Test Steps:**

1. **Fill in the transfer form:**
   - BIN: Enter `NV-2024-001234` (or any battery you own)
   - New Owner Address: Enter Account #2 address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Transfer Type: Select "Manufacturer → OEM"
   - Notes: (Optional) Enter "Test transfer"

2. **Verify current owner display:**
   - Should show your current address (Account #1)

3. **Submit the form:**
   - Click "Transfer Ownership" button
   - MetaMask should pop up

4. **Confirm transaction**

**Expected Results:**

✅ **During transaction:**
- Button shows "Waiting for signature..." → "Confirming..."
- Toast: "Transferring ownership..." → "Confirming transaction..."

✅ **After success:**
- Green toast with transaction hash and "View Passport" action
- Inline green success message with:
  - "Ownership Transferred Successfully!"
  - Battery BIN and new owner (truncated address)
  - Transaction hash
  - Buttons: "View Passport" (green) and "Transfer Another"

✅ **Verify on blockchain:**
- Click "View Passport" button (green button in success message)
- Wait 5 seconds for auto-refresh (the passport refreshes every 5 seconds automatically)
- Battery passport should show new owner as Account #2 address
- Owner display format: `00x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (first 6 and last 4 characters)
- **Note:** If owner doesn't update immediately, wait for the automatic refresh or reload the page
- **Note2:** Only will appear new owner in PASSPORT once Transfer is Accepted as Test 3

**Error Scenarios:**
- Invalid Ethereum address → Validation error
- Transfer to yourself → "Cannot transfer to yourself" error
- BIN you don't own → Transaction should revert with "not owner" error
- Invalid BIN format → Validation error

---

## Test 3: Accept or Reject Transfer (General Dashboard)

**Purpose:** Accept or reject a pending battery transfer sent to your address

**Pre-conditions:**
- Battery transfer initiated to your address (use Test 2 to create a transfer)
- Connected with the recipient account (Account #1 if transferred from Account #0)
- Navigate to: http://localhost:3000/dashboard
- Click on "Transfers" tab

**Test Steps:**

1. **View pending transfer:**
   - Enter BIN of battery with pending transfer: `NV-2024-001234`
   - System displays transfer details:
     - From address (sender)
     - To address (you)
     - New state for battery
     - Initiated timestamp
     - Time remaining (7 days expiration)

2. **Verify recipient status:**
   - Your address should be displayed
   - Transfer should show "Pending Transfer Details"
   - Time remaining countdown should be visible

3. **Option A - Accept Transfer:**
   - Click "Accept Transfer" button (green)
   - MetaMask should pop up
   - Confirm transaction

4. **Option B - Reject Transfer:**
   - Click "Reject Transfer" button (red)
   - MetaMask should pop up
   - Confirm transaction

**Expected Results (Accept):**

✅ **During transaction:**
- Button shows "Accepting..." with loading spinner
- Toast: "Accepting transfer..." → "Confirming transaction..."

✅ **After success:**
- Green toast with transaction hash and "View Passport" action
- Success message: "Transfer Accepted!"
- Battery ownership transferred to you
- Battery state updated to new state
- Buttons: "View Passport"

✅ **Verify on blockchain:**
- Click "View Passport"
- Battery owner should now be your address
- Battery state should be updated

**Expected Results (Reject):**

✅ **During transaction:**
- Button shows "Rejecting..." with loading spinner
- Toast: "Rejecting transfer..." → "Confirming transaction..."

✅ **After success:**
- Green toast with transaction hash
- Success message: "Transfer Rejected!"
- Transfer cancelled permanently
- Ownership remains with original owner

**Error Scenarios:**
- Not the recipient → "Not the Recipient" warning
- No pending transfer → "No pending transfer found"
- Transfer expired (>7 days) → "Transfer has expired" error
- Invalid BIN → Validation error

---

## Test 4: Update State of Health (General Dashboard)

**Purpose:** Update battery's State of Health (SOH) percentage

**Pre-conditions:**
- Connected with Account #0 (battery owner)
- Navigate to: http://localhost:3000/dashboard
- Click on "Operations" tab

**Test Steps:**

1. **Fill in the form:**
   - BIN: Enter `NV-2024-001234`
   - New SOH (%): Enter `95`
   - Notes: (Optional) Enter "Regular maintenance check"

2. **Submit and confirm transaction**

**Expected Results:**

✅ **Success:**
- Green toast notification with transaction hash
- Success message with "View Passport" action
- SOH updated on battery passport

**Error Scenarios:**
- SOH < 0 or > 100 → Validation error
- Not the owner → Transaction reverts
- Non-existent BIN → Transaction reverts - Falla con el nounce. 
- Ver NONCE_ERROR_FIX.md para aplicar mejoras en mensajes de Transaction Revert

---

## Test 5: Change Battery State (General Dashboard)

**Purpose:** Manually change the lifecycle state of a battery (for corrections or testing)

**Pre-conditions:**
- Connected with Account #0 (must have OPERATOR_ROLE or ADMIN_ROLE)
- Faltaria introducir limitar los roles como en UpdateSOH. (A implementar. Ahora esta abierto a todo)
- Navigate to: http://localhost:3000/dashboard
- Click on "Operations" tab
- Scroll to "Change Battery State" form

**Test Steps:**

1. **Enter BIN and fetch current state:**
   - BIN: Enter `NV-2024-001234`
   - Click "Fetch Data" button
   - Current state should be displayed with colored badge

2. **Select new state:**
   - Choose from dropdown:
     - Manufactured (Blue)
     - Integrated (Cyan)
     - First Life (Green)
     - Second Life (Yellow)
     - End of Life (Orange)
     - Recycled (Slate)
   - Current state option is disabled

3. **Add reason (optional):**
   - Enter reason: "Testing lifecycle transitions"

4. **Submit and confirm**

**Expected Results:**

✅ **During transaction:**
- Button shows "Submitting..." → "Confirming..."
- Toast notifications with progress

✅ **After success:**
- Green success message with:
  - "Battery State Changed Successfully!"
  - Battery BIN and new state name
  - Transaction hash
  - Buttons: "View Passport" and "Change Another State"

**Error Scenarios:**
- Not authorized → "Only OPERATOR_ROLE or ADMIN_ROLE" error
- Same state selected → "New state must be different" error
- Invalid BIN → Transaction reverts

**⚠️ Important Notes:**
- This is a powerful administrative function
- Use only for corrections or testing
- State change is immediate and permanent
- Requires special role permissions

---

## Test 6: Integrate Battery into Vehicle (OEM Dashboard)

**Purpose:** Link a battery to a vehicle VIN (after OEM receives it from manufacturer)

**Pre-conditions:**
- Battery registered by Manufacturer (Account #1) - Use Test 1
- **Two-step transfer flow:**
  - **Step 1:** Manufacturer transfers to OEM using Test 2
  - **Step 2:** OEM accepts transfer using Test 3
- Switch MetaMask to Account #2 (OEM - 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
- Navigate to: http://localhost:3000/dashboard/oem
- Click "Integrate Battery" button

**Test Steps:**

1. **Transfer battery from Manufacturer to OEM (if not done yet):**
   - Switch to Account #1 (Manufacturer)
   - Use Test 2 to transfer battery to Account #2 (OEM)
   - Transfer Type: "Manufacturer → OEM"
   - New Owner Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

2. **Accept the transfer as OEM:**
   - Switch to Account #1 (OEM)
   - Use Test 3 to accept the pending transfer
   - Battery state changes to "FirstLife" upon acceptance
   - Battery ownership transfers to OEM

3. **Integrate battery with vehicle:**
   - Navigate to: http://localhost:3000/dashboard/oem
   - Click "Integrate Battery" button
   - Fill in the form:
     - BIN: Enter battery you now own (e.g., `NV-2024-001234`)
     - VIN: Enter `WBA12345678901234` (17 characters)
     - Vehicle Model: Enter `Tesla Model 3`
     - Integration Date: Leave as today

4. **Verify battery data loads:**
   - After entering valid BIN, battery info should display
   - Should show manufacturer, chemistry, capacity, SOH
   - Battery state should be "Manufactured" or "FirstLife"

5. **Submit and confirm**

**Expected Results:**

✅ **Success:**
- Green toast with transaction hash
- Battery status changes to "Integrated"
- Success message with "View Passport" button
- Battery passport shows integration (VIN display in passport is pending implementation)

✅ **Battery State Compatibility:**
- Form accepts batteries in "Manufactured" (0) state
- Form accepts batteries in "FirstLife" (2) state
- This allows integration after two-step transfer is complete

**Error Scenarios:**
- Invalid VIN format (not 17 chars) → Validation error
- Battery in "Integrated", "SecondLife", "EndOfLife", or "Recycled" state → Validation error
- Not the owner → Transaction reverts
- No OEM_ROLE → Access denied error

**Important Notes:**
- ⚠️ **Two-Step Transfer Impact:** When OEM accepts a transfer from manufacturer, the battery state automatically changes to "FirstLife"
- ✅ **Integration Form Updated:** Now accepts both "Manufactured" and "FirstLife" states
- ✅ **VIN Display:** VIN is now displayed in passport (header + technical specifications)
  - Header: Shows VIN with car icon when integrated
  - Specifications: Shows VIN in cyan monospace or "Not Integrated" badge
  - See `VIN_DISPLAY_IMPLEMENTATION.md` for details
- Mirar todos los MD con los fix troubleshooting criticos resueltos como owner, etc...
---

## Test 7: Update Battery Telemetry (Fleet Operator Dashboard)

**Purpose:** Record real-time battery usage data and operational metrics

**Pre-conditions:**
- **Option A (Fleet Operator):**
  - First transfer battery from OEM (Account #2) to Fleet Operator (Account #5)
  - Use Test 2 with Transfer Type: "OEM → Fleet Operator"
  - New Owner Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - Switch MetaMask to Account #5 (Fleet Operator)
- **Option B (OEM):**
  - Use Account #1 (OEM) that owns a battery from Test 4
  - Switch MetaMask to Account #1 (OEM)
- Navigate to: http://localhost:3000/dashboard/fleet-operator
- Click "Update Telemetry" button

**Test Steps:**

1. **Fill in primary metrics:**
   - BIN: Enter battery owned by Account #5 (e.g., `NV-2024-001234`)
   - State of Health (SOH) %: Enter `92.5` -> Transacion OK pero no se actualiza en el passport el SOH. Ese parametro no va bien. Lo doy por valido esta fase
   - State of Charge (SOC) %: Enter `78` (currently disabled - future enhancement)
   - Charge Cycles: Enter `342` (currently disabled - future enhancement)

2. **Optional: Show advanced metrics:**
   - Click "Show Advanced Metrics" button
   - View additional fields (mileage, temperature, DoD, C-rate)
   - Note: These fields are prepared for future DataVault integration

3. **Submit telemetry update:**
   - The form uses UpdateSOHForm internally for blockchain interaction
   - Click "Update SOH" button in the embedded form
   - MetaMask should pop up

4. **Confirm transaction**

**Expected Results:**

✅ **During transaction:**
- Button shows "Waiting for wallet..." → "Confirming transaction..."
- Toast notification: "Updating SOH..."

✅ **After success:**
- Green toast: "SOH updated successfully!"
- Transaction hash displayed
- "View Passport" button appears
- Battery SOH updated to 92.5%

**Development Notes:**
- Currently only SOH updates are stored on-chain
- Full telemetry (SOC, mileage, temperature, etc.) requires DataVault contract enhancement
- UI is prepared for future integration

**Transfer Instructions (OEM → Fleet Operator):**

Before this test, transfer battery ownership from OEM to Fleet Operator:

1. **Switch to Account #1 (OEM)** in MetaMask
2. **Navigate to:** http://localhost:3000/dashboard
3. **Click "Transfers" tab**
4. **Fill in transfer form:**
   - BIN: `NV-2024-001234` (or battery you integrated in Test 4)
   - New Owner Address: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
   - Transfer Type: Select "OEM → Fleet Operator"
   - Notes: "First life deployment to fleet"
5. **Confirm transaction**
6. **Verify:** Battery passport should show new owner as Account #5

---

## Test 8: Record Maintenance Service (Fleet Operator Dashboard)

**Purpose:** Log battery maintenance, inspections, and component replacements

**Pre-conditions:**
- Connected with Account #5 (Fleet Operator) OR Account #1 (OEM)
- Battery owned by the connected account
- Navigate to: http://localhost:3000/dashboard/fleet-operator
- Scroll to Maintenance tab

**Test Steps:**

1. **Navigate to maintenance section:**
   - Click "Maintenance" tab in Fleet Operator dashboard

2. **Fill in maintenance form:**
   - BIN: Enter battery owned by Account #5
   - Maintenance Type: Select "Preventive Maintenance"
   - Service Description: Enter detailed description (min 10 characters)
     - Example: "Routine inspection and thermal management system check. All components functioning normally. BMS software updated."
   - Components Replaced: (Optional) Enter "None" or specific parts
   - BMS Software Update: (Optional) Enter "v2.3.1"
   - Technician ID: Enter "TECH-042"
   - Service Date: Leave as today or select past date

3. **Submit maintenance record:**
   - Click "Record Maintenance" button

**Expected Results:**

✅ **After submission:**
- Green success message appears
- Maintenance record details displayed:
  - Battery BIN
  - Maintenance type and date
  - Technician information
- Action buttons:
  - "View Battery Passport" (navigates to passport)
  - "Record Another" (resets form)

**Development Notes:**
- This is currently a UI-only form (no blockchain transaction)
- Records are stored locally for demonstration
- Production implementation requires:
  - DataVault contract method for maintenance records
  - IPFS storage for detailed service reports
  - Event emission for maintenance history tracking
- Funciona OK de momento como dummy
---

## Test 9: Record Critical Event (Fleet Operator Dashboard)

**Purpose:** Log safety-critical incidents and battery anomalies

**Pre-conditions:**
- Connected with Account #5 (Fleet Operator) OR Account #1 (OEM)
- Battery owned by the connected account
- Navigate to: http://localhost:3000/dashboard/fleet-operator
- Click "Critical Events" tab

**Test Steps:**

1. **Navigate to critical events section:**
   - Click "Critical Events" tab in Fleet Operator dashboard

2. **Fill in event form:**
   - BIN: Enter battery owned by Account #5
   - Event Type: Select "Overheating"
   - Severity Level: Select "Medium - Action Required"
   - Event Description: Enter detailed description (min 10 characters)
     - Example: "Battery temperature exceeded 45°C during DC fast charging session. Charging automatically stopped by BMS. Battery cooled to normal operating temperature within 15 minutes."
   - Temperature at Event (°C): Enter `47.5`
   - Charge Level at Event (%): Enter `65`
   - Location: (Optional) Enter "Charging Station A, Barcelona"
   - Event Date: Leave as today

3. **Submit critical event:**
   - Click "Record Critical Event" button
   - Note the severity-based styling (red for High, yellow for Medium, blue for Low)

**Expected Results:**

✅ **After submission:**
- Success message with severity indicator
- Event details displayed:
  - Battery BIN
  - Event type and severity badge
  - Event date
- Color-coded by severity:
  - High: Red background/border
  - Medium: Yellow background/border
  - Low: Blue background/border
- Action buttons appear:
  - "View Battery Passport"
  - "Record Another Event"

**Development Notes:**
- This is currently a UI-only form
- Production implementation requires:
  - DataVault contract method for event logging
  - Real-time event emission and alerting
  - Integration with fleet monitoring dashboard
  - Automatic notifications for high-severity events

-Funciona como dummy ok de momento
---

## Test 10: Start Second Life Application (General Dashboard)

**Purpose:** Repurpose battery for aftermarket applications

**Pre-conditions:**
- Battery must have SOH between 70-80%
- Battery owner must be connected
- Navigate to: http://localhost:3000/dashboard
- Click on "Second Life" tab

**Test Steps:**

1. **Prepare battery:**
   - If needed, use Test 3 to update SOH to 72%

2. **Fill in the form:**
   - BIN: Enter battery with suitable SOH
   - Application Type: Select "Home Energy Storage"
   - Installation Location: Enter "Barcelona, Spain"
   - Installation Hash: (Optional) Enter IPFS hash or leave default
   - Notes: Enter "Residential installation"

3. **Review calculated available capacity:**
   - Should show: (Capacity × SOH) / 100
   - Example: 75 kWh × 72% = 54 kWh

4. **Submit and confirm**

**Expected Results:**

✅ **Success:**
- Green toast with transaction hash
- Battery status changes to "SecondLife"
- Battery passport shows application type
- Success buttons appear

**Error Scenarios:**
- SOH > 80% → "Battery too healthy for second life" error
- SOH < 50% → "Battery health too low" error
- Invalid application type → Validation error

---

## Test 11: Recycle Battery (Recycler Dashboard)

**Purpose:** Register battery as recycled with material recovery data

**Pre-conditions:**
- Battery transferred to Account #2 (Recycler)
- Battery SOH < 50% (End of Life)
- Switch to Account #2 in MetaMask
- Navigate to: http://localhost:3000/dashboard/recycler
- Click "Recycle Battery" button

**Test Steps:**

1. **Prepare battery:**
   - Use Test 3 to reduce SOH to 45%
   - Use Test 2 to transfer to Account #2

2. **Fill in basic info:**
   - BIN: Enter battery to recycle
   - Recycling Method: Select "Pyrometallurgical"
   - Recycling Date: Leave as today
   - Facility Location: Enter "Recycling Plant A, Sweden"

3. **Add materials recovered:**
   - Click "Add Material" button
   - Row 1: Material = "Li (Lithium)", Quantity = `12.5`
   - Row 2: Material = "Co (Cobalt)", Quantity = `8.3`
   - Row 3: Material = "Ni (Nickel)", Quantity = `15.7`

4. **Verify total calculation:**
   - Total should show: 36.5 kg

5. **Add notes (optional):**
   - Enter "Complete recycling process"

6. **Submit and confirm**

**Expected Results:**

✅ **Success:**
- Green toast with transaction hash
- Battery status changes to "Recycled"
- Battery passport shows:
  - Recycling method
  - Materials recovered
  - Total kg recovered
  - Facility location
- Success message with "View Passport" button

**Error Scenarios:**
- SOH > 50% → "Battery not at end of life" error (SOH must be < 50%)
- No materials added → Warning message
- Invalid quantity (negative or zero) → Validation error
- Not the owner → Transaction reverts

---

## Test 12: Audit Recycling Process (Auditor Dashboard)

**Purpose:** Review and approve/reject battery recycling process compliance

**Pre-conditions:**
- Battery must be in "Recycled" state (use Test 11 to recycle a battery)
- Connected with auditor account (Account #3 or any account with AUDITOR_ROLE)
- Recycling not yet audited
- Navigate to: http://localhost:3000/dashboard/auditor (or wherever audit form is located)

**Test Steps:**

1. **Enter BIN and fetch recycling data:**
   - BIN: Enter battery that has been recycled (e.g., `NV-2024-001234`)
   - Click "Fetch Data" button
   - System displays recycling information:
     - Recycler address
     - Recycled date
     - Method ID
     - Materials recovered
     - Current status (Pending Audit / Audited)

2. **Review recycling details:**
   - Verify recycler information
   - Check materials recovered data
   - Review recycling method used
   - Confirm battery is in "Recycled" state

3. **Make audit decision:**
   - **Option A - Approve:**
     - Select "Approve" radio button
     - See green indicator: "Recycling process meets standards"
   - **Option B - Reject:**
     - Select "Reject" radio button
     - See red indicator: "Recycling process does not meet standards"
     - Audit notes become required

4. **Add audit notes:**
   - For approval (optional): Enter "Process meets all environmental standards"
   - For rejection (required): Enter detailed reason for rejection

5. **Add auditor name (optional):**
   - Enter: "Jane Smith, Certified Environmental Auditor"

6. **Submit and confirm**

**Expected Results (Approve):**

✅ **During transaction:**
- Button shows "Submitting..." → "Confirming..."
- Toast: "Submitting audit..." → "Confirming transaction..."

✅ **After success:**
- Green toast with transaction hash and "View Passport" action
- Success message:
  - "Audit Submitted Successfully!"
  - "Battery [BIN] recycling has been approved"
  - Transaction hash displayed
- Buttons: "View Passport" and "Audit Another Battery"
- Recycling status updated to "Audited"

**Expected Results (Reject):**

✅ **During transaction:**
- Button shows "Submitting..." → "Confirming..."
- Toast notifications with progress

✅ **After success:**
- Green toast with transaction hash
- Success message: "Battery [BIN] recycling has been rejected"
- Audit notes stored for review
- Buttons appear for next actions

**Error Scenarios:**
- Not authorized → "Only AUDITOR_ROLE can audit" error
- Battery not recycled → "Battery must be in Recycled state" error
- Already audited → "This battery has already been audited" warning
- Reject without notes → "Audit notes are required when rejecting" error
- No recycling data → "No recycling data found" error

**⚠️ Important Notes:**
- Requires AUDITOR_ROLE
- Audit decision is permanent on blockchain
- Notes are required for rejection
- Only batteries in "Recycled" state can be audited
- Each battery can only be audited once

---

## Additional Testing Scenarios

### Cross-Flow Test: Complete Battery Lifecycle

Test the entire battery lifecycle from manufacturing to recycling:

1. **Manufacture** (Account #0 - Manufacturer)
   - Register battery: `NV-2024-LIFECYCLE`
   - Verify on blockchain

2. **Transfer to OEM** (Account #0 → Account #1)
   - Transfer ownership
   - Verify new owner

3. **Integration** (Account #1 - OEM)
   - Integrate into vehicle
   - Verify VIN linkage

4. **SOH Updates** (Account #1 - OEM)
   - Update SOH to 95% (after 1 year)
   - Update SOH to 85% (after 3 years)
   - Update SOH to 72% (after 5 years)

5. **Second Life** (Account #1 - OEM)
   - Start second life application
   - Verify status change

6. **End of Life** (Account #1)
   - Update SOH to 45% (after 10 years)

7. **Transfer to Recycler** (Account #1 → Account #2)
   - Transfer to recycler
   - Verify ownership

8. **Recycling** (Account #2 - Recycler)
   - Recycle battery with material recovery
   - Verify final state

---

## Common Issues & Troubleshooting

### Issue 1: "Connect Wallet Required" message
**Solution:**
- Ensure MetaMask is connected
- Ensure correct network (Anvil localhost:8545)
- Refresh page after connecting

### Issue 2: Transaction fails with "User rejected"
**Solution:**
- Normal behavior when rejecting in MetaMask
- Form should show error toast
- Form should remain filled (not reset)

### Issue 3: "Insufficient funds" error
**Solution:**
- Anvil test accounts should have plenty of ETH
- Restart Anvil: `anvil --block-time 2`
- Re-run deploy script

### Issue 4: Form buttons not appearing after success
**Solution:**
- ✅ **FIXED** in the latest update (2024-12-18)
- All forms now show "View Passport" and "[Action] Another" buttons inside success message
- If still not visible, clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5) and refresh

### Issue 5: Toast not showing transaction hash
**Solution:**
- ✅ **FIXED** in the latest update (2024-12-18)
- Transaction hash now appears in:
  - Toast notification description
  - Inline success message
- Format: `Tx: 0x1234...5678` (first 10 and last 8 characters)

### Issue 6: Battery owner not updating after transfer
**Solution:**
- ✅ **FIXED** with auto-refresh functionality (2024-12-18)
- Passport now auto-refreshes every 5 seconds
- After transfer, wait 5 seconds or reload page manually
- Owner address format: `0x7099...79C8` (first 6 and last 4 characters)

### Issue 7: Cannot find battery by BIN
**Solution:**
- Verify BIN format is correct
- Check if battery exists on blockchain
- View in BatteryRegistry contract events

### Issue 8: Role errors ("Only manufacturer can call this")
**Solution:**
- Verify connected account has correct role
- Run seed script to assign roles: `./scripts/deploy-and-seed.sh`
- Check role assignment in RoleManager contract

---

## Testing Checklist

Use this checklist to track your testing progress:

### Core Forms (HIGH Priority)

- [ x] Test 1: Register Battery (Manufacturer)
  - [x ] Successful registration
  - [ x] Toast notifications working
  - [ ]x Transaction hash displayed
  - [ x] Buttons working (View Passport, Register Another)
  - [ x] Form validation working
  - [ x] Error handling working
  - [ x] BIN generation working

- [ x] Test 2: Transfer Ownership
  - [x ] Successful transfer
  - [ x] Toast notifications working
  - [ x] Transaction hash displayed
  - [ x] Buttons working
  - [ x] Validation (invalid address, self-transfer)
  - [ x] Error handling
  - [ x] Transfer type selection working

- [ x] Test 3: Accept or Reject Transfer
  - [x ] Pending transfer displays correctly
  - [ x] Accept transfer successful
  - [ x] Reject transfer successful
  - [ x] Ownership updates correctly
  - [ x] Time remaining countdown works
  - [ x] Recipient validation works
  - [ x] Toast notifications working

- [ x] Test 6: Integrate Battery (OEM)
  - [x ] Successful integration
  - [ x] VIN validation (17 chars)
  - [ x] Battery data loading
  - [ x] Status change to "Integrated"
  - [ x] Toast and success messages

- [x ] Test 11: Recycle Battery
  - [ x] Successful recycling
  - [ x] Material rows add/remove
  - [ x] Total kg calculation
  - [ x] SOH validation (< 50%)
  - [ x] Status change to "Recycled"
  - [ x] Materials table works correctly

### Operations Forms (MEDIUM Priority)

- [x ] Test 4: Update SOH
  - [x ] Successful update
  - [ x] SOH validation (0-100%)
  - [ x] Toast notifications
  - [ x] Passport reflects changes

- [ x] Test 7: Update Telemetry (Fleet Operator)
  - [ x] SOH update works - No actualiza el estado del SOH en el PASSPORT. Pero ejecuta bien transaccion
  - [ x] Advanced metrics display (future feature)
  - [ x] Form embedded UpdateSOH works
  - [x ] Toast notifications

- [ x] Test 8: Record Maintenance (UI Only)
  - [x ] Form submits successfully
  - [ x] Success message displays
  - [ x] All fields validated
  - [ x] Buttons work correctly

- [ x] Test 9: Record Critical Event (UI Only)
  - [x ] Form submits successfully
  - [x ] Severity levels work
  - [x ] Color coding by severity
  - [x ] Success message displays

- [ ] Test 10: Start Second Life - No funciona multiples probleams con el nonce
  - [ ] Successful second life start
  - [ ] SOH validation (50-80%)
  - [ ] Available capacity calculation
  - [ ] Application type selection
  - [ ] Status change

- [ ] Test 12: Audit Recycling
  - [ ] Fetch recycling data works
  - [ ] Approve audit successful
  - [ ] Reject audit successful (with notes)
  - [ ] Already audited validation
  - [ ] Role authorization works

### Administrative Forms (LOW Priority)

- [NOK ] Test 5: Change Battery State
  - [ ] Fetch current state works
  - [ ] State selection works
  - [ ] Successful state change
  - [ ] Role authorization (OPERATOR/ADMIN)
  - [ ] Validation prevents same state
  - [ ] Toast notifications

### Complete Lifecycle Tests

- [ ] Cross-Flow Test: Complete Lifecycle
  - [ ] All steps execute successfully
  - [ x] Status transitions correct
  - [x ] Ownership transfers work
  - [x ] Data persists across stages
  - [x ] Two-step transfer (initiate + accept) works
  - [ ] Recycling + audit workflow complete

---

## Notes for QA Team

1. **Transaction Times:**
   - Anvil block time is set to 2 seconds
   - Each transaction takes ~2-4 seconds to confirm
   - Toasts should update through all states

2. **Data Persistence:**
   - All data is stored on local blockchain
   - Restarting Anvil will wipe data
   - Use seed script to recreate test data

3. **Browser Compatibility:**
   - Tested on Chrome 120+ and Brave
   - MetaMask required
   - Other wallets not tested

4. **Performance:**
   - Forms should be responsive
   - No lag during typing
   - Blockchain calls may take 2-4 seconds

5. **Visual Feedback:**
   - All buttons show loading states
   - Toast notifications for all transaction states
   - Success messages are green
   - Error messages are red
   - Disabled buttons during transactions

---

## Success Criteria

All tests pass when:

### Form Functionality
✅ All 12 forms can be submitted successfully
✅ All 9 blockchain transaction forms work correctly (excluding UI-only forms)
✅ UI-only forms (Maintenance, Critical Events) display success messages
✅ Form validation prevents invalid submissions
✅ All required fields are properly validated

### User Experience
✅ Toast notifications appear and show transaction hash
✅ Success messages display with correct information
✅ Action buttons (View Passport, [Action] Another) work correctly
✅ Loading states and disabled states work during transactions
✅ Error handling works for rejected transactions
✅ Auto-refresh on passport pages works (5 second interval)

### Blockchain Integration
✅ Role-based access control works correctly for all forms
✅ Battery lifecycle can be completed from manufacture to recycling
✅ Two-step transfer workflow (initiate + accept/reject) works
✅ All blockchain data persists and can be viewed in passports
✅ State transitions follow correct business logic
✅ Transaction hashes are displayed and verifiable

### Advanced Features
✅ Accept/Reject transfer system works with 7-day expiration
✅ Change Battery State (admin function) works correctly
✅ Audit Recycling workflow completes successfully
✅ Material recovery tracking in recycling works
✅ Telemetry updates reflect on passport

---

## Next Steps

After manual testing is complete:

1. Document any bugs found in GitHub Issues
2. Proceed to E2E testing with Playwright (Phase 3)
3. Deploy to testnet for external testing (Phase 5 - Optional)

---

## Form Summary

### Blockchain Transaction Forms (9 forms)
1. **RegisterBatteryForm** - Create new battery on blockchain
2. **TransferOwnershipForm** - Initiate ownership transfer (2-step process)
3. **AcceptTransferForm** - Accept or reject pending transfers
4. **UpdateSOHForm** - Update State of Health
5. **ChangeBatteryStateForm** - Manual state change (admin/operator only)
6. **IntegrateBatteryForm** - Link battery to vehicle VIN
7. **StartSecondLifeForm** - Begin second life application
8. **RecycleBatteryForm** - Record recycling with materials
9. **AuditRecyclingForm** - Audit recycling compliance

### UI-Only Forms (2 forms)
10. **RecordMaintenanceForm** - Log maintenance activities (no blockchain)
11. **RecordCriticalEventForm** - Log critical events (no blockchain)

### Telemetry Form (1 form)
12. **UpdateTelemetryForm** - Record operational metrics (uses UpdateSOHForm internally)

**Total Forms:** 12
**Blockchain Transactions:** 9
**UI-Only:** 2
**Hybrid:** 1

---

**Last Updated:** 2024-12-25
**Version:** 2.0.0
**Author:** Claude Code Assistant - Francisco Hipolito García
**Changes in v2.0.0:**
- Added Test 3: Accept or Reject Transfer
- Added Test 5: Change Battery State
- Added Test 12: Audit Recycling Process
- Updated all test numbers to accommodate new tests
- Expanded testing checklist with priority categories
- Updated success criteria with advanced features
- Added form summary section
- Changed in Account to simulate in MetaMask according local configuration
