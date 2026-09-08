# Current context

> 새 세션에서 가장 먼저 읽는 작업 인계 문서입니다. 상태가 바뀌면 이 파일도 같이 갱신합니다.

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
- 남은 음식은 식재료와 별도 종류로 등록하며, 기본값은 `냉장 · 1인분 · 지금 보관 시작 · 내일까지 권장`이다. 냉장고 화면은 보관 위치와 전체/남은 음식/오늘 권장 필터를 제공한다.
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

1. `AGENTS.md`와 이 문서를 읽고 Git 상태를 확인한다.
2. `docs/08-portfolio-demo.md`에 120초 촬영 대본·준비 조건·케이스 스터디 초안을 작성했다. 실기기 QA·preview build·영상 촬영은 아직 미완료다. 다음에는 사용 가능한 iOS·Android 기기에서 사진 권한·레이아웃 QA를 수행하고 preview build로 이어간다. 기기 준비 전에는 대본으로 웹 데모 리허설·녹화를 진행할 수 있으며 실행 환경을 표시한다. 실제 OCR provider 연결은 별도의 명시적 제품 결정 전까지 하지 않는다.
3. Figma 보정은 앱 구현을 막지 않는다. 최종 발표 전 시각 보정이 필요할 때만 WebGL 가능한 Browser 또는 복구된 Computer Use 연결로 다시 확인하며, Figma MCP는 재시도하지 않는다.
4. 구현 중 제품/UX 결정이 바뀌면 관련 명세와 이 문서를 함께 갱신한다.

## Last verified repository state

- Android 로컬 preview 후속 검증: SM-F766N에 JS 내장 Release APK를 설치하고 Wi-Fi/모바일 데이터 없이 cold launch했다. 오프라인 사진 업로드에서 DNS 오류 원문 노출을 발견해 `scan-error.ts`로 사용자용 재시도 안내를 적용했고, Release에서 새 안내·온라인 복구 후 fixture 검수·키보드 유지 스크롤·취소를 확인했다. 네트워크는 원래 켜짐 상태로 복원했다. 두부 수량 의심은 화면 판독 오류였으며 로컬 캐시와 사용자 인증 REST 모두 해당 receipt lot `반 모`를 유지한다. 빌드 방법·해시·증거·남은 범위는 `docs/10-android-preview.md`를 따른다. 최종 Galaxy 설치는 로컬 Release이며 EAS/스토어 배포는 아니다. TypeScript·lint 및 오류 안내 분기 검사를 통과했다. 다음은 남은 경계 QA와 iOS preview/데모 촬영 준비다.

- Galaxy 최신 QA: 사용자가 조리 완료에서 두부 `반 모` 부분 차감·애호박 전량 차감 및 종료·재실행 후 유지까지 확인했다. 에이전트도 ADB 화면에서 두부 `반 모`·`QA 카레 2인분`을 확인하고 사진 선택 취소→등록 방식 복귀→선택기 재진입을 직접 검증했다. 상세 증거 범위는 `docs/09-device-qa.md`를 따른다. 앞으로 가능한 실기기 조작은 ADB로 직접 수행하며 사용자에게 반복 위임하지 않는다. 남은 사진 권한·오류 복구 QA와 Metro 없는 preview 검증으로 이어간다.

- Galaxy 영수증 입고: 사용자가 테스트 영수증에서 돼지고기 제외 → 5개 확정 → 완료 화면 및 냉장(계란·두부·애호박)/냉동(만두)/실온(참기름) 목록 확인 절차를 수행했다고 보고했다. 사용자 본체 보고 기준으로 확정 입고·목록 표시는 통과이며 테스트 lot는 유지한다. 별도 원격 조회나 멱등성 재검증은 하지 않았다. 바로 다음은 조리 완료의 두부 부분 차감·애호박 전량 차감과 재실행 후 유지 확인이다. 동명 lot가 별도로 있으므로 전량 차감 후에도 같은 이름의 다른 lot는 남을 수 있다.

