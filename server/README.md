# MediCo Backend - Patient Transfer Handoff API

Complete end-to-end backend for patient transfer records with offline-first capability, critical info surfacing, and transfer history tracking.

---

## Quick Start

### 1. Setup

```powershell
cd server
npm install
```

### 2. Environment Variables

```powershell
cp .env.example .env
# Edit .env and add your MongoDB connection string
```

### 3. Run Server

```powershell
npm run dev    # With nodemon (auto-reload)
# or
npm start      # Production mode
```

Server will run on `http://localhost:5000`

---

## Project Structure

```
server/
├── models/                 # MongoDB schemas
│   ├── Transfer.js         # Main transfer record
│   ├── Patient.js          # Patient master data
│   ├── Hospital.js         # Hospital registry
│   ├── User.js             # Staff/Doctor registry
│   ├── InteractionDatabase.js  # Drug-allergy conflicts
│   └── AuditLog.js         # Audit trail for compliance
├── controllers/            # Business logic
│   └── transferController.js
├── routes/                 # API endpoints
│   └── transfers.js
├── middleware/             # Custom middleware
│   └── errorHandler.js
├── config/
│   └── database.js         # MongoDB connection
├── server.js               # Main Express app
├── package.json
├── .env                    # Local config (not committed)
├── .env.example            # Template for .env
├── .gitignore              # Git ignore rules
└── schema.md               # Full schema documentation
```

---

## MongoDB Models

### 1. **Transfer** - Main Transfer Record

- **Location**: [models/Transfer.js](models/Transfer.js)
- **Purpose**: Stores each patient transfer with all critical info
- **Key Fields**:
  - `patient`: Demographics (name, age, ID, DOB)
  - `critical`: Allergies, medications, transfer reason (shown first)
  - `vitals`: Last vital signs
  - `clinical`: Investigations, history, clinical summary
  - `sendingFacility`: Where patient comes from
  - `receivingFacility`: Where patient goes to
  - `transfer`: Transfer tracking (mode, status, times)
  - `acknowledgement`: Receiving team review + arrival notes
  - `interactionCheck`: Drug-allergy conflict flags
  - `sharing`: QR code + shareable link
  - `sync`: Offline sync metadata
  - `audit`: Edit history, deletion tracking

### 2. **Patient** - Master Patient Data

- **Location**: [models/Patient.js](models/Patient.js)
- **Purpose**: Patient master record with transfer history
- **Key Fields**:
  - `patientID`: Unique MRN
  - `masterAllergies`: Verified allergy list
  - `masterMedications`: Medication history
  - `totalTransfers`: Transfer count
  - `transferHistory`: Timeline of past transfers
  - `dataQuality`: Verification status

### 3. **Hospital** - Facility Registry

- **Location**: [models/Hospital.js](models/Hospital.js)
- **Purpose**: Master list of sending/receiving hospitals
- **Key Fields**:
  - `hospitalID`: Unique code
  - `type`: PHC, CHC, District, Tertiary
  - `departments`: ICU, Emergency, etc.
  - `capabilities`: Available services
  - `apiKey`: For API access

### 4. **User** - Staff Registry

- **Location**: [models/User.js](models/User.js)
- **Purpose**: Authorized doctors/nurses
- **Key Fields**:
  - `userID`: Employee ID
  - `role`: Doctor, Nurse, Admin
  - `permissions`: What they can do
  - `hospital`: Which facility they work at

### 5. **InteractionDatabase** - Drug-Allergy Reference

- **Location**: [models/InteractionDatabase.js](models/InteractionDatabase.js)
- **Purpose**: Bundled reference for conflict checking
- **Key Fields**:
  - `allergen`: e.g., "Penicillin"
  - `medication`: e.g., "Amoxicillin"
  - `severity`: Critical, Warning, Info
  - `recommendation`: What to do

### 6. **AuditLog** - Compliance & Security

