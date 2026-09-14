# 데모 리허설·영상 제작 계획

> 2026-09-14 후속: 날짜 결함 수정과 검증을 완료했고 사용자 승인으로 Demo·기존 QA 테스트 재고를 비웠다. 현재 상태는 [인계 문서](00-current-context.md), 근거는 [날짜 QA](15-calendar-date-qa.md)를 따른다. 아래 리허설 종료 데이터는 과거 기록이다.

작성: 2026-09-08 / 갱신: 2026-09-14. 환경·시험 녹화·전체 리허설·날짜 후속 수정 완료. 현재 빈 Demo 설치에서 본촬영을 준비한다.

## 목표와 작업 경계

전용 iOS 시뮬레이터에서 실제 앱의 영수증 검수 → 남은 음식 등록 → 추천·조리 후 차감을 보여 주는 약 120초 영상을 만든다. 1차본은 한국어 자막 중심 MP4다. 세로 앱 화면을 유지하고 자막이 입력값·fixture 고지·확정 버튼을 가리지 않게 한다.

- iPhone·Galaxy는 다른 앱 개발 테스트에 사용 중이므로 접근하지 않는다. 기존 QA 시뮬레이터는 재고 정리 후 종료한 상태로 둔다. Figma·withnetworks 파일/워크스페이스와 다른 프로젝트에는 접근하지 않는다.
- 새 전용 시뮬레이터의 제안 이름은 `Namgimeopsi Demo iPhone 13 mini`다. 실제 사용 UDID·OS·앱 기준 SHA를 이 문서에 기록한다. 공유된 `booted` 대상 대신 해당 UDID만 사용하며, 모든 기기 종료·일괄 프로세스 종료는 하지 않는다.
- 사용자 승인으로 Demo·QA 테스트 재고 정리를 완료했다. 현재 빈 Demo의 기존 익명 세션을 사용하며 재설치·새 세션 생성으로 시드 재고를 만들지 않는다.
- 원본·편집 중간 파일은 저장소 안 Git 제외 경로 `.expo/demo-production/`에 보관한다. 2026-09-09 이 경로와 전용 시뮬레이터를 생성했다. 커밋에는 재현 절차·대본·필요한 소규모 스크립트·선별 이미지·영상 링크를 넣고 대용량 원본이나 인증/캐시를 넣지 않는다.
- OCR provider/키를 연결하지 않는다. `분석 제공자는 아직 연결 전` 고지와 fixture 결과를 유지한다. 화면 첫머리에 `iOS 시뮬레이터 · OCR fixture`를 표시한다. 기존 실기기 QA는 별도 근거로 연결한다.
- 촬영용 앱 기능을 새로 만들지 않는다. 실제 추천 결과에 맞춰 대본을 조정하며 저장/추천 결과를 합성하지 않는다. 지연 구간을 줄이면 축약 사실을 표시한다.

## 단계와 완료 기준

| 단계 | 작업 | 산출물·완료 기준 |
| --- | --- | --- |
| 1. 환경·시험 녹화 | 전용 시뮬레이터 준비, 최신 Release 설치, 기존 개인정보 없는 테스트 영수증 준비, 10초 녹화 | 앱 실행·사진 선택 가능, 영상 재생·방향·한글 가독성 확인. UDID·OS·SHA·명령 기록 |
| 2. 리허설 | 대본대로 세 흐름 실행, 실제 추천·동명 lot·생활 단위·입력/대기 시간 기록 | 장면별 촬영 동선과 대본 확정. 입고/차감 전후 대상 ID·수량이 설명과 일치 |
| 3. 본촬영·편집 | 장면별 녹화, 한국어 자막, 대기 구간 편집, 대표 이미지 선정 | 약 120초 MP4·자막 원문·대표 이미지·장면별 원본 확보 |
| 4. 검수·포트폴리오 | 전체 재생과 핵심 프레임 점검, README·케이스 스터디 정리 | fixture·환경 고지, 전후 수량, 화면/자막 동기화, 검증 범위가 정확함. 공개할 완성본 준비 |

외부 영상 공개/업로드는 완성본 검수 후 별도 단계로 다룬다. 공개처는 아직 정하지 않았다. 영상 파일/링크가 생기기 전에 README에 완료로 쓰지 않는다.

## 현재 실행 순서

1. 최신 인계와 빈 재고 기준 `docs/08-portfolio-demo.md`를 확인한다.
2. 기존 Demo UDID `891FA725-0B92-41D6-95B0-FC03729146B4`의 최신 Release·빈 캐시를 확인한다. 환경 생성과 10초 시험을 반복하지 않는다.
3. 영수증 수정·제외·입고, 남은 음식 등록, 추천 안내·부분/전량 차감 장면을 녹화한다. 실제 결과·lot·수량을 대조한다.
4. 약 120초 자막 편집본을 만들고 전체 재생·핵심 프레임을 검수한다. 원본과 촬영 시각을 남긴다.
5. 최종 상태·영상 경로·미완료 항목을 인계에 갱신한다. 공개 업로드는 별도 단계다.