- Galaxy 남은 음식 저장: 사용자가 `QA 카레`·`2인분`·`냉장`으로 저장한 뒤 냉장고 목록에 표시됨을 확인했다. 사용자 본체 보고 기준으로 저장·목록 표시는 통과이며 테스트 항목은 유지한다. 이후 사용자가 최근 앱에서 종료·재실행한 뒤에도 `QA 카레 · 2인분`이 그대로 보인다고 확인해 재실행 후 유지까지 통과했다. 바로 다음은 영수증 검수 확정 입고·목록 반영 확인이다. 원격 동기화 완료는 별도 검증하지 않았다.

- Galaxy 조리 시트 후속 확인: 사용자가 애호박 두부덮밥에서 두부의 남은 양 `반 모` 입력 후 키보드를 유지한 채 `재료 사용 완료`·`아직 있어요`가 모두 보인다고 보고했다. 세 입력 시트의 키보드 스크롤·하단 버튼 접근은 본체 QA 통과다. 소비 확정·상태 유지는 이번에 확인하지 않았다. 다음은 남은 음식 저장·재진입, 영수증 확정 입고, 조리 부분/전량 차감의 실기기 상태 변경 검증이며 preview build는 그 뒤 진행한다.

- Galaxy 영수증 후속 확인: 사용자가 테스트 영수증 선택 → 검수 품목 이름에서 키보드 열기 → 끝까지 스크롤 후 `6개 냉장고에 담기`·`아직 저장하지 않을게요` 표시를 확인했다. 사용자 본체 보고 기준으로 검수 시트의 키보드 스크롤·버튼 접근은 통과이며 입고 확정은 확인하지 않았다. 조리 완료 시트의 후속 결과는 위 최신 항목을 따른다.

- Galaxy 스크롤 후속 수정: 전문 리뷰로 Android `on-drag`의 강제 키보드 닫기를 확인해 Android만 `keyboardDismissMode="none"`으로 변경했다. 연결된 SM-F766N의 ADB 스와이프·화면 캡처에서 한글 키보드를 유지한 채 남은 음식의 마지막 필드·저장·닫기 전체 노출을 확인했다. 저장은 하지 않았다. TypeScript·lint·diff 검사를 통과했다. 사용자가 본체에서도 스크롤이 잘 되고 끝까지 내리면 버튼 전체가 보인다고 재확인했다. 남은 음식 시트의 키보드 스크롤 QA는 통과했다. 영수증·조리 시트 후속 결과는 위 최신 항목을 따른다.

- 2026-09-08 Galaxy 후속 QA: SM-F766N / Android 16에 로컬 Debug 앱을 다시 빌드·설치했다. 사용자가 남은 음식 입력 시 키보드 가림·스크롤 불가를 보고했다. 공용 `KeyboardSheet`의 Android 키보드 회피를 미지정에서 `height`로 변경했다. 다음 작업은 갤럭시 본체에서 마지막 입력란과 저장/닫기까지 스크롤, 키보드 닫기/재열기, 영수증·조리 완료 시트 회귀 확인이다. 당시에는 수정 후 실기기 확인 전이었으며, 후속 스크롤 수정과 본체 확인 결과는 위 항목을 따른다. 사진 QA·preview는 남아 있다.

