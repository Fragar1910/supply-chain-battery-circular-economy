# Final Recycling & Audit Test Guide - Complete Fix

## Summary of Changes

All issues have been fixed. The recycling and auditing workflow now works correctly with a two-transaction flow.

### What Was Fixed:

1. ✅ **AuditRecyclingForm data parsing** - Fixed Wagmi struct access (property names vs array indices)
2. ✅ **AUDITOR_ROLE in header** - Added missing role hash to deployed-roles.json
3. ✅ **Status display** - Shows actual RecyclingStatus enum values
4. ✅ **Two-transaction recycling** - Re-enabled auto-complete to reach "Completed" status
5. ✅ **Contract requirements** - Properly enforces status == Completed for audit

---

## How It Works Now

### Recycling Flow (Two Transactions)

```
User clicks "Recycle Battery"
    ↓
Transaction 1: startRecycling()
    - Status: Received (1)
    - isInRecycling[bin] = true
    - Toast: "Step 1/2: Battery received..."
    ↓
Auto-wait 1 second
    ↓
Transaction 2: completeRecycling()
    - Status: Completed (5)
    - isInRecycling[bin] stays true
    - Toast: "Battery recycling completed! Ready for audit"
    ↓
Battery ready for audit ✅
```

### Audit Flow (One Transaction)

```
Auditor enters BIN → Clicks "Fetch Data"
    ↓   
Displays recycling information
    - Recycler address
    - Method, dates, facility
    - Status: "Completed (Ready for Audit)"
    ↓
Auditor selects Approve/Reject + Notes
    ↓
Transaction: auditRecycling()
    - Checks: status == Completed ✅
    - Checks: isInRecycling[bin] == true ✅
    - Sets: status = Audited (6)
    - Toast: "Audit submitted successfully!"
```

---

## Prerequisites

### 1. Start Anvil
```bash
anvil --chain-id 31337
```

### 2. Deploy Contracts
```bash
cd sc
./deploy-and-seed.sh
```

Wait for:
```
✅ All contracts deployed successfully
✅ Roles assigned
✅ Test batteries seeded
```

### 3. Start Frontend
```bash
cd web
npm run dev
```

Open: **http://localhost:3000**

---

## Test Procedure

### Step 1: Recycle a Battery (Recycler Role)

**Account**: Account #4 (Recycler)
- **Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

**Import in MetaMask**:
1. MetaMask → Settings → Import Account
2. Paste private key: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`
3. Connect at http://localhost:3000

**Recycle Battery**:

1. Navigate to **RecycleBatteryForm**
2. Fill in form:
   ```
   BIN: NV-2024-FINAL999
   Recycling Method: Hydrometallurgical
   Facility: EcoRecycle Plant Madrid
   Materials:
     - Lithium: 10 kg, 95%
     - Cobalt: 5 kg, 92%
     - Nickel: 8 kg, 90%
   Notes: (optional)
   ```

3. Click **"Recycle Battery"**

**Expected Results**:

✅ **Transaction 1** (MetaMask appears):
- Function: `startRecycling`
- Confirm transaction
- Wait for confirmation

✅ **Toast 1**:
```
"Battery recycling started!"
"Step 1/2: Battery NV-2024-FINAL999 received - 23.0 kg materials. Completing recycling process..."
```

⏳ **Auto-wait ~1 second**

✅ **Transaction 2** (MetaMask appears again):
- Function: `completeRecycling`
- Confirm transaction
- Wait for confirmation

✅ **Toast 2**:
```
"Battery recycling completed successfully!"
"Battery NV-2024-FINAL999 is now ready for audit - 23.0 kg materials recovered. Status: Completed"
```

✅ **Console Logs** (F12 Developer Tools):
```
✅ startRecycling transaction sent
Transaction hash: 0x...
✅ startRecycling confirmed. Auto-completing recycling for NV-2024-FINAL999
✅ completeRecycling transaction sent
Transaction hash: 0x...
```

---

### Step 2: Verify Battery Status (Optional CLI Check)

```bash
# Check recycling data
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "getRecyclingData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-FINAL999") \
  --rpc-url http://localhost:8545
```

**Expected Output Decoded**:
```
bin: 0x4e56... (NV-2024-FINAL999)
status: 5 (Completed) ✅
method: 1 (Hydrometallurgical) ✅
recycler: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 ✅
receivedDate: [timestamp] ✅
completionDate: [timestamp] ✅
isAudited: false ✅
```

**Verify isInRecycling flag**:
```bash
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "isInRecycling(bytes32)(bool)" \
  $(cast --format-bytes32-string "NV-2024-FINAL999") \
  --rpc-url http://localhost:8545
```

**Expected**: `true` ✅ (Flag stays true after completion)

---

### Step 3: Switch to Auditor Account

**Account**: Account #6 (Auditor)
- **Address**: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- **Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`

