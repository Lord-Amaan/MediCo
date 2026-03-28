# MediCo Backend API Documentation

Base URL: `http://localhost:5000/api`

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. AUTH ENDPOINTS

### POST /auth/login

**Public** - Authenticate user and get JWT token

**Request:**

```json
{
  "email": "doctor@hospital.com",
  "password": "password123"
}
```

**Response:** (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userID": "DOC_001",
    "name": "Dr. Priya Sharma",
    "email": "doctor@hospital.com",
    "role": "Doctor",
    "hospital": {
      "hospitalID": "HOSP_001",
      "hospitalName": "Rural PHC"
    },
    "permissions": ["Create_Transfer", "Review_Transfer"]
  }
}
```

---

### GET /auth/me

**Protected** - Get current user info

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** (200 OK)

```json
{
  "userID": "DOC_001",
  "name": "Dr. Priya Sharma",
  "email": "doctor@hospital.com",
  "role": "Doctor",
  "hospital": { ... },
  "lastLogin": "2026-03-28T10:30:00Z"
}
```

---

### POST /auth/logout

**Protected** - Logout (clears frontend token)

**Response:** (200 OK)

```json
{ "message": "Logged out successfully" }
```

---

## 2. HOSPITAL ENDPOINTS

### GET /hospitals

**Public** - List hospitals with optional filtering

**Query Params:**

- `type` - Filter by type (PHC, CHC, District, Tertiary)
- `search` - Search by name or city
- `state` - Filter by state

**Example:**

```
GET /hospitals?type=District&search=City&state=Maharashtra
```

**Response:** (200 OK)

```json
{
  "count": 5,
  "hospitals": [
    {
      "hospitalID": "HOSP_DIST_001",
      "name": "District Medical Center",
      "type": "District",
      "city": "Pune",
      "state": "Maharashtra",
      "contact": {
        "phone": "+91-9876543210",
        "email": "admin@dmc.com",
        "emergencyContact": "+91-9876543211"
      },
      "departments": [
        {
          "name": "ICU",
          "contactPerson": "Dr. Sharma",
          "phone": "+91-9876543210"
        }
      ],
      "capabilities": ["ICU", "Cardiac Care", "Ventilator"]
    }
  ]
}
```

---

### GET /hospitals/types

**Public** - Get hospital type counts

**Response:** (200 OK)

```json
{
  "PHC": 45,
  "CHC": 20,
  "District": 8,
  "Tertiary": 3
}
```

---

### GET /hospitals/type/:type

**Public** - Get all hospitals of specific type

**Example:**

```
GET /hospitals/type/District
```

**Response:** (200 OK)

```json
{
  "type": "District",
  "count": 8,
  "hospitals": [...]
}
```

---

### GET /hospitals/:id

**Public** - Get single hospital details

**Response:** (200 OK)

```json
{
  "hospitalID": "HOSP_001",
  "name": "District Medical Center",
  ...
}
```

---

## 3. TRANSFER ENDPOINTS

### POST /transfers

**Protected** - Create new transfer (requires `Create_Transfer` permission)

**Request:**

```json
{
  "patient": {
    "name": "John Doe",
    "age": 45,
    "patientID": "PAT_001",
    "gender": "Male",
    "phone": "+91-9876543210"
  },
  "critical": {
    "allergies": [
      {
        "name": "Penicillin",
        "severity": "Severe",
        "reaction": "Anaphylaxis"
      }
    ],
    "activeMedications": [
      {
        "name": "Aspirin",
        "dose": "100mg",
        "route": "Oral",
        "frequency": "OD",
        "indication": "Heart disease",
        "mustNotStop": true
      }
    ],
    "transferReason": "Post-MI care needed",
    "primaryDiagnosis": "Acute Myocardial Infarction"
  },
  "vitals": {
    "bloodPressure": "140/90",
    "heartRate": 85,
    "respiratoryRate": 18,
    "temperature": 37.2,
    "oxygenSaturation": 98
  },
  "clinical": {
    "clinicalSummary": "45-year-old male admitted with chest pain and ST elevation on ECG. Thrombolysis given. Patient stable."
  },
  "receivingFacility": {
    "hospitalID": "HOSP_DIST_001",
    "hospitalName": "District Medical Center"
  }
}
```

**Response:** (201 Created)

```json
{
  "message": "Transfer created successfully",
  "transfer": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "transferID": "TXF_1711606400000_a1b2c3d4e",
    "shareToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "patient": { ... },
    "critical": { ... },
    "sharing": {
      "qrCodeData": "{...json...}",
      "shareToken": "a1b2c3d4e5f6..."
    }
  }
}
```

---

### GET /transfers

**Protected** - List all transfers for current hospital

**Query Params:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (Pending, Transferred, Received, Acknowledged)
- `patientID` - Filter by patient ID

**Response:** (200 OK)

```json
{
  "page": 1,
  "limit": 20,
  "total": 45,
  "transfers": [
    {
      "transfer": {
        "transferID": "TXF_001",
        "status": "Pending"
      },
      "patient": { "name": "John Doe", ... },
      "critical": { ... },
      "sendingFacility": { ... },
      "receivingFacility": { ... }
    }
  ]
}
```

---

### GET /transfers/:id

**Protected** - Get single transfer by ID

**Response:** (200 OK)

```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "patient": { ... },
  "critical": { ... },
  "transfer": { ... },
  "acknowledgement": { ... }
}
```

---

### GET /transfers/share/:shareToken

**Public** - Get transfer by QR share token (for receiving side, no auth)

**Response:** (200 OK)

```json
{ Full transfer record }
```

---

### GET /transfers/patient/:patientID

**Protected** - Get patient transfer history (timeline)

**Response:** (200 OK)

```json
{
  "patientID": "PAT_001",
  "count": 3,
  "transfers": [
    {
      "transfer": { ... },
      "patient": { ... },
      "sendingFacility": { ... },
      "receivingFacility": { ... },
      "acknowledgement": { ... }
    }
  ]
}
```

---

### POST /transfers/:id/acknowledge

**Protected** - Receiving team marks transfer as received (requires `Review_Transfer` permission)

**Request:**

```json
{
  "arrivalNotes": "Patient arrived stable, vitals normal. Started on regular monitoring.",
  "discrepancies": [
    {
      "field": "medication",
      "issue": "Patient says Metformin was stopped 2 weeks ago",
      "action": "Clarified with patient, corrected in records"
    }
  ],
  "flaggedIssues": ["Hypertension: BP high on arrival"],
  "immediateActions": ["Repeat BP monitoring", "Adjust medications"]
}
```

**Response:** (200 OK)

```json
{
  "message": "Transfer acknowledged successfully",
  "transfer": {
    "transfer": { "status": "Received" },
    "acknowledgement": {
      "reviewed": true,
      "reviewedBy": {
        "name": "Dr. Sharma",
        "role": "Doctor",
        "timestamp": "2026-03-28T12:00:00Z"
      },
      "arrivalNotes": "...",
      "discrepancies": [...]
    }
  }
}
```

---

### PUT /transfers/:id/transferred

**Protected** - Mark transfer as transferred (ambulance left)

**Response:** (200 OK)

```json
{
  "message": "Transfer marked as transferred",
  "transfer": { ... }
}
```

---

### PUT /transfers/:id

**Protected** - Update transfer (vitals, clinical notes, etc.)

**Request:**

```json
{
  "vitals": {
    "bloodPressure": "145/92",
    "heartRate": 88
  },
  "clinical": {
    "clinicalSummary": "Updated clinical notes..."
  }
}
```

**Response:** (200 OK)

```json
{
  "message": "Transfer updated successfully",
  "transfer": { ... }
}
```

---

### DELETE /transfers/:id

**Protected** - Delete transfer (requires `Admin` permission)

**Response:** (200 OK)

```json
{ "message": "Transfer deleted successfully" }
```

---

## 4. USER ENDPOINTS

### GET /users/me

**Protected** - Get current user profile

**Response:** (200 OK)

```json
{
  "userID": "DOC_001",
  "name": "Dr. Priya Sharma",
  "email": "doctor@hospital.com",
  "role": "Doctor",
  "hospital": { ... },
  "qualifications": ["MBBS", "MD"],
  "permissions": ["Create_Transfer", "Review_Transfer"]
}
```

---

### PUT /users/me

**Protected** - Update current user profile

**Request:**

```json
{
  "name": "Dr. Priya Sharma",
  "phone": "+91-9876543210",
  "qualifications": ["MBBS", "MD", "DNB"]
}
```

**Response:** (200 OK)

```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### GET /users

