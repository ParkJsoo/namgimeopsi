# Design direction and system

## Design premise

남김없이는 식재료를 통제하는 대시보드가 아니라, 퇴근 후 사용자의 결정을 가볍게 만들어 주는 주방 도우미다. UI는 재고 관리의 정확함과 식사 제안의 따뜻함을 함께 가져가야 한다.

### Product feeling

- **Calm:** 유통기한과 재고를 경고창처럼 다루지 않는다.
- **Warm:** 식사와 집의 맥락을 담되, 귀엽거나 유아적인 캐릭터 UX는 피한다.
- **Decisive:** 홈은 많은 선택지를 보여 주는 대신 오늘의 다음 행동을 하나로 좁힌다.
- **Trustworthy:** AI 추정값, 포장 표기일, 권장 섭취 시점을 시각적으로 구분한다.

## Reference viewport

- Primary: iPhone 15 / 390 × 844 pt
- Safe-area를 포함한 세로 모바일 화면을 기준으로 설계한다.
- Android에서도 같은 정보 밀도를 유지하되, 시스템 네비게이션과 터치 영역은 플랫폼 규칙을 따른다.

## Visual language

### Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| `bg.canvas` | `#FAF8F4` | 화면 기본 배경. 차갑지 않은 쌀빛 백색 |
| `bg.surface` | `#FFFFFF` | 카드, 바텀시트, 입력 영역 |
| `bg.subtle` | `#F1EEE7` | 비활성 영역, 필터, 정보 배지 |
| `ink.primary` | `#1D211C` | 제목, 본문, 주요 아이콘 |
| `ink.secondary` | `#6C7168` | 보조 설명, 비활성 라벨 |
| `brand.primary` | `#2F6B4F` | 완료, 주요 CTA, 재료 사용 행동 |
| `brand.soft` | `#E4F0E7` | 선택 상태, 성공 배경 |
| `accent.amber` | `#B96C1A` | 오늘/곧 섭취 권장 상태 |
| `accent.amberSoft` | `#FFF0DC` | 임박 상태 배경 |
| `danger` | `#B73D32` | 폐기, 만료됨, 파괴적 행동 |
| `dangerSoft` | `#FCE9E7` | 위험 상태 배경 |
| `ai.violet` | `#6A5ACD` | AI 추정, 분석 상태, 근거 라벨 |
| `ai.violetSoft` | `#EEEBFF` | AI 관련 보조 영역 |

`danger`는 실제로 즉시 버려야 함을 단정하는 데 쓰지 않는다. 식품 상태는 `권장 섭취 시점 지남`으로 표현하고, 폐기 행동을 선택할 때만 사용한다.

### Typography

| Style | Font | Size / Line height | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display | Pretendard | 28 / 36 | 700 | 홈 인사, 완료 메시지 |
| H1 | Pretendard | 22 / 30 | 700 | 화면 제목 |
| H2 | Pretendard | 18 / 26 | 700 | 카드·섹션 제목 |
| Body | Pretendard | 15 / 22 | 400 | 본문, 입력값 |
| Body strong | Pretendard | 15 / 22 | 600 | 강조 문장, CTA 보조 |
| Label | Pretendard | 13 / 18 | 500 | 상태 배지, 필드 라벨 |
| Caption | Pretendard | 12 / 17 | 400 | 날짜 근거, 설명 |

시스템에 Pretendard를 포함하지 않는 초기 구현에서는 플랫폼 기본 sans-serif로 폴백한다. 본문 최소 크기는 15pt, 보조 정보 최소 크기는 12pt를 유지한다.

### Spacing and shape

| Token | Value |
| --- | --- |
| Base unit | 4pt |
| Page horizontal padding | 20pt |
| Section gap | 28pt |
| Card gap | 12pt |
| Card radius | 20pt |
| Input radius | 14pt |
| Pill radius | 999pt |
| Minimum target | 44 × 44pt |

## Component inventory

### Foundation

- App header: 뒤로가기 + 화면 제목 + 선택적 액션
- Bottom navigation: 홈 / 냉장고 / 나, 가운데에 독립된 `추가` FAB
- Primary button: `brand.primary` fill, 52pt 높이
- Secondary button: `bg.subtle` fill, 52pt 높이
- Text button: 파괴적 행동을 제외한 보조 이동
- Bottom sheet: 선택지·폼의 문맥을 유지하는 20pt 상단 라운드

### Domain components

| Component | Purpose | Required states |
| --- | --- | --- |
| Food status chip | 항목의 소비 우선도 표시 | 여유 / 오늘 권장 / 확인 필요 / 권장 시점 지남 |
| Inventory row | 재고 한 묶음 표시 | 기본 / 선택 / 소진 / 수정 필요 |
| AI confidence label | AI 해석의 확실성 공개 | 확인됨 / AI 추정 / 확인 필요 |
| Recipe card | 저녁 결정을 지원 | 기본 / 선택됨 / 부족 재료 있음 |
| Quantity chip group | 생활 단위 빠른 선택 | 1인분 / 2인분 / 반 봉지 / 조금 남음 |
| Reason block | 추천 이유·날짜 근거를 설명 | 기본 / AI 근거 / 안전 안내 |
| Empty state | 다음 행동을 제안 | 첫 재고 없음 / 메뉴 없음 / 검색 결과 없음 |

## Interaction principles

### AI is a draft

AI가 읽은 항목은 보라색 점·라벨로 표시하지만, 제품의 주색보다 강하지 않게 쓴다. 사용자는 모든 항목을 한 번에 확정하거나 개별 수정·제외할 수 있다.

### One-handed and low-friction

주요 완료 버튼은 하단 안전 영역 위에 고정한다. 검수 목록에서 품목을 수정할 때 별도 편집 화면을 밀어 넣지 않고, 수량·위치·날짜를 인라인 또는 작은 바텀시트에서 변경한다.

### Explain priorities

`오늘 먼저 먹을 것`에는 항상 이유를 보인다. 예: `어제부터 냉장 보관 중인 남은 치킨이에요.` 날짜만 붉게 표시해 불안을 조성하지 않는다.

## Accessibility checklist

- 텍스트와 배경의 대비는 WCAG AA를 목표로 한다.
- 색상만으로 상태를 전달하지 않는다. 아이콘과 문구를 함께 사용한다.
- 최소 터치 영역은 44 × 44pt이다.
- 스크린 리더 라벨은 식재료명, 잔량, 보관 위치, 권장 섭취 상태 순으로 읽힌다.
- 분석 중·저장 완료·오류는 접근 가능한 상태 메시지로 알린다.

## Screenshot quality bar

포트폴리오에 넣을 화면은 다음을 만족해야 한다.

1. 한 화면에 하나의 주된 행동만 강하게 보인다.
2. 실제 데이터가 충분히 들어가 있어 빈 프로토타입처럼 보이지 않는다.
3. AI 결과, 사용자 수정, 완료 후 갱신이라는 상태 변화가 연속된 화면으로 보인다.
4. 카드·배지·버튼의 반경, 여백, 라벨 스타일이 모든 화면에서 일관된다.
