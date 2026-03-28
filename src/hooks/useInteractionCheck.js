import { useState } from 'react';
import axios from 'axios';
import { checkInteractionsOffline } from '../utils/drugInteractions';

export default function useInteractionCheck() {
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [hasCritical, setHasCritical] = useState(false);
  const [hasWarnings, setHasWarnings] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const checkInteractions = async (medications, allergies) => {
    if ((!medications || medications.length === 0) && (!allergies || allergies.length === 0)) {
      return null;
    }

    setChecking(true);

    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.124:5000';
      const response = await axios.post(
        `${apiBase}/api/check-interactions`,
        { medications, allergies }
      );

      setConflicts(response.data?.conflicts || []);
      setHasCritical(Boolean(response.data?.hasCritical));
      setHasWarnings(Boolean(response.data?.hasWarnings));
      setAiUsed(Boolean(response.data?.aiUsed));

      return response.data;
    } catch (error) {
      console.error('Interaction check failed:', error);

      // Offline fallback so conflicts still surface even if API is unavailable.
      const offlineConflicts = checkInteractionsOffline(medications || [], allergies || []);
      const hasCriticalOffline = offlineConflicts.some((item) => item.risk === 'Critical');
      const hasWarningsOffline = offlineConflicts.some((item) => item.risk === 'Warning');

      setConflicts(offlineConflicts);
      setHasCritical(hasCriticalOffline);
      setHasWarnings(hasWarningsOffline);
      setAiUsed(false);

      return {
        success: true,
        conflicts: offlineConflicts,
        hasCritical: hasCriticalOffline,
        hasWarnings: hasWarningsOffline,
        totalFound: offlineConflicts.length,
        aiUsed: false,
        message: offlineConflicts.length > 0 ? `${offlineConflicts.length} conflict(s) found` : 'No conflicts detected',
      };
    } finally {
      setChecking(false);
    }
  };

  return { conflicts, checking, hasCritical, hasWarnings, aiUsed, checkInteractions };
}
