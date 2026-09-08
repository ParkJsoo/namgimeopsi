# Current context

> 새 세션에서 가장 먼저 읽는 작업 인계 문서입니다. 상태가 바뀌면 이 파일도 같이 갱신합니다.

## Project snapshot

- 이름: **남김없이 (Namgimeopsi)**
- 목적: AI 신뢰 UX와 모바일 제품 설계/구현 역량을 보여 주는 공개 포트폴리오 프로젝트
- GitHub: <https://github.com/ParkJsoo/namgimeopsi>
- 로컬 경로: `/Users/jeongsoopark/develop/namgimeopsi`
- 구현 상태: Expo TypeScript 앱에서 영수증 검수형 입고, 남은 음식 등록, 메뉴 추천·전량 소비를 구현했다. 재고는 Supabase 익명 사용자별 Postgres에 동기화하고, 기존 AsyncStorage 상태는 최초 원격 시드와 오프라인 캐시로 유지한다. 실제 OCR과 영수증 이미지 저장은 아직 구현하지 않았다.

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
- 레시피 완료 시트는 레시피와 전량 소비 대상으로 명시된 보유 재료·생활 단위를 먼저 보여 준다. 사용자가 `다 먹음으로 기록`을 누르면 `consume-all` 로컬 원장을 남기고 활성 재고에서만 제외한다. 수량을 일부만 쓴 경우에는 자동 차감하지 않고 현재의 재고 수정으로 처리한다. 원장은 AsyncStorage v2에 보존되며 기존 v1 재고 배열은 이관한다.
- 빠른 추가는 `영수증으로 등록 / 남은 음식 등록 / 직접 추가`를 먼저 고른다. 영수증은 실제 OCR이 아님을 명시한 로컬 fixture를 짧게 분석한 뒤, 확인됨 4개와 `AI 추정 · 확인 필요` 2개를 원문과 함께 검수한다. 이름·생활 단위·보관 위치·권장 섭취 시점을 수정하거나 제외할 수 있고, 사용자가 `N개 냉장고에 담기`를 누르기 전에는 재고와 원장이 바뀌지 않는다.
- 영수증 확정은 선택한 후보를 개별 재고 lot와 `intake` 원장 이벤트로 같은 로컬 상태에 기록한다. 원문·생활 단위·확정 시각·영수증 batch ID를 보존하며, 같은 batch ID의 재확정은 중복 입고하지 않고 이미 입고했다는 안내를 보여 준다. AsyncStorage 쓰기에 성공한 뒤에만 완료 화면으로 넘어간다.
- 남은 음식은 식재료와 별도 종류로 등록하며, 기본값은 `냉장 · 1인분 · 지금 보관 시작 · 내일까지 권장`이다. 냉장고 화면은 보관 위치와 전체/남은 음식/오늘 권장 필터를 제공한다.
- `src/features/domain/`에 다음 순수 함수를 구현했다. 레시피 점수화는 `src/features/recipes/recommendations.ts` 어댑터를 거쳐 활성 로컬 재고와 홈 카드에 연결됐다. 수량 기반 이벤트 함수는 부분 차감 단계까지 순수 함수·단위 테스트로만 유지한다.
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
- 375 × 812 웹 앱은 익명 로그인·초기 동기화 뒤 정상 로드됐고 브라우저 콘솔 오류는 없었다(기존 RN `shadow*` 경고만 있음). 새 익명 세션에서 두 테이블 조회가 모두 HTTP 200으로 성공했고, 초기 시드 재고 5건의 실제 업서트를 확인했다. 새 검증 익명 사용자에서는 RPC 첫 호출 `confirmed`, 재호출 `already-confirmed`, 두 테이블 읽기, 품목 수정·삭제까지 성공했다. 별도 동시성 검증에서는 같은 batch의 서로 다른 두 호출이 `confirmed` 1건과 `already-confirmed` 1건으로 끝났고, 세 번째 변조 payload도 `already-confirmed`를 반환했으며 재고·이벤트 검증 행은 모두 삭제했다.
- Product Design 플러그인(0.1.52)을 설치했다. 저장된 플러그인 컨텍스트는 아직 없으며, 시각 QA 기준 문서는 루트 `design-qa.md`에 있다. Chrome 375 × 812에서 빠른 추가·영수증 분석·검수·수정·제외·취소·확정 완료·보관 위치별 입고를 QA했고, 재확정 시 중복 입고 없이 `이미 냉장고에 담은 영수증이에요` 안내가 노출되는 것도 확인했다. Figma 원본 프레임은 연결된 Chrome에서 WebGL을 지원하지 않아 열 수 없었고, 차단 증거는 `docs/qa-artifacts/06-figma-webgl-blocked.png`에 있다. Figma Desktop fallback도 Computer Use 연결 시작 실패로 캡처하지 못했다. Figma MCP는 재호출하지 않았다.
- 검증 완료: `npm run lint`, `npm run test:domain`, `npx tsc --noEmit`, `npx expo export --platform web`, 375 × 812 Chrome 익명 동기화 확인.

## Recommended next session order

1. `AGENTS.md`와 이 문서를 읽고 Git 상태를 확인한다.
2. OCR 원본 영수증 이미지를 private Storage에 저장하고, `commit_receipt_intake`를 이미지·scan job까지 포함한 server-side 흐름으로 확장한다. 새 기기 동기화는 정식 계정 로그인 도입 뒤에 검증한다.
3. 수량 기반 부분 차감과 조리 세션은 영수증 검수 흐름 뒤 별도 작업으로 추가한다. 그전에는 전량 소비와 수동 수량 수정만 지원한다.
4. Figma 보정은 앱 구현을 막지 않는다. 최종 발표 전 시각 보정이 필요할 때만 WebGL 가능한 Browser 또는 복구된 Computer Use 연결로 다시 확인하며, Figma MCP는 재시도하지 않는다.
5. 구현 중 제품/UX 결정이 바뀌면 관련 명세와 이 문서를 함께 갱신한다.

## Last verified repository state

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
- 위 커밋은 아직 원격에 푸시하지 않았다. Figma 변경은 외부 디자인 파일에 반영됐고, 이번 문서 갱신도 별도 작은 커밋으로 기록한다.
