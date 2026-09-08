import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Keep every field and action reachable on short screens and above the keyboard. */
export function KeyboardSheet({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, insets.bottom) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'android' ? 'none' : 'on-drag'}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29,33,28,0.35)', justifyContent: 'flex-end' },
  sheet: { flexGrow: 0, flexShrink: 1, maxHeight: '100%', backgroundColor: '#FAF8F4', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20 },
});
