# Manual Testing Guide - Battery Supply Chain Traceability

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
   ./scripts/deploy-and-seed.sh
   ```

3. **Web application is running:**
   ```bash
   cd web
   npm run dev
   ```

4. **MetaMask configured:**
   - Network: Anvil (localhost:8545, Chain ID: 31337)
   - Import at least 3 test accounts from Anvil
   - Account #0: Admin/Manufacturer (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
   - Account #1: OEM (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
   - Account #2: Recycler (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)

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
| 3 | UpdateSOHForm | Any owner | General Dashboard → Operations tab | MEDIUM |
| 4 | IntegrateBatteryForm | OEM_ROLE | OEM Dashboard | HIGH |
| 5 | StartSecondLifeForm | Any owner | General Dashboard → Second Life tab | MEDIUM |
| 6 | RecycleBatteryForm | RECYCLER_ROLE | Recycler Dashboard | HIGH |

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
- Connected with Account #0 (current owner of a battery)
- Navigate to: http://localhost:3000/dashboard
- Click on "Transfers" tab

**Test Steps:**

1. **Fill in the transfer form:**
   - BIN: Enter `NV-2024-001234` (or any battery you own)
   - New Owner Address: Enter Account #1 address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Transfer Type: Select "Manufacturer → OEM"
   - Notes: (Optional) Enter "Test transfer"

2. **Verify current owner display:**
   - Should show your current address (Account #0)

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
- Battery passport should show new owner as Account #1 address
- Owner display format: `0x7099...79C8` (first 6 and last 4 characters)
- **Note:** If owner doesn't update immediately, wait for the automatic refresh or reload the page

**Error Scenarios:**
- Invalid Ethereum address → Validation error
- Transfer to yourself → "Cannot transfer to yourself" error
- BIN you don't own → Transaction should revert with "not owner" error
- Invalid BIN format → Validation error

---

## Test 3: Update State of Health (General Dashboard)

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
- Non-existent BIN → Transaction reverts

---

## Test 4: Integrate Battery into Vehicle (OEM Dashboard)

**Purpose:** Link a manufactured battery to a vehicle VIN

**Pre-conditions:**
- **IMPORTANT:** First transfer battery to Account #1 (OEM) using Test 2
- Switch MetaMask to Account #1 (OEM)
- Navigate to: http://localhost:3000/dashboard/oem
- Click "Integrate Battery" button

**Test Steps:**

1. **Fill in the form:**
   - BIN: Enter battery that Account #1 owns (e.g., `NV-2024-001234`)
   - VIN: Enter `WBA12345678901234` (17 characters)
   - Vehicle Model: Enter `Tesla Model 3`
   - Integration Date: Leave as today
   - Notes: Enter "Initial vehicle integration"

2. **Verify battery data loads:**
   - After entering valid BIN, battery info should display
   - Should show manufacturer, chemistry, capacity, SOH

3. **Submit and confirm**

**Expected Results:**

✅ **Success:**
- Green toast with transaction hash
- Battery status changes to "Integrated"
- Battery passport shows VIN linkage
- Success message with "View Passport" button

**Error Scenarios:**
- Invalid VIN format (not 17 chars) → Validation error
- Battery not in "Manufactured" state → Transaction reverts
- Not the owner → Transaction reverts

---

## Test 5: Start Second Life Application (General Dashboard)

**Purpose:** Repurpose battery for aftermarket applications

**Pre-conditions:**
- Battery must have SOH between 50-80%
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

## Test 6: Recycle Battery (Recycler Dashboard)

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

- [ ] Test 1: Register Battery (Manufacturer)
  - [ ] Successful registration
  - [ ] Toast notifications working
  - [ ] Transaction hash displayed
  - [ ] Buttons working (View Passport, Register Another)
  - [ ] Form validation working
  - [ ] Error handling working

- [ ] Test 2: Transfer Ownership
  - [ ] Successful transfer
  - [ ] Toast notifications working
  - [ ] Transaction hash displayed
  - [ ] Buttons working
  - [ ] Validation (invalid address, self-transfer)
  - [ ] Error handling

- [ ] Test 3: Update SOH
  - [ ] Successful update
  - [ ] SOH validation (0-100%)
  - [ ] Toast notifications
  - [ ] Passport reflects changes

- [ ] Test 4: Integrate Battery (OEM)
  - [ ] Successful integration
  - [ ] VIN validation (17 chars)
  - [ ] Battery data loading
  - [ ] Status change to "Integrated"
  - [ ] Toast and success messages

- [ ] Test 5: Start Second Life
  - [ ] Successful second life start
  - [ ] SOH validation (50-80%)
  - [ ] Available capacity calculation
  - [ ] Application type selection
  - [ ] Status change

- [ ] Test 6: Recycle Battery
  - [ ] Successful recycling
  - [ ] Material rows add/remove
  - [ ] Total kg calculation
  - [ ] SOH validation (< 50%)
  - [ ] Status change to "Recycled"

- [ ] Cross-Flow Test: Complete Lifecycle
  - [ ] All steps execute successfully
  - [ ] Status transitions correct
  - [ ] Ownership transfers work
  - [ ] Data persists across stages

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

✅ All 6 forms can be submitted successfully
✅ Toast notifications appear and show transaction hash
✅ Success messages display with correct information
✅ Action buttons (View Passport, Register/Transfer/etc Another) work correctly
✅ Form validation prevents invalid submissions
✅ Error handling works for rejected transactions
✅ Role-based access control works correctly
✅ Battery lifecycle can be completed from manufacture to recycling
✅ All blockchain data persists and can be viewed in passports

---

## Next Steps

After manual testing is complete:

1. Document any bugs found in GitHub Issues
2. Proceed to E2E testing with Playwright (Phase 3)
3. Deploy to testnet for external testing (Phase 5 - Optional)

---

**Last Updated:** 2024-12-18
**Version:** 1.0.0
**Author:** Claude Code Assistant
