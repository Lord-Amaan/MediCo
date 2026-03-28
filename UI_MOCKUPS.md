# Complete UI Flow for Transfer Creation

## Complete Journey from Home to QR

---

## **SCREEN 0: Home Screen (Starting Point)**

```
┌────────────────────────────────┐
│      MEDICO APP                │
├────────────────────────────────┤
│                                │
│  👋 Hi Priya!                  │
│                                │
│  Hospital: Rural PHC ✓         │
│  Role: Nurse                   │
│  Status: Ready to work         │
│                                │
├────────────────────────────────┤
│                                │
│  [📋 CREATE TRANSFER]          │ ← User taps here
│                                │
│  [📥 SCAN QR CODE]             │
│                                │
│  [📊 VIEW HISTORY]             │
│                                │
├────────────────────────────────┤
│ ⓘ App Version 1.0              │
└────────────────────────────────┘
```

---

## **SCREEN 1: Patient Details Entry**

When user taps **[📋 CREATE TRANSFER]**:

```
┌────────────────────────────────┐
│ TRANSFER FORM (Screen 1/4)     │
├────────────────────────────────┤
│                                │
│ Sending Hospital:              │
│ ┌──────────────────────────┐   │
│ │ Rural PHC              │   │
│ └──────────────────────────┘   │
│ (Auto-filled, can't change)    │
│                                │
│ Patient Name *                 │
│ ┌──────────────────────────┐   │
│ │ [Type name...]         │   │
│ └──────────────────────────┘   │
│                                │
│ Patient ID / MRN *             │
│ ┌──────────────────────────┐   │
│ │ [Type ID or scan icon]  │   │
│ └──────────────────────────┘   │
│ 📷 [Tap to scan card]          │
│                                │
│ Age *                          │
│ ┌──────────────────────────┐   │
│ │ [Type age...]          │   │
│ └──────────────────────────┘   │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘

⏱️ ~30 seconds to fill
```

---

## **SCREEN 2: Critical Information**

After user taps [NEXT →]:

```
┌────────────────────────────────┐
│ CRITICAL INFO (Screen 2/4)     │
├────────────────────────────────┤
│                                │
│ ⚠️ ALLERGIES *                 │
│ ┌──────────────────────────┐   │
│ │ [e.g., Penicillin]     │   │
│ │                         │   │
│ │ (Copy from patient file)│   │
│ └──────────────────────────┘   │
│                                │
│ 💊 MEDICATIONS *               │
│ ┌──────────────────────────┐   │
│ │ [e.g., Metformin 500mg] │   │
│ │                         │   │
│ │ (Copy from file)        │   │
│ └──────────────────────────┘   │
│                                │
│ 🚑 TRANSFER REASON *           │
│ ┌──────────────────────────┐   │
│ │ [e.g., Hypertensive...] │   │
│ │                         │   │
│ │ (Why transfer patient?) │   │
│ └──────────────────────────┘   │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘

⏱️ ~1 minute to fill
```

---

## **SCREEN 3: SELECT RECEIVING HOSPITAL** ← Most Important!

After user taps [NEXT →]:

### **OPTION A: Simple Dropdown (RECOMMENDED FOR MVP)**

```
┌────────────────────────────────┐
│ SELECT HOSPITAL (Screen 3/4)   │
├────────────────────────────────┤
│                                │
│ Where is patient going? *      │
│                                │
│ ┌──────────────────────────┐   │
│ │ Receiving Hospital:  ▼  │   │ ← Dropdown
│ └──────────────────────────┘   │
│                                │
│ [When tapped, shows options:] │
│                                │
│ ○ CHC Taluk Center            │
│   3 km away · Basic care       │
│                                │
│ ○ District Hospital ✓         │
│   60 km away · Full services   │
│                                │
│ ○ Tertiary Center             │
│   200 km away · Advanced care  │
│                                │
│ [After selection:]             │
│                                │
│ Selected: District Hospital    │
│ Distance: 60 km                │
│ ETA: ~80 minutes by ambulance │
│ Contact: 0891-2345678         │
│ On-duty doctor: Dr. Rajiv      │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘

⏱️ ~30 seconds
```

**PROS:**

- ✅ Simple, clear
- ✅ One tap to open, one tap to select
- ✅ Shows helpful info (distance, contact)
- ✅ Good for MVP

**CONS:**

- ❌ No guidance if unsure

