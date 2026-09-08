import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { StoragePlace } from '../inventory/types';
import { receiptReviewFixture } from './fixture';
import { analyzeReceiptImage, pickReceiptImage, uploadReceiptImage } from './scan-storage';
import { canConfirmReceiptDraft, type ReceiptConfirmationResult } from './confirm-receipt';
import { getReceiptReviewCounts, updateReceiptDraftItem } from './review-draft';
import type { ReceiptReviewDraft } from './types';

type ReceiptStage = 'choice' | 'uploading' | 'analyzing' | 'review' | 'complete';

function createReviewDraft(scan?: Pick<ReceiptReviewDraft, 'scanJobId' | 'sourceLabel'>): ReceiptReviewDraft {
  return {
    ...receiptReviewFixture,
    ...(scan
      ? {
          batchId: `receipt-${scan.scanJobId}`,
          sourceLabel: scan.sourceLabel,
          scanJobId: scan.scanJobId,
        }
      : {}),
    items: receiptReviewFixture.items.map((item) => ({ ...item })),
  };
}

function StoragePicker({ value, onChange }: { value: StoragePlace; onChange: (storage: StoragePlace) => void }) {
  return (
    <View style={styles.storageRow}>
      {(['냉장', '냉동', '실온'] as StoragePlace[]).map((storage) => (
        <Pressable
          accessibilityRole="button"
          key={storage}
          onPress={() => onChange(storage)}
          style={[styles.storageOption, value === storage && styles.storageOptionSelected]}>
          <Text style={[styles.storageText, value === storage && styles.storageTextSelected]}>{storage}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ReceiptEntrySheet({
  visible,
  onClose,
  onDirectAdd,
  onLeftoverAdd,
  onConfirm,
  onGoHome,
  onGoInventory,
}: {
  visible: boolean;
  onClose: () => void;
  onDirectAdd: () => void;
  onLeftoverAdd: () => void;
  onConfirm: (draft: ReceiptReviewDraft) => Promise<ReceiptConfirmationResult>;
  onGoHome: () => void;
  onGoInventory: () => void;
}) {
  const [stage, setStage] = useState<ReceiptStage>('choice');
  const [draft, setDraft] = useState<ReceiptReviewDraft>(createReviewDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const counts = getReceiptReviewCounts(draft);
  const canConfirm = canConfirmReceiptDraft(draft) && !isSaving;

  const startReceiptReview = async () => {
    setDraft(createReviewDraft());
    setSaveNotice(null);
    setScanNotice(null);
    setStage('uploading');
    try {
      const image = await pickReceiptImage();
      if (!image) {
        setStage('choice');
        return;
      }

      const uploaded = await uploadReceiptImage(image);
      setScanNotice('영수증 원본을 내 계정의 비공개 저장소에 보관했어요. 공개 링크는 만들지 않아요.');
      setStage('analyzing');

      const analyzed = await analyzeReceiptImage(uploaded.id);
      if (analyzed.status !== 'ready') throw new Error('영수증 분석을 완료하지 못했어요.');

      setDraft(
        createReviewDraft({
          scanJobId: analyzed.id,
          sourceLabel: image.fileName ? `선택한 영수증 · ${image.fileName}` : '선택한 영수증',
        }),
      );
      setScanNotice(
        analyzed.analysisSource === 'fixture'
          ? '원본은 비공개로 저장됐어요. 분석 제공자는 아직 연결 전이라, 아래 품목은 검수 UX용 fixture 초안입니다.'
          : '원본은 비공개로 저장됐어요. 아래 AI 초안은 저장 전에 직접 확인해 주세요.',
      );
      setStage('review');
    } catch (error) {
      setScanNotice(error instanceof Error ? error.message : '영수증 사진을 준비하지 못했어요. 다시 시도해 주세요.');
      setStage('choice');
    }
  };

  const resetSheet = () => {
    setStage('choice');
    setIsSaving(false);
    setSaveNotice(null);
    setScanNotice(null);
  };

  const closeSheet = () => {
    resetSheet();
    onClose();
  };

  const openDirectAdd = () => {
    resetSheet();
    onDirectAdd();
  };

  const openLeftoverAdd = () => {
    resetSheet();
    onLeftoverAdd();
  };

  const goHome = () => {
    resetSheet();
    onGoHome();
  };

  const goInventory = () => {
    resetSheet();
    onGoInventory();
  };

  const finishConfirmation = async () => {
    if (!canConfirm) return;
    setIsSaving(true);
    setSaveNotice(null);
    const result = await onConfirm(draft);
    setIsSaving(false);
    if (result === 'confirmed') {
      setStage('complete');
      return;
    }
    setSaveNotice(
      result === 'already-confirmed'
        ? '이미 냉장고에 담은 영수증이에요. 재고 목록에서 확인해 주세요.'
        : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={closeSheet}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {stage === 'choice' ? (
            <>
              <Text style={styles.title}>빠르게 추가할까요?</Text>
              <Text style={styles.copy}>등록 방법을 고르면 다음 단계에서 직접 확인할 수 있어요.</Text>
              {scanNotice ? <Text accessibilityRole="alert" style={styles.scanNotice}>{scanNotice}</Text> : null}
              <Pressable accessibilityRole="button" onPress={startReceiptReview} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>영수증으로 등록</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={openLeftoverAdd} style={styles.optionButton}>
                <Text style={styles.optionTitle}>남은 음식 등록</Text>
                <Text style={styles.optionCopy}>조리·보관 시작일을 기준으로 직접 적어요.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={openDirectAdd} style={styles.optionButton}>
                <Text style={styles.optionTitle}>직접 추가</Text>
                <Text style={styles.optionCopy}>식재료와 남은 양을 바로 적어요.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={closeSheet} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>닫기</Text>
              </Pressable>
            </>
          ) : null}

          {stage === 'uploading' ? (
            <View style={styles.analysisBody}>
              <Text style={styles.title}>영수증 원본을 안전하게 저장하고 있어요</Text>
              <Text style={styles.analysisLead}>사진은 내 계정의 비공개 저장소에만 보관해요.</Text>
              <Text style={styles.analysisStep}>1. 파일 형식과 크기를 확인하고 있어요</Text>
              <Text style={styles.analysisStep}>2. 분석 작업을 준비하고 있어요</Text>
            </View>
          ) : null}

          {stage === 'analyzing' ? (
            <View style={styles.analysisBody}>
              <Text style={styles.title}>장 본 것을 정리하고 있어요</Text>
              <Text style={styles.analysisLead}>원본의 소유권·형식·용량을 서버에서 한 번 더 확인해요.</Text>
              <Text style={styles.analysisStep}>1. 영수증 글자를 읽었어요</Text>
              <Text style={styles.analysisStep}>2. 상품명을 식재료로 정리하고 있어요</Text>
              <Text style={styles.analysisStep}>3. 보관 위치와 권장 섭취 시점을 제안할게요</Text>
              <Text style={styles.analysisNote}>결과는 저장 전에 직접 확인할 수 있어요.</Text>
            </View>
          ) : null}

          {stage === 'review' ? (
            <>
              <Text style={styles.title}>장 본 것 확인</Text>
              <Text style={styles.copy}>{counts.included}개를 찾았어요. AI가 읽은 결과를 맞는지만 확인해 주세요.</Text>
              {scanNotice ? <Text style={styles.scanNotice}>{scanNotice}</Text> : null}
              {saveNotice ? <Text accessibilityRole="alert" style={styles.saveNotice}>{saveNotice}</Text> : null}
              <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
                {(['high', 'needs-review'] as const).map((confidence) => {
                  const sectionItems = draft.items.filter((item) => item.confidence === confidence);
                  if (!sectionItems.length) return null;
                  return (
                    <View key={confidence} style={styles.reviewGroup}>
                      <Text style={styles.groupTitle}>
                        {confidence === 'high' ? `확인됨 ${sectionItems.filter((item) => item.included).length}` : `확인 필요 ${sectionItems.filter((item) => item.included).length}`}
                      </Text>
                      {sectionItems.map((item) => (
                        <View key={item.id} style={[styles.reviewCard, !item.included && styles.reviewCardExcluded]}>
                          <View style={styles.reviewCardHeader}>
                            <View style={styles.reviewCardHeading}>
                              <Text style={styles.rawName}>원문 · {item.rawName}</Text>
                              {item.confidence === 'needs-review' ? <Text style={styles.needsReview}>AI 추정 · 확인 필요</Text> : null}
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setDraft((current) => updateReceiptDraftItem(current, item.id, { included: !item.included }))}
                              style={styles.excludeButton}>
                              <Text style={styles.excludeButtonText}>{item.included ? '제외' : '다시 포함'}</Text>
                            </Pressable>
                          </View>
                          {item.included ? (
                            <>
                              <Text style={styles.fieldLabel}>식재료 이름</Text>
                              <TextInput
                                accessibilityLabel={`${item.rawName} 식재료 이름`}
                                value={item.name}
                                onChangeText={(name) => setDraft((current) => updateReceiptDraftItem(current, item.id, { name }))}
                                style={styles.input}
                              />
                              <Text style={styles.fieldLabel}>수량</Text>
                              <TextInput
                                accessibilityLabel={`${item.rawName} 수량`}
                                value={item.quantity}
                                onChangeText={(quantity) => setDraft((current) => updateReceiptDraftItem(current, item.id, { quantity }))}
                                style={styles.input}
                              />
                              <Text style={styles.fieldLabel}>보관 위치</Text>
                              <StoragePicker
                                value={item.storage}
                                onChange={(storage) => setDraft((current) => updateReceiptDraftItem(current, item.id, { storage }))}
                              />
                              <Text style={styles.fieldLabel}>권장 섭취 시점</Text>
                              <TextInput
                                accessibilityLabel={`${item.rawName} 권장 섭취 시점`}
                                value={item.recommendedUseBy}
                                onChangeText={(recommendedUseBy) =>
                                  setDraft((current) => updateReceiptDraftItem(current, item.id, { recommendedUseBy }))
                                }
                                style={styles.input}
                              />
                              {item.labelExpiryAt ? <Text style={styles.dateNote}>포장 표기일 {item.labelExpiryAt}</Text> : null}
                            </>
                          ) : (
                            <Text style={styles.excludedCopy}>이 항목은 확정해도 냉장고에 담기지 않아요.</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canConfirm }}
                disabled={!canConfirm}
                onPress={finishConfirmation}
                style={[styles.primaryButton, !canConfirm && styles.primaryButtonDisabled]}>
                <Text style={styles.primaryButtonText}>{isSaving ? '냉장고에 담는 중…' : `${counts.included}개 냉장고에 담기`}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={closeSheet} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>아직 저장하지 않을게요</Text>
              </Pressable>
            </>
          ) : null}

          {stage === 'complete' ? (
            <View style={styles.completeBody}>
              <Text style={styles.title}>{counts.included}개를 냉장고에 담았어요.</Text>
              <Text style={styles.copy}>두부처럼 먼저 쓰기 좋은 재료는 홈 추천에서 바로 확인할 수 있어요.</Text>
              <Pressable accessibilityRole="button" onPress={goHome} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>오늘의 한 끼 보기</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={goInventory} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>냉장고 목록으로</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29,33,28,0.35)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', backgroundColor: '#FAF8F4', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9C7C1', marginBottom: 18 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#1D211C' },
  copy: { marginTop: 8, color: '#4D554B', fontSize: 14, lineHeight: 21 },
  scanNotice: { marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: '#EEEBFF', color: '#51459C', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  saveNotice: { marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: '#FFF1DC', color: '#8A5311', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  primaryButton: { minHeight: 52, marginTop: 20, borderRadius: 14, backgroundColor: '#2F6B4F', alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: '#A5BCA9' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  optionButton: { marginTop: 10, borderRadius: 14, padding: 15, backgroundColor: '#FFFFFF' },
  optionTitle: { color: '#1D211C', fontSize: 15, fontWeight: '700' },
  optionCopy: { marginTop: 3, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  secondaryButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#2F6B4F', fontSize: 14, fontWeight: '600' },
  analysisBody: { paddingVertical: 18 },
  analysisLead: { marginTop: 10, color: '#6C7168', fontSize: 13, lineHeight: 19 },
  analysisStep: { marginTop: 18, color: '#1D211C', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  analysisNote: { marginTop: 22, color: '#2F6B4F', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  reviewScroll: { maxHeight: 480, marginTop: 16 },
  reviewContent: { paddingBottom: 6 },
  reviewGroup: { marginBottom: 18 },
  groupTitle: { marginBottom: 8, color: '#4D554B', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  reviewCard: { padding: 14, marginBottom: 10, borderRadius: 16, backgroundColor: '#FFFFFF' },
  reviewCardExcluded: { backgroundColor: '#F1EEE7' },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  reviewCardHeading: { flex: 1 },
  rawName: { color: '#6C7168', fontSize: 12, lineHeight: 17 },
  needsReview: { marginTop: 4, color: '#B56D14', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  excludeButton: { minHeight: 32, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F1EEE7', justifyContent: 'center' },
  excludeButtonText: { color: '#4D554B', fontSize: 12, fontWeight: '700' },
  fieldLabel: { marginTop: 12, marginBottom: 6, color: '#4D554B', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  input: { minHeight: 46, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#F7F7F4', color: '#1D211C', fontSize: 14 },
  storageRow: { flexDirection: 'row', gap: 6 },
  storageOption: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: '#F1EEE7', alignItems: 'center', justifyContent: 'center' },
  storageOptionSelected: { backgroundColor: '#E4F0E7', borderWidth: 1, borderColor: '#2F6B4F' },
  storageText: { color: '#6C7168', fontSize: 12, fontWeight: '600' },
  storageTextSelected: { color: '#2F6B4F' },
  dateNote: { marginTop: 9, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  excludedCopy: { marginTop: 12, color: '#6C7168', fontSize: 12, lineHeight: 17 },
  completeBody: { paddingTop: 4 },
});
