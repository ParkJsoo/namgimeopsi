# Current context

> 새 세션에서 가장 먼저 읽는 작업 인계 문서입니다. 상태가 바뀌면 이 파일도 같이 갱신합니다.

## Project snapshot

- 이름: **남김없이 (Namgimeopsi)**
- 목적: AI 신뢰 UX와 모바일 제품 설계/구현 역량을 보여 주는 공개 포트폴리오 프로젝트
- GitHub: <https://github.com/ParkJsoo/namgimeopsi>
- 로컬 경로: `/Users/jeongsoopark/develop/namgimeopsi`
- 구현 상태: Expo TypeScript 앱에서 로컬 영속 재고 CRUD와 남은 음식 등록·필터를 구현했다. 재고 이벤트·날짜 상태·레시피 점수화 순수 함수가 실제 홈 추천·전량 소비 흐름에 연결됐고, Chrome에서 375 × 812 핵심 홈 상호작용을 확인했다. Supabase·AI 영수증·실기기 기능은 아직 시작하지 않았다.

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
- 남은 음식은 식재료와 별도 종류로 등록하며, 기본값은 `냉장 · 1인분 · 지금 보관 시작 · 내일까지 권장`이다. 냉장고 화면은 보관 위치와 전체/남은 음식/오늘 권장 필터를 제공한다.
- `src/features/domain/`에 다음 순수 함수를 구현했다. 아직 화면·저장소에 연결하지 않았으므로, 현재 메뉴 카드는 시드 데이터 기반이다.
  - `inventory-events.ts`: 입고·소비·수정·폐기 이벤트로 잔량을 계산하며, 단위 혼용과 초과 소비를 막는다.
  - `date-status.ts`: 권장 섭취 시점을 우선하고 없을 때만 포장 표기일을 보조 기준으로 써 `지남 / 오늘 / 임박 / 여유 / 알 수 없음`을 계산한다. 구매일·보관 시작일만으로 식품 상태를 추정하지 않는다.
  - `recipe-ranking.ts`: 재료 충족도 + 임박 재료 활용 - 부족 재료 - 조리 시간으로 점수화하고, 부족 재료가 2개를 넘는 메뉴를 제외한 상위 3개와 추천 근거를 반환한다.
- Supabase CLI 설정·`supabase/` 디렉터리·클라이언트 패키지·환경 파일·`EXPO_PUBLIC_SUPABASE_*` 값은 아직 없다. 프로젝트 선택과 URL/anon key가 준비되기 전에는 백엔드 연동을 시작하지 않는다.
- 이 단계는 백엔드 연동 전 UI·상태 전환 검증용이다. 기기 로컬에만 저장되며 계정·다른 기기와 동기화되지 않는다.
- Product Design 플러그인(0.1.52)을 설치했다. 저장된 플러그인 컨텍스트는 아직 없으며, 시각 QA 기준 문서는 루트 `design-qa.md`에 있다. 이번 세션에서 in-app Browser는 연결되지 않았지만 Chrome 연결로 구현 화면 캡처와 동작 QA를 완료했다. Figma 원본 프레임은 연결된 Chrome에서 WebGL을 지원하지 않아 열 수 없었고, 차단 증거는 `docs/qa-artifacts/06-figma-webgl-blocked.png`에 있다. Figma Desktop fallback도 Computer Use 연결 시작 실패로 캡처하지 못했다. Figma MCP는 재호출하지 않았다.
- 검증 완료: `npm run test:domain`, `npx tsc --noEmit`, `npx expo export --platform web`.

## Recommended next session order

1. `AGENTS.md`와 이 문서를 읽고 Git 상태를 확인한다.
2. Figma 보정은 앱 구현을 막지 않는다. 최종 발표 전 시각 보정이 필요할 때만 WebGL 가능한 Browser 또는 복구된 Computer Use 연결로 다시 확인하며, Figma MCP는 재시도하지 않는다.
3. 영수증 모의 AI 검수형 입고를 로컬 fixture로 구현한다. `빠른 추가 선택 → 분석 상태 → 확인됨/확인 필요 검수 → 사용자 확정 뒤 입고 이벤트` 순서를 지키고, 확정 전에는 재고를 바꾸지 않는다.
4. Supabase 프로젝트를 준비한다. 프로젝트 선택과 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`가 있어야 로컬 저장소를 데이터 모델·익명 로그인·시드 데이터 저장으로 대체한다.
5. 수량 기반 부분 차감과 조리 세션은 영수증 검수 흐름 뒤 별도 작업으로 추가한다. 그전에는 전량 소비와 수동 수량 수정만 지원한다.
6. 구현 중 제품/UX 결정이 바뀌면 관련 명세와 이 문서를 함께 갱신한다.

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
- 위 커밋은 아직 원격에 푸시하지 않았다. Figma 변경은 외부 디자인 파일에 반영됐고, 이번 문서 갱신도 별도 작은 커밋으로 기록한다.