---

### **OPTION B: With Smart Recommendation (Better)**

```
┌────────────────────────────────┐
│ SELECT HOSPITAL (Screen 3/4)   │
├────────────────────────────────┤
│                                │
│ 💡 RECOMMENDED:                │
│ ┌──────────────────────────┐   │
│ │ District Hospital      │   │ ← Highlighted
│ │ Why? Has cardiac ICU   │   │
│ │ Best for: Hypertensive │   │
│ │ 60 km · 80 min drive   │   │
│ │ ✓ Select this          │   │
│ └──────────────────────────┘   │
│                                │
│ OR CHOOSE MANUALLY:            │
│                                │
│ ┌──────────────────────────┐   │
│ │ Hospital:            ▼  │   │
│ └──────────────────────────┘   │
│                                │
│ Other options:                 │
│ ○ CHC Taluk (3 km)             │
│ ○ Tertiary (200 km)            │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘

⏱️ ~30 seconds
```

**PROS:**

- ✅ Guides user to right choice
- ✅ Shows why recommended
- ✅ Can still override

**CONS:**

- ❌ More complex to build
- ❌ Needs hospital capabilities data

---

### **OPTION C: Filter by Specialty (Advanced)**

```
┌────────────────────────────────┐
│ SELECT HOSPITAL (Screen 3/4)   │
├────────────────────────────────┤
│                                │
│ Filter by services needed:     │
│ ☐ Cardiac Care                 │
│ ☐ ICU                          │
│ ☐ Trauma Center                │
│ ☐ Pediatrics                   │
│                                │
│ [Based on selections:]         │
│ Matching hospitals:            │
│                                │
│ ○ District Hospital ✓          │
│   Has: Cardiac, ICU, Trauma    │
│   60 km                        │
│                                │
│ ○ Tertiary Center              │
│   Has: All services            │
│   200 km                       │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘

⏱️ ~1 minute
```

**PROS:**

- ✅ Very user-friendly
- ✅ Shows hospital capabilities

**CONS:**

- ❌ Complex to implement
- ❌ Too many options for MVP
- ❌ Overkill for simple use case

---

## **MY RECOMMENDATION: GO WITH OPTION A (Simple Dropdown)**

```
✅ BEST FOR MVP:

┌────────────────────────────────┐
│ SELECT HOSPITAL (Screen 3/4)   │
├────────────────────────────────┤
│                                │
│ Where is patient going? *      │
│                                │
│ Receiving Hospital:            │
│ ┌──────────────────────────┐   │
│ │ Select hospital        ▼│   │
│ └──────────────────────────┘   │
│                                │
│ ○ CHC Taluk (3 km)             │
│ ○ District Hospital (60 km) ✓  │
│ ○ Tertiary Center (200 km)     │
│                                │
│ Distance: 60 km                │
│ ETA: ~80 minutes               │
│ Contact: 0891-2345678         │
│                                │
├────────────────────────────────┤
│  [BACK]          [NEXT →]      │
└────────────────────────────────┘
```

---

## **SCREEN 4: Confirmation**

After user taps [NEXT →]:

```
┌────────────────────────────────┐
│ REVIEW & CONFIRM (Screen 4/4)  │
├────────────────────────────────┤
│                                │
│ 📋 SENDING HOSPITAL            │
│ ┌──────────────────────────┐   │
│ │ From: Rural PHC         │   │
│ │ Doctor: Priya Sharma    │   │
│ │ Time: Now               │   │
│ └──────────────────────────┘   │
│                                │
│ 👤 PATIENT INFO                │
│ ┌──────────────────────────┐   │
│ │ Name: Rajesh Kumar      │   │
│ │ Age: 65, MRN: PHC...    │   │
│ │ Allergies: Aspirin ⚠️   │   │
│ │           (Severe)      │   │
│ │ Meds: Metoprolol        │   │
│ │ Reason: Hypertensive    │   │
│ └──────────────────────────┘   │
│                                │
│ 🏥 RECEIVING HOSPITAL          │
│ ┌──────────────────────────┐   │
│ │ To: District Hospital   │   │
│ │ Distance: 60 km         │   │
│ │ ETA: ~80 mins           │   │
│ │ Contact: 0891-2345678  │   │
│ └──────────────────────────┘   │
│                                │
│ Everything correct?            │
│                                │
├────────────────────────────────┤
│ [EDIT]   [GENERATE QR →]       │
└────────────────────────────────┘

⏱️ ~1 minute to review
```

