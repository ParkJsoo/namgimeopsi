# 120초 데모 제작 결과 — 2026-09-14

리뷰에서 확인한 날짜 삭제·추천 설명 문제를 수정한 `454ac3a` Release로 본촬영하고 한국어 자막 편집본을 만들었다. 실기기·실제 OCR·카메라 촬영을 시연한 영상은 아니다.

## 결과물

- 최종 로컬 영상: `.expo/demo-production/final/namgimeopsi-demo-ko.mp4`
- H.264 / 1920×1080 / 30fps / 3,600프레임 / 120.000초 / 무음. 앱의 세로 화면을 왼쪽에 유지하고 오른쪽에 한국어 설명을 배치했다.
- SHA-256: `29a203a37b8fb85f3b9f24605fab50b96457d5eef78745c3a1a111f054f9eca0`
- [대표 이미지](qa-artifacts/production/poster.png), [최종 잔량](qa-artifacts/production/final-inventory.png), [장면별 검수표](qa-artifacts/production/contact-sheet.jpg), [설명 자막 원문](qa-artifacts/production/captions.ko.srt), [시간표](qa-artifacts/production/timeline.json).
- 영상 파일은 Git 제외 로컬 산출물이다. clone으로 전달되지 않으며, 외부 업로드·공개 링크·push는 아직 없다. 커밋된 이미지·자막·기록으로 제작 근거를 남긴다.

## 실제 촬영과 데이터 검증

전용 `Namgimeopsi Demo iPhone 13 mini` / iOS 26.5 / UDID `891FA725-0B92-41D6-95B0-FC03729146B4`만 사용했다. 입력은 XCTest 실제 터치와 한글 키보드로 수행했다.

빈 재고 → 테스트 영수증 선택 → 원문·fixture 고지 → 참기름 `조금 남음` 수정·돼지고기 제외 → 5개 확정 입고 → 남은 카레 1인분 등록 → 추천의 날짜 경과 안내 → 두부 반 모·애호박 전량 소비 → 냉장고 결과 순서다. XCTest `take2.xcresult`는 성공했다.

- batch: `receipt-scan-1789381976411-3fwr1g5s`
- 카레: `inventory-1789382020724`, 권장일 `2026-09-15`, 보관 시작 `2026-09-14T10:33:40.724Z`
- 조리 session: `cooking-1789382037807-3`
- 최종 저장 lot 6개 / 활성 5개 / 원장 7건(입고 5 + 부분 소비 1 + 전량 소비 1) / outbox 0.
- 서버의 자기 사용자 재고·원장 조회로 수량과 날짜를 확인했다. 재실행 전후 캐시를 ID별로 비교했고 ISO timestamp의 `Z`/`+00:00`와 optional null 표현을 정규화한 뒤 동일함을 확인했다.
- 이번 촬영 데이터는 최종 영상 근거로 유지한다. 앞서 삭제한 QA 재고를 복원한 것이 아니라 새로 입고한 별도 batch다.

## 편집과 검수

- 원본은 `.expo/demo-production/final/take2.mp4`이며 기술 시험용 `smoke-10s-playback.mp4`는 사용하지 않았다.
- `take1`은 사진 선택기가 이미 열린 상태에서 중복 버튼을 찾은 자동화 실패로 중단했다. 이 take는 최종 편집에 사용하지 않았다.
- 원본 가변 프레임을 먼저 고정 30fps로 변환했다. 장면 경계·스크롤을 축약하고 마지막 실제 프레임을 유지해 설명 시간을 확보했다. 상태·수량을 합성하거나 다른 데이터 화면으로 교체하지 않았다.
- 첫 편집에서는 다음 화면을 유지하는 컷과 마지막 프레임 누락을 발견했다. CFR 원본과 조정한 컷 경계로 재편집해 10개 장면의 대표 프레임을 모두 확인했다.
- 최종 파일의 전체 ffmpeg 디코딩 오류 없음. 10개 장면의 화면·설명·한글 가독성을 확인했다. QuickTime에서 최종 파일을 0초부터 실제 재생했고, 중간 진행 뒤 `current time=120.0 / playing=false`로 종료까지 확인했다. 네이티브 Computer Use 연결 실패로 플레이어 UI 조작은 AppleScript를 사용했으며 시각 검수는 추출한 실제 프레임으로 수행했다.
- 입력·스크롤·대기 구간 축약, 무음·한국어 자막, iOS 시뮬레이터·OCR fixture 고지를 영상에 유지했다. 고정 샘플의 과거 날짜를 숨기지 않았다.

## 재현과 남은 작업

원본·XCTest 로그·타임스탬프가 있는 현재 컴퓨터에서는 `.expo/demo-production/final/venv/bin/python scripts/demo/edit-production.py`로 동일 구성의 영상을 다시 만들 수 있다. Pillow는 영상 제작용 격리 venv에만 설치했으며 앱 의존성을 추가하지 않았다. 먼저 `take2.mp4`를 fps=30, 마지막 실제 프레임 10초 유지 방식으로 `take2-cfr.mp4`에 변환해야 한다. 스크립트는 이 촬영의 장면 이름과 시간표에 맞춰져 있다.

남은 일은 완성본에 대한 사용자 검토와 공개처 결정·업로드, 이후 공개 링크 연결이다. 실기기 경계 QA·사용자 관찰·OCR 연결은 이번 영상 완성과 구분한다.
