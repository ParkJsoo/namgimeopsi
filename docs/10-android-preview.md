# Android 로컬 preview 검증

2026-09-08, Galaxy SM-F766N / Android 16에서 확인했다. 앱은 `com.parkjsoo.namgimeopsi`, versionName `1.0.0`, versionCode `1`, arm64-v8a Release APK다. EAS 배포나 스토어 배포는 아니다. Expo 생성 프로젝트의 debug keystore로 서명한 로컬 검증용 Release이며, JS와 자산을 내장해 Metro 없이 실행한다.

## 최신 설치 — main 병합 후 최종 회귀 (2026-09-08, `14a7977`)

- `e45f128` 공통 저장 재시도 복구와 `0e49aa6` 조리 빈 잔량 차단을 포함한 최신 main으로 Release를 빌드했다. 앱 소스 변경 없이 같은 앱 ID·debug keystore 서명으로 `adb install -r` 갱신했다.
- **현재 APK SHA-256:** `0cdd41dac0de4731517930b3a63b1c1d4876d88a9a5ae2e98ceca321fa115851`. 기기에 설치된 `base.apk` 해시도 정확히 일치하며 `DEBUGGABLE` 플래그가 없다.
- Wi-Fi·모바일 데이터를 끈 상태의 force-stop → cold launch를 통과했다. Metro 8081 리스너와 ADB reverse 매핑이 없는 상태다. QA 뒤 두 네트워크 설정은 모두 원래 켜짐으로 복원했다.
- 두부 빈 잔량 + 애호박 `다 먹음`에서 완료 비활성·안내를 확인했다. 빈 입력에서 완료 영역을 눌러도 소비되지 않았다. 실제 화면 한글 키로 `반 모`를 조합하자 활성화됐고, 키보드 유지 스와이프로 완료·취소 버튼 전체에 접근해 취소했다.
- 오프라인에서 `QA Android 카레 · 1인분 · 냉장 · 내일까지`를 저장하고 종료·재실행 후 유지했다. 네트워크 복원 직후 첫 재시도는 실패 안내가 유지됐으나 연결이 확보된 뒤 다시 탭하자 해제됐다. 최종 영속 outbox는 0건이다. 로컬 디스크 실패 주입은 하지 않았으며 그 경로는 실제 hook을 사용하는 `test:inventory` 6개 회귀 테스트 근거와 구분한다.
- 지정 테스트 영수증의 실제 private 업로드 → fixture 검수를 확인했다. `분석 제공자는 아직 연결 전` 고지는 유지된다. 한글 키보드를 열고 ADB 네이티브 스와이프 6회로 목록 끝의 입고·취소 버튼 전체에 도달해 취소했다. 이번 회귀에서는 입고·조리 차감을 확정하지 않았다. 업로드 중 닫기 버튼 노출은 확인했으나 진행 중 닫기의 지연 응답 검증은 이번에 반복하지 않았다.
- 전후 기기 캐시 대조: 기존 lot 11개·원장 7개 모든 내용 불변(배열 순서·동등 UTC 날짜 표기 정규화). 새 leftover `inventory-1788876700429` 1개만 추가돼 최종 lot 12개·원장 7개다. 원격 DB 직접 조회 결과는 아니다.
- Release는 `run-as` 읽기를 허용하지 않아, 앱을 강제 종료한 뒤 같은 서명 Debug를 임시 갱신하고 **Debug를 실행하지 않은 채** 캐시를 읽었다. 전후 모두 최종 Release로 복원했으며 마지막 설치 해시·비디버그 플래그·cold launch·냉장고 목록을 재확인했다. 앱 삭제·데이터 초기화는 하지 않았다.
- `test:inventory` 6개와 `test:recipes` 빈칸/공백·부분 선택 회귀를 통과했다. 상세 빌드 로그·화면/XML·캐시·비교 결과·설치 식별자는 Git 제외 `.expo/android-final-qa/`에 보존했다. Java는 Android Studio 내장 JBR을 `JAVA_HOME`으로 지정했다.

증거: [빈 잔량 차단](qa-artifacts/11-galaxy-final-empty-quantity.png), [한글 수정·버튼 활성](qa-artifacts/12-galaxy-final-hangul-quantity.png), [영수증 키보드·하단 버튼](qa-artifacts/13-galaxy-final-receipt-keyboard.png), [최종 재고](qa-artifacts/14-galaxy-final-inventory.png).

## 재현

README의 의존성·환경 변수·Android SDK/JDK 준비 후 Expo 네이티브 프로젝트가 없으면 `npx expo prebuild --platform android`로 생성한다. 저장소 루트에서 다음을 실행한다.

```sh
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
cd ..
adb -s R3CY70MDN2M install -r android/app/build/outputs/apk/release/app-release.apk
adb -s R3CY70MDN2M shell am start -n com.parkjsoo.namgimeopsi/.MainActivity
```