**Switch Account in MetaMask**:
1. Click current account icon (top right)
2. Select Account #6 (0x976EA...3a0aa9)
3. Or import with private key if not present

**Refresh page** to update wallet connection

---

### Step 4: Verify AUDITOR Role in Header

**Check Header** (top right of page):

✅ **Expected Display**:
```
Roles: [AUDITOR]
```
- Green badge with text "AUDITOR"

❌ **If shows "None"**:
- Verify connected account: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
- Check deployed-roles.json has AUDITOR_ROLE
- Check browser console for role check logs

**Verify via CLI** (if needed):
```bash
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "hasRole(bytes32,address)(bool)" \
  0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5 \
  0x976EA74026E726554dB657fA54763abd0C3a0aa9 \
  --rpc-url http://localhost:8545
```
**Expected**: `true`

---

### Step 5: Audit the Battery

**Still connected as Account #6 (Auditor)**

1. Navigate to **AuditRecyclingForm**
2. Enter **BIN**: `NV-2024-FINAL999`
3. Click **"Fetch Data"**

**Expected Data Display**:

✅ **Recycling Information Box** appears with:

| Field | Expected Value |
|-------|----------------|
| Recycler | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |
| Recycled Date | (Human-readable date/time) |
| Completion Date | (Human-readable date/time) |
| Method | `Hydrometallurgical` |
| Status | **"Completed (Ready for Audit)"** (yellow badge) |
| Input Weight | `[value] kg` |
| Facility | `EcoRecycle Plant Madrid` |

✅ **Audit Form Visible**:
- Radio buttons: Approve / Reject
- Notes text area
- "Submit Audit" button enabled

❌ **Should NOT see**:
- "Battery Not Recycled" message
- "Recycling In Progress" message (unless you used a battery with status < 5)
- "N/A" for any fields

**Submit Audit**:

4. Select: **Approve** (or Reject)
5. **Notes**: `Final test - all materials properly documented and recovered`
6. Click **"Submit Audit"**

**Expected Results**:

✅ **MetaMask Opens**:
- Function: `auditRecycling`
- Parameters: bin, approved (true/false)
- Confirm transaction

✅ **Transaction Succeeds** (No errors!)

✅ **Success Toast**:
```
"Recycling audit submitted successfully!"
"Audit for battery NV-2024-FINAL999 has been recorded"
```

✅ **Console Logs**:
```
🎯 Submitting audit for NV-2024-FINAL999
Approved: true
✅ Audit transaction sent
Transaction hash: 0x...
```

---

### Step 6: Verify Audit Was Recorded

**Option 1: Try to audit again (UI)**

1. Stay on AuditRecyclingForm
2. Enter same BIN: `NV-2024-FINAL999`
3. Click "Fetch Data"

**Expected**:
- Status badge: **"Audited"** (green)
- Message: "This recycling has already been audited on [date]"
- Form disabled / grayed out
- Submit button disabled

**Option 2: CLI Verification**

```bash
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "getRecyclingData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-FINAL999") \
  --rpc-url http://localhost:8545
```

**Expected Changes**:
```
status: 6 (Audited) ✅ (changed from 5)
isAudited: true ✅ (changed from false)
auditor: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 ✅ (no longer 0x000...)
completionDate: [timestamp] ✅
```

---

## Success Checklist

| Test | Expected Result | Status |
|------|----------------|--------|
| Import Recycler account (0x15d34...) | Connected successfully | ⬜ |
| Recycle battery - Transaction 1 | `startRecycling()` succeeds | ⬜ |
| Toast shows "Step 1/2" | Confirmation visible | ⬜ |
| Recycle battery - Transaction 2 | `completeRecycling()` succeeds (auto) | ⬜ |
| Toast shows "Ready for audit" | Confirmation visible | ⬜ |
| Battery status = Completed (5) | CLI verification passes | ⬜ |
| Switch to Auditor account (0x976EA...) | Connected successfully | ⬜ |
| AUDITOR badge in header | Green badge visible | ⬜ |
| Fetch battery data | All fields populated correctly | ⬜ |
| Status shows "Completed (Ready for Audit)" | Yellow badge visible | ⬜ |
| Submit audit transaction | Transaction succeeds | ⬜ |
| Success toast appears | "Audit submitted successfully" | ⬜ |
| Battery status = Audited (6) | CLI verification passes | ⬜ |
| Try to audit again | Form disabled, shows "already audited" | ⬜ |

---

## Troubleshooting

### ❌ Second transaction (completeRecycling) doesn't appear

**Possible Causes**:
1. First transaction still confirming - wait a few seconds
2. Auto-complete code not triggered - check console for errors
3. React hooks not running - hard refresh browser (Cmd+Shift+R)

**Solution**:
- Check console logs for: `✅ startRecycling confirmed. Auto-completing recycling for...`
- If missing, check RecycleBatteryForm.tsx lines 181-199 are uncommented
- Restart frontend: `npm run dev`

