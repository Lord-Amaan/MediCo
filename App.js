// ============================================================================
// MEDICO - PATIENT TRANSFER HANDOFF APP
// Main entry point with modular structure
// ============================================================================

import React, { useState } from 'react';
import { View } from 'react-native';
import { TransferProvider } from './src/context/TransferContext';
import {
  HomeScreen,
  PatientDetailsScreen,
  CriticalInfoScreen,
  HospitalSelectionScreen,
  ConfirmationScreen,
  QRDisplayScreen,
} from './src/screens';



export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const handleNavigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  const goToHome = () => {
    setCurrentScreen('Home');
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

  return (
    <TransferProvider>
      <View style={{ flex: 1 }}>
        {currentScreen === 'Home' && (
          <HomeScreen onNavigate={handleNavigate} />
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
      </View>
    </TransferProvider>
  );
}
