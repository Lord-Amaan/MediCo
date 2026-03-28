# MediCo - Complete UI Implementation Guide

## 📁 Project Structure

```
MediCo/
├── App.js                          # Main entry point with navigate logic
├── package.json
├── app.json
├── index.js
├── assets/
└── src/
    ├── screens/                    # Screen components for each step
    │   ├── index.js               # Exports all screens
    │   ├── HomeScreen.js          # Initial home screen
    │   ├── PatientDetailsScreen.js
    │   ├── CriticalInfoScreen.js
    │   ├── HospitalSelectionScreen.js  (Hospital filtering + selection)
    │   ├── ConfirmationScreen.js
    │   └── QRDisplayScreen.js
    │
    ├── components/                 # Reusable UI components
    │   ├── index.js               # Exports all components
    │   ├── FormInput.js           # Text input component
    │   ├── Button.js              # Button component
    │   ├── Card.js                # Card container
    │   ├── FilterTabs.js          # Horizontal filter tabs
    │   └── HospitalListItem.js    # Hospital selection item
    │
    ├── context/                    # State management
    │   └── TransferContext.js     # Global transfer form state (Redux-like)
    │
    ├── utils/                      # Utility functions
    │   ├── index.js               # Exports all utilities
    │   ├── api.js                 # API client & endpoints
    │   ├── qrGenerator.js         # QR code generation
    │   └── helpers.js             # Validation & formatting helpers
    │
    └── constants/                  # App constants
        ├── index.js               # Exports all constants
        ├── colors.js              # Color palette
        └── styles.js              # Typography, spacing, shadows
```

---

## 🎯 How It Works

### 1. **Flow Navigation**

- User starts at **Home**
- Clicks "CREATE TRANSFER" → **PatientDetails**
- Fills info → **CriticalInfo**
- Selects hospital → **HospitalSelection** ← MOST IMPORTANT
- Reviews everything → **Confirmation**
- Generates QR → **QRDisplay**
- Done! Back to Home

### 2. **State Management (Context API)**

- All form data stored in `TransferContext`
- No prop drilling - access state anywhere with `useTransfer()`
- Persists across screens
- Can reset entire form

### 3. **Hospital Selection Screen**

```
┌─────────────────────────────────┐
│ Hospitals                       │
├─────────────────────────────────┤
│ [Search box]                    │
│                                 │
│ Filter tabs:                    │
│ [PHC] [CHC] [District] [Tertiary]
│                                 │
│ Results:                        │
│ ○ District Hospital (60 km)     │
│ ○ Medical College (75 km)       │
│                                 │
│ Features:                       │
│ - Search by name                │
│ - Filter by hospital type       │
│ - Shows distance & contact      │
│ - Shows departments             │
│ - Radio button selection        │
└─────────────────────────────────┘
```

---

## 🔧 Component Details

### **FormInput** (Reusable)

```javascript
import { FormInput } from "../components";

<FormInput
  label="Patient Name"
  placeholder="Enter name"
  value={value}
  onChangeText={setValue}
  error={error}
  required
  multiline
/>;
```

### **Button** (Reusable)

```javascript
import { Button } from '../components';

<Button
  title="Next Step"
  onPress={handleNext}
  variant="primary" | "secondary" | "danger" | "ghost"
  size="sm" | "md" | "lg"
  loading={isLoading}
/>
```

### **Card** (Reusable)

```javascript
import { Card } from '../components';

<Card shadow="small" | "medium" | "large" | "none">
  <Text>Content inside card</Text>
</Card>
```

### **FilterTabs** (Reusable)

```javascript
import { FilterTabs } from "../components";

<FilterTabs
  tabs={[
    { id: "PHC", label: "PHC" },
    { id: "CHC", label: "CHC" },
    { id: "District", label: "District" },
  ]}
  selectedTab={selectedType}
  onTabChange={setSelectedType}
/>;
```

### **HospitalListItem** (Used in HospitalSelectionScreen)

```javascript
import { HospitalListItem } from "../components";

<HospitalListItem
  hospital={hospital}
  onSelect={handleSelect}
  isSelected={hospital.id === selectedId}
/>;
```

