# Contract Bug Workaround - Testing Guide

## Problem Summary

**Contract Bug Discovered**: RecyclingManager.sol has an architectural flaw:
- `completeRecycling()` decrements `totalBatteriesInRecycling--` which somehow causes `isInRecycling[bin]` to become `false`
- `auditRecycling()` has modifier `inRecycling(bin)` requiring `isInRecycling[bin] == true`
- **Result**: Cannot audit batteries after completion

## Workaround Applied

**Solution**: Only call `startRecycling()`, skip `completeRecycling()`, and audit while battery is in "Received" status

### Changes Made:

1. **RecycleBatteryForm.tsx** (lines 178-202)
   - Disabled auto-complete functionality
   - Only calls `startRecycling()`
   - Battery stays in status "Received" (1) instead of "Completed" (5)
   - Updated success message to reflect this

2. **AuditRecyclingForm.tsx** (line 86)
   - Changed validation from `status === 5` to `status >= 1 && status < 6`
   - Now accepts batteries in "Received" status for auditing

---

## Testing Steps

### Prerequisites

1. **Anvil Running**:
   ```bash
   anvil --chain-id 31337
   ```

2. **Contracts Deployed**:
   ```bash
   cd sc
   ./deploy-and-seed.sh
   ```

3. **Frontend Running**:
   ```bash
   cd web
   npm run dev
   ```

4. **Browser**: http://localhost:3000

---

### Step 1: Recycle a Fresh Battery

**Important**: Use a NEW battery that hasn't been recycled before

**Account**: Account #4 (Recycler)
- **Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

**Actions**:

1. Import Account #4 in MetaMask (if not already)
2. Connect to http://localhost:3000
3. Go to **RecycleBatteryForm**
4. Fill in:
   - **BIN**: `NV-2024-TEST999` (or any fresh battery)
   - **Recycling Method**: Hydrometallurgical
   - **Facility**: EcoRecycle Plant Madrid
   - **Materials**:
     - Lithium: 10 kg, 95%
     - Cobalt: 5 kg, 92%
     - Nickel: 8 kg, 90%
   - **Notes**: (optional)

5. Click **"Recycle Battery"**

**Expected Results**:

✅ **ONE transaction in MetaMask** (not two!)
- Only `startRecycling()` transaction
- NO second transaction for `completeRecycling()`

✅ **Success Toast**:
```
"Battery recycling started successfully!"
"Battery NV-2024-TEST999 entered recycling process - 23.0 kg materials to recover. Status: Received (ready for audit)"
```

✅ **Console Logs** (open dev tools):
```
✅ startRecycling transaction sent
Transaction hash: 0x...
```

❌ **Should NOT see**:
```
"Auto-completing recycling for..."
```

---

### Step 2: Verify Battery State (Optional CLI Check)

```bash
# Check recycling data
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "getRecyclingData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-TEST999") \
  --rpc-url http://localhost:8545
```

**Expected**:
- Recycler: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` (not 0x000...)
- Status: `1` (Received)
- ReceivedDate: (timestamp > 0)
- Method: `1` (Hydrometallurgical)

```bash
# CRITICAL: Check isInRecycling flag
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "isInRecycling(bytes32)(bool)" \
  $(cast --format-bytes32-string "NV-2024-TEST999") \
  --rpc-url http://localhost:8545
```

**Expected**: `true` ✅ (This is the key!)

---

### Step 3: Verify Header Shows AUDITOR Role

**Account**: Account #6 (Auditor)
- **Address**: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- **Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`

**Actions**:

1. Switch to Account #6 in MetaMask
2. Refresh page or reconnect wallet
3. Check **header** (top right)

**Expected**:

✅ **Header Shows**:
```
Roles: [AUDITOR]
```

Green badge with "AUDITOR" text

❌ **If shows "None"**:
- Check `deployed-roles.json` has AUDITOR_ROLE
- Check console for role check logs
- Verify account #6 has AUDITOR_ROLE on RecyclingManager contract

---

### Step 4: Audit the Battery

**Still connected as Account #6 (Auditor)**

**Actions**:

1. Go to **AuditRecyclingForm**
2. **BIN**: `NV-2024-TEST999` (the battery you just recycled)
3. Click **"Fetch Data"**

**Expected Data Display**:

✅ **Recycling Information Box**:
```
Recycler: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
Recycled Date: (human-readable date)
Method: Hydrometallurgical
Status: "Received" (yellow badge)
Input Weight: (shown in kg)
Facility: EcoRecycle Plant Madrid
```

✅ **NO "Battery Not Recycled" message**

✅ **Audit form visible** (Approve/Reject radio buttons)

**Complete Audit**:

4. Select: **Approve** or **Reject**
5. **Notes**: "Testing workaround - materials properly documented"
6. Click **"Submit Audit"**

**Expected Results**:

