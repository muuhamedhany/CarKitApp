import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';

/**
 * A hook that listens for a 'TAB_RELOAD' event emitted when the active tab is tapped.
 * @param screenName The name of the current screen/route.
 * @param onReload Callback to execute (e.g., scroll to top and refresh data).
 */
export function useTabReload(screenName: string, onReload: () => void) {
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('TAB_RELOAD', (data) => {
      if (data.screen === screenName) {
        onReload();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [screenName, onReload]);
}
