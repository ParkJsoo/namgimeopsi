const userNotices = new Set([
  '영수증 사진을 고르려면 사진 접근을 허용해 주세요.',
  'JPG, PNG, HEIC 형식의 영수증 사진만 올릴 수 있어요.',
  '영수증 사진은 10MB 이하로 선택해 주세요.',
  '영수증 분석 결과를 확인하지 못했어요.',
  '영수증 분석을 완료하지 못했어요.',
]);

/** Only known user-facing notices may cross the service/UI boundary. */
export function getReceiptScanErrorNotice(error: unknown): string {
  if (error instanceof Error && userNotices.has(error.message)) return error.message;
  return '영수증 사진을 준비하지 못했어요. 인터넷 연결을 확인한 뒤 영수증으로 등록을 다시 눌러 주세요.';
}