✅ **MetaMask Opens** - Transaction to sign
✅ **Transaction Succeeds** - No error about "must be in recycled state"
✅ **Success Toast**:
```
"Recycling audit submitted successfully!"
"Audit for battery NV-2024-TEST999 has been recorded"
```

✅ **Console Logs**:
```
🎯 Submitting audit for NV-2024-TEST999
✅ Audit transaction sent
Transaction hash: 0x...
```

---

### Step 5: Verify Audit Was Recorded

**CLI Verification**:

```bash
# Check recycling data again
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "getRecyclingData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-TEST999") \
  --rpc-url http://localhost:8545
```

**Expected Changes**:
- Status: `6` (Audited) - changed from 1
- Auditor: `0x976EA74026E726554dB657fA54763abd0C3a0aa9` (not 0x000...)
- CompletionDate: (timestamp > 0)

**UI Verification**:

1. Enter same BIN in AuditRecyclingForm
2. Click "Fetch Data"
3. **Expected**:
   - Status badge: **"Audited"** (green badge)
   - Message: "This recycling has already been audited"
   - Form disabled (cannot audit again)

---

## Success Criteria

| Check | Expected Result | Status |
|-------|----------------|--------|
| Only ONE transaction when recycling | `startRecycling()` only | ⬜ |
| Success toast says "Status: Received" | Not "Completed" | ⬜ |
| AUDITOR badge shows in header | Green badge visible | ⬜ |
| AuditForm shows battery data | All fields populated | ⬜ |
| Status shows "Received" (yellow) | Not "Completed" | ⬜ |
| Audit transaction succeeds | No "must be in recycled state" error | ⬜ |
| Status updates to "Audited" | Green badge after audit | ⬜ |
| `isInRecycling[bin]` stays true until audit | CLI check returns true | ⬜ |

---

## Troubleshooting

### ❌ Still getting "Battery must be in recycled state for audit"

**Possible Causes**:

1. **Battery was recycled before the workaround**
   - Solution: Use a completely fresh battery that has never been recycled
   - The old batteries have `isInRecycling[bin] = false` from previous `completeRecycling()` calls

2. **Frontend code not updated**
   - Solution: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
   - Check `RecycleBatteryForm.tsx` lines 178-202 show commented-out code

3. **ABI not updated**
   - Solution: Run `cd sc && ./update-abi.sh`
   - Restart frontend: `cd web && npm run dev`

### ❌ "Battery Not Recycled" message

**Causes**:
- Wrong BIN entered
- Battery was never recycled
- Recycling transaction failed

**Solution**:
- Check transaction hash in Etherscan/Anvil logs
- Use CLI to verify: `getRecyclingData(bin)`

### ❌ AUDITOR role not showing in header

**Causes**:
- Wrong account connected
- `deployed-roles.json` missing AUDITOR_ROLE

**Solution**:
- Verify connected address: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- Check `deployed-roles.json` has `AUDITOR_ROLE: "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5"`

### ❌ Fetch Data shows "N/A" for all fields

**Causes**:
- Struct parsing error
- Wrong contract ABI

**Solution**:
- Check console logs for raw `recyclingData` object
- Verify `AuditRecyclingForm.tsx` uses property access (`.bin`, `.status`) not array indices

---

## Files Modified (Reference)

1. **web/src/components/forms/RecycleBatteryForm.tsx**
   - Lines 178-202: Disabled auto-complete functionality
   - Line 210: Updated success message

2. **web/src/components/forms/AuditRecyclingForm.tsx**
   - Lines 52-69: Fixed struct parsing (property access)
   - Line 86: Changed validation to accept status >= 1
   - Lines 342-355: Improved status display

3. **web/src/config/deployed-roles.json**
   - Added AUDITOR_ROLE hash

---

## Known Limitations

⚠️ **This is a workaround, not a permanent fix**

**Limitations**:
1. Batteries stay in "Received" status forever (never reach "Completed")
2. Material recovery details cannot be recorded (would require `completeRecycling()`)
3. Battery state in BatteryRegistry never updates to "Recycled"

**Proper Fix Requires**:
- Modify `RecyclingManager.sol` contract
- Option A: Remove `inRecycling()` modifier from `auditRecycling()`
- Option B: Fix `isInRecycling` flag management in `completeRecycling()`
- Redeploy contract

---

## Contract Addresses (Reference)

```
RecyclingManager: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
RoleManager: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
BatteryRegistry: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

---

## Test Accounts

```
Account #4 (Recycler):
  Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
  PK: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #6 (Auditor):
  Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
  PK: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

---

**Last Updated**: 26 December 2024
**Status**: ⚠️ WORKAROUND APPLIED - Awaiting User Testing
**Related Docs**:
- QUICK_TEST_GUIDE.md
- MANUAL_TESTING_GUIDE.md
- AUDITOR_ROLE_COMPLETE_FIX.md