---

## **SCREEN 5: QR Code Display**

After user taps [GENERATE QR →]:

```
┌────────────────────────────────┐
│ ✓ TRANSFER READY (Screen 5/4)  │
├────────────────────────────────┤
│                                │
│ 🎉 Transfer Created!           │
│                                │
│ ╔──────────────────────────┐   │
│ ║   QR CODE IMAGE          ║   │
│ ║  ┌──────────────────┐   ║   │
│ ║  │ ████ ██ ████    │   ║   │
│ ║  │ ██   ██ ██ ██   │   ║   │
│ ║  │ ████ ██ ████    │   ║   │
│ ║  └──────────────────┘   ║   │
│ ║  Scan to get all data   ║   │
│ ╚──────────────────────────┘   │
│                                │
│ FROM: Rural PHC                │
│ TO: District Hospital ✓        │
│                                │
│ Patient: Rajesh Kumar, 65      │
│ Allergies: Aspirin (SEVERE)    │
│ Meds: Metoprolol               │
│ Reason: Hypertensive crisis    │
│                                │
├────────────────────────────────┤
│                                │
│ [🖨️ PRINT]  [📱 SCREENSHOT]   │
│ [📋 COPY LINK]                 │
│ [✓ DONE]                       │
│                                │
└────────────────────────────────┘

⏱️ Instant

LINK: medico.app/t/abc123xyz (can be sent via SMS)
```

---

## **Complete Screen Sequence Map**

```
HOME SCREEN
    ↓
    [📋 CREATE TRANSFER]
    ↓
SCREEN 1: Patient Details
    ├─→ [BACK] (cancel)
    ├─→ [NEXT]
    └─→ ⏱️ 30 seconds

    ↓
SCREEN 2: Critical Info
    ├─→ [BACK] (previous)
    ├─→ [NEXT]
    └─→ ⏱️ 1 minute

    ↓
SCREEN 3: Hospital Selection ← KEY SCREEN
    ├─→ [BACK] (previous)
    ├─→ Dropdown to select hospital
    ├─→ [NEXT]
    └─→ ⏱️ 30 seconds

    ↓
SCREEN 4: Confirmation
    ├─→ [BACK] / [EDIT] (fix mistakes)
    ├─→ [GENERATE QR]
    └─→ ⏱️ 1 minute to review

    ↓
SCREEN 5: QR Display & Sharing
    ├─→ [PRINT] (for paper folder)
    ├─→ [COPY LINK] (send via SMS)
    ├─→ [DONE] (back to home)
    └─→ ⏱️ Instant

TOTAL TIME: ~3 minutes ✅
```

---

## **What Data Shows at Each Screen**

| Screen      | Auto-Filled  | User Enters             | Appears From         |
| ----------- | ------------ | ----------------------- | -------------------- |
| 1. Patient  | Hospital     | Name, ID, Age           | Manual entry         |
| 2. Critical | -            | Allergies, Meds, Reason | Manual copy          |
| 3. Hospital | -            | **Receiving Hospital**  | **Dropdown from DB** |
| 4. Confirm  | All of above | Nothing                 | Combined data        |
| 5. QR       | -            | -                       | Generated from data  |

---

## **Hospital Selection Dropdown Content**

When user clicks "Receiving Hospital" dropdown on Screen 3:

**Data comes from:** `Hospital` collection in MongoDB

```javascript
// Database shows:

Hospital 1:
{
  hospitalID: "HOSP_CHC_001",
  name: "CHC Taluk Center",
  type: "CHC",
  distance: 3,
  contact: "0891-3333333",
  departments: ["Emergency", "ICU"],
  capabilities: ["Basic Care"]
}

Hospital 2:
{
  hospitalID: "HOSP_DIST_001",
  name: "District Hospital",
  type: "District",
  distance: 60,
  contact: "0891-4444444",
  departments: ["Emergency", "ICU", "Cardiac", "Trauma"],
  capabilities: ["Full Services"]
}

Hospital 3:
{
  hospitalID: "HOSP_TERTIARY_001",
  name: "Tertiary Center",
  type: "Tertiary",
  distance: 200,
  contact: "0891-5555555",
  departments: ["All"],
  capabilities: ["Advanced Services"]
}

// App displays as:
○ CHC Taluk Center (3 km)
○ District Hospital (60 km)
○ Tertiary Center (200 km)
```

