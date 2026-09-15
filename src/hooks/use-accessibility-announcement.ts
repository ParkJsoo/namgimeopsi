import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** iOS has no accessibilityLiveRegion. Call only with a currently visible notice. */
export function useAccessibilityAnnouncement(message: string | null) {
  useEffect(() => {
    if (Platform.OS === 'ios' && message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);
}
