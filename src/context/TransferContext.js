import React, { createContext, useContext, useReducer } from 'react';

const TransferContext = createContext();

const initialState = {
  // Patient details (Screen 1)
  patientName: '',
  patientID: '',
  patientAge: '',
  patientGender: '',
  patientDateOfBirth: '',
  patientPhone: '',
  patientAddress: '',

  // Critical info (Screen 2)
  allergies: [],
  medications: [],
  transferReason: '',
  primaryDiagnosis: '',

  // Clinical details (Screen 3)
  vitals: {
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    bloodGlucose: '',
  },
  pendingInvestigations: '',
  clinicalSummary: '',
  pastMedicalHistory: '',
  surgicalHistory: '',
  allergyDetailsText: '',
  medicationDetailsText: '',
  transferMode: '',
  transferClinicalReason: '',
  medicalEscort: false,
  escortName: '',
  escortQualification: '',

  // Hospital selection (Screen 4)
  sendingFacility: {
    hospitalID: 'HOSP_PHC_001', // Default - would come from logged-in user
    name: 'Rural PHC',
  },
  receivingFacility: null,
  hospitalTypeFilter: 'District', // Default filter

  // Additional data
  sendingDoctor: {
    userID: 'DOC_123',
    name: 'Dr. Priya Sharma',
  },

  // Generated data
  transferID: null,
  qrCode: null,
  shareLink: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    // Patient details actions
    case 'SET_PATIENT_NAME':
      return { ...state, patientName: action.payload };
    case 'SET_PATIENT_ID':
      return { ...state, patientID: action.payload };
    case 'SET_PATIENT_AGE':
      return { ...state, patientAge: action.payload };
    case 'SET_PATIENT_GENDER':
      return { ...state, patientGender: action.payload };
    case 'SET_PATIENT_DOB':
      return { ...state, patientDateOfBirth: action.payload };
    case 'SET_PATIENT_PHONE':
      return { ...state, patientPhone: action.payload };
    case 'SET_PATIENT_ADDRESS':
      return { ...state, patientAddress: action.payload };

    // Critical info actions
    case 'SET_ALLERGIES':
      return { ...state, allergies: action.payload };
    case 'ADD_ALLERGY':
      return {
        ...state,
        allergies: [...state.allergies, action.payload],
      };
    case 'REMOVE_ALLERGY':
      return {
        ...state,
        allergies: state.allergies.filter((_, i) => i !== action.payload),
      };

    case 'SET_MEDICATIONS':
      return { ...state, medications: action.payload };
    case 'ADD_MEDICATION':
      return {
        ...state,
        medications: [...state.medications, action.payload],
      };
    case 'REMOVE_MEDICATION':
      return {
        ...state,
        medications: state.medications.filter((_, i) => i !== action.payload),
      };

    case 'SET_TRANSFER_REASON':
      return { ...state, transferReason: action.payload };
    case 'SET_PRIMARY_DIAGNOSIS':
      return { ...state, primaryDiagnosis: action.payload };
    case 'SET_VITAL':
      return {
        ...state,
        vitals: {
          ...state.vitals,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'SET_PENDING_INVESTIGATIONS':
      return { ...state, pendingInvestigations: action.payload };
    case 'SET_CLINICAL_SUMMARY':
      return { ...state, clinicalSummary: action.payload };
    case 'SET_PAST_MEDICAL_HISTORY':
      return { ...state, pastMedicalHistory: action.payload };
    case 'SET_SURGICAL_HISTORY':
      return { ...state, surgicalHistory: action.payload };
    case 'SET_ALLERGY_DETAILS_TEXT':
      return { ...state, allergyDetailsText: action.payload };
    case 'SET_MEDICATION_DETAILS_TEXT':
      return { ...state, medicationDetailsText: action.payload };
    case 'SET_TRANSFER_MODE':
      return { ...state, transferMode: action.payload };
    case 'SET_TRANSFER_CLINICAL_REASON':
      return { ...state, transferClinicalReason: action.payload };
    case 'SET_MEDICAL_ESCORT':
      return { ...state, medicalEscort: action.payload };
    case 'SET_ESCORT_NAME':
      return { ...state, escortName: action.payload };
    case 'SET_ESCORT_QUALIFICATION':
      return { ...state, escortQualification: action.payload };

    // Hospital selection actions
    case 'SET_HOSPITAL_TYPE_FILTER':
      return { ...state, hospitalTypeFilter: action.payload };
    case 'SET_RECEIVING_FACILITY':
      return { ...state, receivingFacility: action.payload };

    // Generated data actions
    case 'SET_TRANSFER_ID':
      return { ...state, transferID: action.payload };
    case 'SET_QR_CODE':
      return { ...state, qrCode: action.payload };
    case 'SET_SHARE_LINK':
      return { ...state, shareLink: action.payload };

    // Reset entire form
    case 'RESET_FORM':
      return initialState;

    // Load complete transfer data
    case 'LOAD_TRANSFER_DATA':
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

export const TransferProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = {
    state,
    dispatch,

    // Patient details
    setPatientName: (name) => dispatch({ type: 'SET_PATIENT_NAME', payload: name }),
    setPatientID: (id) => dispatch({ type: 'SET_PATIENT_ID', payload: id }),
    setPatientAge: (age) => dispatch({ type: 'SET_PATIENT_AGE', payload: age }),
    setPatientGender: (gender) => dispatch({ type: 'SET_PATIENT_GENDER', payload: gender }),
    setPatientDateOfBirth: (dob) => dispatch({ type: 'SET_PATIENT_DOB', payload: dob }),
    setPatientPhone: (phone) => dispatch({ type: 'SET_PATIENT_PHONE', payload: phone }),
    setPatientAddress: (address) => dispatch({ type: 'SET_PATIENT_ADDRESS', payload: address }),

    // Critical info
    setAllergies: (allergies) => dispatch({ type: 'SET_ALLERGIES', payload: allergies }),
    addAllergy: (allergy) => dispatch({ type: 'ADD_ALLERGY', payload: allergy }),
    removeAllergy: (index) => dispatch({ type: 'REMOVE_ALLERGY', payload: index }),

    setMedications: (meds) => dispatch({ type: 'SET_MEDICATIONS', payload: meds }),
    addMedication: (med) => dispatch({ type: 'ADD_MEDICATION', payload: med }),
    removeMedication: (index) => dispatch({ type: 'REMOVE_MEDICATION', payload: index }),

    setTransferReason: (reason) => dispatch({ type: 'SET_TRANSFER_REASON', payload: reason }),
    setPrimaryDiagnosis: (diagnosis) => dispatch({ type: 'SET_PRIMARY_DIAGNOSIS', payload: diagnosis }),
    setVital: (key, value) => dispatch({ type: 'SET_VITAL', payload: { key, value } }),
    setPendingInvestigations: (value) => dispatch({ type: 'SET_PENDING_INVESTIGATIONS', payload: value }),
    setClinicalSummary: (value) => dispatch({ type: 'SET_CLINICAL_SUMMARY', payload: value }),
    setPastMedicalHistory: (value) => dispatch({ type: 'SET_PAST_MEDICAL_HISTORY', payload: value }),
    setSurgicalHistory: (value) => dispatch({ type: 'SET_SURGICAL_HISTORY', payload: value }),
    setAllergyDetailsText: (value) => dispatch({ type: 'SET_ALLERGY_DETAILS_TEXT', payload: value }),
    setMedicationDetailsText: (value) => dispatch({ type: 'SET_MEDICATION_DETAILS_TEXT', payload: value }),
    setTransferMode: (value) => dispatch({ type: 'SET_TRANSFER_MODE', payload: value }),
    setTransferClinicalReason: (value) => dispatch({ type: 'SET_TRANSFER_CLINICAL_REASON', payload: value }),
    setMedicalEscort: (value) => dispatch({ type: 'SET_MEDICAL_ESCORT', payload: value }),
    setEscortName: (value) => dispatch({ type: 'SET_ESCORT_NAME', payload: value }),
    setEscortQualification: (value) => dispatch({ type: 'SET_ESCORT_QUALIFICATION', payload: value }),

    // Hospital selection
    setHospitalTypeFilter: (type) =>
      dispatch({ type: 'SET_HOSPITAL_TYPE_FILTER', payload: type }),
    setReceivingFacility: (facility) =>
      dispatch({ type: 'SET_RECEIVING_FACILITY', payload: facility }),

    // Generated data
    setTransferID: (id) => dispatch({ type: 'SET_TRANSFER_ID', payload: id }),
    setQRCode: (qr) => dispatch({ type: 'SET_QR_CODE', payload: qr }),
    setShareLink: (link) => dispatch({ type: 'SET_SHARE_LINK', payload: link }),

    // Reset
    resetForm: () => dispatch({ type: 'RESET_FORM' }),
    loadTransferData: (data) =>
      dispatch({ type: 'LOAD_TRANSFER_DATA', payload: data }),
  };

  return (
    <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
  );
};

export const useTransfer = () => {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error('useTransfer must be used within TransferProvider');
  }
  return context;
};