## 장면 구성

세부 문구는 [120초 대본](08-portfolio-demo.md)을 사용한다. 다음은 목표 구간이며 리허설 측정 후 확정한다.

| 구간 | 보여 줄 결정 |
| --- | --- |
| 0–10초 | 프로젝트와 데모 환경 |
| 10–55초 | 사진 선택 → fixture 고지 → 수정·제외 → 5개 확정 입고 |
| 55–75초 | 남은 카레 1인분 등록 |
| 75–110초 | 실제 추천 이유 확인 → 조리 부분·전량 차감 |
| 110–120초 | 최종 잔량과 핵심 흐름·검증 범위 |

fixture 날짜는 고정값이므로 촬영일에 따른 추천 변화를 먼저 확인한다. 동일 이름 lot를 합쳐 설명하지 않는다. 앱 내 카메라 촬영·실제 OCR·스토어 배포를 시연했다고 표현하지 않는다.

## PR 구분

1. **데모 준비·리허설 PR:** 오늘의 인계/계획 문서, 다음 세션의 촬영 재현 절차·확정 대본·리허설 결과·필요한 최소 촬영 도구. 현재 `docs/demo-rehearsal-handoff`의 로컬 커밋을 이어서 사용한다. 원격 PR은 아직 없다.
2. **영상·포트폴리오 PR:** 최종 영상 연결·대표 이미지·README·케이스 스터디. 준비 PR의 결과를 바탕으로 별도 브랜치에서 진행한다.

리허설에서 발견한 앱 결함은 재현·수정·회귀 근거와 함께 별도 PR로 분리한다. 과거 QA PR의 push·병합 허가를 새로운 영상 공개 허가로 해석하지 않는다.

## 확인한 도구와 보존할 근거

- 2026-09-08 읽기 전용 확인: `/usr/bin/xcrun`, `/opt/homebrew/bin/ffmpeg`, `/opt/homebrew/bin/ffprobe` 존재. `xcrun simctl help io`에서 `recordVideo`와 H.264 출력 지원을 확인했다. 실제 녹화·편집은 미검증이다.
- iOS QA 근거: `.expo/ios-gesture-qa/`, `.expo/ios-review-qa/`. 기존 테스트 시뮬레이터 lot 6개·원장 2개는 보존한다.
- Android 최신 QA 근거: `.expo/android-final-qa/`. APK·캐시 비교·설치 식별자와 기록된 화면을 삭제하지 않는다. 기기 접근은 하지 않는다.
- 해당 로컬 산출물은 Git 제외 상태이며 다른 컴퓨터로 clone하면 따라오지 않는다. 공개 가능한 선별 화면은 `docs/qa-artifacts/`에 이미 커밋돼 있다. 원본 QA 기록을 정리 명목으로 삭제하지 않는다.

## 진행 기록

- [x] 대본·QA 상태 확인, 시뮬레이터 중심 제작 계획 수립
- [x] 실기기 사용 중단·기존 QA 데이터 보존 경계 기록
- [x] 녹화/편집 도구 존재 확인
- [x] 전용 촬영 시뮬레이터 생성·UDID 기록
- [x] 최신 Release 설치·10초 시험 녹화·재생 검수
- [x] 실제 데이터 리허설·장면별 시간과 전후 수량 기록
- [x] 본촬영·편집·프레임/디코딩 검수
- [ ] 영상 공개처 결정 및 게시·README 연결

현재는 [120초 로컬 편집본 제작 완료](17-demo-production-result.md) 상태다. 아래 9월 9일 환경·데이터는 과거 기록이다.


## 2026-09-09 환경·시험 녹화 결과