같은 서명·앱 ID의 기존 설치를 `-r`로 갱신해 테스트 재고를 유지했다. `.env`의 공개 URL·publishable key만 기존 구성대로 번들에 반영한다. OCR provider/키는 추가하지 않는다.

APK: `android/app/build/outputs/apk/release/app-release.apk` (Git 제외)

이전 APK SHA-256 (`eca2a79`): `61b1b87aa495e62c5418e9eb075d29e6b719027219a9bed34d84d1223e510268`

전문 리뷰의 저장 실패 재시도·진행 중 닫기 수정 후 Release를 재빌드·갱신 설치했다. 아래 사진 증거와 오프라인 QA는 직전 APK(`16cc4321d97f79aa7f2791ed27376b12627894843af18ab233fa3f51e5d78374`) 기준이며 최신 수정의 검증 범위는 [QA 기록](09-device-qa.md)의 전문 리뷰 수정 항목을 따른다.

## 직접 확인한 결과

- Release 빌드 성공, 설치 성공, 설치 패키지에 `DEBUGGABLE` 플래그 없음.
- Wi-Fi·모바일 데이터를 끄고 force-stop 후 cold launch: 홈·기존 재고·오프라인 안내 표시. 네트워크 없이 내장 JS로 실행하므로 Metro 의존이 없다.
- 오프라인에서 테스트 영수증 선택: 한국어 연결 확인·재시도 안내와 등록 방식으로 복귀. 이전 DNS 오류 원문/서버 주소 노출은 `scan-error.ts`로 수정했다.
- 네트워크를 원래 상태(Wi-Fi·모바일 데이터 켜짐)로 복원하고 다시 선택: 업로드 후 fixture 검수 진입, 제공자 미연결 고지 표시.
- 검수 품목 이름에서 한글 키보드를 열고 끝까지 스와이프: 키보드를 유지한 채 입고·취소 버튼 전체 표시. 취소 버튼으로 닫았으며 추가 입고는 하지 않았다.
- 홈의 동기화 재시도 뒤 오프라인 안내 해제.
- 기존 소비 결과는 같은 lot ID로 로컬 캐시·사용자 인증 REST 조회를 대조해 영수증 두부 `반 모`, 기존 시드 두부 `1모`로 유지됨을 확인했다. 수량이 되돌아간 것으로 보였던 화면 판독은 오류였으며 데이터 손실은 확인하지 못했다. 진단을 위해 잠시 Debug를 재설치했고 최종적으로 Release를 복원했다.

## 증거

- [오프라인 업로드 안내](qa-artifacts/08-galaxy-preview-offline-receipt.png)
- [연결 복구 후 fixture 검수](qa-artifacts/09-galaxy-preview-receipt-recovered.png)
- [키보드 유지·하단 버튼](qa-artifacts/10-galaxy-preview-keyboard.png)

사진 선택기에 표시된 개인 사진 썸네일은 저장소에 넣지 않았다. 네트워크 복구 검증으로 테스트 사진 업로드/scan job은 생성됐고, 추가 입고·소비는 확정하지 않았다.

## 남은 범위

- Android 16의 현재 Expo ImagePicker는 시스템 Photo Picker를 쓰며 런타임 사진 읽기 권한 배열이 비어 있다. 설치된 앱도 READ_MEDIA_IMAGES/READ_EXTERNAL_STORAGE를 요청하지 않는다. 따라서 이 빌드에 iOS식 전체/제한/거부 QA를 그대로 적용하지 않는다. [Expo ImagePicker 문서](https://docs.expo.dev/versions/latest/sdk/imagepicker/)와 설치된 네이티브 구현을 확인했다.
- 실제 HEIC·10MB 경계 이미지, 긴 이름, 접힘/펼침 전환은 이번에 실기기 검증하지 않았다. 기존 사용자가 완료한 세 흐름 저장·차감 QA는 Debug 결과이며 Release에서 세 흐름의 모든 저장을 다시 수행한 것은 아니다.
- iOS 독립 실행 preview·핵심 QA는 이후 완료했다(`docs/11-ios-preview.md`). 영상 촬영은 남아 있다. iPhone 후속 전문 리뷰의 `e45f128`·`0e49aa6` 공통 코드 수정은 이 Android APK에 포함되지 않으며, 해당 최신 수정의 갱신 설치·회귀는 위 `14a7977` 최신 항목에서 완료했다.
- 코드 리뷰에서 오프라인 hydrate가 빈 outbox에도 bootstrap을 만드는 경로와 기존 receipt pending 재적용의 멱등 의미 차이를 후속 테스트 대상으로 제안했다. 이번 실제 데이터에서 해당 문제나 손실을 재현하지 못했으며 이번 변경에 동기화 로직 수정은 포함하지 않았다.
