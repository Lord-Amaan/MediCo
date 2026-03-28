# Role-Based Access Control (RBAC) Implementation Guide

## Overview

Role-Based Access Control determines **who can do what** in the app.

```
User logs in with email/password
  ↓
Server creates JWT token (contains userID + role)
  ↓
Client sends JWT with every request
  ↓
Server checks: "Is this user a Doctor?"
  ├─ YES → Allow action
  └─ NO → Deny with 403 Forbidden
```

---

## Step 1: Authentication (Login)

### **User Model (Already Have)**

```javascript
User: {
  userID: "DOC_001",
  name: "Dr. Priya Sharma",
  email: "priya@phc.com",
  role: "Doctor",              // ← This is the key
  permissions: ["Create_Transfer", "Review_Transfer"],
  passwordHash: "hashed_pwd",
  hospital: { hospitalID, departmentName }
}
```

### **Login Controller (New - Build This)**

**File:** `server/controllers/authController.js`

```javascript
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ============================================================================
// LOGIN: Generate JWT token
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Check if active
    if (!user.isActive) {
      return res.status(403).json({ error: "User account disabled" });
    }

    // 4. Create JWT token (contains role, userID, hospital)
    const token = jwt.sign(
      {
        userID: user.userID,
        email: user.email,
        role: user.role, // ← ROLE IS EMBEDDED
        permissions: user.permissions, // ← PERMISSIONS ARE EMBEDDED
        hospital: user.hospital.hospitalID,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }, // Token valid for 24 hours
    );

    // 5. Update last login
    user.lastLogin = new Date();
    await user.save();

    // 6. Return token
    res.json({
      token,
      user: {
        userID: user.userID,
        name: user.name,
        role: user.role,
        hospital: user.hospital.hospitalName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// VERIFY TOKEN
// ============================================================================
exports.verifyToken = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

**API Endpoint:**

```
POST /api/auth/login
Body: { email: "priya@phc.com", password: "password123" }

Response:
{
  token: "eyJhbGciOiJIUzI1NiIs...",  ← This is the JWT
  user: {
    userID: "DOC_001",
    name: "Dr. Priya Sharma",
    role: "Doctor",
    hospital: "Rural PHC"
  }
}
```

---

## Step 2: Authentication Middleware

**Verify JWT on every request**

**File:** `server/middleware/auth.js`

```javascript
const jwt = require("jsonwebtoken");

// ============================================================================
// MIDDLEWARE: Verify JWT token is valid
// ============================================================================
exports.verifyAuth = (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // "Bearer <token>"

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user info to request (so controllers can access it)
    req.user = decoded;
    // Now req.user = {
    //   userID: "DOC_001",
    //   email: "priya@phc.com",
    //   role: "Doctor",
    //   permissions: ["Create_Transfer", "Review_Transfer"],
    //   hospital: "HOSP_001"
    // }

    next(); // Continue to next middleware/controller
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
```

---

## Step 3: Authorization Middleware

**Check if user has required role/permission**

**File:** `server/middleware/authorize.js`

```javascript
// ============================================================================
// MIDDLEWARE: Check user role
// ============================================================================
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user is authenticated (verifyAuth should run first)
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2. Check if role matches
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" OR ")}. Your role: ${req.user.role}`,
      });
    }

    next(); // Role matches, proceed
  };
};

// ============================================================================
// MIDDLEWARE: Check user permissions
// ============================================================================
exports.requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // 1. Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2. Check if has permission
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: `Access denied. Required permission: ${requiredPermission}`,
      });
    }

    next(); // Permission granted, proceed
  };
};

// ============================================================================
// MIDDLEWARE: Check if belongs to same hospital (data isolation)
// ============================================================================
exports.requireSameHospital = async (req, res, next) => {
  try {
    // Get hospitalID from request (e.g., from transfer document)
    const Transfer = require("../models/Transfer");
    const transfer = await Transfer.findById(req.params.transferId);

    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    // Check if user's hospital matches
    if (req.user.hospital !== transfer.sendingFacility.hospitalID) {
      return res.status(403).json({
        error: "Access denied. You can only view transfers from your hospital",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Step 4: Protected API Routes

**Apply middleware to routes**

**File:** `server/routes/transfers.js`

```javascript
const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferController");
const { verifyAuth } = require("../middleware/auth");
const {
  requireRole,
  requirePermission,
  requireSameHospital,
} = require("../middleware/authorize");

// ============================================================================
// ROUTE 1: Create Transfer (Only Doctors/Nurses)
// ============================================================================
router.post(
  "/",
  verifyAuth, // Must be logged in
  requireRole(["Doctor", "Nurse"]), // Must be Doctor or Nurse
  requirePermission("Create_Transfer"), // Must have permission
  transferController.createTransfer,
);