**Protected** - List all users (requires `Admin` permission)

**Query Params:**

- `role` - Filter by role (Doctor, Nurse, Admin)
- `hospitalID` - Filter by hospital
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:** (200 OK)

```json
{
  "page": 1,
  "limit": 20,
  "total": 150,
  "users": [
    {
      "userID": "DOC_001",
      "name": "Dr. Priya Sharma",
      "email": "doctor@hospital.com",
      "role": "Doctor",
      "hospital": { ... },
      "lastLogin": "2026-03-28T10:30:00Z"
    }
  ]
}
```

---

### GET /users/hospital/:hospitalID

**Protected** - Get all users in a hospital

**Query Params:**

- `role` - Filter by role (optional)

**Response:** (200 OK)

```json
{
  "hospitalID": "HOSP_001",
  "count": 25,
  "users": [ ... ]
}
```

---

## Error Responses

### 400 Bad Request

```json
{ "error": "Required field missing" }
```

### 401 Unauthorized

```json
{ "error": "Invalid or expired token" }
```

### 403 Forbidden

```json
{ "error": "Permission denied" }
```

### 404 Not Found

```json
{ "error": "Resource not found" }
```

### 500 Server Error

```json
{ "error": "Internal server error message" }
```

---

## Authentication Flow

1. **Login:**

   ```
   POST /auth/login
   → Get JWT token
   ```

2. **Use Token:**

   ```
   GET /transfers
   Headers: Authorization: Bearer <token>
   ```

3. **Token Expiry:**
   - Tokens valid for 7 days
   - Re-login to get new token

---

## Example Frontend Usage

### Frontend API Client

```javascript
// Set authorization header
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Create transfer
const response = await api.post("/transfers", transferData);

// Get hospitals (no auth needed)
const hospitals = await api.get("/hospitals?type=District");

// Acknowledge transfer (receiving side)
await api.post(`/transfers/${id}/acknowledge`, acknowledgementData);
```

---

## Testing Endpoints

Use Postman or cURL:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"password123"}'

# Get hospitals
curl http://localhost:5000/api/hospitals?type=District

# Create transfer (with token)
curl -X POST http://localhost:5000/api/transfers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... transfer data ... }'
```

---

## Rate Limiting & Security

- Rate limit: 100 requests/minute per IP
- CORS enabled for frontend domain
- All requests logged in AuditLog
- Password hashed with bcrypt
- JWT tokens expire after 7 days

---
