# NMC Verification API Documentation

## Overview
The NMC (National Medical Council) Verification API allows doctors to verify their credentials against a dummy NMC registry database. This adds credibility and trust to the MediCo platform.

## Features
- ✅ Verify doctor by Registration Number + Name
- ✅ Get verification status
- ✅ Case-insensitive name matching
- ✅ Stores verification details (qualifications, university, year of passing)

## API Endpoints

### 1. Verify Doctor Credentials
**Endpoint:** `POST /api/nmc/verify`

**Description:** Verify a doctor's credentials using their Registration Number and Name

**Request Body:**
```json
{
  "regNo": "56117",
  "name": "BASANTANI RAJKUMAR BAKSHOMAL"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "message": "Doctor credentials verified successfully",
  "data": {
    "regNo": "56117",
    "name": "BASANTANI RAJKUMAR BAKSHOMAL",
    "qualifications": ["Doctor in General Medicine"],
    "yearOfPassing": "2026",
    "registrationDate": "1986-02-20"
  }
}
```

**Not Found Response (200):**
```json
{
  "success": true,
  "verified": false,
  "message": "Doctor credentials not found in NMC registry. Please verify Reg No and Name."
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Registration Number and Name are required"
}
```

### 2. Get Verification Status by Registration Number
**Endpoint:** `GET /api/nmc/verify/:regNo`

**Description:** Get verification status and details for a doctor using only Registration Number

**Parameters:**
- `regNo` (path parameter): Doctor's Registration Number (e.g., "56117")

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "data": {
    "_id": "...",
    "regNo": "56117",
    "name": "BASANTANI RAJKUMAR BAKSHOMAL",
    "qualifications": ["Doctor in General Medicine"],
    "university": "NEW VISION UNIVERSITY, GEORGIA",
    "yearOfPassing": "2026",
    "registrationDate": "1986-02-20",
    "sex": "M",
    "address": "D 3, DATTA KRUPA CHS LIMITED...",
    "state": "MAHARASHTRA"
  }
}
```

**Not Found Response (200):**
```json
{
  "success": true,
  "verified": false,
  "data": null
}
```

## Example Usage in Frontend (React Native)

### Using axios:
```javascript
// Verify doctor during registration
const verifyDoctor = async (regNo, name) => {
  try {
    const response = await axios.post('http://your-api/api/nmc/verify', {
      regNo: regNo.trim(),
      name: name.trim(),
    });

    if (response.data.verified) {
      console.log('✓ Doctor verified!', response.data.data);
      // Store isNMCVerified = true in user profile
      return { verified: true, data: response.data.data };
    } else {
      console.log('✗ Credentials not found');
      return { verified: false };
    }
  } catch (error) {
    console.error('Verification failed:', error);
    return { verified: false, error: error.message };
  }
};
```

## Setup Instructions

### 1. Seed the NMC Database
```bash
cd server
npm run seed:nmc
```

This will insert 10 dummy doctor records into the database.

### 2. Available Test Credentials
| Reg No | Name | Qualification |
|--------|------|---------------|
| 56117 | BASANTANI RAJKUMAR BAKSHOMAL | Doctor in General Medicine |
| 20260100899 | BRIJKESH SURENDRAKUMAR DHARKAR | M.B.B.S. |
| 61850 | GOSAVI VIKAS RATAN | M.B.B.S. |
| 86680 | GULIANI SAMEER KISHANSAROOP | M.B.B.S., Dip. Child Health |
| 82676 | GURRAM CHUKK MAHIPAL REDDY | M.B.B.S. |
| 90851 | KADAKIA HEMAL HARESHBHAI | M.B.B.S. |
| 61543 | KADAM PANDURANG | M.B.B.S. |
| 92845 | KHAN SYED AKRAM AHMED | M.B.B.S., MD General Medicine |
| 78932 | SHARMA RAJESH KUMAR | M.B.B.S., DNB |
| 85643 | PATEL NEHA VIRAJ | M.B.B.S., MS Surgery |

### 3. Integration with User Model
Users now have these new fields:
```javascript
{
  registrationNumber: "56117",        // Doctor's NMC Reg No
  isNMCVerified: true,                // Verification status
  nmcVerificationDate: "2026-03-29"   // When verified
}
```

## How It Works

1. **Doctor provides Reg No + Name** during registration/login
2. **System searches NMC registry** for matching combination
3. **Verification badge ✓** shown if found
4. **Transfers are tagged with verified status** - adds credibility
5. **Can be upgraded** to real NMC API in future

## Security Notes
- Currently uses dummy data for development
- Can be connected to actual NMC API (https://nmc.org.in/) in production
- Verification is read-only (no API key required for now)
- Add authentication middleware for production use

## Future Enhancements
- Connect to real NMC API
- Add verification renewal dates
- Display verification badges in transfer records
- Send verification emails
- Add license expiry tracking