- 기기: `Namgimeopsi Demo iPhone 13 mini`, iOS 26.5, UDID `891FA725-0B92-41D6-95B0-FC03729146B4`. 생성 전 동일 이름이 없음을 확인했다. 기존 QA 기기는 종료 상태였으며 조작하지 않았다.
- 소스: `474b894380a7d9d8089237405e0ec78d3656437d`, 앱 소스는 `14a7977`과 동일. 별도 Release 빌드 성공, Metro를 시작하지 않고 실행했다.
- 번들 SHA-256: `856cb065ebb072acd6c05c820c9f580d66e4a18afdb8018a19ca74a35e31b570`.
- 홈 시험 재생본: `.expo/demo-production/smoke-10s-playback.mp4`, H.264 / 1080×2340 / 30fps / 300프레임 / 10.000초 / 125,870바이트. QuickTime 재생·세로 방향·한글 추천 이유 가독성 확인, ffmpeg 전체 디코딩 오류 없음. 무음이며 자막·장면 전환 없는 기술 시험 영상으로, 최종 데모 영상이 아니다.
- 첫 `smoke-10s.mp4`는 정지 화면이라 1프레임/0.067초만 저장됐다. `smoke-10s-v2.mp4`는 10초 뒤 상태 표시줄 시각을 `9:41 → 9:42`로 갱신해 10.177초를 확보했다. 이 원본의 가변 프레임 간격 때문에 null 출력에서 DTS 경고가 있어, 위 재생본은 고정 30fps로 변환하고 마지막 0.177초만 잘랐다. 앱의 재고·추천 화면은 합성하지 않았다.
- 재현 스크립트 최종 실행 `smoke-final-raw.mp4`는 사진 선택기 화면에서 10.192초 기록·길이 검사 통과. 이 파일은 홈 재생본과 별도다. 스크립트는 전용 UDID 고정, 기존 출력 덮어쓰기 차단, 첫 프레임 신호 후 타이머 시작, 10초 시점 상태 표시줄 갱신, 길이 검사를 수행한다. 실행하면 전용 시뮬레이터의 표시 시각이 바뀐다.
- 영수증: 기존 `/Users/jeongsoopark/Downloads/namgimeopsi-test-receipt.png` 한 장만 추가했다. 새 시뮬레이터에는 기본 샘플 사진 6장도 있다. XCTest로 사진 권한 허용·선택기 진입·첫 테스트 영수증 선택 후 제공자 미연결 고지와 6개 fixture 검수를 확인했다. 아직 입고하지 않았다.
- `photo-smoke.xcresult`는 진입 동작만 실행한 것이며 당시 사진 권한 팝업 상태였다. `photo-permission.xcresult`는 실제 선택기 진입, `photo-selected.xcresult`는 이미지 요소 `not hittable` 실패, `photo-selected-retry.xcresult`는 확인한 이미지 중앙 `(62, 200)` pt 터치 후 fixture 검수 도달 성공이다. 각 로그·화면은 `.expo/demo-production/`에 보존한다.
- 초기 재고 기준: lot 5개(`leftover-chicken`, `tofu`, `zucchini`, `eggs`, `dumplings`), 원장 0개, outbox 0개. `inventory-before-rehearsal.json`은 인증 정보를 제외한 재고 캐시다. 서버 DB 직접 대조는 이번 단계에 포함하지 않는다.
- 리허설 준비 관찰: 홈 순위는 애호박 두부덮밥 → 치킨마요 덮밥 → 만두 계란국. 첫 두 메뉴는 부족 재료 없음, 세 번째는 대파 부족으로 표시됐다. 고정 시드 날짜·상대 문구는 실제 촬영일의 식품 상태를 뜻하지 않는다.

### 재현 명령

기기는 이미 생성돼 있으므로 다시 만들지 않는다. 모든 명령은 저장소 루트에서 실행한다.

```sh
xcodebuild -workspace ios/app.xcworkspace -scheme app \
  -configuration Release \
  -destination 'platform=iOS Simulator,id=891FA725-0B92-41D6-95B0-FC03729146B4' \
  -derivedDataPath .expo/demo-production/DerivedData \
  CODE_SIGNING_ALLOWED=NO build > .expo/demo-production/release-build.log 2>&1
xcrun simctl install 891FA725-0B92-41D6-95B0-FC03729146B4 \
  .expo/demo-production/DerivedData/Build/Products/Release-iphonesimulator/app.app
xcrun simctl launch 891FA725-0B92-41D6-95B0-FC03729146B4 com.parkjsoo.namgimeopsi
# 앱 화면이 준비된 뒤 새 파일명으로 기록한다.
python3 scripts/demo/record-smoke.py .expo/demo-production/smoke-next-raw.mp4
ffmpeg -n -v error -i .expo/demo-production/smoke-next-raw.mp4 \
  -vf fps=30 -t 10 -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  .expo/demo-production/smoke-next-playback.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,avg_frame_rate,nb_frames \
  -of json .expo/demo-production/smoke-next-playback.mp4
ffmpeg -v error -i .expo/demo-production/smoke-next-playback.mp4 -f null -
```

마지막으로 QuickTime에서 재생하며 방향·가독성과 재생 완료를 확인한다. 메타데이터/디코딩 검사는 실제 재생 확인을 대체하지 않는다. 본촬영에는 정지 화면 보정용 시각 변경을 쓰지 않고 장면 동작과 종료 프레임을 따로 검수한다.


## 전체 리허설 후 결정

- [전체 리허설 결과](14-demo-rehearsal.md)에 장면별 관찰 시간, 실제 추천 순위, lot별 전후 수량, 재실행 검증과 선별 화면을 기록했다.
- `smoke-10s-playback.mp4`는 테스트 전용이며 사용자의 확인대로 **최종 영상에 사용하지 않는다**. 리허설도 본촬영과 별개다.
- 날짜 수정 및 후속 리뷰 보완을 완료했다. 앱 수정과 영상 산출물은 커밋을 분리한다.
- 현재 본촬영은 사용자 승인으로 비운 기존 Demo 세션에서 진행한다.
