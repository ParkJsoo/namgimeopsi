import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { KeyboardSheet } from '@/components/KeyboardSheet';
import type { RecipeRecommendation } from '../domain/recipe-ranking';
import type { InventoryItem } from '../inventory/types';
import type { CookingConsumption } from '../inventory/ledger';

type CompletionDraft = {
  key: string;
  modes: Record<string, 'all' | 'remaining'>;
  remainingQuantities: Record<string, string>;
};

export function RecipeCompletionSheet({
  recommendation,
  consumedItems,
  onConfirm,
  onClose,
}: {
  recommendation: RecipeRecommendation | null;
  consumedItems: InventoryItem[];
  onConfirm: (consumptions: CookingConsumption[]) => void;
  onClose: () => void;
}) {
  const completionKey = recommendation ? `${recommendation.recipe.id}:${consumedItems.map((item) => item.id).join(',')}` : '';
  const defaultDraft: CompletionDraft = {
    key: completionKey,
    modes: Object.fromEntries(consumedItems.map((item) => [item.id, 'all'])),
    remainingQuantities: Object.fromEntries(consumedItems.map((item) => [item.id, item.quantity])),
  };
  const [savedDraft, setSavedDraft] = useState(defaultDraft);
  const draft = savedDraft.key === completionKey ? savedDraft : defaultDraft;

  const consumptions = consumedItems.map<CookingConsumption>((item) => ({
    itemId: item.id,
    mode: draft.modes[item.id] ?? 'all',
    remainingQuantity: draft.remainingQuantities[item.id],
  }));
  const canConfirm = Boolean(recommendation && consumptions.some((consumption) =>
    consumption.mode === 'all' || Boolean(consumption.remainingQuantity?.trim() && consumption.remainingQuantity !== consumedItems.find((item) => item.id === consumption.itemId)?.quantity),
  ));

  return (
    <Modal animationType="slide" transparent visible={recommendation !== null} onRequestClose={onClose}>
      <KeyboardSheet>
        <View style={styles.handle} />
        <Text style={styles.title}>조리·섭취를 완료할까요?</Text>
        <Text style={styles.recipeTitle}>{recommendation?.recipe.title}</Text>
        <Text style={styles.copy}>실제로 쓴 뒤 남은 양을 확인해 주세요. 생활 단위는 그대로 남겨요.</Text>
        <View style={styles.itemList}>
          {consumedItems.map((item) => {
            const mode = draft.modes[item.id] ?? 'all';
            return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>현재 {item.quantity}</Text>
              </View>
              <View style={styles.choiceRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSavedDraft(() => ({ ...draft, modes: { ...draft.modes, [item.id]: 'all' } }))}
                  style={[styles.choice, mode === 'all' && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, mode === 'all' && styles.choiceTextSelected]}>다 먹음</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSavedDraft(() => ({ ...draft, modes: { ...draft.modes, [item.id]: 'remaining' } }))}
                  style={[styles.choice, mode === 'remaining' && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, mode === 'remaining' && styles.choiceTextSelected]}>남은 양</Text>
                </Pressable>
              </View>
              {mode === 'remaining' ? (
                <TextInput
                  accessibilityLabel={`${item.name} 사용 뒤 남은 양`}
                  value={draft.remainingQuantities[item.id] ?? ''}
                  onChangeText={(value) => setSavedDraft(() => ({ ...draft, remainingQuantities: { ...draft.remainingQuantities, [item.id]: value } }))}
                  placeholder="예: 반 봉지, 조금 남음"
                  placeholderTextColor="#8B9087"
                  style={styles.quantityInput}
                />
              ) : null}
            </View>
            );
          })}
        </View>
        {!canConfirm ? <Text style={styles.warning}>차감할 보유 재료가 없어요. 냉장고를 먼저 확인해 주세요.</Text> : null}
        <Text style={styles.note}>남은 양은 숫자로 환산하지 않아요. 바꾼 값만 소비 원장과 재고에 함께 저장돼요.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canConfirm }}
          disabled={!canConfirm}
          onPress={() => onConfirm(consumptions)}
          style={[styles.primaryButton, !canConfirm && styles.primaryButtonDisabled]}>
          <Text style={styles.primaryButtonText}>재료 사용 완료</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>아직 있어요</Text>
        </Pressable>
      </KeyboardSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9C7C1', marginBottom: 18 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#1D211C' },
  recipeTitle: { marginTop: 12, fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#2F6B4F' },
  copy: { marginTop: 8, color: '#4D554B', fontSize: 14, lineHeight: 21 },
  itemList: { marginTop: 16, borderRadius: 14, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  itemRow: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9E6DF' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { color: '#1D211C', fontSize: 14, fontWeight: '700' },
  itemQuantity: { color: '#6C7168', fontSize: 12 },
  choiceRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  choice: { minHeight: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F1EEE7', justifyContent: 'center' },
  choiceSelected: { backgroundColor: '#E4F0E7', borderWidth: 1, borderColor: '#2F6B4F' },
  choiceText: { color: '#6C7168', fontSize: 12, fontWeight: '600' },
  choiceTextSelected: { color: '#2F6B4F' },
  quantityInput: { minHeight: 44, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D8D6D0', paddingHorizontal: 12, color: '#1D211C', fontSize: 14 },
  note: { marginTop: 14, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  warning: { marginTop: 14, color: '#8A5C19', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 20, borderRadius: 14, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: '#A5BCA9' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#2F6B4F', fontSize: 14, fontWeight: '600' },
});
