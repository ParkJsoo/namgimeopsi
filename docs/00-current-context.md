# Current context

> 새 세션에서 가장 먼저 읽는 작업 인계 문서입니다. 상태가 바뀌면 이 파일도 같이 갱신합니다.

## 최신 작업 — 2026-09-15 홈 메뉴·README 미완성 정리

- `main` / `0555bd1`의 clean HEAD에서 `fix/home-menu-copy`를 만들었다.
- 홈은 현재 추천 최대 3개를 모두 표시하므로 별도 전체 목록 없이 남아 있던 `모두 보기` 문구와 미사용 스타일을 제거했다. 추천 개수·점수화·메뉴 선택/조리 완료 흐름은 유지한다. 와이어프레임의 해당 문구도 현재 결정과 맞췄다.
- README의 “원문을 고칠 수 있다”는 설명을 수정했다. 영수증 원문은 읽기 전용으로 보존하고, 식재료 이름·수량·보관 위치·권장 섭취일을 수정할 수 있음을 구분한다.
- 실기기는 다른 프로젝트에서 사용 중이므로 접근하지 않는다. 이번 변경은 로컬 코드/문서 검증으로 확인하며 시뮬레이터·Figma·다른 워크스페이스·원격 데이터에 접근하지 않는다. Demo 데이터·기존 영상·README 영상/이미지 링크는 보존한다.
- 검증: 기존 domain 14, recipes 7, inventory hook 17 + 날짜 9 + 화면 6, TypeScript·lint·diff 검사를 통과했다. 간단한 문구/표시 정리여서 새 테스트·기기 설치는 추가하지 않았다. 변경은 로컬 커밋으로 남기며 push·PR·main 병합은 하지 않았다.
- 다음은 접근성 선택 상태/라벨·실제 VoiceOver, 모바일 가독성, 호환 의존성 정비, 타깃 사용자 관찰이다. `모두 보기`와 README 원문 문구는 완료 항목이며, 아래 인계의 후순위 목록은 당시 상태다.

## 최신 인계 — 2026-09-15 P2 main 통합·서버 배포 완료