// ============================================================================
// ROUTE 2: Get Transfer (Any authenticated user)
// ============================================================================
router.get(
  "/:transferId",
  verifyAuth, // Must be logged in
  requireSameHospital, // Can only access own hospital's transfers
  transferController.getTransfer,
);

// ============================================================================
// ROUTE 3: Acknowledge Transfer (Only Receiving Doctor)
// ============================================================================
router.post(
  "/:transferId/acknowledge",
  verifyAuth, // Must be logged in
  requireRole(["Doctor"]), // Must be a Doctor (not nurse)
  requirePermission("Review_Transfer"), // Must have review permission
  transferController.acknowledgeTransfer,
);

// ============================================================================
// ROUTE 4: Delete Transfer (Only Admin)
// ============================================================================
router.delete(
  "/:transferId",
  verifyAuth, // Must be logged in
  requireRole(["Admin"]), // Must be Admin
  requirePermission("Delete_Transfer"), // Must have delete permission
  transferController.deleteTransfer,
);

// ============================================================================
// ROUTE 5: View Audit Logs (Only Admin)
// ============================================================================
router.get(
  "/audit/logs/:patientId",
  verifyAuth, // Must be logged in
  requireRole(["Admin"]), // Must be Admin ONLY
  transferController.viewAuditLogs,
);

module.exports = router;
```

---

## Step 5: Controller Using Role Information

**File:** `server/controllers/transferController.js`

```javascript
const Transfer = require('../models/Transfer');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');

