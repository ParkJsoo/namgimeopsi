# 남김없이 (Namgimeopsi)

> 장 본 재료와 남은 음식을 빠르게 기록하고, 버리기 전에 오늘 먹을 한 끼를 결정해 주는 1~2인 가구용 AI 식재료 관리 앱.

`남김없이`는 포트폴리오 목적의 모바일 제품 프로젝트입니다. 단순 재고 목록이 아니라 **기록 → 오늘 먹기 → 소진**으로 이어지는 경험을 실제로 구현합니다.

## Problem

1~2인 가구는 구매 단위보다 소비 속도가 느려 식재료, 반찬, 배달 잔반을 잊고 버리기 쉽습니다. 하지만 매번 품목·수량·날짜를 직접 기록하는 재고 앱은 오래 쓰기 어렵습니다.

이 프로젝트는 두 가지 가설을 검증합니다.

1. AI가 영수증을 재고 초안으로 만들고 사용자가 짧게 검수하면 기록 비용이 낮아진다.
2. 임박 식재료와 남은 음식을 기준으로 메뉴를 제한해 제안하면 재고 관리가 실제 소비 행동으로 이어진다.

## Core flows

```text
영수증 촬영 → AI 품목 초안 → 검수·수정 → 재고 입고
남은 음식 등록 → 권장 섭취 시점 관리 → 오늘 먼저 먹을 것에 반영
오늘의 메뉴 선택 → 조리/섭취 완료 → 재료 차감 및 재고 갱신
```

## MVP scope

실제로 구현합니다.

- 영수증 이미지 업로드와 AI 기반 품목 초안
- `확인 / 수정 / 제외`가 가능한 검수형 입고
- 재고, 보관 위치, 수량, 날짜, 소진·폐기 이력
- 남은 배달음식·반찬의 빠른 등록
- 임박도와 재료 충족도를 반영한 메뉴 3개 추천
- 조리 완료 후 재료 차감

초기에는 구현하지 않습니다.

- 냉장고 사진만으로 전체 재고를 자동 인식하는 기능
- 바코드·상품 DB, 가격 비교, 외부 주문 연동
- 가족 공유 및 복잡한 권한 관리
- 자유형 AI 요리 챗, 영양·알레르기 분석, 스마트 냉장고 연동

## Design principles

- **AI는 자동 확정하지 않는다.** AI는 초안을 만들고, 사용자가 재고 반영을 통제한다.
- **불확실성을 숨기지 않는다.** 낮은 신뢰도의 인식 결과는 `확인 필요`로 분리한다.
- **정밀도보다 지속성을 우선한다.** `반 봉지`, `1모`, `2인분`, `조금 남음` 같은 생활 단위를 지원한다.
- **날짜의 성격을 구분한다.** 포장 표기일과 조리·보관 후 권장 섭취 시점을 혼용하지 않는다.
- **추천은 설명 가능해야 한다.** 메뉴 카드에 임박 재료, 부족 재료, 조리 시간, 추천 이유를 표시한다.

## Planned stack

- React Native + Expo + TypeScript
- Expo Router, TanStack Query, React Hook Form, Zod
- Supabase Auth, PostgreSQL, Storage, Edge Functions
- Vision/OCR provider for receipt extraction
- Local notifications for expiry reminders

## Documentation

- [Current context / handoff](docs/00-current-context.md)
- [Product brief](docs/01-product-brief.md)
- [UX specification](docs/02-ux-specification.md)
- [Technical design](docs/03-technical-design.md)
- [Development roadmap](docs/04-development-roadmap.md)
- [Competitive-analysis notes](docs/05-competitive-analysis.md)
- [Design direction and system](docs/06-design-direction.md)
- [Wireframe specification](docs/07-wireframe-specification.md)

## Status

Documentation and product definition are complete. Implementation has not started yet.