- **사용자 승인/통합:** “다음” 단계인 최종 검토 → push·PR·main 병합 → Edge 배포·실제 웹 검증을 승인받아 완료했다. [PR #11](https://github.com/ParkJsoo/namgimeopsi/pull/11)을 merge commit으로 병합한 main은 `bedf5ef`이며, 검증한 `45e8893`과 파일 트리가 동일하다. P2 수정 5개·기존 점검 인계 2개 커밋을 모두 포함한다. 직접 최종 검토에서 추가 병합 차단 결함은 찾지 못했다. 원격 Actions 워크플로와 PR check는 0개이며 기존 로컬 통과 결과와 구분한다.
- **배포:** 남김없이 프로젝트 `xnfkzhceqvkhrfnahljb`의 `analyze-receipt`를 버전 2 → **3 / ACTIVE**로 배포했다. `verify_jwt=true`를 유지했고, 배포 후 내려받은 `index.ts`가 main 소스와 정확히 일치했다. 배포 번들 SHA-256 `098da8b66acbed772ee272bde3e9aa1051ffec56dc2e503473233503e824ce35`. 스키마·RLS·OCR 제공자 설정은 변경하지 않았다.
- **실제 웹 검증 완료:** Chrome의 별도 `http://127.0.0.1:8787` 검증 페이지에서 새 익명 세션으로 실행했다. 인증/JSON/client-info/retry/trace 헤더를 포함한 브라우저 요청의 preflight와 읽을 수 있는 400·404 응답, 합성 PNG 비공개 업로드 → SDK 분석 `ready / fixture` → 저장 결과 조회 → ready 재호출을 통과했다. 사용자 확정 전 재고·원장 0건, 무인증 public 이미지 요청 HTTP 400을 확인했다. 별도 HTTP 검사에서 OPTIONS 204와 허용 헤더·POST/OPTIONS를 확인했고, 인증 없는 POST는 기존 게이트웨이가 401로 차단했다. 네이티브 촬영/검수 E2E나 실제 OCR 정확도 검증은 아니다.
- **테스트 정리:** 이번에 만든 익명 사용자 `3faa7e35-94d7-4357-a150-6fc0d2f874d4`와 scan `p2-cors-f79eb16c-2a92-4482-b16c-c0b4f780861a`만 대상으로 이미지 제거·로그아웃·scan/user 삭제를 수행했다. 해당 사용자·scan·이미지·재고·원장 잔여 건수는 모두 0이다. 전용 브라우저 탭과 로컬 검증 서버는 종료했다. 실행용 페이지/JSON 근거는 Git 제외 `.expo/final-check/p2-web-verify-server.mjs`, `p2-browser-result.json`에 있고 별도 리뷰 보고서는 만들지 않았다.
- **보존:** 실기기·시뮬레이터·Figma·다른 프로젝트/워크스페이스에 접근하지 않았다. Demo 데이터·공개 README/영상/이미지는 유지하며 두 로컬 영상의 기존 SHA-256 일치를 다시 확인했다.
- **다음:** 이번 P2 5건의 코드 통합·배포·원격 웹 검증은 완료됐다. 접근성 선택 상태/라벨과 실제 VoiceOver, 모바일 가독성, `모두 보기`, README의 원문 수정 가능 문구, 호환 가능한 의존성 정비, 타깃 사용자 관찰이 후순위다. 기존 본촬영·영상 평가·재진입 QA를 처음부터 반복하지 않는다. 새 네이티브 설치는 별도 요청 시 QA 전용 시뮬레이터로 검토한다.

## 직전 작업 — 2026-09-15 P2 5건 로컬 수정·회귀 완료

- **Git/인계:** `docs/final-check-handoff` / `982ab26`의 clean HEAD에서 `fix/final-check-p2`를 만들었다. 인계 커밋을 모두 포함하며 기록된 ①→⑤ 순서로 수정·검증·작은 로컬 커밋을 진행했다. push·PR·병합은 하지 않았다. 아래 이전 인계/점검의 “미수정”은 당시 상태다.
- **① 수량 검증·outbox 복구:** 직접 추가/수정의 공백 수량을 화면과 hook에서 차단한다. 이미 저장된 잘못된 upsert는 같은 lot의 후속 정상 수정/제외로 대체된 경우에만 정리한다. 다른 lot와 이벤트·영수증/조리 트랜잭션 순서는 보존한다. 정상 수정이 없는 공백 수량이나 중간 원장 의존성은 자동 추정/삭제하지 않는다. 사용자 수정/제외 → 재시도, 기존 수정 작업이 쌓인 채 재실행하는 경로를 검증했다.
- **② 영수증 저장:** 저장 중 이름·수량·날짜·보관 위치·포함/제외·중복 제출·닫기를 막고 완료 수량은 제출한 스냅샷에서 계산한다. 실패/예외 뒤에는 같은 초안을 다시 수정할 수 있다. 업로드/분석 단계의 닫기·늦은 응답 무효화는 유지한다.
- **③ 초기 읽기 재시도:** v2·legacy·outbox 캐시 읽기 실패를 잡아 시작 화면에 `다시 불러오기`를 제공한다. 읽기 성공 전 캐시 쓰기·원격 접근을 하지 않고, 연속 재시도는 하나로 합친다. 오프라인 초기 쓰기 실패도 잡아 읽은 재고와 대기열을 보존한다.
- **④ 공통 오류 안내:** 저장/동기화 안내와 재시도를 홈·냉장고 공통 영역에 노출한다. `저장 또는 동기화하지 못했어요`로 로컬 쓰기 실패까지 안내하며, 오류 메시지에 alert 역할을 제공한다.
- **⑤ 로컬 웹 CORS:** `analyze-receipt`의 OPTIONS는 인증/데이터 접근 없이 204로 처리한다. SDK CORS 헤더를 정상·오류 응답에 적용하고 메서드는 POST/OPTIONS로 제한했다. Edge SDK import는 앱과 같은 `2.112.4`로 고정한다. 예상 밖 예외도 원문을 노출하지 않는 JSON 500으로 반환한다. 기존 인증·소유권 검사와 fixture-only 동작을 유지한다.
- **회귀 근거:** 보존된 세 재현 스크립트에서 원래 결함을 확인하고 정식 검사에 새 경계를 추가했다. 수량/복구 4건, 초기 읽기/쓰기 4건, 영수증 중복 제출, CORS 13건은 수정 전 실패를 확인했다. 수정 후 `test:domain` 14, `test:inventory` hook 17 + 날짜 9 + 화면 6, `test:receipts` 날짜·세션 + 컴포넌트 7, `test:recipes` 7, 새 `test:edge` 13, TypeScript·lint·Deno check·웹 export(`.expo/final-check/p2-web-export`)를 통과했다. 테스트는 실제 hook/컴포넌트/handler와 모의 저장소·네트워크 경계를 사용하며 기기/원격 E2E가 아니다.
- **보존/접근:** 실기기·시뮬레이터·Figma·다른 프로젝트/워크스페이스·원격 데이터에 접근하지 않았다. Demo 본촬영 데이터와 공개 README/영상/이미지는 수정하지 않았다. 두 로컬 영상 SHA-256은 기존 `29a203…9eca0` / `fd3359…542b`와 일치한다. `.expo/final-check/`의 원래 재현 스크립트도 그대로 보존했다. 별도 리뷰 보고서는 만들지 않았다.
- **다음:** 변경 검토·통합, CORS 서버 배포와 실제 원격 웹 preflight/분석 호출 검증은 아직 하지 않았다. 새 네이티브 설치·화면/VoiceOver 검증도 미실시다. 기존 본촬영·영상 평가·재진입 QA를 반복하지 않는다. 접근성·모바일 가독성·`모두 보기`·README 원문 수정 문구·호환 의존성 정비·사용자 관찰은 기존 후순위로 유지한다.

## 이전 인계 — 2026-09-15 점검 종료 (수정 전)

- **현재 단계:** 공개 README·영상 연결과 사용자 Chrome 재생 확인 완료. 전체 main 점검에서 발견한 P2 5건은 **모두 미수정**이다. 이번 세션은 점검·인계까지만 수행했고, 다음 세션에서 수정한다. 완료한 본촬영·영상 평가·재진입 QA를 처음부터 반복하지 않는다.
- **Git:** 현재 브랜치는 `docs/final-check-handoff`. `main`/마지막 확인 `origin/main`은 `0bfb0ef`, 점검 결과는 로컬 커밋 `12f5946`과 그 뒤 인계 커밋에 있다. 이 브랜치는 아직 push하지 않았다. 새 작업은 이 브랜치의 인계 변경을 포함해서 시작하고, main만 체크아웃해 인계를 버리지 않는다. 현재 커밋은 `git log -3 --oneline`, 변경 여부는 `git status --short --branch`로 확인한다.
- **첫 순서:** AGENTS.md → 이 문서 전체 → 제품·UX·기술/UI 기준 → 아래 최신 점검을 읽는다. 새 수정 브랜치를 현재 HEAD에서 만들고, P2를 재현 → 회귀 테스트 추가 → 수정 → 관련 검증 → 작은 로컬 커밋 순으로 처리한다.
- **수정 순서/위치:** ① 공백 수량 검증과 이미 막힌 outbox 복구 (`src/app/index.tsx`, `inventory/use-inventory.ts`, `sync-queue.ts`) ② 영수증 저장 중 편집 차단·완료 수량을 확정 스냅샷으로 고정 (`receipts/ReceiptEntrySheet.tsx`) ③ 초기 캐시 읽기 실패 재시도와 ④ 홈/재고 공통 저장 오류 안내 (`use-inventory.ts`, `index.tsx`) ⑤ 웹 CORS (`supabase/functions/analyze-receipt/index.ts`). 서버 배포·실제 웹 호출 검증은 로컬 수정 검증과 구분한다.
- **같은 컴퓨터의 재현 근거:** `node .expo/final-check/quantity-queue-repro.mjs`, `node .expo/final-check/receipt-pending-repro.mjs`, `node .expo/final-check/hydration-read-repro.mjs`. 세 스크립트는 실제 hook/컴포넌트와 모의 경계를 사용하고, 현재 결함이 재현되면 종료 코드 0·`REPRO`를 출력한다. 수정 후 통과할 회귀 테스트 자체가 아니므로 예상 결과를 바꿔 정식 테스트에 반영한다. Git 제외 파일이며 이 컴퓨터에 보존했다. CORS는 별도 재현 파일이 없으므로 OPTIONS handler 회귀를 추가한다.
- **검증:** 관련 inventory/receipts/recipes 검사를 먼저 실행하고, 통합 시 `npm run test:domain`, `npm run test:inventory`, `npm run test:receipts`, `npm run test:recipes`, `npx tsc --noEmit`, `npm run lint`를 확인한다. 웹 CORS 수정은 preflight·정상/오류 응답의 허용 헤더를 확인한다. 현재 기존 검사들은 통과하지만 새 P2 경계를 포함하지 않는다.
- **보존/접근 경계:** 실기기·Figma·다른 프로젝트/워크스페이스 접근 금지. 필요할 때만 QA 전용 시뮬레이터 UDID `6B38D865-7C34-45E2-9A8E-D425754394D9`를 명시한다. Demo UDID `891FA725-0B92-41D6-95B0-FC03729146B4`의 본촬영 데이터와 두 로컬 영상, 공개 영상 자산을 보존한다. `booted`·전체 종료·일괄 초기화 금지. 이번 점검에서는 기기·서버 데이터를 조회/변경하지 않았다.
- **후순위:** 접근성 선택 상태·라벨/실제 VoiceOver, 모바일 가독성, `모두 보기`, README 원문 수정 가능 문구 정정, 호환 가능한 의존성 정비·사용자 관찰. 별도 리뷰/메모 문서는 만들지 않으며, 상태와 남은 작업은 이 파일에만 기록한다.

## 이전 점검 — 2026-09-15 전체 main 최종 점검 (수정 전)

- 기준 `main` / `0bfb0ef`는 원격과 일치·clean이었다. 사용자 요청으로 데이터 정합성, 백엔드·보안, UX·접근성 코드 전문가 3명과 전체 현재 구현을 점검했다. 최근 변경 검토보다 넓은 예외 경계에서 아래 P2 5건을 확인했으며 아직 수정하지 않았다. 기존 재진입 수량 수정은 유지됐다.
- **우선 수정:** (1) 직접 추가/수정의 공백 수량이 DB CHECK에 거부되면 첫 outbox 작업이 남아 이후 정상 수정·삭제까지 막힘. (2) 영수증 저장 중 제외/이름 수정이 가능해 제출 6개인데 완료 안내는 5개로 달라짐. (3) 초기 AsyncStorage 읽기 실패가 예외 경계 밖이라 로딩에서 벗어나지 못함. 실제 hook/컴포넌트에 모의 저장소·응답을 연결해 재현했고 메인도 재확인했다. 재현 스크립트는 Git 제외 `.expo/final-check/`에 있다.
- **추가 P2:** (4) 동기화 오류/재시도 UI가 홈 분기 안에만 있어 재고 탭에서 저장 실패를 알 수 없음(코드 경로 확인). (5) 로컬 `analyze-receipt`가 OPTIONS를 405로 거부하고 CORS 헤더가 없어 이 소스를 그대로 배포한 웹 분석 경로가 차단됨(handler 로컬 재현). 실제 원격 배포·게이트웨이는 조회하지 않았으므로 현재 서버 재현으로 표현하지 않는다.
- 기존 domain 14, inventory 8 + 날짜 9, recipes 7, receipts 검사 통과. 위 새 예외는 기존 자동 검사 범위 밖이었다. 앱 소스는 직전 타입·lint·웹 export 통과 버전과 같다. 원격 CI 워크플로는 0개, 추적 Markdown의 누락된 로컬 링크는 0개, 현재 README HTML은 영상 1개·이미지 3개를 포함한다.
- 후속 보완: 다른 선택 컨트롤의 접근성 상태·추가 버튼 라벨, 실제 VoiceOver·모바일 표시 확인, 작동하지 않는 `모두 보기`, README의 읽기 전용 원문을 수정 가능하다고 적은 문장. 제품 효과·사용자 이해도는 아직 측정하지 않았다. Chrome/browser·native pipe 연결 실패로 새 화면 기반 UX 감사는 수행하지 않았다. 사용자 Chrome 재생 확인과 이전 영상 전문 평가는 유지한다.
- 의존성 `npm audit --omit=dev`: high/critical 0, moderate 14개는 decode-uri-component와 uuid의 advisory 2개가 전이된 결과다. 전자는 런타임 트리에 있으나 앱의 취약 경로 도달성 미확정, 후자는 확인한 Expo xcode 도구의 v4 호출이 advisory의 v3/v5/v6 조건과 다르다. 호환 가능한 정비를 검토하며 강제 다운그레이드는 실행하지 않았다.
- 앱·서버·Demo 데이터·영상·공개 README를 변경하지 않았다. 별도 리뷰 문서는 만들지 않고 상태와 다음 수정만 여기에 반영한다. 다음은 수량 검증/기존 잘못된 outbox 복구 → 저장 중 영수증 스냅샷 고정 → 초기 읽기 재시도·공통 오류 노출 → 웹 CORS 수정과 각각의 회귀 검증이다.

## 최신 작업 — 2026-09-15 README 데모 게시

- 사용자가 제안한 README 구성(효용 설명 → GitHub 첨부 영상 → 핵심 화면 3장)을 승인했다. 확인한 P3 개선본을 이 저장소의 GitHub 첨부 자산으로 업로드하고 README에 게시하는 범위이며, 아래 영상 업로드 보류보다 우선한다.
- 시작 상태는 PR #7 병합 후 `main` / `16d2c4d`, 원격과 일치·clean이다. [PR #8](https://github.com/ParkJsoo/namgimeopsi/pull/8)의 `docs/readme-demo`에서 README에 효용 설명·영상·본촬영 검수/추천/최종 잔량 이미지 3장을 추가했다. 실제 병합 상태는 PR 링크를 따른다. 앱·서버·Demo 데이터와 두 로컬 영상은 유지했다.
- 공개 영상: https://github.com/user-attachments/assets/cdec4e42-c54b-443c-969c-5452c6ed7d70 — P3 개선본, 120초 / 1080p / H.264 / 3,309,704바이트. 인증 없는 다운로드와 원본 SHA-256 `fd3359541160713b0430eec2c90d909054579935367e4c126e3a8f984526542b` 일치를 확인했다. MP4는 GitHub 첨부 자산이며 Git에는 넣지 않았다.
- README의 로컬 링크와 이미지 원본을 확인했고, GitHub Markdown API가 영상 플레이어 1개·핵심 이미지 3개를 렌더링하는 것을 확인했다. 브라우저 제어 연결이 없어 실제 GitHub 플레이어 클릭·전체 화면·모바일 페이지 시각 검수는 미실시다. 기존 로컬 연속 재생·375/768/1280px 축소 검수와 구분한다. 영상 환경/fixture/촬영일/이후 UI 미포함을 README에 명시했다.
- 사용자가 Chrome의 GitHub 저장소 화면에서 영상이 정상 재생됨을 확인했다. 이는 사용자 확인이며 에이전트의 브라우저 직접 검수와 구분한다. README의 `다음 단계` 섹션과 마지막 MVP 범위 안내 문장은 사용자 요청으로 [PR #9](https://github.com/ParkJsoo/namgimeopsi/pull/9)에서 삭제·병합했다.
- 다음: 모바일 가독성을 확인하고, 모바일 시청 비중에 따라 핵심 장면 확대·짧은 소개본을 검토한다. VoiceOver와 타깃 사용자 관찰은 별도 후속이다. 별도 리뷰 문서는 만들지 않았다.

## 최신 인계 — 2026-09-15 병합 검증·영상 전문 평가

- **최신 사용자 승인:** 영상 확인 후 전문 에이전트와 데모 가치·내용·편집 품질을 평가하고, 병렬로 현재 브랜치 push → PR → 변경·CI 확인 → main 병합까지 진행하도록 요청했다. 아래 이전 push·PR 보류보다 이 승인이 우선한다. 영상 외부 업로드는 승인 범위에 포함하지 않는다. 평가 보고서 파일은 만들지 않는다.
- **통합 검증:** [PR #7](https://github.com/ParkJsoo/namgimeopsi/pull/7)에 날짜·조리 차감 안정화와 데모 제작 근거를 push했다. domain 14, inventory 8 + 날짜/추천 9, receipts 날짜·세션·진행 중 닫기, recipes 7, TypeScript·lint·웹 export를 다시 통과했다. 별도 코드 에이전트도 변경을 검토해 P1/P2 병합 차단 결함을 발견하지 못했다. 원격 워크플로와 PR check는 없으며 CI 통과로 표현하지 않는다. PR의 실제 병합 상태는 링크가 기준이다.
- **영상 전문 평가 완료:** 내용·데모 가치와 편집·가독성 담당 2명이 실제 프레임을 독립 확인했다. 데스크톱 설명형 포트폴리오 데모로 공개 가치가 충분하며 내용 모순·핵심 흐름 누락을 발견하지 못했다. 원문/수정/제외 → 확정 입고, 날짜 구분, 반 모/전량 소비 → 최종 재고가 강점이다. 375px 임베드에서는 앱 폭이 약 87px이므로 모바일 중심 공개는 확대 편집이나 별도 구성 검토가 필요하다. 도입의 사용자 효용 한 문장, 긴 정지 구간 단축·핵심 UI 확대는 선택 개선이다. 실제 타깃 사용자 이해도는 측정하지 않았다.
- 시작 Git 상태: `fix/inventory-calendar-dates` / `62b3f58`, 작업 트리 clean. AGENTS.md와 이 문서 전체 및 제품·UX·기술·UI 기준을 확인했다.
- 조리 완료 시트의 동명 재고 접근성 라벨에 화면과 같은 등록 시각을 추가했다. `다 먹음 / 남은 양`에는 재료명과 현재 선택 상태를 제공한다. recipes 7개 시나리오·TypeScript·lint 통과. 이번 변경은 코드·자동 검사로 확인했으며 VoiceOver·네이티브 설치 검증은 수행하지 않았다.
- 어제 재진입 초안 수정은 자동 테스트·QA 전용 시뮬레이터 설치와 재진입·서버/캐시 대조·테스트 데이터 정리까지 완료됐다. 같은 QA를 미완료 작업으로 다시 잡지 않는다. Demo에는 어제 재진입 수정 이전 설치본이 보존돼 있다.
- 영상 P3 편집 완료: `.expo/demo-production/p3-edit/namgimeopsi-demo-ko.mp4` (120초 / 1920×1080 / H.264 / 30fps / 3,600프레임 / 3,309,704바이트 / 무음). 남은 음식 장면의 끝에서 홈 이동을 잘라 카레 저장 결과를 71.9초까지 유지하고, 72초부터 홈과 추천 설명을 함께 보여 준다. 촬영 당시 `454ac3a`의 단일 lot 흐름이며 최신 UI 재촬영은 아니다. SHA-256 `fd3359541160713b0430eec2c90d909054579935367e4c126e3a8f984526542b`.
- 전체 디코딩 오류 없음. QuickTime에서 0초부터 연속 재생하고 진행 중 상태와 `120.0 / playing=false` 종료를 확인했다. 시각 검수는 추출 프레임으로 수행했다. 수정 경계·fixture·추천 안내·두부 반 모·최종 재고를 확인했고, 남은 음식 외 9개 영상 조각은 기존 파일과 바이트가 같다. 375/768/1280px 폭의 로컬 축소 프레임도 검수했다. 작은 폭에서는 앱 내부 날짜·추천 근거가 너무 작으므로 좁은 임베드만으로 상세 가독성을 충족했다고 보지 않는다. 공개처 결정 후 실제 플레이어에서 전체 화면 보기·핵심 장면 확대 필요성을 확인한다. 현재는 실제 공개 페이지 검수가 아니다.
- 본촬영 원본과 기존 120초 파일은 보존했다. 기존 파일 SHA-256 `29a203a37b8fb85f3b9f24605fab50b96457d5eef78745c3a1a111f054f9eca0` 불변 확인. 편집 스크립트는 이제 별도 출력 폴더만 만들고 기존 폴더/영상 덮어쓰기를 거부한다. 재실행 거부와 두 파일 불변도 확인했다. 재현: `.expo/demo-production/final/venv/bin/python scripts/demo/edit-production.py --output-dir .expo/demo-production/p3-next` (새 폴더 이름 필요). 로컬 MP4·프레임·시간표는 Git 제외이며 별도 리뷰 문서는 없다.
- 실기기·시뮬레이터·다른 워크스페이스·Figma·서버 데이터에 접근하지 않았다. Demo 본촬영 데이터와 기존 영상을 보존했다. Git 통합만 진행하며 영상 외부 업로드는 하지 않는다. 별도 리뷰 문서는 만들지 않는다.
- 사용자가 별도 편집본 영상 확인을 완료했다. 코드 통합 이후 남은 일은 공개처 결정과 실제 공개 위치의 임베드 크기 확인·필요한 확대 편집이며, 업로드·공개 링크 연결은 별도 요청 때 진행한다. 접근성의 실제 VoiceOver 확인이 필요하면 QA 전용 UDID `6B38D865-7C34-45E2-9A8E-D425754394D9`에 새 설치하여 검증한다. 이번에는 시뮬레이터 설치본을 갱신하지 않았다.

## 직전 인계 — 2026-09-14 조리 완료 재진입 수량 수정

- 완료·취소 때 이전 시트 초안을 비우도록 수정했다. 두부 1모 → 반 모 소비 후 동일 메뉴를 다시 열면 최신 반 모로 초기화하고, 값이 그대로면 추가 소비 저장을 막는다.
- 실제 시트·원장을 연결한 회귀 테스트에서 수정 전 1모 복원 실패를 확인하고 수정 후 통과했다. 닫힌 화면 렌더 유무 두 경우, 취소 후 재진입, 반 모 → 조금 남음의 후속 소비 원장까지 확인했다. recipes 7개 시나리오와 inventory 8 + 날짜/추천 9, TypeScript·lint 통과.
- 최신 Release를 QA 전용 iPhone 13 mini 시뮬레이터에 설치해 실제 한글 입력으로 두부 1모 → 반 모 소비 → 같은 메뉴 재진입을 확인했다. 재진입 화면의 현재값·입력값은 모두 반 모였고 완료 버튼은 비활성이었다. 서버와 재실행 캐시도 재고 1건 반 모·부분 소비 원장 1건·outbox 0으로 일치했다. 테스트 재고·원장은 정리한 뒤 서버·재실행 캐시 0건을 재확인했다.
- Demo 설치본과 본촬영 데이터·영상은 유지했다. 실기기·push·외부 공개는 하지 않았다.
- 세션 종료 정리: Demo·QA 전용 시뮬레이터는 모두 종료했다. 이번 재진입 QA의 일회성 Release 빌드·XCTest 결과·추출 화면은 휴지통 `/Users/jeongsoopark/.Trash/namgimeopsi-session-20260914`로 옮겼다. 저장소와 QA 서버 데이터는 깨끗하며, QA 시뮬레이터에는 최신 Release만 설치된 상태다.
- 사용자 요청에 따라 기존 별도 리뷰 문서 3개를 삭제했다. 앞으로 리뷰 보고서를 만들지 않으며, 결과는 대화로 전달하고 필요한 상태·남은 작업만 여기에 갱신한다. 이 규칙은 AGENTS.md에도 반영했다.
- 당시 남은 작업은 접근성 라벨의 등록 시각 및 소비 방식 선택 상태 보완 후보, 선택적 영상 P3 편집·공개 크기 검수·사용자 최종 검토와 공개처 결정이었다. 초안 수정의 QA 설치·재진입 확인은 위 기록대로 완료됐다. 기존 120초 영상은 촬영 당시 단일 lot 흐름 기록이다.

## 직전 구현 — 2026-09-14 동명 lot 선택 P2 수정 완료

- 추천과 완료 시트가 같은 날짜 우선순위로 기본 lot를 고르도록 통합했다. 동명 재고는 날짜·보관 위치·등록 시각을 보고 사용자가 실제 사용한 lot를 선택한다. 선택한 ID만 차감하며 취소 시 초안을 초기화한다. [구현·검증](19-lot-selection-qa.md).
- recipes 6개 시나리오, inventory 8 + 날짜/추천 9, domain 14, TypeScript·lint 통과. 전문 리뷰의 새 두부/기존 두부 재현과 명시적 선택 후 원장을 실제 컴포넌트 테스트로 검증했다.
- 기존 QA 전용 시뮬레이터에서 두부 1모 두 개를 등록해 오래된 날짜 기본 선택 → 새 lot 선택 → 반 모 저장을 XCTest로 확인했다. 서버와 재실행 캐시에서 새 lot만 반 모·기존 lot 1모·부분 소비 원장 1건 확인. 테스트 재고 2·원장 1을 정리하고 0건 재확인 후 QA 종료.
- Demo에도 최신 Release를 설치했다. 번들 `d2c8daab5e1f54e6a663e23629db30454a2d64df32a570e61c22c38427b8e8b1`. 본촬영 재고 6 stored / 5 active / 원장 7 / outbox 0을 그대로 보존했다. 실기기는 사용하지 않았다.
- 기존 120초 영상은 `454ac3a`의 단일 lot 흐름 기록으로 유지한다. 새 lot 선택 UI를 재촬영한 영상은 아니다. 다음은 선택적 P3 편집·공개 크기 검수와 사용자 최종 검토·공개처 결정이다. push·PR·외부 업로드는 하지 않았다.

## 직전 인계 — 2026-09-14 본촬영·120초 로컬 편집본 완료

- 리뷰의 두 P2는 `454ac3a`에서 수정·회귀 검증 완료. 같은 Release로 빈 Demo 재고에서 실제 새 본촬영을 수행했다. 실기기는 사용하지 않았다.
- 최종 영상 `.expo/demo-production/final/namgimeopsi-demo-ko.mp4`: 120초 / 1920×1080 / H.264 / 30fps / 한국어 설명 / 무음. 세로 앱 화면을 유지하고 설명을 옆에 배치했다. 시험 smoke 영상은 사용하지 않았다. [제작 결과·데이터·검수](17-demo-production-result.md).
- 새 batch `receipt-scan-1789381976411-3fwr1g5s`: 참기름 수정·돼지고기 제외·5개 입고, 카레 1인분, 두부 반 모·애호박 전량 소비를 실제 촬영했다. 최종 저장 lot 6 / 활성 5 / 원장 7 / outbox 0. 서버 조회와 앱 재실행 내용 일치 확인. 현재 Demo는 이 본촬영 결과 상태다. 기존 QA는 빈 상태로 종료되어 있다.
- README·대본·제작 기록·대표 이미지·자막 원문을 갱신했다. 영상은 Git 제외 로컬 파일이며 외부 공개 링크는 없다. 새 push·PR·업로드는 하지 않았다.
- **다음:** 완성본 사용자 검토, 공개처 결정·업로드와 링크 연결. 이미 완료한 환경 생성·10초 시험·리허설·날짜 수정을 반복하지 않는다. 추가 실기기 경계 QA나 실제 OCR 연결은 별도 범위다.

## 이전 진행 — 2026-09-14 리뷰 보완 완료·본촬영 준비

- 아래 리뷰의 두 P2를 수정했다. 날짜 없는 기존 재고에 시드 날짜를 주입하는 로직을 제거했고, 지난 기준 날짜가 포함된 추천 이유에는 사용 전 상태 확인을 명시한다. 점수화 정책은 유지한다.
- 실제 hook hydration을 실행하는 날짜 삭제 → 오프라인 재실행 → 연결 복구 → 재실행 회귀를 추가했다. inventory 8개 + 날짜/추천 9개, domain 14개, receipts·recipes·타입·lint 통과.
- 새 simulator Release 빌드·설치·실행 성공. 번들 `39675ee2898d323c999aea5492377b9e36675070a2e7ef92e7d1ee611b1d5faf`. Demo 캐시 재고·원장·outbox 0 유지. 이번 두 경계의 검증은 모의 저장소/원격을 사용한 실제 함수·hook 테스트이며 네이티브 오프라인 재현은 아니다.
- `docs/08`, `docs/13`을 빈 Demo 기준으로 갱신했다. 다음은 장면별 본촬영·편집·검수다. 실기기에는 접근하지 않는다.

## 직전 인계 — 2026-09-14 날짜 수정·테스트 재고 정리 완료

- 토큰 한도로 중단됐던 `fix/inventory-calendar-dates` 작업을 재개했다. 이전 전체 리허설은 완료 상태였고, 남은 날짜 결함 수정과 검증을 마쳤다. 상세는 [날짜 수정 QA](15-calendar-date-qa.md).
- 남은 음식 등록은 실제 권장일 `YYYY-MM-DD`와 보관 시작 ISO 시각을 저장한다. 수정·날짜 비우기·outbox에도 동일하게 반영한다. 목록·홈·추천은 같은 실제 날짜와 기기 현지 날짜로 상태를 계산하며, 자정·앱 복귀 때 갱신한다. 기준일 없는 과거 `내일까지`·`지금`은 임의 변환하지 않고 확인 필요로 표시한다.
- 자동 검사: inventory 7개 + 날짜 8개, domain 14개, receipts·recipes, TypeScript·lint 통과. Demo 시뮬레이터 Release XCTest에서 9/15 기본값, 2/30 차단, 저장·서버 반영·재실행 유지, 최종 목록 줄바꿈을 확인했다. 편집·날짜 제거는 hook 회귀로 검증했다. 실기기 QA는 하지 않았다.
- **사용자 승인에 따른 데이터 정리:** 아래 과거 보존 지시보다 최신 “불필요한 데이터/기존 QA 재고도 필요 없으면 삭제” 요청이 우선한다. Demo 익명 세션의 재고 12개·원장 7건, 기존 QA 익명 세션의 재고 6개·원장 2건을 사용자별 RLS API로 삭제하고 각 로컬 캐시·outbox도 비웠다. 재실행 후 서버 0건을 확인했다. 다른 사용자와 실기기는 접근하지 않았다. 감사용 scan/receipt/cooking 이력, 사진, 검증 근거는 보존했다.
- Demo UDID `891FA725-0B92-41D6-95B0-FC03729146B4`는 최종 Release가 설치된 빈 재고 상태다. 기존 QA UDID `6B38D865-7C34-45E2-9A8E-D425754394D9`는 빈 재고 확인 후 종료했다. 환경 자체는 삭제하지 않았다. 앱 재설치로 새 익명 세션을 만들면 기존 앱 정책상 예제 재고가 생기므로 본촬영 준비는 현재 Demo 설치에서 진행한다.
- **다음 작업:** 빈 Demo 재고에서 본촬영용 영수증 검수·남은 음식·조리 장면을 준비하고 촬영·편집한다. fixture의 과거 날짜는 숨기지 말고 검수 중 실제 촬영 대본에 맞게 사용자가 수정하는 장면으로 다룬다. 본촬영·최종 영상·공개는 아직 미완료다.
- `smoke-10s-playback.mp4`는 시험용이며 최종 영상에 사용하지 않는다. 새 작업은 로컬 커밋으로 유지하며 push·PR·외부 공개는 하지 않는다. 아래 기록은 과거 상태다.

## 이전 인계 — 2026-09-09 전체 리허설 완료

- 사용자 요청대로 실기기에 접근하지 않고 촬영 전용 `Namgimeopsi Demo iPhone 13 mini` / iOS 26.5를 생성했다. UDID `891FA725-0B92-41D6-95B0-FC03729146B4`만 사용한다. 기존 QA 시뮬레이터·재고와 다른 프로젝트는 조작하지 않았다.
- `docs/demo-rehearsal-handoff`의 `474b894`에서 별도 Release 빌드·설치·실행을 완료했다. 앱 소스는 `14a7977`과 같다. 번들 SHA-256은 `856cb065ebb072acd6c05c820c9f580d66e4a18afdb8018a19ca74a35e31b570`이다.
- **10초 시험 녹화·재생 통과:** `.expo/demo-production/smoke-10s-playback.mp4`, H.264 / 1080×2340 세로 / 30fps / 10.00초. QuickTime 실제 재생과 한글 가독성, 전체 프레임 디코딩을 확인했다. 첫 정지 화면 원본은 1프레임/0.067초여서 실패로 남겼다. 상태 표시줄 갱신으로 마지막 프레임을 확보한 10.177초 원본을 30fps·10초로 변환했다. 상세 명령과 한계는 [제작 계획](13-demo-production-plan.md)을 따른다.
- 테스트 영수증을 새 사진 보관함에 넣고 사진 권한·선택·비공개 업로드·fixture 검수 진입을 확인했다. 선택기의 이미지 AX 터치는 `not hittable`이었고, 확인된 이미지 중앙 좌표의 XCTest 터치로 성공했다. OCR 제공자는 연결하지 않았다.
- **전체 리허설 완료:** 참기름 `조금 남음` 수정·돼지고기 제외 → 5개 입고 → 남은 카레 `1인분` 등록 → 애호박 두부덮밥 선택 → 새 입고 두부 `반 모`·새 애호박 전량 소비 → 앱 재실행을 확인했다. 검수·조리 확정 전에는 재고·원장이 그대로였고, 기존 5개 lot도 보존됐다. [전체 결과·대본 보정·근거](14-demo-rehearsal.md).
- **최종 상태:** 저장된 lot 11개 / 활성 10개 / 원장 7건(입고 5 + 소비 2) / outbox 0. 재실행 후 ID별 내용은 동일하다(서버 ISO 시각 형식 정규화 비교). batch `receipt-scan-1788939138080-gjuotrfg`, cooking session `cooking-1788939878605-3`, 카레 `inventory-1788939817422`. 현재 화면은 냉장고 목록이며 데이터는 리허설 종료 상태다. 기존 두부 `1모`·애호박 `반 개`와 새 입고 lot를 합쳐 설명하지 않는다.
- **본촬영 전 발견 사항:** 남은 음식은 `내일까지`·`지금`을 문구로 저장하고 실제 `recommendedUseByAt`이 없다. 목록 상태도 상대 문구 기준이라 ISO 날짜로 계산하는 추천과 어긋난다. 영수증 두부의 ISO `2026-09-01`과 목록 `이번 주 안 권장` 불일치를 확인했다. 날짜 자동 관리가 완성됐다고 설명하지 않는다. [리허설 날짜 문제](14-demo-rehearsal.md)에 기록했고 앱 수정은 아직 하지 않았다.
- **다음 작업:** 날짜 저장·목록 표시의 일관성을 별도 앱 수정으로 해결·회귀 확인한 뒤, 리허설 종료 데이터를 보존하는 별도 본촬영 세션을 준비한다. 그 후 대본 최종 확정·장면별 촬영·편집이다. 전체 리허설은 완료했지만 본촬영·최종 영상·공개는 미완료다.
- **영상 구분:** 사용자가 확인한 `smoke-10s-playback.mp4`는 기술 시험 전용이며 최종 영상에 사용하지 않는다. 이번 리허설은 장면별 XCTest·화면·캐시 대조로 수행했고 연속 원테이크 영상이 아니다. 선별 화면 4장은 `docs/qa-artifacts/demo-rehearsal/`, 원본·로그·검증 스크립트는 `.expo/demo-production/`에 있다.
- 이번 변경은 준비 브랜치의 로컬 커밋으로 유지한다. push·PR 생성·외부 영상 공개는 하지 않았다. 아래 2026-09-08 인계의 미착수 내용은 과거 상태다.

## 이전 인계 — 2026-09-08 종료

- **오늘 작업 종료, 착수는 다음 세션(예정 2026-09-09).** 사용자는 데모 계획만 확인했고 환경 생성·설치·리허설·녹화는 아직 시작하지 않았다. 오늘은 인계 문서만 정리한다.
- **Git 기준:** PR #1~#6 병합 완료. 원격 main의 마지막 확인 커밋은 `f622dc7`이며 앱 코드는 QA 기준 `14a7977`과 같다. 이번 인계 문서는 `docs/demo-rehearsal-handoff`의 로컬 커밋으로 남긴다. 아직 push·PR 생성은 하지 않았으므로 새 세션에서 이 브랜치의 변경을 버리거나 이전 main만으로 시작하지 않는다.
- **실기기 사용 중단:** iPhone·Galaxy 모두 다른 앱 개발 테스트에 사용 중이다. 사용자가 다시 허용하기 전까지 ADB·devicectl·미러링으로 조회/조작하거나 설치·재시작하지 않는다. 다른 프로젝트의 파일·프로세스·테스트 환경도 건드리지 않는다. 아래 과거 실기기 조작 선호보다 이 최신 제한이 우선한다.
- **내일 첫 작업:** [데모 제작 계획](13-demo-production-plan.md)을 읽고, 남김없이 전용 새 iOS 시뮬레이터 준비 → 최신 Release 설치 → **10초 시험 녹화와 재생 확인**부터 진행한다. 기존 `Namgimeopsi QA iPhone 13 mini`와 재고는 보존한다. 촬영용 시뮬레이터는 아직 생성되지 않았다.
- **자료:** 장면별 대본·케이스 스터디 초안은 [데모 문서](08-portfolio-demo.md)에 있다. 도구 존재 및 `simctl io recordVideo` 지원만 확인했다. 실제 녹화 성공·최종 영상·공개 링크는 아직 없다.
- **PR 구분:** 준비·리허설 PR과 영상·포트폴리오 PR로 나눈다. 앱 결함 수정은 별도 PR이다. 기존 push·병합 허가는 완료된 QA PR 범위였으며 앞으로의 PR/외부 영상 공개는 별도로 다룬다.

## Project snapshot

- 이름: **남김없이 (Namgimeopsi)**
- 목적: AI 신뢰 UX와 모바일 제품 설계/구현 역량을 보여 주는 공개 포트폴리오 프로젝트
- GitHub: <https://github.com/ParkJsoo/namgimeopsi>
- 로컬 경로: `/Users/jeongsoopark/develop/namgimeopsi`
- 구현 상태: Expo TypeScript 앱에서 영수증 검수형 입고, 남은 음식 등록, 메뉴 추천·조리/섭취 완료 후 부분·전량 차감을 구현했다. 재고는 Supabase 익명 사용자별 Postgres에 동기화하고, 기존 AsyncStorage 상태는 최초 원격 시드와 오프라인 캐시로 유지한다. private 원본 이미지·scan job·서버 검증 마이그레이션은 실제 프로젝트에 적용했고 `analyze-receipt` 최신 로컬 원문도 Dashboard에서 배포했다. `service_role`의 `scan_jobs` 상태 전이 권한(UPDATE 및 필터에 필요한 `id`·`user_id`·`status` 컬럼 SELECT)을 실제 Dashboard SQL Editor에 적용했으며, 새 익명 사용자 E2E로 private 업로드 → fixture `ready` → 확정 입고 → 무인증 원본 차단까지 확인했다. OCR provider는 아직 연결하지 않았다.

## Locked decisions

- 초기 타깃은 한국의 1~2인 가구다. 핵심 페르소나는 배달·HMR·집밥을 혼용하고 메뉴 결정과 식재료 폐기를 번거롭게 느끼는 직장인이다.
- MVP의 핵심 흐름은 영수증 검수형 입고, 남은 음식 등록, 오늘 먹을 메뉴 추천과 조리 후 재고 차감이다.
- AI는 초안만 제시한다. 어떤 인식 결과도 사용자 확인 없이 재고에 반영하지 않는다.
- 메뉴 추천은 한국어 레시피 40~60개와 결정론적 점수화로 시작한다. 추천 점수는 재료 충족도 + 임박 재료 활용 - 부족 재료 - 조리 시간 페널티를 사용한다.
- 예정 기술 스택은 React Native + Expo + TypeScript, Expo Router, TanStack Query, React Hook Form + Zod, Supabase(Auth/Postgres/Storage/Edge Functions), OCR/Vision, 로컬 알림이다.

## Documentation status

- `01-product-brief.md`부터 `07-wireframe-specification.md`까지 제품, UX, 기술, 로드맵, 경쟁 분석, 디자인 방향, 와이어프레임 명세를 작성했고 GitHub에 커밋했다.
- 읽기 순서는 `AGENTS.md`의 문서 우선순위를 따른다.

## Figma status

- 파일: [남김없이 — Mobile App Design](https://www.figma.com/design/ALo74fHnDbRVvw4hkDe09x)
- 소유 워크스페이스: **박정수의 팀**. `withnetworks` 계열 워크스페이스는 절대 사용하거나 조작하지 않는다.
- Starter 플랜 제약: 파일당 3페이지. 현재 `Cover / Foundations / App Screens`로 구성했다.
- 완료 항목:
  - 컬렉션 3개와 변수 43개: 원시 색상 15, 시맨틱 색상 15, 간격/반경/크기 13
  - Noto Sans KR 텍스트 스타일 6개, 카드 Elevation 스타일 1개
  - Cover 화면과 Foundations의 컬러/타이포 문서화
  - Cover와 Foundations는 캡처 후 시각 검증 완료
  - Foundations에 `Button` 컴포넌트 세트 추가: `Style=Primary / Secondary` 2개 변형, 240×52 터치 영역, 12px 반경, 14px `계속하기` 라벨. Primary는 브랜드 배경·흰 라벨, Secondary는 흰 배경·1px 브랜드 외곽선·브랜드 라벨이다.
  - `App Screens`에 375×812 홈 화면을 실제 캔버스에서 시각 검증했다. 인사말·`오늘 먼저 먹을 게 있어요` Display 헤더, 연한 초록의 우선 소비 카드(제목/H2·추천 근거/Body), `오늘의 한 끼`와 `모두 보기`, 첫 레시피 카드(조리 시간·인분·추천 근거), 하단 `홈 / 냉장고 / 내 정보` 탐색, 브랜드 색상의 `+` 빠른 추가 진입점을 배치했다.
- 아직 할 일:
  - Foundations 안에 공용 `Status chip`, `Recipe card`, `Bottom navigation` 컴포넌트 구성
  - App Screens에 온보딩, 영수증 검수, 레시피 상세, 완료/차감 흐름을 구성하고 검증
- 주의: Figma MCP는 Starter 호출 한도 오류가 재발했다. MCP 한도를 우회하지 않는다. 다음 화면부터는 Product Design으로 코드·상호작용을 먼저 만들고 시각 QA를 마친 뒤, Figma MCP가 다시 가능할 때 편집 가능한 디자인으로 반영한다. Figma 데스크톱 수동 조작은 짧은 시각 확인 또는 마지막 보정에만 쓴다.
- 이번 QA에서 Figma MCP는 상태 확인으로 한 번만 호출했다. 개인 팀은 Starter `View` 권한으로 확인됐고, 파일 수정·추가 호출은 하지 않았다.

## Implementation status

- Expo Router 기반 TypeScript 앱을 루트에 초기화했다.
- `AsyncStorage` 기반 로컬 저장소로 재고를 분리했다. 직접 추가, 수정, 제외, `다 먹음` 처리 후에도 앱을 다시 열면 재고 상태가 유지된다.
- 홈은 Figma `App Screens > Frame 1`의 밀도에 맞춰 인사·단일 우선 소비 카드·`오늘의 한 끼`·설명 가능한 메뉴 카드로 정렬했다. 375 × 812 Chrome 캡처와 우선 소비 수정·레시피 차감 확인·냉장고 탭·빠른 추가 상호작용 QA를 마쳤고 증거는 `docs/qa-artifacts/`와 루트 `design-qa.md`에 기록했다.
- 홈의 메뉴 카드는 더 이상 하드코딩되지 않는다. 5개 검수 레시피의 작은 로컬 카탈로그를 현재 활성 재고에 점수화해 최대 3개를 표시하며, 추천 근거와 부족 재료를 함께 보여 준다. 소비 우선도는 ISO 권장 섭취일만 사용하며 표시 문구·구매일·보관 시작일로 안전 상태를 추정하지 않는다.
- 레시피 완료 시트는 레시피와 보유 lot의 현재 생활 단위를 보여 주고, 사용자가 각 lot를 `다 먹음` 또는 `남은 양`으로 확인한다. `반 봉지`, `조금 남음` 등 남긴 양은 수치 환산 없이 보존한다. 전량 소비는 `consume-all` 원장으로 활성 재고에서 제외하고, 부분 소비는 `consume` 원장과 `remainingQuantityLabel`로 lot 수량을 함께 갱신한다. 원장은 AsyncStorage v2에 보존되며 기존 v1 재고 배열은 이관한다.
- 빠른 추가는 `영수증으로 등록 / 남은 음식 등록 / 직접 추가`를 먼저 고른다. 영수증은 실제 OCR이 아님을 명시한 로컬 fixture를 짧게 분석한 뒤, 확인됨 4개와 `AI 추정 · 확인 필요` 2개를 원문과 함께 검수한다. 이름·생활 단위·보관 위치·권장 섭취 시점을 수정하거나 제외할 수 있고, 사용자가 `N개 냉장고에 담기`를 누르기 전에는 재고와 원장이 바뀌지 않는다.
- 영수증 확정은 선택한 후보를 개별 재고 lot와 `intake` 원장 이벤트로 같은 로컬 상태에 기록한다. 원문·생활 단위·확정 시각·영수증 batch ID를 보존하며, 같은 batch ID의 재확정은 중복 입고하지 않고 이미 입고했다는 안내를 보여 준다. AsyncStorage 쓰기에 성공한 뒤에만 완료 화면으로 넘어간다.
- 남은 음식은 식재료와 별도 종류로 등록하며, 기본값은 냉장 · 1인분이며 보관 시작은 저장 시각, 권장일은 기기 현지 날짜의 다음 날을 실제 날짜로 저장한다. 냉장고 화면은 보관 위치와 전체/남은 음식/오늘 권장 필터를 제공한다.
- `src/features/domain/`에 다음 순수 함수를 구현했다. 레시피 점수화는 `src/features/recipes/recommendations.ts` 어댑터를 거쳐 활성 로컬 재고와 홈 카드에 연결됐다. 수량 기반 이벤트 함수는 단위 혼용·초과 소비 방지 단위 테스트의 기준으로 유지하고, 실제 조리 완료는 `complete_cooking_session` RPC와 outbox로 동기화한다.
  - `inventory-events.ts`: 입고·소비·수정·폐기 이벤트로 잔량을 계산하며, 단위 혼용과 초과 소비를 막는다.
  - `date-status.ts`: 권장 섭취 시점을 우선하고 없을 때만 포장 표기일을 보조 기준으로 써 `지남 / 오늘 / 임박 / 여유 / 알 수 없음`을 계산한다. 구매일·보관 시작일만으로 식품 상태를 추정하지 않는다.
  - `recipe-ranking.ts`: 재료 충족도 + 임박 재료 활용 - 부족 재료 - 조리 시간으로 점수화하고, 부족 재료가 2개를 넘는 메뉴를 제외한 상위 3개와 추천 근거를 반환한다.
- Supabase `henry / 남김없이` Free 프로젝트를 서울(`ap-northeast-2`)에 만들었다. 새 테이블 자동 공개는 끄고 RLS 자동 설정을 켰으며, 익명 로그인을 활성화했다.
- `@supabase/supabase-js`와 `react-native-url-polyfill`을 추가했다. 실제 URL과 publishable key는 Git에서 제외된 `.env`에만 있고, `.env.example`에는 키 이름만 둔다.
- `supabase/migrations/20260829000000_inventory.sql`로 `inventory_items`, `inventory_events`, 사용자별 RLS 정책과 `authenticated` 역할의 읽기·쓰기 권한을 정의했고 실제 프로젝트에 반영했다. 두 테이블 모두 `authenticated`의 `SELECT / INSERT / UPDATE / DELETE` 권한과 사용자별 RLS 정책을 확인했다.
- `useInventory`는 기존 v1/v2 AsyncStorage를 먼저 읽고, 로컬 변경을 영속 outbox에 기록한 뒤 순서대로 원격에 반영한다. 원격 요청 실패는 로컬 재고를 시드 데이터로 대체하지 않으며, 대기·실패 상태를 노출하고 사용자가 재시도할 수 있다. 원격 행을 다시 읽을 때에도 대기 중인 로컬 작업을 순서대로 재적용한다.
- 영수증 확정은 `commit_receipt_intake` Postgres RPC 하나로 선택한 lot와 `intake` 원장을 같은 트랜잭션에 저장한다. `receipt_intakes(user_id, receipt_id)`의 유니크 선점으로 최초 요청만 처리하며, 같은 batch의 재호출·동시 호출·다른 payload 호출은 item/event를 건드리지 않고 `already-confirmed`를 반환한다. 기존 로컬 영수증 데이터의 최초 이관도 같은 RPC 작업으로 묶는다.
- `supabase/migrations/20260901000000_backfill_receipt_intakes.sql`는 `inventory_events`에 이미 남은 receipt batch를 `receipt_intakes`에 멱등 backfill한다. SQL Editor로 실제 프로젝트에 적용했고, 기존 receipt batch 중 선점 행이 없는 건은 `0`건으로 검증했다. `sync-queue.ts`는 lot와 `intake` 이벤트의 일대일 매핑이 완전한 batch만 RPC로 보낸다. lot가 삭제된 legacy batch는 남은 item을 일반 upsert하고, 모든 `intake` 이벤트를 recovery `upsert-events` 작업으로 보존한다.
- 로컬 recovery 단위 테스트, 타입 검사·lint·웹 export와 실제 새 익명 사용자 재시도(`confirmed → already-confirmed`)·동시성(`confirmed` 1건 + `already-confirmed` 1건, 변조 payload 재시도 불변성) 검증을 마쳤다. backfill 적용 뒤 같은 익명 재시도·동시성 검증도 다시 통과했으며, 전문 재리뷰에서 추가 병합 차단 이슈는 찾지 못했다.
- `expo-image-picker`로 선택한 JPG/PNG/HEIC(10MB 이하)는 사용자 ID 경로의 private `receipt-images` bucket에 저장하도록 구현했다. `scan_jobs`에는 원본 경로·MIME·실제 바이트 수·분석 상태만 남기고 공개 URL을 만들지 않는다. `analyze-receipt` Edge Function은 소유자·경로·MIME·용량을 server-side에서 다시 확인한 뒤 fixture 결과만 `ready`로 만든다. OCR provider가 없으므로 앱은 fixture 결과를 명시하고 실제 OCR처럼 표시하지 않는다. `commit_receipt_scan_intake`는 ready scan job만 기존 입고 RPC와 같은 트랜잭션에 연결한다.
- `20260901010000_receipt_scan_jobs.sql`은 SQL Editor로 실제 프로젝트에 적용했다. `analyze-receipt` 최신 로컬 원문은 Dashboard에 배포되어 있고 `npx --yes deno check supabase/functions/analyze-receipt/index.ts`를 통과했다. `20260902000000_allow_scan_function_state_updates.sql`의 `grant update on table public.scan_jobs to service_role;`를 Dashboard SQL Editor에 적용한 뒤 `has_table_privilege('service_role', 'public.scan_jobs', 'UPDATE') = true`를 재확인했다. 실제 함수의 filtered UPDATE는 PostgreSQL에서 필터 컬럼 SELECT도 요구하므로, `service_role`에 `scan_jobs(id, user_id, status)`만 SELECT하도록 최소 추가 권한을 적용하고 migration에 기록했다. 새 익명 사용자 `8a7afb5a-88f7-4598-bf98-e5a3930b0b27` E2E에서 70-byte PNG를 자기 경로에 private upload하고 uploaded job을 생성했다. `analyze-receipt`는 `ready / fixture / result.provider=fixture`, `commit_receipt_scan_intake`는 `confirmed`, inventory item과 `intake` event는 각 1건으로 검증했다. 같은 원본의 무인증 `/storage/v1/object/public/receipt-images/...` 요청은 HTTP 400으로 차단됐다. OCR provider나 키를 연결하지 않았고, 앱의 `분석 제공자는 아직 연결 전…fixture 초안` 및 `AI 추정 · 확인 필요` 고지는 그대로다. Expo lint 복구를 위해 `eslint`·`eslint-config-expo`를 dev dependency로 명시했으며, Expo 57/TypeScript 6 resolver 호환 문제의 import 규칙은 `tsc --noEmit` 검증으로 대체했다.
- `20260902145056_add_cooking_session_consumption.sql`을 실제 프로젝트에 적용했다. `complete_cooking_session`은 `SECURITY INVOKER`, authenticated 전용 실행, 사용자별 RLS로 동작하며 세션 선점·부분/전량 소비 event·부분 소비 lot 수량·세션 감사 행을 하나의 트랜잭션에 기록한다. 새 익명 사용자 `66c6b66d-e968-4888-b659-8091b2809992` E2E에서 계란 `9개 → 8개` 부분 소비와 두부 전량 소비를 함께 확정했고, 첫 RPC는 `confirmed`, 동일 session 재호출은 `already-confirmed`, event 2건·session 1건·session item 2건을 확인했다. 앱은 사용 후 남은 양을 직접 확인하게 하며 `반 봉지`·`조금 남음` 같은 생활 단위를 자동 환산하지 않는다.
- 375px 웹 QA에서 `애호박 두부덮밥`의 조리 완료 시트를 열고, 두부를 `남은 양`으로 바꾼 뒤 `반 모`를 입력해 그대로 표시되는 것을 확인했다. `아직 있어요`로 닫았을 때 재고를 변경하지 않는 상태도 확인했다.
- 375 × 812 웹 앱은 익명 로그인·초기 동기화 뒤 정상 로드됐고 브라우저 콘솔 오류는 없었다(기존 RN `shadow*` 경고만 있음). 새 익명 세션에서 두 테이블 조회가 모두 HTTP 200으로 성공했고, 초기 시드 재고 5건의 실제 업서트를 확인했다. 새 검증 익명 사용자에서는 RPC 첫 호출 `confirmed`, 재호출 `already-confirmed`, 두 테이블 읽기, 품목 수정·삭제까지 성공했다. 별도 동시성 검증에서는 같은 batch의 서로 다른 두 호출이 `confirmed` 1건과 `already-confirmed` 1건으로 끝났고, 세 번째 변조 payload도 `already-confirmed`를 반환했으며 재고·이벤트 검증 행은 모두 삭제했다.
- 포트폴리오 데모 QA를 다시 수행했다. 375 × 812 웹 새 익명 세션에서 남은 음식 등록, 조리 완료의 `두부 1모 → 반 모` 부분 차감과 애호박 전량 차감, 재시작 뒤 원격 복원을 확인했다. 초기 오프라인 표시에서 재시도를 누른 뒤 동기화 상태가 해제되는 것도 확인했다. 별도 익명 사용자에서는 private PNG 업로드 → `analyze-receipt`의 `ready / fixture` → `commit_receipt_scan_intake`의 `confirmed` → 동일 요청의 `already-confirmed`와 public 원본 HTTP 400 차단을 재확인했다. 문제를 재현하지 못해 구현 변경은 하지 않았다.
- README를 현 구현에 맞는 포트폴리오 안내 문서로 전면 갱신했다. 문제 정의와 세 가지 사용자 결정을 먼저 보여 주고, fixture-only 분석의 한계와 신뢰 UX, 결정론적 추천, outbox·RLS·멱등 RPC, 검증 범위, 로컬 실행·Supabase 적용 요건, 의도적으로 미구현인 범위를 실제 상태와 구분해 기록했다.
- Product Design 플러그인(0.1.52)을 설치했다. 저장된 플러그인 컨텍스트는 아직 없으며, 시각 QA 기준 문서는 루트 `design-qa.md`에 있다. Chrome 375 × 812에서 빠른 추가·영수증 분석·검수·수정·제외·취소·확정 완료·보관 위치별 입고를 QA했고, 재확정 시 중복 입고 없이 `이미 냉장고에 담은 영수증이에요` 안내가 노출되는 것도 확인했다. Figma 원본 프레임은 연결된 Chrome에서 WebGL을 지원하지 않아 열 수 없었고, 차단 증거는 `docs/qa-artifacts/06-figma-webgl-blocked.png`에 있다. Figma Desktop fallback도 Computer Use 연결 시작 실패로 캡처하지 못했다. Figma MCP는 재호출하지 않았다.
- 검증 완료: `npm run lint`, `npm run test:domain`, `npx tsc --noEmit`, `npx expo export --platform web`, 375 × 812 Chrome 익명 동기화 확인.

## Recommended next session order

- **통합 완료:** 기능별 PR #1~#5를 merge commit으로 main에 순차 병합했다. 기준 `14a7977`은 최종 feature tree와 같고 기존 커밋을 모두 포함한다. 계획·PR 링크는 `docs/12-merge-plan.md`를 따른다.
- **최신 Android 회귀 완료:** `qa/android-final-release`에서 main `14a7977` 코드 그대로 Galaxy Release를 갱신 설치했다. 조리 빈 잔량·한글/스와이프·취소, 오프라인 남은 음식 저장·재실행·연결 복구, 영수증 키보드·취소를 통과했다. 현재 iOS·Android 모두 `e45f128`·`0e49aa6` 수정이 포함돼 있다. APK 해시·기기 데이터 보존 근거는 `docs/10-android-preview.md` 최신 항목을 따른다. 이 기록은 사용자 요청으로 [PR #6](https://github.com/ParkJsoo/namgimeopsi/pull/6)에 push·검토 후 병합했고, main은 `f622dc7`로 갱신됐다.

1. `AGENTS.md` → 이 문서의 최상단 인계 → `docs/13-demo-production-plan.md` → `docs/08-portfolio-demo.md` 순서로 읽고 Git 상태를 확인한다. QA 세부 근거가 필요할 때만 `docs/09-device-qa.md`와 양쪽 preview 기록을 참고한다. 핵심 기기 QA를 반복하지 않는다.
2. **다음 작업은 전용 시뮬레이터의 10초 시험 녹화다.** 실기기는 사용할 수 없다. 시험 녹화·재생 확인 후 120초 대본을 리허설하고 장면별 촬영·편집·케이스 스터디로 이어간다. 환경·데이터·진행 상태를 `docs/13-demo-production-plan.md`에 기록한다.
3. 과거 iPhone QA 당시 설치는 로컬 Apple Development 서명 Release였고 profile 만료는 2026-09-13 14:32:39 KST다. 현재 다른 앱 테스트에 사용 중이므로 이 만료를 이유로 기기에 접근하거나 갱신하지 않는다. 시뮬레이터 촬영은 실기기 서명 갱신을 기다릴 필요가 없다. EAS·TestFlight·스토어 배포는 별도 범위다.
4. 추가 경계 QA(HEIC·10MB·긴 이름·Galaxy 접힘 전환)와 실제 타깃 사용자 관찰은 후속이다. 현재 fixture 분석을 실제 OCR 정확도 검증으로 설명하지 않는다.

## Session memory and boundaries

- **현재 우선 제한:** 실기기 두 대는 다른 앱 테스트 중이다. 다음 세션은 새 촬영 전용 iOS 시뮬레이터만 대상으로 하며, 기존 QA 시뮬레이터·실기기·다른 앱의 개발 서버/runner를 종료·초기화하지 않는다. 모든 시뮬레이터 작업은 확인한 전용 UDID를 지정한다. `booted`에 대한 암묵적 작업·전체 종료·일괄 프로세스 종료를 사용하지 않는다.

- iOS 키보드·스크롤 QA는 XCTest의 실제 화면 키/터치 제스처를 우선 검토한다. 미러링은 사진 선택·화면 확인에 보조로 사용한다. 일반 드래그가 전달되지 않으면 같은 시도를 오래 반복하지 말고 네이티브 테스트로 전환한다. 사용자에게는 인증·본체 잠금 해제처럼 필요한 조작만 요청한다.
- 사용자는 실기기 조작을 반복해서 안내받기보다 에이전트가 직접 진행하기를 원한다. Galaxy는 ADB로 화면 캡처·터치·재실행이 가능하다. iPhone은 사용 가능한 미러링/네이티브 제어를 먼저 사용하고, 본체 조작이 꼭 필요한 경우만 요청한다. 시뮬레이터 결과와 본체 결과는 구분한다.
- 본체 키보드 결과 보고 대신 사용자가 시뮬레이터 검증을 요청해 진행했다. 전용 `Namgimeopsi QA iPhone 13 mini`만 사용했다. `QA SIM 카레 2인분`, 두부 `반 모`, 애호박 `consume-all` 원장을 보존한다. Computer Use의 드래그·휠 한계는 이후 별도 XCTest UI runner로 보완했다. 설치된 Release에 네이티브 터치 스와이프를 보내 세 시트의 한글 조합·키보드 닫힘·하단 버튼 전체 접근을 확인했다. 시뮬레이터 재고 6개·원장 2개는 불변이다.
- 이후 사용자가 미러링·시뮬레이터를 상황에 맞게 사용해 직접 가능한 본체 QA를 이어가도록 요청했다. 미러링 창을 전면에 올리고 작은 단위로 반복 스크롤하면 실제 iPhone 긴 목록이 이동했다. 탄성 스크롤/시트 애니메이션 직후 좌표를 누르지 말고 멈춘 화면을 재확인한다. 미러링 클립보드·한글 키 전송은 불안정하므로 입력값을 화면에서 확인한 후에만 저장한다.
- **Figma 및 withnetworks 관련 파일·워크스페이스는 읽거나 조작하지 않는다.** 앞의 디자인 이력은 과거 기록이며 접근 허가가 아니다.
- OCR provider/키를 연결하지 않는다. fixture 결과와 `분석 제공자는 아직 연결 전` 고지를 유지한다.
- `닫기`는 검수 화면을 닫고 늦은 응답을 무효화한다. 진행 중 업로드 중단이나 원격 원본 삭제를 뜻하지 않는다.
- 테스트 이미지: `~/Downloads/namgimeopsi-test-receipt.png`. iPhone·Galaxy에 사용자가 저장했다. 개인 사진을 새로 업로드하지 않는다.
- iPhone에는 이전 5개 입고 lot에 더해 **에이전트의 스크롤 중 잘못된 터치로 추가 입고된 fixture 6개**, `QA iPhone curry 1인분`, 새 두부 `0.5 block`·새 애호박 전량 소비 결과가 남아 있다. 실수는 사용자에게 알렸고 해당 batch `receipt-scan-1788857458575-wr12qfzx`를 삭제하지 않았다. Galaxy에는 5개 입고 lot·`QA 카레 2인분`·부분/전량 차감 결과와 최신 `QA Android 카레 1인분`이 남아 있다. 최신 캐시는 lot 12개·원장 7개다. 동명 lot는 별도이며 lot ID로 구분한다. 임의 초기화·정리는 하지 않는다.
- 이 문서가 저장소의 세션 메모리다. 별도 MEMORY 파일을 만들지 않고 현재 상태와 사용자 선호를 여기에 유지한다.

## Last verified repository state — 2026-09-08 handoff

- **main 통합 후 Android 후속:** `14a7977`에서 최신 Release를 갱신 설치했다. 기존 lot 11개·원장 7개 내용은 보존됐고 새 leftover 1개만 저장했다. 최종 APK·독립 실행·전후 대조 결과는 `docs/10-android-preview.md` 최상단 최신 설치 항목이 우선한다. 아래 Android 미갱신/이전 설치 언급은 역사 기록이다.

- **최신 전문 협업 리뷰:** iOS 입력·비동기 저장·QA 근거 에이전트 3명과 리뷰했다. 로컬 저장 실패 후 공통 재시도 복구(`e45f128`), 조리 빈 잔량으로 일부 재료만 소비되던 경로 차단(`0e49aa6`)을 수정했다. 다른 에이전트의 독립 재리뷰에서 추가 차단 이슈 없음. inventory 6개·새 recipes 회귀·타입·lint 통과. 실제 iPhone XCTest로 빈 입력 차단→한글 수정 후 활성→스와이프·취소를 통과했고 재고/원장 불변을 대조했다. 현재 iOS 설치·해시는 `docs/11-ios-preview.md` 최신 항목을 따른다. 당시 새 변경은 push를 보류했으며 이후 통합 요청은 위 통합 작업 항목을 따른다.

- **이번 iPhone QA 세션:** 시작 HEAD는 `cd8b625`, clean 상태에서 `origin/feat/live-recommendations`와 일치했다. 당시 새 변경은 별도 요청 전까지 push를 보류했다. iOS Release 설치·Metro 없는 cold launch·기존 냉장 재고 유지·테스트 영수증 fixture 검수 진입을 직접 확인했다. 상세·남은 항목은 `docs/09-device-qa.md`의 최신 iPhone 항목과 `docs/11-ios-preview.md`를 따른다.
- **시뮬레이터 후속:** `bb3258e` 이후 문서 외 영구 소스 변경 없이 전용 iOS 26.5 Release QA를 수행했다. 세 시트 한글 조합, 남은 음식 저장·소비 원장 2건·재실행 유지, 응답 지연 조건의 두 진행 단계 닫기·재진입을 확인했다. 원래 소스·Release를 복원하고 번들 해시 일치·Metro 없는 실행·최종 목록을 재확인했다. 이후 `ce93e4f` 뒤 XCTest 네이티브 터치로 세 시트 스와이프도 검증했다. 실제 본체 결과와는 구분한다.
- **실제 iPhone 네이티브 터치 후속:** `fa47b6d` 이후 사용자 잠금 해제만 받고 에이전트가 세 입력 시트의 화면 한글 조합·키보드 시작 터치 스와이프·하단 버튼 전체 접근·취소를 검증했다. 재고 17개·원장 13개 불변과 Metro 없는 cold launch 후 목록을 재확인했다. 기존 요청의 iPhone 핵심 QA를 완료했고 영구 앱 소스 변경은 없다. 상세는 `docs/09-device-qa.md`의 최신 실제 iPhone 결과다.
- **실제 iPhone 미러링 후속:** `7d94a61` 이후 직접 저장·차감·취소·재실행 및 작은 단위 스크롤을 확인했다. 새 조리 세션 `cooking-1788860288115-3`의 부분/전량 원장 2건과 기존 lot 보존을 USB 기기 캐시로 대조했다. 최종 lot 17개·원장 13개다. 두 진행 단계 닫기는 20초 성공 응답 전달 지연 조건이며 원래 Release로 복원하고 최초 번들 해시 일치·서명·Metro 없는 재실행을 확인했다. 영구 앱 소스 변경은 없다. 당시 새 문서 커밋은 push를 보류했다.
- 이전 인계: 구현 기준 `eca2a79 fix: retry receipt persistence and allow closing progress`와 문서 인계 `cd8b625`는 사용자 요청으로 `origin/feat/live-recommendations`에 push 완료했다. main 병합·PR 생성·스토어 배포는 하지 않았다. 이 이력은 이번 세션의 새 변경에 대한 push 허가가 아니다.
- **Galaxy 핵심 QA 완료:** SM-F766N / Android 16에서 영수증 검수·5개 입고, 남은 음식 저장, 조리 부분/전량 차감과 재실행 유지, 세 입력 시트의 한글 키보드 유지 스크롤·하단 버튼 접근을 확인했다. 사용자 본체 보고와 에이전트 직접 관찰은 `docs/09-device-qa.md`에 구분했다.
- **Android 로컬 preview 확인:** JS 내장 arm64 Release를 설치하고 네트워크 없이 cold launch, 오프라인 영수증 실패·온라인 재시도·fixture 고지·키보드 스크롤·취소를 확인했다. 최신 리뷰 수정을 포함해 Release를 재빌드·설치했다. Galaxy 최종 설치는 Release이며 Metro가 필요 없다. 로컬 debug keystore 서명으로 EAS/스토어 배포와 다르다. APK 경로·해시·증거 버전은 `docs/10-android-preview.md`를 따른다.
- 네트워크 오류 원문 노출은 한국어 재시도 안내로 수정했다. Wi-Fi·모바일 데이터는 테스트 전 켜짐 상태로 복원했다. 수량 손실 의심은 화면 판독 오류였으며 로컬 캐시/인증 REST 대조에서 receipt 두부 `반 모`·시드 두부 `1모`를 확인했다.
- 전문 에이전트 2명의 리뷰에서 발견한 두 P2를 수정하고 재리뷰했다. 저장 실패 후 같은 영수증 재시도는 재고·outbox를 다시 영속화한 후에만 중복 입고 안내를 반환한다. 업로드·분석 단계에 닫기를 추가했다. 추가 차단 이슈는 발견하지 못했다.
- 검증 통과: `npm run test:domain` 14개, `npm run test:inventory` 저장 실패/복구 3개, `npm run test:receipts` 날짜·세션 및 진행 중 닫기 4개 경우, `npx tsc --noEmit`, `npm run lint`, Android Release 빌드·설치. 저장 실패/지연 응답은 실제 hook/컴포넌트를 실행하는 모의 저장소·네트워크 테스트이며 본체 저장 공간 부족 재현은 아니다.
- **iPhone 현재 상태:** iPhone 13 mini / iOS 26.6.1에 최신 코드의 로컬 Release를 갱신 설치했고 Metro 없이 실행했다. 사진 거부·제한된 접근·fixture 검수·5개 입고는 이전 Debug에서 확인했다. iOS 26.5 전용 시뮬레이터에서는 한글 키보드와 세 시트를 확인했다. 최신 진행 중 닫기와 본체 키보드·저장·소비의 완료 여부는 최신 QA 기록을 따른다.
- 추가 경계 QA: 실제 HEIC·10MB 경계 이미지, 긴 이름, Galaxy 접힘/펼침 전환. Android 16의 현재 시스템 Photo Picker는 앱 전체 사진 권한을 요청하지 않으므로 iOS식 거부/제한/전체 QA와 구분한다.
- 후속 동기화 테스트 후보: offline hydrate의 bootstrap 생성 및 pending receipt 재적용 경계. 일반적인 단일 클라이언트 경로에서 수량 손실을 재현하지 못했으므로 확정 결함으로 기록하지 않는다.

상세 과거 이력은 Git 로그와 `docs/09-device-qa.md`를 따른다. 다음 작업은 최상단 다음 세션 인계와 `docs/13-demo-production-plan.md`가 우선한다.