- **Location**: [models/AuditLog.js](models/AuditLog.js)
- **Purpose**: Complete audit trail
- **Key Fields**:
  - `action`: What happened (Created, Acknowledged, Accessed)
  - `actor`: Who did it (User, role, hospital)
  - `target`: What was affected (Transfer, Patient)
  - `timestamp`: When it happened
  - `ipAddress`: From where
  - `sensitiveDataAccessed`: Did they view PII?

---

## API Endpoints (To Be Implemented)

### Transfers

- `POST /api/transfers` – Create new transfer
- `GET /api/transfers/:id` – Get transfer by ID
- `GET /api/transfers/token/:shareToken` – Get transfer by QR token (public)
- `PUT /api/transfers/:id` – Update transfer
- `DELETE /api/transfers/:id` – Soft delete transfer
- `POST /api/transfers/:id/acknowledge` – Mark as reviewed (receiving team)

### Patients

- `GET /api/patients/:patientID` – Get patient master record
- `GET /api/patients/:patientID/transfers` – Get transfer history

### Drug-Allergy Checking

- `POST /api/check-interactions` – Check for conflicts

### Hospitals

- `GET /api/hospitals` – List all hospitals
- `GET /api/hospitals/:hospitalID` – Get hospital details

### Users

- `POST /api/auth/login` – Login
- `POST /api/auth/logout` – Logout
- `GET /api/users/me` – Get current user

### Audit

- `GET /api/audit-logs` – Get audit trail (admin only)

---

## Offline Sync Strategy

### How it works:

1. **Client creates transfer locally** → Stored in AsyncStorage/SQLite
2. **QR code generated from local data** → Works without server
3. **When online, sync to server** → Using version numbers for conflict detection
4. **Server validates** → Checks for duplicates
5. **Mark as synced** → `sync.syncedToServer = true`

### Conflict Resolution:

- Use `sync.version` number for optimistic concurrency
- If version matches → Accept update
- If version mismatch → Flag for manual review
- Acknowledgement stays local until connectivity returns

---

## Drug-Allergy Interaction Checking

### How it works:

1. **Sending team enters allergies + medications**
2. **Query InteractionDatabase for conflicts**
3. **Show warnings before form submission**
4. **Flag critical conflicts in red**
5. **Store flags in transfer.interactionCheck**

### Example Query:

```javascript
// Check if any meds conflict with allergies
const conflicts = await InteractionDatabase.find({
  allergen: { $in: patientAllergies },
  medication: { $in: prescribedMeds },
});
```

---

## Security Best Practices

1. **Encrypt PII at Rest**
   - Use MongoDB field-level encryption
   - Encrypt sensitive data before storing

2. **Encrypt in Transit**
   - Use HTTPS/TLS only
   - Never http over public networks

3. **Role-Based Access Control (RBAC)**
   - Only authorized staff can view records
   - Use `permissions` field in User model

4. **API Authentication**
   - Use JWT tokens for API calls
   - Verify token on each request

5. **Audit Logging**
   - Log every access (AuditLog collection)
   - Track what data was viewed, by whom, when

6. **Share Link Expiry**
   - QR links expire after 30 days
   - `sharing.shareLinkExpiry` timestamp

7. **Data Minimization**
   - Don't store unnecessary info
   - Example: Don't store patient's full medical history, just critical info

---

## Querying Examples

### Get Critical Info (For Receiving Doctor - <90 seconds)

```javascript
db.transfers.findOne(
  { "sharing.shareToken": "abc123" },
  {
    projection: {
      critical: 1,
      "patient.name": 1,
      "patient.age": 1,
      vitals: 1,
      "sendingFacility.hospitalName": 1,
      "transfer.transferReason": 1,
    },
  },
);
// Returns ONLY critical info - no scrolling needed
```

### Get Patient Transfer History

```javascript
db.transfers
  .find({ "patient.patientID": "MRN123" })
  .sort({ "sendingFacility.timestamp": -1 })
  .limit(10);
```

### Find Drug-Allergy Conflicts

```javascript
db.interactionDatabase.find({
  $or: [
    { allergen: { $in: ["Penicillin", "Aspirin"] }, medication: "Amoxicillin" },
    { allergen: { $in: ["Penicillin", "Aspirin"] }, medication: "Ibuprofen" },
  ],
});
```