### ❌ "Battery Not Recycled" message in audit form

**Possible Causes**:
1. Battery was never recycled
2. Wrong BIN entered
3. Recycling transactions failed

**Solution**:
- Verify transaction hashes in MetaMask
- Use CLI to check: `getRecyclingData(bin)`
- Check `receivedDate > 0` and `status >= 1`

### ❌ "Recycling In Progress" message instead of "Ready for Audit"

**Possible Causes**:
1. Second transaction (`completeRecycling`) didn't run
2. Battery stuck in status 1-4 (not Completed)

**Solution**:
- Check CLI: `getRecyclingData(bin)` - look at status value
- If status < 5, second transaction failed
- Check console logs for errors
- Try recycling a fresh battery

### ❌ Audit transaction fails: "RecyclingManager: Recycling not completed"

**Possible Causes**:
1. Battery status is not 5 (Completed)
2. Only first transaction ran, second didn't execute

**Solution**:
```bash
# Check actual status
cast call RecyclingManager "getRecyclingData" \
  $(cast --format-bytes32-string "YOUR-BIN") \
  --rpc-url http://localhost:8545
```
- If status != 5, recycle the battery again (fresh BIN)
- Verify BOTH transactions completed

### ❌ AUDITOR role not showing in header

**Possible Causes**:
1. Wrong account connected
2. `deployed-roles.json` missing AUDITOR_ROLE
3. RoleManager contract doesn't have role assigned

**Solution**:
- Verify address: Must be `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- Check file: `web/src/config/deployed-roles.json`
- Should have: `"AUDITOR_ROLE": "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5"`
- Hard refresh browser

### ❌ Data shows "N/A" for fields

**Possible Causes**:
1. Struct parsing issue
2. Wrong property names
3. Old ABI

**Solution**:
- Update ABIs: `cd sc && ./update-abi.sh`
- Restart frontend
- Check AuditRecyclingForm.tsx uses `.bin`, `.status`, `.method` (not array indices)

---

## Test Data Reference

### Contracts (Anvil Local)

```
RecyclingManager: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
RoleManager: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
BatteryRegistry: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
SecondLifeManager: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
```

### Test Accounts

```
Account #4 (Recycler):
  Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
  Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #6 (Auditor):
  Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
  Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

### RecyclingStatus Enum

```
0 = NotStarted
1 = Received      (after startRecycling)
2 = Disassembled
3 = MaterialsSorted
4 = Processing
5 = Completed     (after completeRecycling) ← Required for audit
6 = Audited       (after auditRecycling)
```

### Role Hashes

```
AUDITOR_ROLE = 0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5
RECYCLER_ROLE = 0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154
```

---

## Files Modified (Summary)

| File | Change | Lines |
|------|--------|-------|
| `AuditRecyclingForm.tsx` | Fixed struct parsing (object properties) | 52-69 |
| `AuditRecyclingForm.tsx` | Updated validation (status === 5) | 81-85 |
| `AuditRecyclingForm.tsx` | Improved status display | 342-355 |
| `RecycleBatteryForm.tsx` | Re-enabled auto-complete | 178-230 |
| `RecycleBatteryForm.tsx` | Two-step toast messages | 201-230 |
| `deployed-roles.json` | Added AUDITOR_ROLE hash | Line 3 |
| `DashboardLayout.tsx` | Added role debug logging | 26-34 |

---

## Complete End-to-End Flow

```
1. Recycler logs in (0x15d34...)
   └─> Header shows: [RECYCLER]

2. Recycler fills RecycleBatteryForm
   └─> Clicks "Recycle Battery"
       └─> TX1: startRecycling()
           ├─> Toast: "Step 1/2: Battery received..."
           └─> Status = Received (1)
       └─> Auto-wait 1 second
       └─> TX2: completeRecycling()
           ├─> Toast: "Recycling completed! Ready for audit"
           └─> Status = Completed (5)

3. Auditor logs in (0x976EA...)
   └─> Header shows: [AUDITOR]

4. Auditor opens AuditRecyclingForm
   └─> Enters BIN → Fetch Data
       └─> Shows: Recycler, dates, method, facility
       └─> Status badge: "Completed (Ready for Audit)" (yellow)
       └─> Form enabled

5. Auditor selects Approve/Reject + Notes
   └─> Clicks "Submit Audit"
       └─> TX: auditRecycling()
           ├─> Contract checks: status == 5 ✅
           ├─> Contract checks: isInRecycling[bin] == true ✅
           ├─> Toast: "Audit submitted successfully!"
           └─> Status = Audited (6)

6. Try to audit same battery again
   └─> Form shows: "Already audited" (disabled)
   └─> Status badge: "Audited" (green)
```

---

**Status**: ✅ ALL FIXES APPLIED - READY FOR TESTING
**Date**: 26 December 2024
**Session**: Final recycling & audit workflow fix

**Ready to test!** 🚀
