/**
 * QR Code Generation for React Native
 * Uses react-native-qrcode-svg which renders directly in components
 */

export const encodeTransferData = (transferData) => {
  /**
   * Prepare transfer data to be encoded in QR code
   * Note: QR code has size limitations, so we keep JSON compact
   */
  const data = {
    transferID: transferData.transferID || 'TXF_' + Date.now(),
    patient: {
      name: transferData.patientName,
      age: transferData.patientAge,
      id: transferData.patientID,
    },
    critical: {
      allergies: transferData.allergies || [],
      medications: transferData.medications || [],
      reason: transferData.transferReason,
    },
    from: transferData.sendingFacility?.hospitalID || 'HOSP_001',
    to: transferData.receivingFacility?.hospitalID || 'HOSP_002',
    time: new Date().toISOString().split('T')[0], // Just date, not full timestamp
  };
  return JSON.stringify(data);
};

export const generateShareLink = (transferID) => {
  return `medico.app/t/${transferID}`;
};

/**
 * For React Native, QR codes are rendered directly using QRCode component
 * In QRDisplayScreen.js, use:
 * 
 * import QRCode from 'react-native-qrcode-svg';
 * 
 * <QRCode
 *   value={qrDataString}
 *   size={250}
 *   color="black"
 *   backgroundColor="white"
 * />
 */