### Get Audit Trail (Compliance)

```javascript
db.auditlogs
  .find({
    "target.patientID": "MRN123",
    timestamp: { $gte: ISODate("2024-01-01"), $lte: ISODate("2024-12-31") },
  })
  .sort({ timestamp: -1 });
```

---

## Indexes for Performance

Critical indexes created automatically:

```javascript
transfers:
  - patient.patientID (search by patient)
  - sharing.shareToken (QR scanning)
  - transfer.transferID (unique identifier)
  - transfer.status (filter by status)
  - sendingFacility.timestamp (sort by date)

patients:
  - patientID (primary lookup)
  - transferHistory.transferID (related transfers)

users:
  - userID (user lookup)
  - email (authentication)
  - hospital.hospitalID (filter by facility)

interactionDatabase:
  - allergen, medication (unique compound)

auditLogs:
  - timestamp (recent activity)
  - actor.userID (who did what)
  - target.patientID (what patient)
```

---

## Environment Variables

| Variable      | Description               | Example                                              |
| ------------- | ------------------------- | ---------------------------------------------------- |
| `PORT`        | Server port               | `5000`                                               |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/medico` |
| `NODE_ENV`    | Environment               | `development` \| `production`                        |
| `JWT_SECRET`  | Secret for JWT tokens     | `your_secret_key`                                    |

---

## HIPAA Compliance Checklist

- [ ] Encrypt patient data at rest (MongoDB field-level encryption)
- [ ] Encrypt data in transit (HTTPS/TLS)
- [ ] Access control (RBAC - role-based permissions)
- [ ] Audit logging (AuditLog collection tracks all access)
- [ ] Data integrity (edit history in Transfer model)
- [ ] Secure deletion (soft delete with timestamp)
- [ ] Session management (JWT with expiry)
- [ ] No hardcoded credentials (use .env files)
- [ ] Regular backups (MongoDB Atlas automatic backups)
- [ ] Incident response plan (documented procedures)

---

## Folder Structure for API Implementation

**To implement the full API, you'll need:**

1. **Controllers** (business logic)

   ```
   controllers/
   ├── transferController.js
   ├── patientController.js
   ├── userController.js
   ├── interactionController.js
   └── auditController.js
   ```

2. **Routes** (API endpoints)

   ```
   routes/
   ├── transfers.js
   ├── patients.js
   ├── users.js
   ├── interactions.js
   └── audit.js
   ```

3. **Middleware** (auth, validation)
   ```
   middleware/
   ├── auth.js (JWT verification)
   ├── authorize.js (RBAC)
   ├── validate.js (input validation)
   ├── errorHandler.js
   └── logger.js (audit logging)
   ```

---

## Getting Started for Your Teammate

If your teammate is working on backend:

```powershell
# 1. Clone repository
git clone <your-repo-url>

# 2. Navigate to server
cd server

# 3. Install dependencies
npm install

# 4. Create .env from template
cp .env.example .env

# 5. Add MongoDB connection string to .env
# (Get from https://www.mongodb.com/cloud/atlas)

# 6. Start development server
npm run dev

# 7. Test health check
curl http://localhost:5000/health
```

---

## Next Steps

1. ✅ **Schema designed** (in schema.md)
2. ✅ **Models created** (in models/)
3. ⬜ **Implement API controllers** (TODO)
4. ⬜ **Implement routes** (TODO)
5. ⬜ **Authentication middleware** (TODO)
6. ⬜ **Input validation** (TODO)
7. ⬜ **Error handling** (TODO)
8. ⬜ **Testing** (TODO)
9. ⬜ **Deployment** (Heroku/Railway)

---

## Resources

- **MongoDB Docs**: https://docs.mongodb.com
- **Mongoose Docs**: https://mongoosejs.com
- **Express Docs**: https://expressjs.com
- **HIPAA Compliance**: https://www.hhs.gov/hipaa
- **JWT Auth**: https://jwt.io

---

## Questions?

Refer to [schema.md](schema.md) for complete schema documentation with all field details, validation rules, and design decisions.