---

## **API Flow Behind the Scenes**

### **When app loads (Screen 3):**

```javascript
// Frontend calls:
GET /
  api /
  hospitals[
    // Backend returns:
    ({
      hospitalID: "HOSP_CHC_001",
      name: "CHC Taluk Center",
      distance: "3 km",
      contact: "0891-3333333",
    },
    {
      hospitalID: "HOSP_DIST_001",
      name: "District Hospital",
      distance: "60 km",
      contact: "0891-4444444",
    },
    {
      hospitalID: "HOSP_TERTIARY_001",
      name: "Tertiary Center",
      distance: "200 km",
      contact: "0891-5555555",
    })
  ];

// Frontend displays options in dropdown
```

### **When user taps [GENERATE QR]:**

```javascript
// Frontend sends:
POST /api/transfers
{
  patient: { name, age, patientID, allergies, meds },
  sendingFacility: { hospitalID: "HOSP_PHC_001" },
  receivingFacility: { hospitalID: "HOSP_DIST_001" }, ← USER SELECTED
  critical: { reason, allergies, medications },
  transfer: { transferReason, ... }
}

// Backend:
1. Creates Transfer document
2. Encodes data to QR
3. Generates share link
4. Returns QR + link to app

// Frontend displays QR code
```

---

## **Key Points for Hospital Selection Screen**

```
✅ MUST HAVE:
- Hospital name
- Distance
- Contact number
- Radio button / checkbox to select

✅ NICE TO HAVE:
- On-duty doctor name
- Specialties available
- Recommendation based on reason

❌ DON'T INCLUDE (adds complexity):
- Full department list
- Bed availability
- Complex filtering
```

---

## **Code Structure for React Native**

```javascript
// App.js structure:

export default function App() {
  const [screen, setScreen] = useState('home');
  const [formData, setFormData] = useState({...});
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Screens:
  const HomeScreen = () => { ... }
  const PatientDetailsScreen = () => { ... }
  const CriticalInfoScreen = () => { ... }
  const HospitalSelectionScreen = () => {
    // Dropdown with hospitals
    useEffect(() => {
      fetchHospitals(); // GET /api/hospitals
    }, []);

    return (
      <View>
        <Text>Where is patient going?</Text>
        <Picker
          selectedValue={selectedHospital}
          onValueChange={(value) => setSelectedHospital(value)}
        >
          {hospitals.map(h => (
            <Picker.Item label={h.name} value={h.hospitalID} />
          ))}
        </Picker>
      </View>
    );
  }
  const ConfirmationScreen = () => { ... }
  const QRDisplayScreen = () => { ... }

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'patient' && <PatientDetailsScreen />}
      {screen === 'critical' && <CriticalInfoScreen />}
      {screen === 'hospital' && <HospitalSelectionScreen />}
      {screen === 'confirm' && <ConfirmationScreen />}
      {screen === 'qr' && <QRDisplayScreen />}
    </>
  );
}
```

---

## **Final Answer: What to Show**

### **When user selects "Create Transfer":**

```
Show 5 sequential screens:
1. Patient Details (name, ID, age)
2. Critical Info (allergies, meds, reason)
3. Hospital Selection (dropdown with 3 options)
4. Confirmation (review everything)
5. QR Display (print/share)
```

### **On Hospital Selection Screen:**

```
┌────────────────────────────────┐
│ WHERE IS PATIENT GOING?        │
├────────────────────────────────┤
│                                │
│ Receiving Hospital: [Select ▼] │
│                                │
│ ○ CHC Talluk (3 km)            │
│ ○ District Hospital (60 km) ✓  │
│ ○ Tertiary Center (200 km)     │
│                                │
│ Contact: 0891-2345678         │
│                                │
│ [NEXT]                         │
└────────────────────────────────┘
```

### **Data Source:**

```
Hospital names & details come from:
→ GET /api/hospitals endpoint
→ Returns list from Hospital collection
→ App displays in dropdown
```

---

**Ready to build this? Should I:**

1. ✅ Create the React Native UI screens (all 5)?
2. ✅ Build backend `/api/hospitals` endpoint?
3. ✅ Create `/api/transfers` POST endpoint with QR generation?
4. ✅ All of the above?

Which should I start with? 🚀
