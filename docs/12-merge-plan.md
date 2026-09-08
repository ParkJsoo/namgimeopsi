# 기능별 PR 통합 계획 — 2026-09-08

사용자가 iPhone QA·전문 에이전트 리뷰 이후 push와 병합을 논의하고, 계획과 PR 구분을 요청했다. 원격 main `83254f7`에는 아직 앱 구현이 없으므로 전체 63개 후속 커밋을 의존성 순서에 따라 5개 PR로 나눈다. 통합 계획 문서 커밋은 마지막 PR에 포함한다.

## PR 경계

| 순서 | 브랜치 | 기존 코드 범위 (이전 끝 제외 → 이번 끝 포함) | 결과 |
| --- | --- | --- | --- |
| 1 | `pr/01-local-core` | `83254f7 → 5541368` (20개) | Expo 앱, 로컬 재고·남은 음식, 결정론적 추천, fixture 검수·입고 |
| 2 | `pr/02-inventory-sync` | `5541368 → dc168e0` (9개) | 익명 사용자별 재고 동기화, outbox, RLS, 멱등 영수증 입고·legacy 복구 |
| 3 | `pr/03-receipt-scan` | `dc168e0 → f495c68` (5개) | private 이미지 업로드, 소유자 검증·scan job, fixture 서버 분석 |
| 4 | `pr/04-cooking-sessions` | `f495c68 → 3275fc9` (2개) | 조리 세션의 부분·전량 차감, 원자적 RPC·outbox |
| 5 | `feat/live-recommendations` | `3275fc9 → 4857a6e` (27개) 및 통합 문서 | 모바일 입력·닫기·저장 안정화, 포트폴리오 문서, Android/iPhone QA·preview, 전문 리뷰 수정 |

각 범위는 선형 조상 관계이며 중복·누락이 없다. 처음에는 바로 앞 브랜치를 base로 PR을 생성해 해당 범위만 리뷰할 수 있게 한다. PR 1부터 main에 merge commit으로 병합하고, 다음 PR의 base를 main으로 바꾼 뒤 이어서 병합한다. squash/rebase·force push는 사용하지 않는다. 전체 병합 전에는 의존 브랜치를 삭제하지 않는다.

PR 2의 공통 재시도 저장 복구와 PR 4의 빈 잔량 차단은 PR 5에서 보완됐다. 중간 main을 배포하지 않고 마지막 PR까지 하나의 통합 작업으로 완료한다. 이 작업은 Git 통합이며 앱 배포, OCR 연결, 원격 DB 변경을 하지 않는다.

## 검증 근거와 한계

- 전문 에이전트가 5개 끝 지점의 Git 원문을 각각 인메모리 TypeScript 호스트로 검사해 진단 0건을 확인했다. 현재 설치된 의존성을 사용했으며 각 과거 lockfile로 별도 `npm ci`를 한 결과는 아니다. Expo·React Native·TypeScript 버전은 전 구간 동일하다. PR 1·2의 기존 의존성 중 최종 설치본과 다른 버전은 `js-yaml` 4.3.1 → 4.3.2다.
- 각 시점 도메인 테스트: PR 1은 10개, PR 2·3은 13개, PR 4·5는 14개 통과했다. PR 1·2에는 ESLint 설치·설정이 없으므로 lint 통과를 주장하지 않는다. ESLint 설정은 PR 3부터 포함된다.
- PR 3 이후 서버 함수 원문은 최종 코드와 동일하며 `npx --yes deno check supabase/functions/analyze-receipt/index.ts`를 별도로 통과했다. 앱의 tsconfig는 Edge Function을 검사하지 않는다.
- 최종 코드 `4857a6e`에서 domain 14개, inventory 저장 실패·복구 6개, receipts 날짜·세션·진행 중 닫기, recipes 빈 입력·공백·부분 선택 회귀, `tsc --noEmit`, lint를 통과했다. 전문 에이전트 3명 리뷰에서 발견한 P2 두 건을 수정하고 독립 재리뷰에서 추가 차단 이슈를 찾지 못했다.
- 최신 iOS Release는 코드 수정 `e45f128`·`0e49aa6`를 포함한다. 실제 iPhone·시뮬레이터 설치, Metro 없는 실행, 실제 iPhone XCTest 회귀 및 재고·원장 불변을 확인했다. 증거와 빌드 해시는 `docs/09-device-qa.md`, `docs/11-ios-preview.md`에 있다. 과거 구간 각각의 기기 검증으로 해석하지 않는다.
- Android 설치 APK는 위 두 iOS 후속 수정 전 버전이다. Galaxy QA·기존 preview 결과는 `docs/10-android-preview.md`의 버전 범위에 한정된다.
- 저장소에 GitHub Actions CI가 없으므로 로컬 검사와 기록된 기기 QA가 검증 근거다. 테스트 실패·충돌·새 필수 검사가 발생하면 해결 후 병합한다.

## 완료 확인 기준

1. 각 PR이 의도한 범위만 포함하며 지정 head SHA를 확인하고 병합한다.
2. 최종 원격 main이 마지막 feature tip을 조상으로 포함하고, 전체 Git tree가 해당 tip과 동일해야 한다.
3. 통합 문서 외 앱·테스트·설정·migration은 검증된 `4857a6e`와 동일해야 한다.
4. 로컬 작업 상태가 clean이고 원격 결과와 일치하는지 확인한다. 기존 로컬 main의 미공개 10개 커밋은 feature의 조상으로 포함되므로 조상 관계를 확인한 후 fast-forward만 허용한다.
5. 기존 앱·테스트 재고 및 OCR 미연결 fixture 고지를 그대로 유지한다.

## PR 링크

1. [로컬 핵심 흐름 #1](https://github.com/ParkJsoo/namgimeopsi/pull/1)
2. [재고 동기화 #2](https://github.com/ParkJsoo/namgimeopsi/pull/2)
3. [영수증 업로드·fixture 분석 #3](https://github.com/ParkJsoo/namgimeopsi/pull/3)
4. [조리 세션 차감 #4](https://github.com/ParkJsoo/namgimeopsi/pull/4)
5. [모바일 안정화·QA #5](https://github.com/ParkJsoo/namgimeopsi/pull/5)

실제 병합 상태는 각 PR의 GitHub 상태를 확인한다.