- 2026-09-08 리뷰 수정: 영수증 권장 섭취일을 선택적 `YYYY-MM-DD` 입력으로 변경해 표시·추천 날짜를 함께 갱신하고 잘못된 달력 날짜의 확정을 차단했다. 빈 날짜는 미지정으로 저장하며 포장 표기일은 유지한다. 이전 검수를 닫거나 새 요청을 시작하면 기존 요청 세션을 무효화해 늦은 사진 선택·업로드·분석·확정 응답이 새 화면을 덮지 않게 했다. 진행 중 원격 업로드 자체의 취소/삭제 기능을 추가한 것은 아니다. 분석·검수 문구를 fixture에 맞게 통일했고 OCR provider/키는 연결하지 않았다.
- 세 입력 시트를 공용 `KeyboardSheet`로 통합했다. 전용 iPhone 13 mini / iOS 26.5 시뮬레이터에서 소프트웨어 한글 키보드 조합, 마지막 필드 표시, 스와이프 후 확정·취소 접근 및 저장 없이 닫기를 확인했다. 영수증 날짜 오류·정정의 버튼 상태도 확인했다. 상세와 샘플 이미지 사용 한계는 `docs/09-device-qa.md`에 기록했다. 실제 본체·갤럭시 키보드 및 preview QA는 아직 남아 있다.
- 이번 검증: 기존 도메인 14개 테스트, 새 날짜·지연 응답 테스트(`npm run test:receipts`), TypeScript·lint·웹 export, iOS Simulator Debug 빌드 성공. 전문 에이전트의 수정 코드 재리뷰에서 추가 차단 사항을 발견하지 못했다. 앱 상태를 변경하는 시뮬레이터 입고·소비 확정은 하지 않았고, 기존 iPhone 데모 재고는 유지했다.

- 최신 실기기 QA: `docs/09-device-qa.md`에 iPhone 13 mini의 제한된 사진 접근 → 테스트 이미지 업로드 → fixture 검수 → 수량 공란/편집·제외·취소 → 새 초안 5개 확정 입고 → 냉장/냉동/실온 목록 확인 결과를 기록했다. 사용자가 사진 권한을 제한된 접근으로 변경했으며 테스트 입고 5개 lot는 유지했다. iPhone 본체 한글 키보드·남은 음식 저장·조리 차감·갤럭시 QA·preview build는 미완료다. 기존 웹/Supabase E2E 결과와 이번 미러링 기반 UI 관찰을 구분한다.

- iPhone 최초 확인: 사용자가 개발 앱을 열고 로컬 네트워크 권한을 허용한 뒤 `Reload JS`로 iOS bundle 로딩과 홈 표시를 확인했다. 초기 오프라인 안내는 재시도를 눌러 해제됐다. 미러링에서 사진 권한 요청의 한국어 설명과 `허용 안 함` 뒤 `영수증 사진을 고르려면 사진 접근을 허용해 주세요.` 안내 및 등록 방식 선택 화면 복귀를 확인했다. 이후 제한된 접근·업로드는 위 최신 QA에서 확인했다.
- 실기기에서 직접 추가/남은 음식 편집 시트에 취소 버튼이 없는 문제를 발견해 공용 편집 시트에 `닫기`를 추가했다. iPhone에서 버튼 표시와 저장 없이 홈 복귀를 확인했고 `npx tsc --noEmit`, `npm run lint`, `git diff --check`를 통과했다. 사진 권한 거부 테스트 뒤 사용자가 설정에서 제한된 접근으로 변경했다.

- 2026-09-06 실기기 설치 준비: iPhone 13 mini(iOS 26.6, 개발자 모드 enabled)와 갤럭시 SM-F766N(Android 16, adb authorized)의 USB 연결을 확인했다. Xcode 26.6·CocoaPods·Android SDK·JDK 17로 두 플랫폼의 로컬 Debug 빌드를 성공했다. 앱 식별자는 `com.parkjsoo.namgimeopsi`로 지정했고, `npm run ios/android`는 Expo 로컬 빌드 명령으로 변경했다. 자동 생성 `ios/`, `android/`는 Git에서 제외한다.
- 갤럭시는 APK 설치·실행과 Metro의 Android bundle 로딩을 확인했고 앱 프로세스도 실행 중이다. iPhone은 빌드·설치 뒤 실행 단계에서 iOS의 서명/entitlement/프로파일 신뢰 오류로 차단됐다. 사용자에게 본인의 개발 계정 신뢰 확인을 요청했으며, iOS 앱 실행 성공은 아직 확인 전이다. 사진 권한·레이아웃·세 흐름의 실기기 QA와 독립 실행 preview build는 아직 완료하지 않았다.
- 실기기 준비 검증: `npx tsc --noEmit`, `npm run lint`, 생성된 iOS `NSPhotoLibraryUsageDescription`의 한국어 문구 일치 확인을 통과했다. Android Debug 빌드 성공, iOS Debug 빌드 0 errors(중복 `-lc++` 링크 경고 1건). OCR provider·키·fixture 고지는 변경하지 않았다. 후속 검증에서는 iPhone 신뢰 확인 후 앱 실행, 두 기기의 홈 표시와 사진 권한부터 확인한다.

