import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecipeRecommendation } from '../domain/recipe-ranking';
import type { InventoryItem } from '../inventory/types';

export function RecipeCompletionSheet({
  recommendation,
  consumedItems,
  onConfirm,
  onClose,
}: {
  recommendation: RecipeRecommendation | null;
  consumedItems: InventoryItem[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const canConfirm = Boolean(recommendation && consumedItems.length);

  return (
    <Modal animationType="slide" transparent visible={recommendation !== null} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>조리·섭취를 완료할까요?</Text>
          <Text style={styles.recipeTitle}>{recommendation?.recipe.title}</Text>
          <Text style={styles.copy}>아래 재료는 이번 메뉴에서 전부 사용한 것으로 기록돼요.</Text>
          <View style={styles.itemList}>
            {consumedItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>{item.quantity} · 다 먹음</Text>
              </View>
            ))}
          </View>
          {!canConfirm ? <Text style={styles.warning}>차감할 보유 재료가 없어요. 냉장고를 먼저 확인해 주세요.</Text> : null}
          <Text style={styles.note}>수량을 일부만 썼다면 완료하지 말고 냉장고에서 수량을 직접 수정해 주세요.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canConfirm }}
            disabled={!canConfirm}
            onPress={onConfirm}
            style={[styles.primaryButton, !canConfirm && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>다 먹음으로 기록</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>아직 있어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29,33,28,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FAF8F4', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9C7C1', marginBottom: 18 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#1D211C' },
  recipeTitle: { marginTop: 12, fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#2F6B4F' },
  copy: { marginTop: 8, color: '#4D554B', fontSize: 14, lineHeight: 21 },
  itemList: { marginTop: 16, borderRadius: 14, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  itemRow: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9E6DF' },
  itemName: { color: '#1D211C', fontSize: 14, fontWeight: '700' },
  itemQuantity: { color: '#6C7168', fontSize: 12 },
  note: { marginTop: 14, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  warning: { marginTop: 14, color: '#8A5C19', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 20, borderRadius: 14, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: '#A5BCA9' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#2F6B4F', fontSize: 14, fontWeight: '600' },
});
