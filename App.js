// ============================================================================
// MEDICO - PATIENT TRANSFER HANDOFF APP
// Main entry point with authentication & modular structure
// ============================================================================

import React, { useState } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TransferProvider } from './src/context/TransferContext';
import {
  LoginScreen,
  HomeScreen,
  PatientDetailsScreen,
  CriticalInfoScreen,
  HospitalSelectionScreen,
  ConfirmationScreen,
  QRDisplayScreen,
  QRScannerScreen,
  ReceivedTransferScreen,
} from './src/screens';

const API_BASE_URL = 'http://192.168.0.124:5000/api';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [scannedData, setScannedData] = useState(null);
  const { state } = useAuth();

  // If not authenticated, show login screen
  if (!state.token) {
    return (
      <LoginScreen
        onLoginSuccess={() => setCurrentScreen('Home')}
      />
    );
  }

  const handleNavigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  const goToHome = () => {
    setCurrentScreen('Home');
    setScannedData(null);
  };

  const goToNext = () => {
    const screenFlow = [
      'Home',
      'PatientDetails',
      'CriticalInfo',
      'HospitalSelection',
      'Confirmation',
      'QRDisplay',
    ];

    const currentIndex = screenFlow.indexOf(currentScreen);
    if (currentIndex < screenFlow.length - 1) {
      setCurrentScreen(screenFlow[currentIndex + 1]);
    }
  };

  const goToBack = () => {
    const screenFlow = [
      'Home',
      'PatientDetails',
      'CriticalInfo',
      'HospitalSelection',
      'Confirmation',
      'QRDisplay',
    ];

    const currentIndex = screenFlow.indexOf(currentScreen);
    if (currentIndex > 0) {
      setCurrentScreen(screenFlow[currentIndex - 1]);
    }
  };

  const handleQRScanned = (data) => {
    setScannedData(data);
    setCurrentScreen('ReceivedTransfer');
  };

  return (
    <TransferProvider>
      <View style={{ flex: 1 }}>
        {/* Sending Side - Main Flow */}
        {currentScreen === 'Home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onOpenScanner={() => setCurrentScreen('QRScanner')}
          />
        )}

        {currentScreen === 'PatientDetails' && (
          <PatientDetailsScreen
            onNext={goToNext}
            onBack={goToBack}
          />
        )}

        {currentScreen === 'CriticalInfo' && (
          <CriticalInfoScreen
            onNext={goToNext}
            onBack={goToBack}
          />
        )}

        {currentScreen === 'HospitalSelection' && (
          <HospitalSelectionScreen
            onNext={goToNext}
            onBack={goToBack}
          />
        )}

        {currentScreen === 'Confirmation' && (
          <ConfirmationScreen
            onNext={goToNext}
            onBack={goToBack}
          />
        )}

        {currentScreen === 'QRDisplay' && (
          <QRDisplayScreen
            onDone={goToHome}
            onBack={goToBack}
          />
        )}

        {/* Receiving Side */}
        {currentScreen === 'QRScanner' && (
          <QRScannerScreen
            onScanSuccess={handleQRScanned}
            onClose={() => setCurrentScreen('Home')}
          />
        )}

        {currentScreen === 'ReceivedTransfer' && scannedData && (
          <ReceivedTransferScreen
            transferData={scannedData}
            onClose={() => {
              setScannedData(null);
              setCurrentScreen('Home');
            }}
            onAcknowledge={() => {
              setScannedData(null);
              setCurrentScreen('Home');
            }}
          />
        )}
      </View>
    </TransferProvider>
  );
}

export default function App() {
  return (
    <AuthProvider apiBaseURL={API_BASE_URL}>
      <AppContent />
    </AuthProvider>
  );
}
