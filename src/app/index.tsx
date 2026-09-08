import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardSheet } from '@/components/KeyboardSheet';
import type { RecipeRecommendation } from '@/features/domain/recipe-ranking';
import { useInventory } from '@/features/inventory/use-inventory';
import {
  blankDraft,
  getDateDescription,
  getFoodStatus,
  type InventoryDraft,
  type InventoryItem,
  type StoragePlace,
} from '@/features/inventory/types';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { RecipeCompletionSheet } from '@/features/recipes/RecipeCompletionSheet';
import { getLiveRecipeRecommendations } from '@/features/recipes/recommendations';
import { ReceiptEntrySheet } from '@/features/receipts/ReceiptEntrySheet';

function normalizeFoodName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}

function statusTone(item: InventoryItem) {
  if (getFoodStatus(item) === 'today') return styles.statusToday;
  if (getFoodStatus(item) === 'soon') return styles.statusSoon;
  return styles.statusRelaxed;
}

function StoragePicker({
  value,
  onChange,
}: {
  value: StoragePlace;
  onChange: (storage: StoragePlace) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {(['냉장', '냉동', '실온'] as StoragePlace[]).map((storage) => (
        <Pressable
          accessibilityRole="button"
          key={storage}
          onPress={() => onChange(storage)}
          style={[styles.option, value === storage && styles.optionSelected]}>
          <Text style={[styles.optionText, value === storage && styles.optionTextSelected]}>
            {storage}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function KindPicker({
  value,
  onChange,
}: {
  value: InventoryDraft['kind'];
  onChange: (kind: InventoryDraft['kind']) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('ingredient')}
        style={[styles.option, value === 'ingredient' && styles.optionSelected]}>
        <Text style={[styles.optionText, value === 'ingredient' && styles.optionTextSelected]}>식재료</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('leftover')}
        style={[styles.option, value === 'leftover' && styles.optionSelected]}>
        <Text style={[styles.optionText, value === 'leftover' && styles.optionTextSelected]}>남은 음식</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'home' | 'inventory'>('home');
  const { items: inventory, isReady, syncStatus, add, update, remove, completeCookingSession, confirmReceipt, retrySync } = useInventory();
  const [editorOpen, setEditorOpen] = useState(false);
  const [receiptEntryOpen, setReceiptEntryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRecommendation, setPendingRecommendation] = useState<RecipeRecommendation | null>(null);
  const [draft, setDraft] = useState<InventoryDraft>(blankDraft);
  const [selectedStorage, setSelectedStorage] = useState<StoragePlace>('냉장');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'leftover' | 'today'>('all');

  const priorityItems = useMemo(
    () => inventory.filter((item) => getFoodStatus(item) !== 'relaxed').slice(0, 3),
    [inventory],
  );
  const featuredPriority = priorityItems[0];

  const recommendations = useMemo(() => getLiveRecipeRecommendations(inventory), [inventory]);

  const pendingConsumedItems = useMemo(() => {
    if (!pendingRecommendation) return [];
    const consumptionFoodNames = pendingRecommendation.recipe.consumptionFoodNames ?? pendingRecommendation.availableIngredients;
    return consumptionFoodNames
      .map((foodName) => inventory.find((item) => normalizeFoodName(item.name) === normalizeFoodName(foodName)))
      .filter((item): item is InventoryItem => item !== undefined);
  }, [inventory, pendingRecommendation]);

  const visibleInventory = useMemo(
    () =>
      inventory.filter((item) => {
        if (item.storage !== selectedStorage) return false;
        if (inventoryFilter === 'leftover') return item.kind === 'leftover';
        if (inventoryFilter === 'today') return getFoodStatus(item) === 'today';
        return true;
      }),
    [inventory, inventoryFilter, selectedStorage],
  );

  const openCreate = (kind: InventoryDraft['kind'] = 'ingredient') => {
    setEditingId(null);
    setDraft({
      ...blankDraft,
      kind,
      storage: kind === 'leftover' ? '냉장' : blankDraft.storage,
      recommendedUseBy: kind === 'leftover' ? '내일까지' : blankDraft.recommendedUseBy,
    });
    setEditorOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      quantity: item.quantity,
      storage: item.storage,
      recommendedUseBy: item.recommendedUseBy,
      kind: item.kind,
    });
    setEditorOpen(true);
  };

  const openCreateFromEntry = (kind: InventoryDraft['kind']) => {
    setReceiptEntryOpen(false);
    openCreate(kind);
  };

  const saveItem = () => {
    if (!draft.name.trim()) {
      Alert.alert('식재료 이름을 입력해 주세요.');
      return;
    }

    if (editingId) {
      update(editingId, draft);
    } else {
      add(draft);
    }
    setEditorOpen(false);
  };

  const deleteItem = () => {
    if (!editingId) return;
    Alert.alert('재고에서 제외할까요?', '이 항목은 내 재고와 동기화 목록에서 제외됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '제외',
        style: 'destructive',
        onPress: () => {
          remove(editingId);
          setEditorOpen(false);
        },
      },
    ]);
  };

  const openRecipeCompletion = (recommendation: RecipeRecommendation) => {
    setPendingRecommendation(recommendation);
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingScreen}>
          <Text style={styles.eyebrow}>내 냉장고를 불러오고 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.app}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' ? (
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.eyebrow}>안녕하세요, 윤서님</Text>
                  <Text style={styles.title}>오늘 먼저 먹을 게 있어요</Text>
                </View>
              </View>

              {syncStatus !== 'synced' ? (
                <Pressable accessibilityRole="button" onPress={retrySync} style={styles.syncNotice}>
                  <Text style={styles.syncNoticeText}>
                    {syncStatus === 'error'
                      ? '동기화하지 못했어요. 탭해서 다시 시도해 주세요.'
                      : syncStatus === 'offline'
                        ? '오프라인으로 저장했어요. 연결되면 동기화해요.'
                        : '재고를 안전하게 동기화하고 있어요.'}
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.priorityCard}>
                <Text style={styles.priorityHeading}>오늘 먼저 먹으면 좋은 것</Text>
                {featuredPriority ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openEdit(featuredPriority)}
                    style={styles.priorityRow}>
                    <View style={styles.priorityCopy}>
                      <Text style={styles.foodName}>{featuredPriority.name}</Text>
                      <Text style={styles.reason}>{featuredPriority.reason}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Text style={styles.priorityEmpty}>먼저 먹을 재료가 없어요. 새 재료를 추가해 보세요.</Text>
                )}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>오늘의 한 끼</Text>
                <Text style={styles.link}>모두 보기</Text>
              </View>
              {recommendations.length ? (
                recommendations.map((recommendation) => (
                  <RecipeCard
                    key={recommendation.recipe.id}
                    recommendation={recommendation}
                    onPress={() => openRecipeCompletion(recommendation)}
                  />
                ))
              ) : (
                <View style={styles.recipeEmpty}>
                  <Text style={styles.recipeEmptyTitle}>추천할 메뉴가 아직 없어요</Text>
                  <Text style={styles.recipeEmptyCopy}>재료를 추가하면 오늘 만들기 좋은 메뉴를 최대 3개 보여 드릴게요.</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inventoryHeader}>
                <View>
                  <Text style={styles.eyebrow}>내 냉장고</Text>
                  <Text style={styles.title}>먼저 먹기 순서예요</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => openCreate('ingredient')} style={styles.addSmallButton}>
                  <Text style={styles.addSmallButtonText}>직접 추가</Text>
                </Pressable>
              </View>
              <StoragePicker value={selectedStorage} onChange={setSelectedStorage} />
              <View style={styles.filterRow}>
                {([
                  ['all', '전체'],
                  ['leftover', '남은 음식'],
                  ['today', '오늘 권장'],
                ] as const).map(([filter, label]) => (
                  <Pressable
                    accessibilityRole="button"
                    key={filter}
                    onPress={() => setInventoryFilter(filter)}
                    style={[styles.filterChip, inventoryFilter === filter && styles.filterChipSelected]}>
                    <Text style={[styles.filterText, inventoryFilter === filter && styles.filterTextSelected]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inventoryList}>
                {visibleInventory.map((item) => (
                    <Pressable key={item.id} onPress={() => openEdit(item)} style={styles.inventoryRow}>
                      <View style={styles.inventoryCopy}>
                        <Text style={styles.foodName}>{item.name}</Text>
                        <Text style={styles.inventoryMeta}>{item.quantity} · {getDateDescription(item)}</Text>
                      </View>
                      <View style={[styles.statusChip, statusTone(item)]}>
                        <Text style={styles.statusText}>{item.recommendedUseBy} 권장</Text>
                      </View>
                    </Pressable>
                ))}
                {visibleInventory.length === 0 && (
                  <Text style={styles.emptyText}>이 조건에 맞는 재고가 없어요.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable accessibilityRole="tab" onPress={() => setActiveTab('home')} style={styles.tab}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabActive]}>⌂</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabActive]}>홈</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setReceiptEntryOpen(true)} style={styles.fab}>
            <Text style={styles.fabText}>＋</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" onPress={() => setActiveTab('inventory')} style={styles.tab}>
            <Text style={[styles.tabIcon, activeTab === 'inventory' && styles.tabActive]}>▤</Text>
            <Text style={[styles.tabLabel, activeTab === 'inventory' && styles.tabActive]}>냉장고</Text>
          </Pressable>
        </View>
      </View>

      <Modal animationType="slide" transparent visible={editorOpen} onRequestClose={() => setEditorOpen(false)}>
        <KeyboardSheet>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{editingId ? '재고 수정' : '직접 추가'}</Text>
          <Text style={styles.fieldLabel}>등록할 항목</Text>
          <KindPicker
            value={draft.kind}
            onChange={(kind) =>
              setDraft((current) => ({
                ...current,
                kind,
                storage: kind === 'leftover' ? '냉장' : current.storage,
                recommendedUseBy: kind === 'leftover' ? '내일까지' : current.recommendedUseBy,
              }))
            }
          />
          <Text style={styles.fieldLabel}>식재료 이름</Text>
          <TextInput
            accessibilityLabel="식재료 이름"
            value={draft.name}
            onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
            placeholder="예: 양파"
            placeholderTextColor="#8B9087"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>남은 양</Text>
          <TextInput
            accessibilityLabel="남은 양"
            value={draft.quantity}
            onChangeText={(quantity) => setDraft((current) => ({ ...current, quantity }))}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>보관 위치</Text>
          <StoragePicker value={draft.storage} onChange={(storage) => setDraft((current) => ({ ...current, storage }))} />
          <Text style={styles.fieldLabel}>권장 섭취 시점</Text>
          <TextInput
            accessibilityLabel="권장 섭취 시점"
            value={draft.recommendedUseBy}
            onChangeText={(recommendedUseBy) => setDraft((current) => ({ ...current, recommendedUseBy }))}
            style={styles.input}
          />
          <Text style={styles.safetyNote}>
            {draft.kind === 'leftover'
              ? '조리·보관 시작은 지금으로 기록돼요. 이는 식품 안전을 보장하는 날짜가 아니에요.'
              : '포장 표기일과 별도로, 사용자가 정할 수 있는 권장 섭취 시점이에요.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={saveItem} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{editingId ? '수정 완료' : '냉장고에 담기'}</Text>
          </Pressable>
          {editingId ? (
            <Pressable accessibilityRole="button" onPress={deleteItem} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>재고에서 제외</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setEditorOpen(false)} style={styles.deleteButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </Pressable>
        </KeyboardSheet>
      </Modal>

      <RecipeCompletionSheet
        recommendation={pendingRecommendation}
        consumedItems={pendingConsumedItems}
        onConfirm={(consumptions) => {
          if (!pendingRecommendation || !pendingConsumedItems.length) return;
          const didComplete = completeCookingSession(consumptions, {
            recipeId: pendingRecommendation.recipe.id,
            recipeTitle: pendingRecommendation.recipe.title,
          });
          if (didComplete) setPendingRecommendation(null);
        }}
        onClose={() => setPendingRecommendation(null)}
      />

      <ReceiptEntrySheet
        visible={receiptEntryOpen}
        onClose={() => setReceiptEntryOpen(false)}
        onDirectAdd={() => openCreateFromEntry('ingredient')}
        onLeftoverAdd={() => openCreateFromEntry('leftover')}
        onConfirm={confirmReceipt}
        onGoHome={() => {
          setReceiptEntryOpen(false);
          setActiveTab('home');
        }}
        onGoInventory={() => {
          setReceiptEntryOpen(false);
          setActiveTab('inventory');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  app: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F4' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 116 },
  header: { marginBottom: 104 },
  syncNotice: { alignSelf: 'flex-start', marginTop: -92, marginBottom: 20, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF0DC' },
  syncNoticeText: { color: '#6C4A18', fontSize: 12, lineHeight: 17 },
  inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { fontSize: 15, lineHeight: 22, color: '#6C7168' },
  title: { marginTop: 4, fontSize: 25, lineHeight: 34, fontWeight: '700', color: '#1D211C', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#1D211C' },
  priorityCard: { borderRadius: 20, backgroundColor: '#E4F0E7', paddingHorizontal: 20, paddingVertical: 22 },
  priorityHeading: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#1D211C' },
  priorityRow: { minHeight: 56, justifyContent: 'flex-end' },
  priorityCopy: { flex: 1 },
  foodName: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#1D211C' },
  reason: { marginTop: 2, fontSize: 12, lineHeight: 17, color: '#6C7168' },
  priorityEmpty: { paddingTop: 16, color: '#6C7168', fontSize: 14, lineHeight: 21 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  link: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: '#2F6B4F' },
  recipeEmpty: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D5E0D6', padding: 20 },
  recipeEmptyTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#1D211C' },
  recipeEmptyCopy: { marginTop: 6, fontSize: 13, lineHeight: 19, color: '#6C7168' },
  optionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  option: { flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: '#F1EEE7', alignItems: 'center', justifyContent: 'center' },
  optionSelected: { backgroundColor: '#E4F0E7', borderWidth: 1, borderColor: '#2F6B4F' },
  optionText: { color: '#6C7168', fontSize: 14, fontWeight: '600' },
  optionTextSelected: { color: '#2F6B4F' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  filterChip: { minHeight: 36, borderRadius: 999, paddingHorizontal: 13, backgroundColor: '#F1EEE7', alignItems: 'center', justifyContent: 'center' },
  filterChipSelected: { backgroundColor: '#E4F0E7' },
  filterText: { color: '#6C7168', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  filterTextSelected: { color: '#2F6B4F' },
  inventoryList: { marginTop: 16, borderRadius: 20, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  inventoryRow: { padding: 16, minHeight: 76, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9E6DF' },
  inventoryCopy: { flex: 1 },
  inventoryMeta: { marginTop: 2, color: '#6C7168', fontSize: 13, lineHeight: 18 },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusToday: { backgroundColor: '#FFF0DC' },
  statusSoon: { backgroundColor: '#E4F0E7' },
  statusRelaxed: { backgroundColor: '#F1EEE7' },
  statusText: { color: '#4D554B', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  emptyText: { padding: 20, color: '#6C7168', fontSize: 14, lineHeight: 21 },
  addSmallButton: { minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#E4F0E7', alignItems: 'center', justifyContent: 'center' },
  addSmallButtonText: { color: '#2F6B4F', fontSize: 13, fontWeight: '700' },
  bottomBar: { position: 'absolute', left: 20, right: 20, bottom: 22, height: 68, borderRadius: 24, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', shadowColor: '#1D211C', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  tab: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 21, color: '#8B9087' },
  tabLabel: { marginTop: 1, fontSize: 11, color: '#8B9087', fontWeight: '600' },
  tabActive: { color: '#2F6B4F' },
  fab: { width: 56, height: 56, borderRadius: 28, marginTop: -30, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center', shadowColor: '#2F6B4F', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  fabText: { color: '#FFFFFF', fontSize: 29, lineHeight: 31, fontWeight: '300' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9C7C1', marginBottom: 18 },
  sheetTitle: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#1D211C', marginBottom: 20 },
  fieldLabel: { marginTop: 14, marginBottom: 6, color: '#4D554B', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  input: { minHeight: 52, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#FFFFFF', color: '#1D211C', fontSize: 15 },
  safetyNote: { marginTop: 14, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 20, borderRadius: 14, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#B73D32', fontSize: 14, fontWeight: '600' },
  closeButtonText: { color: '#626B60', fontSize: 14, fontWeight: '600' },
});
