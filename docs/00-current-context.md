# Current context

> 새 세션에서 가장 먼저 읽는 작업 인계 문서입니다. 상태가 바뀌면 이 파일도 같이 갱신합니다.

## Project snapshot

- 이름: **남김없이 (Namgimeopsi)**
- 목적: AI 신뢰 UX와 모바일 제품 설계/구현 역량을 보여 주는 공개 포트폴리오 프로젝트
- GitHub: <https://github.com/ParkJsoo/namgimeopsi>
- 로컬 경로: `/Users/jeongsoopark/develop/namgimeopsi`
- 구현 상태: Expo TypeScript 초기화와 시드 데이터 기반 수동 재고 CRUD의 첫 화면을 구현했다. Supabase·AI 영수증·실기기 기능은 아직 시작하지 않았다.

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
- 아직 할 일:
  - Foundations 안에 공용 `Button`, `Status chip`, `Recipe card`, `Bottom navigation` 컴포넌트 구성
  - App Screens에 온보딩, 홈, 영수증 검수, 레시피 상세, 완료/차감 흐름 구성 및 검증
- 주의: 이번 세션에서 Figma Starter MCP 도구 호출 한도에 도달했다. 다음 세션에서는 먼저 한도 해제 여부를 확인하고, 막혀 있으면 Figma 작업을 억지로 우회하지 말고 앱 구현/문서 작업으로 전환한다.

## Implementation status

- Expo Router 기반 TypeScript 앱을 루트에 초기화했다.
- 현재는 로컬 시드 데이터로 홈과 냉장고 화면을 렌더링한다. 직접 추가, 수정, 제외, `다 먹음` 처리는 메모리 상태에서 동작한다.
- 홈은 남은 치킨·두부·애호박의 우선 소비 카드와 두 개의 설명 가능한 메뉴 카드를 보여 준다.
- 이 단계는 백엔드 연동 전 UI·상태 전환 검증용이다. 앱을 다시 실행하면 변경한 재고는 초기 시드 상태로 돌아간다.

## Recommended next session order

1. `AGENTS.md`와 이 문서를 읽고 Git 상태를 확인한다.
2. Figma MCP 호출 가능 여부를 한 번 확인한다. 가능하면 공용 컴포넌트 → 핵심 화면 순으로 계속 작업한다.
3. Figma가 막힌 경우 현재 로컬 재고 상태를 영속 계층으로 분리하고, 남은 음식 등록 및 재고 필터·상세 수정 흐름을 보강한다.
4. 이후 Supabase 초기화와 익명 로그인, 시드 데이터 저장을 연결한다.
5. 구현 중 제품/UX 결정이 바뀌면 관련 명세와 이 문서를 함께 갱신한다.

## Last verified repository state

- 문서 기반 커밋 2개가 원격 `main`에 반영돼 있다.
  - `8790ff4 docs: add portfolio product foundation`
  - `f669b3e docs: define design system and wireframes`
- `83254f7` 이후 Expo 초기화와 로컬 시드 재고 CRUD 작업이 진행 중이며, 검증 후 별도 커밋한다.
