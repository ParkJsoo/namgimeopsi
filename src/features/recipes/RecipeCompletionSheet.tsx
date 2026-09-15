import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { KeyboardSheet } from '@/components/KeyboardSheet';
import type { RecipeRecommendation } from '../domain/recipe-ranking';
import type { InventoryItem } from '../inventory/types';
import { getDateLabel, localDate } from '../inventory/dates';
import { groupInventoryLots } from './inventory-lots';
import type { CookingConsumption } from '../inventory/ledger';

type CompletionDraft = {
  key: string;
  selected: Record<string, string>;
  modes: Record<string, 'all' | 'remaining'>;
  remainingQuantities: Record<string, string>;
};

export function RecipeCompletionSheet({
  recommendation,
  consumedItems,
  referenceDate = localDate(),
  onConfirm,
  onClose,
}: {
  recommendation: RecipeRecommendation | null;
  consumedItems: InventoryItem[];
  referenceDate?: string;
  onConfirm: (consumptions: CookingConsumption[]) => void;
  onClose: () => void;
}) {
  const groups = [...groupInventoryLots(consumedItems, referenceDate).entries()];
  const completionKey = recommendation ? `${recommendation.recipe.id}:${consumedItems.map((item) => item.id).join(',')}` : '';
  const defaultDraft: CompletionDraft = {
    key: completionKey,
    selected: Object.fromEntries(groups.map(([name, items]) => [name, items[0].id])),
    modes: Object.fromEntries(consumedItems.map((item) => [item.id, 'all'])),
    remainingQuantities: Object.fromEntries(consumedItems.map((item) => [item.id, item.quantity])),
  };
  const [savedDraft, setSavedDraft] = useState<CompletionDraft | null>(null);
  const draft = savedDraft?.key === completionKey ? savedDraft : defaultDraft;

  const selectedItems = groups.flatMap(([name, items]) => items.filter((item) => item.id === draft.selected[name]));
  const consumptions = selectedItems.map<CookingConsumption>((item) => ({
    itemId: item.id,
    mode: draft.modes[item.id] ?? 'all',
    remainingQuantity: draft.remainingQuantities[item.id],
  }));
  const hasValidQuantities = consumptions.every((consumption) =>
    consumption.mode === 'all' || Boolean(consumption.remainingQuantity?.trim()),
  );
  const hasChanges = consumptions.some((consumption) =>
    consumption.mode === 'all' || Boolean(consumption.remainingQuantity?.trim() && consumption.remainingQuantity.trim() !== consumedItems.find((item) => item.id === consumption.itemId)?.quantity),
  );
  const canConfirm = Boolean(recommendation && hasValidQuantities && hasChanges);

  const close = () => { setSavedDraft(null); onClose(); };

  return (
    <Modal animationType="slide" transparent visible={recommendation !== null} onRequestClose={close}>
      <KeyboardSheet>
        <View style={styles.handle} />
        <Text style={styles.title}>조리·섭취를 완료할까요?</Text>
        <Text style={styles.recipeTitle}>{recommendation?.recipe.title}</Text>
        <Text style={styles.copy}>실제로 쓴 뒤 남은 양을 확인해 주세요. 생활 단위는 그대로 남겨요.</Text>
        <View style={styles.itemList}>
          {groups.map(([name, items]) => {
            const item = items.find((candidate) => candidate.id === draft.selected[name]) ?? items[0];
            const mode = draft.modes[item.id] ?? 'all';
            return (
            <View key={name} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>현재 {item.quantity}</Text>
              </View>
              {items.length > 1 ? (
                <View style={styles.lotList}>
                  <Text style={styles.note}>실제로 사용한 재고를 선택해 주세요. 먼저 확인할 날짜 순이에요.</Text>
                  {items.map((candidate, index) => (
                    <Pressable key={candidate.id} accessibilityRole="radio"
                      accessibilityState={{ checked: candidate.id === item.id }}
                      accessibilityLabel={`${candidate.name} 재고 ${index + 1}, ${candidate.quantity}, ${candidate.storage}, ${getDateLabel(candidate, referenceDate)}, 등록 ${new Date(candidate.createdAt).toLocaleString('ko-KR')}`}
                      onPress={() => setSavedDraft({ ...draft, selected: { ...draft.selected, [name]: candidate.id } })}
                      style={[styles.lotOption, candidate.id === item.id && styles.choiceSelected]}>
                      <Text style={styles.choiceText}>{candidate.id === item.id ? '●' : '○'} 재고 {index + 1} · {candidate.storage} · {candidate.quantity}</Text>
                      <Text style={styles.lotMeta}>{getDateLabel(candidate, referenceDate)}</Text>
                      <Text style={styles.lotMeta}>등록 {new Date(candidate.createdAt).toLocaleString('ko-KR')}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : <Text style={styles.lotMeta}>{item.storage} · {getDateLabel(item, referenceDate)}</Text>}
              <View style={styles.choiceRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} 다 먹음`}
                  accessibilityState={{ selected: mode === 'all' }}
                  onPress={() => setSavedDraft(() => ({ ...draft, modes: { ...draft.modes, [item.id]: 'all' } }))}
                  style={[styles.choice, mode === 'all' && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, mode === 'all' && styles.choiceTextSelected]}>다 먹음</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} 남은 양`}
                  accessibilityState={{ selected: mode === 'remaining' }}
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
              {mode === 'remaining' && !draft.remainingQuantities[item.id]?.trim() ? (
                <Text accessibilityRole="alert" style={styles.warning}>남은 양을 입력해 주세요.</Text>
              ) : null}
            </View>
            );
          })}
        </View>
        {!consumedItems.length ? <Text style={styles.warning}>차감할 보유 재료가 없어요. 냉장고를 먼저 확인해 주세요.</Text> : null}
        <Text style={styles.note}>남은 양은 숫자로 환산하지 않아요. 바꾼 값만 소비 원장과 재고에 함께 저장돼요.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canConfirm }}
          disabled={!canConfirm}
          onPress={() => { if (canConfirm) { onConfirm(consumptions); setSavedDraft(null); } }}
          style={[styles.primaryButton, !canConfirm && styles.primaryButtonDisabled]}>
          <Text style={styles.primaryButtonText}>재료 사용 완료</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={close} style={styles.secondaryButton}>
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
  lotList: { gap: 8 },
  lotOption: { minHeight: 64, padding: 10, borderRadius: 12, backgroundColor: '#F8F7F3' },
  lotMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: '#6C7168' },
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
