import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export async function checkOnlineStatus() {
  try {
    const state = await NetInfo.fetch();
    const reachable = state.isInternetReachable;
    return Boolean(state.isConnected && (reachable === null || reachable === undefined || reachable === true));
  } catch (error) {
    return false;
  }
}

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [connectionType, setConnectionType] = useState(null);

  useEffect(() => {
    let initialized = false;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state?.isInternetReachable;
      const online = Boolean(state?.isConnected && (reachable === null || reachable === undefined || reachable === true));
      setIsOnline(online);
      setConnectionType(state?.type || null);

      if (!initialized) {
        initialized = true;
        setIsChecking(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, isChecking, connectionType, checkOnlineStatus };
}