---

## 🌍 Using State with Context

```javascript
import { useTransfer } from "../context/TransferContext";

// Inside any component:
const {
  state, // Access current form data
  setPatientName, // Update functions
  setReceivingFacility,
  addAllergy,
  resetForm,
} = useTransfer();

// Access data
console.log(state.patientName);
console.log(state.receivingFacility);
console.log(state.allergies);

// Update data
setPatientName("Rajesh Kumar");
addAllergy("Penicillin");
```

---

## 🔌 API Integration

### **Replace Dummy Data with Real API**

In `HospitalSelectionScreen.js`, replace:

```javascript
// ❌ OLD: Using dummy data
const DUMMY_HOSPITALS = [...];
setHospitals(DUMMY_HOSPITALS);

// ✅ NEW: Use real API
import { hospitalApi } from '../utils';

const fetchHospitals = async () => {
  try {
    const response = await hospitalApi.getHospitals();
    setHospitals(response);
  } catch (err) {
    console.error(err);
  }
};
```

### **API Endpoints Needed**

```javascript
// GET /api/hospitals?type=District&search=Medical
// Returns: Hospital[]

// POST /api/transfers
// Sends: { patient, critical, receivingFacility, ... }
// Returns: { transferID, qrCode, shareLink }

// GET /auth/me
// Returns: Current logged-in user
```

---

## 🚀 How to Run

```bash
# 1. Install dependencies
npm install

# 2. Update your backend URL in utils/api.js
# Edit API_BASE_URL = 'your-actual-backend'

# 3. Start Expo
npx expo start

# 4. Run on device or simulator
# Press 'a' for Android or 'i' for iOS
```

---

## 📝 Key Features Implemented

✅ **5-Screen Flow** (Patient → Critical → Hospital → Confirm → QR)
✅ **Hospital Filtering** (By type + search)
✅ **Form Validation** (Age, name, required fields)
✅ **State Persistence** (Context API)
✅ **Reusable Components** (FormInput, Button, Card, etc.)
✅ **Professional Styling** (Colors, typography, shadows)
✅ **Error Handling** (Validation messages)
✅ **Loading States** (Activity indicators)
✅ **QR Generation** (Ready for backend integration)
✅ **Modular Architecture** (Easy to extend)

---

## 🎨 Customization

### Change Primary Color

Edit `src/constants/colors.js`:

```javascript
export const COLORS = {
  primary: "#2196F3", // Change this
  // ...
};
```

### Adjust Spacing

Edit `src/constants/styles.js`:

```javascript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12, // Adjust
  lg: 16,
  xl: 24,
  xxl: 32,
};
```

### Add New Component

1. Create file in `src/components/MyComponent.js`
2. Export in `src/components/index.js`
3. Use anywhere: `import { MyComponent } from '../components'`

---

## ❓ Common Issues

### "Cannot find module 'src/screens'"

**Solution:** Make sure all files are in `src/screens/` folder

### Hospital list is empty

**Solution:** Update the dummy data or connect to backend API

### Form data not persisting

**Solution:** Make sure component is wrapped in `<TransferProvider>`

### Styling not working

**Solution:** Check that constants are imported correctly

---

## 📚 Next Steps

1. **Backend Integration**: Connect API endpoints
2. **Authentication**: Add login screen with JWT
3. **QR Code Scanning**: Add camera for receiving side
4. **Dark Mode**: Add theme switching
5. **Offline Sync**: Save transfers locally, sync when online
6. **Testing**: Add unit tests for validation functions

---

## 📞 API Implementation Example

Once backend is ready:

### Create Transfer

```javascript
// In QRDisplayScreen.js
const { transferApi } = require("../utils");

const createTransfer = async () => {
  const transferData = encodeTransferData(state);
  const response = await transferApi.createTransfer(transferData);

  setTransferID(response.transferID);
  setQRCode(response.qrCode);
  setShareLink(response.shareLink);
};
```

---

**Build status**: ✅ Complete UI structure ready for backend integration!