- 2026-09-06 포트폴리오 준비: 시작 시 `feat/live-recommendations`, HEAD `a980ae6 docs: finalize portfolio handoff`, 작업 트리 clean을 확인했다. README에 데모 준비 문서 링크를 추가했다. 앱·OCR 설정·원격 데이터 변경 없이 대본과 케이스 스터디를 준비했으며 이번에 실기기 QA나 Supabase E2E를 재수행하지 않았다. fixture의 고정 날짜·동명 lot·분석 중 OCR처럼 보이는 문구를 촬영 주의점과 알려진 한계로 기록했다. Figma 및 다른 프로젝트 자료는 접근하지 않았다.
- 이번 문서 변경 검증: README·데모 문서의 로컬 링크, 대본 9구간의 연속성·합계 120초, `npm run test:domain` 14개 테스트를 통과했다. 커밋 메시지는 `docs: prepare portfolio demo and case study`이며 원격 push는 하지 않는다.

- 원격 `main`은 `83254f7 docs: add project handoff context`까지 반영돼 있다.
- 이전 세션의 로컬 커밋:
  - `dfe31d2 feat: initialize Expo inventory prototype`
  - `c8b1ad2 feat: persist inventory and add leftover flow`
  - `5a09183 docs: update implementation handoff`
- `9b8924c feat: add tested inventory domain logic`
- 현재 작업 브랜치 `feat/live-recommendations`의 로컬 커밋:
  - `c165a3e feat(recipes): add live recommendation selector`
  - `d3afd5d feat(inventory): persist consumption events`
  - `8375bbf feat(home): render live meals and completion flow`
  - `f0fd1ca docs: record live recommendation demo`
  - `bf91a64 docs: prepare receipt flow handoff`
  - `d095fa8 feat(receipts): add local receipt review fixture`
  - `284f577 feat(inventory): persist receipt intake batches`
  - `a947e23 feat(receipts): add fixture review flow`
  - `5541368 fix(receipts): explain duplicate intake`
  - `13f042f feat(inventory): sync anonymous inventory with supabase`
  - `2999777 fix(supabase): grant inventory access to authenticated users`
  - `da08a01 docs: record supabase access verification`
  - `19bd756 fix(inventory): make remote sync resilient`
  - `1c3b93d fix(receipts): lock intake batches`
  - `0c04788 docs: record remaining sync blockers`
  - `1c951c7 fix(inventory): recover legacy receipt sync`
- 이번 세션의 로컬 커밋:
  - `7af9ac5 feat(receipts): add private image scan workflow`
  - `3856806 fix(receipts): scope scan lookup to caller`
  - `61a1d7d fix(supabase): allow scan job state updates`
  - `f495c68 fix(supabase): grant scan state filter access`
  - `1de928d feat(cooking): record partial consumption sessions`
  - `3275fc9 docs: update cooking session handoff`
  - `70e172e docs: refresh portfolio README`
- 위 로컬 커밋은 아직 원격에 푸시하지 않았다. 다음 세션은 README의 다음 단계대로 실기기 QA 또는 발표 산출물 작업을 택해 시작한다.
