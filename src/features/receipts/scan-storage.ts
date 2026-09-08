import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { ensureInventoryUser } from '../inventory/supabase-store';

const receiptImageBucket = 'receipt-images';
export const maxReceiptImageBytes = 10 * 1024 * 1024;
const supportedReceiptImageTypes = new Set(['image/jpeg', 'image/png', 'image/heic']);

type ScanJobRow = {
  id: string;
  storage_path: string;
  status: 'uploaded' | 'analyzing' | 'ready' | 'failed';
  analysis_source: 'fixture' | 'ocr' | null;
};

export type ReceiptScanJob = {
  id: string;
  storagePath: string;
  status: ScanJobRow['status'];
  analysisSource: ScanJobRow['analysis_source'];
};

export type ReceiptImageSelection = Pick<ImagePicker.ImagePickerAsset, 'uri' | 'fileName' | 'fileSize' | 'mimeType'>;

function getExtension(mimeType: string) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/heic') return 'heic';
  return 'jpg';
}

function createScanId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `scan-${Date.now()}-${random}`;
}

function mapScanJob(row: ScanJobRow): ReceiptScanJob {
  return {
    id: row.id,
    storagePath: row.storage_path,
    status: row.status,
    analysisSource: row.analysis_source,
  };
}

/** 사진 권한을 요청하고 영수증 한 장만 선택한다. 취소는 정상적인 사용자 선택이다. */
export async function pickReceiptImage(): Promise<ReceiptImageSelection | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('영수증 사진을 고르려면 사진 접근을 허용해 주세요.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
    selectionLimit: 1,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;
  return asset;
}

/** 원본은 사용자 ID 폴더의 private Storage에만 저장하고, 공개 URL을 만들지 않는다. */
export async function uploadReceiptImage(selection: ReceiptImageSelection): Promise<ReceiptScanJob> {
  const mimeType = selection.mimeType ?? 'image/jpeg';
  if (!supportedReceiptImageTypes.has(mimeType)) {
    throw new Error('JPG, PNG, HEIC 형식의 영수증 사진만 올릴 수 있어요.');
  }

  const response = await fetch(selection.uri);
  const body = await response.arrayBuffer();
  // 선택기 메타데이터가 아닌 실제 upload 본문 크기를 원장과 서버 검증에 함께 쓴다.
  const byteSize = body.byteLength;
  if (!byteSize || byteSize > maxReceiptImageBytes) {
    throw new Error('영수증 사진은 10MB 이하로 선택해 주세요.');
  }

  const user = await ensureInventoryUser();
  const scanId = createScanId();
  const storagePath = `${user.id}/${scanId}.${getExtension(mimeType)}`;
  const { error: uploadError } = await supabase.storage.from(receiptImageBucket).upload(storagePath, body, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('scan_jobs')
    .insert({
      id: scanId,
      user_id: user.id,
      storage_path: storagePath,
      mime_type: mimeType,
      byte_size: byteSize,
      status: 'uploaded',
    })
    .select('id, storage_path, status, analysis_source')
    .single();

  if (error || !data) {
    // scan job 생성이 실패한 경우에만 방금 올린 private 원본을 되돌린다.
    await supabase.storage.from(receiptImageBucket).remove([storagePath]);
    throw error ?? new Error('영수증 분석 작업을 만들지 못했어요.');
  }
  return mapScanJob(data as ScanJobRow);
}

/** Edge Function은 소유자·MIME·용량을 다시 검증한 뒤에만 분석 결과를 ready로 바꾼다. */
export async function analyzeReceiptImage(scanId: string): Promise<ReceiptScanJob> {
  const { data, error } = await supabase.functions.invoke('analyze-receipt', { body: { scanId } });
  if (error) throw error;
  if (!data || typeof data !== 'object' || typeof data.id !== 'string') {
    throw new Error('영수증 분석 결과를 확인하지 못했어요.');
  }
  return data as ReceiptScanJob;
}