// ============================================================================
// CREATE TRANSFER
// ============================================================================
exports.createTransfer = async (req, res) => {
  try {
    // 1. Get data from request
    const { patientName, patientID, allergies, medications, reason, vitals, clinical } = req.body;

    // 2. Validation
    if (!patientName || !allergies || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3. Create transfer document
    const transfer = new Transfer({
      patient: {
        name: patientName,
        patientID: patientID,
        // ...
      },
      critical: {
        allergies: allergies,
        activeMedications: medications,
        transferReason: reason
      },
      vitals: vitals,
      clinical: clinical,

      sendingFacility: {
        hospitalID: req.user.hospital,      // ← From logged-in user
        doctorName: req.user.name,           // ← From logged-in user
        doctorID: req.user.userID,           // ← From logged-in user
        timestamp: new Date()
      },

      transfer: {
        transferID: generateTransferID(),
        status: 'Pending'
      },

      sharing: {
        shareToken: generateToken(),
        qrCodeData: encodeTransferData(...)
      }
    });

    // 4. Save to database
    await transfer.save();

    // 5. Update Patient model
    let patient = await Patient.findOne({ patientID: patientID });
    if (!patient) {
      patient = new Patient({ patientID: patientID, name: patientName });
    }
    patient.transferHistory.push(transfer._id);
    patient.totalTransfers += 1;
    await patient.save();

    // 6. LOG TO AUDIT (who created this transfer)
    await AuditLog.create({
      action: 'Transfer_Created',
      actor: {
        userID: req.user.userID,        // ← From token
        name: req.user.name,             // ← From token
        role: req.user.role,             // ← From token
        hospital: req.user.hospital
      },
      target: {
        transferID: transfer._id,
        patientID: patientID,
        patientName: patientName
      },
      details: `Created transfer for ${reason}`,
      timestamp: new Date(),
      sensitiveDataAccessed: true,
      dataFields: ['allergies', 'medications', 'vitals']
    });

    // 7. Return success with transfer details
    res.status(201).json({
      success: true,
      transfer: {
        transferID: transfer.transfer.transferID,
        qrCode: transfer.sharing.qrCodeData,
        shareLink: transfer.sharing.shareLink,
        message: 'Transfer created. Share QR code with patient.'
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ACKNOWLEDGE TRANSFER (Receiving Doctor)
// ============================================================================
exports.acknowledgeTransfer = async (req, res) => {
  try {
    // 1. Find transfer
    const transfer = await Transfer.findById(req.params.transferId);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // 2. Get data from request
    const { arrivalNotes, discrepancies } = req.body;

    // 3. Update transfer
    transfer.acknowledgement = {
      reviewed: true,
      reviewedBy: {
        userID: req.user.userID,        // ← From token
        name: req.user.name,             // ← From token
        role: req.user.role,
        timestamp: new Date()
      },
      arrivalNotes: arrivalNotes,
      discrepancies: discrepancies,
      acknowledgementTime: new Date(),
      synced: false
    };
    transfer.transfer.status = 'Acknowledged';

    await transfer.save();

    // 4. LOG TO AUDIT (who acknowledged)
    await AuditLog.create({
      action: 'Transfer_Acknowledged',
      actor: {
        userID: req.user.userID,
        name: req.user.name,
        role: req.user.role,
        hospital: req.user.hospital
      },
      target: {
        transferID: transfer._id,
        patientID: transfer.patient.patientID
      },
      details: `Marked transfer as reviewed${discrepancies.length > 0 ? ' with discrepancies' : ''}`,
      timestamp: new Date()
    });

    // 5. Return success
    res.json({
      success: true,
      message: 'Transfer acknowledged',
      acknowledgementTime: transfer.acknowledgement.acknowledgementTime
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// VIEW AUDIT LOGS (Admin Only)
// ============================================================================
exports.viewAuditLogs = async (req, res) => {
  try {
    // 1. Admin can view audit logs for any patient
    const patientID = req.params.patientId;

    // 2. Query audit logs
    const logs = await AuditLog.find({ 'target.patientID': patientID })
      .sort({ timestamp: -1 })
      .limit(100);

    // 3. Return logs
    res.json({
      patientID: patientID,
      totalLogs: logs.length,
      logs: logs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Step 6: Setup Routes in Main Server

**File:** `server/server.js`

```javascript
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
mongoose.connect(process.env.MONGODB_URI);

// ============================================================================
// ROUTES
// ============================================================================

// Auth routes (no auth required)
const authController = require("./controllers/authController");
app.post("/api/auth/login", authController.login);
app.get("/api/auth/verify", authController.verifyToken);

// Protected routes (auth required)
const transferRoutes = require("./routes/transfers");
app.use("/api/transfers", transferRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Step 7: Real-World API Call Flow

### **Scenario 1: Doctor Creates Transfer**

**Client (React Native App):**

```javascript
// 1. User logs in
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  body: JSON.stringify({
    email: "priya@phc.com",
    password: "password123",
  }),
});

const { token } = await loginResponse.json();
// token = "eyJhbGciOiJIUzI1NiIs..."

// Store token in AsyncStorage
AsyncStorage.setItem("authToken", token);

// 2. Create transfer (with auth token)
const createResponse = await fetch("http://localhost:5000/api/transfers", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`, // ← Send token
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    patientName: "Rajesh Kumar",
    patientID: "MRN_12345",
    allergies: ["Aspirin"],
    medications: ["Metoprolol"],
    reason: "Hypertensive crisis",
  }),
});

const transfer = await createResponse.json();
// Response:
// {
//   success: true,
//   transfer: {
//     transferID: "TRANSFER_001",
//     qrCode: "...",
//     shareLink: "..."
//   }
// }
```

**Server Processing:**

```
1. Request arrives with token:
   POST /api/transfers
   Header: Authorization: Bearer eyJh...

2. verifyAuth middleware:
   ├─ Extract token from header
   ├─ Verify JWT signature (using JWT_SECRET)
   ├─ If valid: req.user = { userID, role, permissions, ... }
   └─ If invalid: return 401 Unauthorized

3. requireRole(['Doctor', 'Nurse']) middleware:
   ├─ Check req.user.role
   ├─ Is role in ['Doctor', 'Nurse']?
   ├─ YES: proceed
   └─ NO: return 403 Forbidden

4. requirePermission('Create_Transfer') middleware:
   ├─ Check req.user.permissions
   ├─ Is 'Create_Transfer' in permissions?
   ├─ YES: proceed
   └─ NO: return 403 Forbidden

5. createTransfer controller:
   ├─ Create transfer document
   ├─ Use req.user.userID for author
   ├─ Use req.user.hospital for facility
   ├─ Create AuditLog entry
   └─ Return transfer details

6. Response sent back to client:
   {
     success: true,
     transfer: { transferID, qrCode, shareLink }
   }
```

---

### **Scenario 2: Nurse Tries to Acknowledge Transfer (Should Fail)**

**Client:**

```javascript
const response = await fetch(
  "http://localhost:5000/api/transfers/TRANSFER_001/acknowledge",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${nurseToken}`, // Nurse's token
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      arrivalNotes: "Patient stable",
    }),
  },
);

const data = await response.json();
// Response (because nurse doesn't have "Review_Transfer" permission):
// {
//   error: "Access denied. Required permission: Review_Transfer"
// }
```

**Server Processing:**

```
1. verifyAuth: ✅ Token is valid, req.user = { role: 'Nurse', ... }

2. requireRole(['Doctor']): ✅ Passes? NO!
   req.user.role = 'Nurse'
   'Nurse' NOT in ['Doctor']

   Return: 403 Forbidden
   Error: "Access denied. Required role: Doctor"
```

---

### **Scenario 3: Admin Views Audit Logs**

**Client:**

```javascript
const response = await fetch(
  "http://localhost:5000/api/transfers/audit/logs/MRN_12345",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  },
);

const logs = await response.json();
// Returns:
// {
//   patientID: "MRN_12345",
//   logs: [
//     {
//       action: "Transfer_Created",
//       actor: { userID: "DOC_001", name: "Dr. Priya", role: "Doctor" },
//       timestamp: "2026-03-28T15:10:00Z"
//     },
//     {
//       action: "Transfer_Acknowledged",
//       actor: { userID: "DOC_002", name: "Dr. Rajiv", role: "Doctor" },
//       timestamp: "2026-03-28T16:50:00Z"
//     }
//   ]
// }
```

---

## Step 8: Install Required Packages

**File:** `server/package.json`

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5"
  }
}
```

**Install:**

```powershell
npm install jsonwebtoken bcryptjs
```

---

## Step 9: Update .env

**File:** `server/.env`

```
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRY=24h
```

---

## Authorization Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native)                     │
│                                                                   │
│  1. User enters email + password                                 │
│  2. POST /api/auth/login                                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SERVER (Express Backend)                        │
│                                                                   │
│  authController.login():                                          │
│  ├─ Find user by email                                           │
│  ├─ Verify password (bcryptjs.compare)                           │
│  ├─ Create JWT token containing:                                 │
│  │  ├─ userID                                                    │
│  │  ├─ role: "Doctor"                                            │
│  │  └─ permissions: ["Create_Transfer"]                          │
│  └─ Return token to client                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼ Token stored in AsyncStorage
┌──────────────────────────────────────────────────────────────────┐
│                    SUBSEQUENT REQUESTS                            │
│                                                                   │
│  POST /api/transfers                                              │
│  Header: Authorization: Bearer <token>                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              verifyAuth Middleware                                │
│  ├─ Extract token from Authorization header                      │
│  ├─ jwt.verify(token, JWT_SECRET)                                │
│  ├─ If invalid: return 401 Unauthorized                          │
│  ├─ If valid: req.user = decoded token payload                   │
│  └─ next() → proceed                                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│          requireRole(['Doctor', 'Nurse']) Middleware              │
│  ├─ Check if req.user.role in allowed roles                      │
│  ├─ If YES: proceed to requirePermission                         │
│  └─ If NO: return 403 Forbidden                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│      requirePermission('Create_Transfer') Middleware              │
│  ├─ Check if 'Create_Transfer' in req.user.permissions           │
│  ├─ If YES: proceed to controller                                │
│  └─ If NO: return 403 Forbidden                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              transferController.createTransfer()                  │
│  ├─ Validate request data                                        │
│  ├─ Create Transfer document                                     │
│  ├─ Use req.user.userID as doctorID                              │
│  ├─ Create AuditLog entry (who created, when, what)              │
│  ├─ Save to database                                             │
│  └─ Return transfer details                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    ✅ Transfer Created
```

---

## Role Permission Matrix

| Action                 | Doctor | Nurse | Admin |
| ---------------------- | ------ | ----- | ----- |
| Create Transfer        | ✅     | ✅\*  | ✅    |
| View Transfer          | ✅     | ✅    | ✅    |
| Acknowledge Transfer   | ✅     | ❌    | ❌    |
| Modify Critical Fields | ✅     | ❌    | ✅    |
| Delete Transfer        | ❌     | ❌    | ✅    |
| View Audit Logs        | ❌     | ❌    | ✅    |
| Manage Users           | ❌     | ❌    | ✅    |
| Manage Hospitals       | ❌     | ❌    | ✅    |

_Nurse can only create with Doctor supervision_

---

## Summary

**RBAC Implementation has 3 Layers:**

1. **Authentication (verifyAuth)**
   - Is the user logged in?
   - Is the JWT token valid?

2. **Authorization (requireRole)**
   - What is the user's role?
   - Is this role allowed to do this action?

3. **Permission Checking (requirePermission)**
   - Does the user have the specific permission?
   - Is "Create_Transfer" in their permission list?

**Every API call flow:**

```
User logs in
  ↓
Get JWT token (contains role + permissions)
  ↓
Send token with every request
  ↓
Server verifies token (is it valid?)
  ↓
Server checks role (is doctor? is nurse?)
  ↓
Server checks permission (has "Create_Transfer"?)
  ↓
If ALL pass: Execute action + Log to AuditLog
If ANY fail: Return 403 Forbidden
```

---

## Next: Implementation Steps

1. ✅ Update `server/package.json` (add JWT + bcrypt)
2. ✅ Create `server/controllers/authController.js` (login)
3. ✅ Create `server/middleware/auth.js` (verify JWT)
4. ✅ Create `server/middleware/authorize.js` (check role + permission)
5. ✅ Update `server/controllers/transferController.js` (use req.user)
6. ✅ Update `server/routes/transfers.js` (add middleware)
7. ✅ Update `server/server.js` (register auth routes)

Want me to build all of this? 🚀
