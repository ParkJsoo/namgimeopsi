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

1. `AGENTS.md`와 이 문서, `docs/09-device-qa.md`, `docs/10-android-preview.md`를 읽고 Git 상태를 확인한다. 작업 브랜치는 `feat/live-recommendations`이며 `origin/feat/live-recommendations`를 추적한다.
2. **새 세션의 작업은 iPhone QA와 iOS 독립 실행 preview 검증이다.** 이번 인계 세션에서 iPhone 작업을 시작하지 않았다. Galaxy 핵심 QA를 처음부터 반복하지 않는다.
3. iPhone 13 mini의 연결·잠금·개발자 모드·서명을 확인하고 최신 코드로 빌드한다. 기존 테스트 재고를 지우거나 앱을 삭제하지 않는다. 이전 Metro 세션은 재사용 가능 여부를 확인하고 필요할 때만 다시 시작한다.
4. 우선 영수증 업로드/분석 중 새 `닫기` 버튼의 실제 표시·터치, 닫기 후 재진입을 확인한다. 이어 세 입력 시트의 본체 한글 키보드·마지막 필드·확정/취소 접근, 남은 음식 저장·조리 부분/전량 차감·재실행 후 유지 등을 `docs/09-device-qa.md`의 미완료 범위에 맞춰 검증한다.
5. iOS preview는 서명 가능한 로컬 Release 또는 사용 가능한 배포 경로를 확인하고, 실제 설치와 Metro 없는 cold launch로 검증한다. 개발용 Debug/시뮬레이터 결과를 독립 실행 실기기 preview 완료로 기록하지 않는다.
6. 이후 `docs/08-portfolio-demo.md`의 120초 대본을 리허설하고 영상·케이스 스터디를 마무리한다. 영상 파일/공개 링크는 아직 없다.

## Session memory and boundaries

- 사용자는 실기기 조작을 반복해서 안내받기보다 에이전트가 직접 진행하기를 원한다. Galaxy는 ADB로 화면 캡처·터치·재실행이 가능하다. iPhone은 사용 가능한 미러링/네이티브 제어를 먼저 사용하고, 본체 조작이 꼭 필요한 경우만 요청한다. 시뮬레이터 결과와 본체 결과는 구분한다.
- **Figma 및 withnetworks 관련 파일·워크스페이스는 읽거나 조작하지 않는다.** 앞의 디자인 이력은 과거 기록이며 접근 허가가 아니다.
- OCR provider/키를 연결하지 않는다. fixture 결과와 `분석 제공자는 아직 연결 전` 고지를 유지한다.
- `닫기`는 검수 화면을 닫고 늦은 응답을 무효화한다. 진행 중 업로드 중단이나 원격 원본 삭제를 뜻하지 않는다.
- 테스트 이미지: `~/Downloads/namgimeopsi-test-receipt.png`. iPhone·Galaxy에 사용자가 저장했다. 개인 사진을 새로 업로드하지 않는다.
- iPhone에는 이전 5개 입고 lot, Galaxy에는 5개 입고 lot·`QA 카레 2인분`·부분/전량 차감 결과가 남아 있다. 동명 lot는 별도이며, 수량 확인은 lot ID로 구분한다. 임의 초기화·정리는 하지 않는다.
- 이 문서가 저장소의 세션 메모리다. 별도 MEMORY 파일을 만들지 않고 현재 상태와 사용자 선호를 여기에 유지한다.

## Last verified repository state — 2026-09-08 handoff

- 구현 기준: `eca2a79 fix: retry receipt persistence and allow closing progress`. 사용자의 명시적 요청으로 `origin/feat/live-recommendations`에 push했고 upstream을 설정했다. 인계 문서 정리 커밋도 같은 브랜치로 push한다. main 병합·PR 생성·스토어 배포는 하지 않았다. 이전 미push 안내는 이 기록으로 대체한다.
- **Galaxy 핵심 QA 완료:** SM-F766N / Android 16에서 영수증 검수·5개 입고, 남은 음식 저장, 조리 부분/전량 차감과 재실행 유지, 세 입력 시트의 한글 키보드 유지 스크롤·하단 버튼 접근을 확인했다. 사용자 본체 보고와 에이전트 직접 관찰은 `docs/09-device-qa.md`에 구분했다.
- **Android 로컬 preview 확인:** JS 내장 arm64 Release를 설치하고 네트워크 없이 cold launch, 오프라인 영수증 실패·온라인 재시도·fixture 고지·키보드 스크롤·취소를 확인했다. 최신 리뷰 수정을 포함해 Release를 재빌드·설치했다. Galaxy 최종 설치는 Release이며 Metro가 필요 없다. 로컬 debug keystore 서명으로 EAS/스토어 배포와 다르다. APK 경로·해시·증거 버전은 `docs/10-android-preview.md`를 따른다.
- 네트워크 오류 원문 노출은 한국어 재시도 안내로 수정했다. Wi-Fi·모바일 데이터는 테스트 전 켜짐 상태로 복원했다. 수량 손실 의심은 화면 판독 오류였으며 로컬 캐시/인증 REST 대조에서 receipt 두부 `반 모`·시드 두부 `1모`를 확인했다.
- 전문 에이전트 2명의 리뷰에서 발견한 두 P2를 수정하고 재리뷰했다. 저장 실패 후 같은 영수증 재시도는 재고·outbox를 다시 영속화한 후에만 중복 입고 안내를 반환한다. 업로드·분석 단계에 닫기를 추가했다. 추가 차단 이슈는 발견하지 못했다.
- 검증 통과: `npm run test:domain` 14개, `npm run test:inventory` 저장 실패/복구 3개, `npm run test:receipts` 날짜·세션 및 진행 중 닫기 4개 경우, `npx tsc --noEmit`, `npm run lint`, Android Release 빌드·설치. 저장 실패/지연 응답은 실제 hook/컴포넌트를 실행하는 모의 저장소·네트워크 테스트이며 본체 저장 공간 부족 재현은 아니다.
- **iPhone 현재 상태:** iPhone 13 mini / iOS 26.6 Debug 실행, 사진 거부·제한된 접근·fixture 검수·5개 입고는 이전에 확인했다. iOS 26.5 전용 시뮬레이터에서는 한글 키보드와 세 시트를 확인했다. 최신 닫기 버튼의 실제 iPhone 터치, 본체 키보드·저장·소비 및 iOS preview는 아직 남아 있다.
- 추가 경계 QA: 실제 HEIC·10MB 경계 이미지, 긴 이름, Galaxy 접힘/펼침 전환. Android 16의 현재 시스템 Photo Picker는 앱 전체 사진 권한을 요청하지 않으므로 iOS식 거부/제한/전체 QA와 구분한다.
- 후속 동기화 테스트 후보: offline hydrate의 bootstrap 생성 및 pending receipt 재적용 경계. 일반적인 단일 클라이언트 경로에서 수량 손실을 재현하지 못했으므로 확정 결함으로 기록하지 않는다.

상세 과거 이력은 Git 로그와 `docs/09-device-qa.md`를 따른다. 이 문서의 다음 작업은 위 iPhone 인계 순서를 우선한다.
