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

import { useInventory } from '@/features/inventory/use-inventory';
import {
  blankDraft,
  getDateDescription,
  getFoodStatus,
  type InventoryDraft,
  type InventoryItem,
  type StoragePlace,
} from '@/features/inventory/types';

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
  const { items: inventory, isReady, add, update, remove } = useInventory();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<InventoryDraft>(blankDraft);
  const [selectedStorage, setSelectedStorage] = useState<StoragePlace>('냉장');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'leftover' | 'today'>('all');

  const priorityItems = useMemo(
    () => inventory.filter((item) => getFoodStatus(item) !== 'relaxed').slice(0, 3),
    [inventory],
  );

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
    Alert.alert('재고에서 제외할까요?', '이 항목은 시드 데이터 화면에서만 삭제됩니다.', [
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

  const consumeItem = (item: InventoryItem) => {
    Alert.alert(`${item.name}을(를) 다 먹었나요?`, '완료하면 목록에서 사라집니다.', [
      { text: '아직 있어요', style: 'cancel' },
      {
        text: '다 먹음',
        onPress: () => remove(item.id),
      },
    ]);
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
                <Pressable accessibilityRole="button" style={styles.iconButton}>
                  <Text style={styles.iconText}>◌</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>오늘 먼저 먹으면 좋은 것</Text>
              <View style={styles.priorityCard}>
                {priorityItems.length ? (
                  priorityItems.map((item, index) => (
                    <Pressable
                      accessibilityRole="button"
                      key={item.id}
                      onPress={() => openEdit(item)}
                      style={[styles.priorityRow, index > 0 && styles.priorityDivider]}>
                      <View style={styles.priorityIcon}>
                        <Text>{item.kind === 'leftover' ? '◒' : '◌'}</Text>
                      </View>
                      <View style={styles.priorityCopy}>
                        <Text style={styles.foodName}>{item.name}</Text>
                        <Text style={styles.reason}>{item.reason}</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptyText}>먼저 먹을 재료가 없어요. 새 재료를 추가해 보세요.</Text>
                )}
              </View>

              <View style={styles.quickAddRow}>
                <Pressable accessibilityRole="button" onPress={() => openCreate('leftover')} style={styles.quickAddButton}>
                  <Text style={styles.quickAddTitle}>남은 음식</Text>
                  <Text style={styles.quickAddHint}>지금 바로 기록</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => openCreate('ingredient')} style={styles.quickAddButton}>
                  <Text style={styles.quickAddTitle}>직접 추가</Text>
                  <Text style={styles.quickAddHint}>식재료 하나씩</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>오늘의 한 끼</Text>
                <Text style={styles.link}>모두 보기</Text>
              </View>
              <RecipeCard
                title="치킨마요 덮밥"
                meta="15분 · 1인분"
                reason="남은 치킨과 계란을 오늘 쓰기 좋아요"
                onPress={() => {
                  const chicken = inventory.find((item) => item.id === 'leftover-chicken');
                  if (chicken) consumeItem(chicken);
                  else openCreate('leftover');
                }}
              />
              <RecipeCard
                title="애호박 두부덮밥"
                meta="15분 · 1인분"
                reason="두부와 애호박을 이틀 안에 쓰기 좋아요"
                onPress={() => setActiveTab('inventory')}
              />
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
          <Pressable accessibilityRole="button" onPress={() => openCreate('ingredient')} style={styles.fab}>
            <Text style={styles.fabText}>＋</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" onPress={() => setActiveTab('inventory')} style={styles.tab}>
            <Text style={[styles.tabIcon, activeTab === 'inventory' && styles.tabActive]}>▤</Text>
            <Text style={[styles.tabLabel, activeTab === 'inventory' && styles.tabActive]}>냉장고</Text>
          </Pressable>
        </View>
      </View>

      <Modal animationType="slide" transparent visible={editorOpen} onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RecipeCard({ title, meta, reason, onPress }: { title: string; meta: string; reason: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.recipeCard}>
      <View style={styles.recipeVisual}>
        <Text style={styles.recipeVisualText}>오늘의 메뉴</Text>
      </View>
      <View style={styles.recipeCopy}>
        <View style={styles.recipeHeading}>
          <Text style={styles.recipeTitle}>{title}</Text>
          <Text style={styles.recipeMeta}>{meta}</Text>
        </View>
        <Text style={styles.recipeReason}>{reason}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF8F4' },
  app: { flex: 1, backgroundColor: '#FAF8F4' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F4' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 116 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { fontSize: 15, lineHeight: 22, color: '#6C7168' },
  title: { marginTop: 4, fontSize: 25, lineHeight: 34, fontWeight: '700', color: '#1D211C', letterSpacing: -0.5 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 24, color: '#2F6B4F' },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#1D211C' },
  priorityCard: { marginTop: 12, borderRadius: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 16 },
  priorityRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center' },
  priorityDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E9E6DF' },
  priorityIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E4F0E7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  priorityCopy: { flex: 1 },
  foodName: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#1D211C' },
  reason: { marginTop: 2, fontSize: 12, lineHeight: 17, color: '#6C7168' },
  chevron: { fontSize: 28, color: '#6C7168' },
  quickAddRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  quickAddButton: { flex: 1, minHeight: 74, borderRadius: 20, padding: 16, backgroundColor: '#F1EEE7', justifyContent: 'center' },
  quickAddTitle: { color: '#1D211C', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  quickAddHint: { marginTop: 2, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  link: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: '#2F6B4F' },
  recipeCard: { borderRadius: 20, backgroundColor: '#FFFFFF', overflow: 'hidden', marginBottom: 12 },
  recipeVisual: { height: 86, padding: 16, justifyContent: 'flex-end', backgroundColor: '#E4F0E7' },
  recipeVisualText: { color: '#2F6B4F', fontSize: 13, fontWeight: '600' },
  recipeCopy: { padding: 16 },
  recipeHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  recipeTitle: { flex: 1, fontSize: 17, lineHeight: 24, fontWeight: '700', color: '#1D211C' },
  recipeMeta: { fontSize: 12, lineHeight: 17, color: '#6C7168' },
  recipeReason: { marginTop: 6, fontSize: 13, lineHeight: 18, color: '#2F6B4F' },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(29,33,28,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FAF8F4', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9C7C1', marginBottom: 18 },
  sheetTitle: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#1D211C', marginBottom: 20 },
  fieldLabel: { marginTop: 14, marginBottom: 6, color: '#4D554B', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  input: { minHeight: 52, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#FFFFFF', color: '#1D211C', fontSize: 15 },
  safetyNote: { marginTop: 14, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 20, borderRadius: 14, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#B73D32', fontSize: 14, fontWeight: '600' },
});
