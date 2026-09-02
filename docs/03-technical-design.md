# Technical design

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile | React Native, Expo, TypeScript | iOS·Android을 하나의 코드베이스로 만들고 카메라·알림을 실기기에서 시연한다. |
| Navigation and state | Expo Router, TanStack Query | 화면 상태와 서버 캐시를 분리한다. |
| Forms and validation | React Hook Form, Zod | 검수·수정 폼과 AI JSON을 모두 타입 안전하게 다룬다. |
| Backend | Supabase Auth, PostgreSQL, Storage, Edge Functions | 인증, 관계형 재고 데이터, 이미지 저장, 안전한 AI 호출을 빠르게 구성한다. |
| AI | Vision/OCR provider behind an Edge Function | 앱에 API 키를 두지 않고, 제공자를 교체할 수 있게 한다. |

## Architecture

```text
Expo app
  ├─ Supabase Auth / PostgreSQL (RLS)
  ├─ Private Storage: receipt images
  └─ Edge Functions
       ├─ analyze-receipt
       └─ commit-scan
            └─ Vision/OCR provider
```

1. 앱은 영수증 이미지를 private storage에 업로드하고 `scan_jobs`를 만든다.
2. `analyze-receipt` 함수는 파일 소유권, MIME 타입, 용량을 검증한 뒤 이미지에서 후보를 추출한다.
3. 추출 결과는 엄격한 JSON 스키마를 통과한 뒤 `scan_jobs`에 저장된다.
4. 사용자가 검수하면 `commit-scan` RPC가 재고 항목과 입고 이벤트를 하나의 트랜잭션으로 만든다.
5. AI 키, private image URL, 재고 확정 권한은 클라이언트에 노출하지 않는다.

## AI result contract

AI는 다음과 같은 후보만 반환한다. 재고를 직접 생성하지 않는다.

```ts
type ReceiptCandidate = {
  rawName: string;
  canonicalFoodName: string | null;
  quantity: number | null;
  unit: 'piece' | 'pack' | 'g' | 'ml' | 'serving' | 'portion' | null;
  confidence: number;
  needsReview: boolean;
};
```

### Failure handling

- JSON 스키마 검증 실패: 재시도 후 수동 등록으로 이동
- 낮은 신뢰도: `확인 필요` 그룹으로 분리
- 네트워크 오류: 이미지 재시도 또는 빈 수동 등록 폼 제공
- 동일 이미지 재호출: 이미지 해시와 `scan_jobs` 상태로 방지

## Data model

```text
profiles
households
household_members
foods
food_aliases
inventory_items
inventory_events
scan_jobs
recipes
recipe_ingredients
cooking_sessions
cooking_session_items
```

### Important entities

| Entity | Responsibility |
| --- | --- |
| `foods` | 표준 식재료명, 카테고리, 기본 보관 위치, 기본 권장 보관 기간 |
| `food_aliases` | 영수증 원문·사용자 수정 이력과 표준 식재료의 매핑 |
| `inventory_items` | 한 번의 구매·보관 단위. 동명의 재료를 임의로 합치지 않는다. |
| `inventory_events` | 입고, 전량/부분 소비, 수정, 폐기 이력. 부분 소비에는 사용 뒤 사용자가 확인한 `remaining_quantity_label`을 남긴다. |
| `scan_jobs` | 업로드 이미지, AI 결과, 분석 상태, 오류를 관리한다. |
| `recipes` | 검수된 구조화 레시피와 필요 재료를 저장한다. |
| `cooking_sessions` / `cooking_session_items` | 한 번의 조리·섭취 완료를 멱등하게 선점하고, 선택한 lot별 소비 방식·남은 생활 단위를 감사 가능하게 보존한다. |

`inventory_items`에는 포장 표기일 `label_expiry_at`과 편의용 제안일 `recommended_use_by_at`을 별도 저장한다. 후자는 식품 안전을 보장하는 날짜가 아니다.

## Recommendation logic

초기에는 자유형 LLM 레시피 생성을 사용하지 않는다. 검수된 한국식 레시피 40~60개를 시드하고, 재고와 결정적으로 매칭한다.

```text
score =
  ingredientCoverage
  + soonToExpireUsageWeight
  - missingIngredientPenalty
  - cookTimePenalty
```

- 부족 재료가 두 개를 초과하는 레시피는 기본 추천에서 제외한다.
- 소금, 식용유, 간장, 고추장 등은 사용자의 기본 보유 재료 설정에 따라 부족 재료에서 제외한다.
- 홈에는 상위 세 개만 표시하고, 추천 이유를 점수 근거에서 생성한다.

## Testing strategy

- Unit: 날짜 우선순위, 레시피 점수화, 별칭 정규화, AI JSON 파서, 재고 변화량
- Component: 검수 항목 수정·제외·실패 상태
- Integration: 사용자별 RLS, `commit-scan`과 조리 완료 트랜잭션의 멱등성
- Device smoke test: 실제 영수증 → 검수 → 입고 → 메뉴 선택 → 차감 흐름

데모는 실제 영수증 이미지와 mock provider를 모두 지원한다. mock provider는 재현 가능한 UI 테스트와 발표 데모에 사용하고, 실제 API 결과는 별도로 검증한다.
