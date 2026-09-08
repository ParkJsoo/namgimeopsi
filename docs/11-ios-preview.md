# iOS 로컬 preview 검증

## 환경과 보존 원칙

- 2026-09-08, iPhone 13 mini / iOS 26.6.1. USB 연결·페어링·개발자 모드와 iPhone 미러링 통신을 확인했다.
- 시작 코드: `cd8b625` / `feat/live-recommendations`. 시작 시 워크트리는 깨끗했고 로컬 upstream과 일치했다.
- 앱 ID: `com.parkjsoo.namgimeopsi`, 버전 `1.0.0 (1)`. 기존 앱은 Metro가 없을 때 `No script URL provided`를 표시했다. 설치 버전 번호만으로 기존 Debug의 소스 커밋을 특정하지 않는다.
- 기존 앱을 삭제하거나 데이터를 초기화하지 않는다. 같은 앱 ID·기존 Apple Development 서명으로 Release를 갱신 설치한다.
- OCR provider/키는 연결하지 않으며 기존 fixture 결과·제공자 미연결 고지를 유지한다.

## 로컬 빌드 절차

기존 Expo 네이티브 프로젝트와 서명 설정을 사용한다. 저장소 루트에서:

```sh
mkdir -p .expo/ios-preview
xcodebuild -workspace ios/app.xcworkspace -scheme app \
  -configuration Release \
  -destination 'id=00008110-000678260AE8401E' \
  -derivedDataPath .expo/ios-preview/DerivedData \
  -allowProvisioningUpdates build > .expo/ios-preview/build.log 2>&1
```

산출물: `.expo/ios-preview/DerivedData/Build/Products/Release-iphoneos/app.app`. `.expo/`와 생성된 `ios/`는 Git 제외다. 이 경로는 EAS·TestFlight·App Store 배포가 아닌 로컬 기기 검증이다.

```sh
codesign --verify --deep --strict .expo/ios-preview/DerivedData/Build/Products/Release-iphoneos/app.app
xcrun devicectl device install app \
  --device 36CBAE4C-163A-53B0-A07D-C27FC46BA921 \
  .expo/ios-preview/DerivedData/Build/Products/Release-iphoneos/app.app
xcrun devicectl device process launch \
  --device 36CBAE4C-163A-53B0-A07D-C27FC46BA921 \
  --terminate-existing com.parkjsoo.namgimeopsi
```

`main.jsbundle` SHA-256: `3963a21257cec4d1511b780a1f4666eb60648546d1e91a76355d21b40c7efdef`

서명은 기존 Apple Development / team `323JRW8R82`다. 내장 provisioning profile 만료 시각은 **2026-09-13 14:32:39 KST**이며 `get-task-allow=true`다. Release 구성·내장 JS로 실행하지만 배포용 distribution 서명은 아니며, 장기 설치용 산출물로 간주하지 않는다.

## 검증 상태

- 자동 회귀: `npm run test:domain`, `npm run test:inventory`, `npm run test:receipts`, `npx tsc --noEmit`, `npm run lint` 통과.
- Release 빌드·코드 서명 검증·기존 앱 위 갱신 설치 성공.
- Metro를 시작하지 않았고 로컬 8081 listening 프로세스가 없는 상태에서 `--terminate-existing`로 cold launch했다. 미러링에서 홈·추천 카드가 정상 표시됐다. 네트워크 전체를 끈 테스트는 아니다.
- 갱신 설치 뒤 냉장 목록에서 이전 입고의 계란 `10개`·두부 `1모`·애호박 `1개`와 기존 계란 `9개`·두부 `1모`·애호박 `반 개`를 확인했다. 앱 삭제나 초기화는 하지 않았다.
- 지정된 테스트 영수증을 선택해 실제 업로드 후 검수 진입·`분석 제공자는 아직 연결 전…fixture 초안` 고지를 확인했다. 추가 입고는 확정하지 않았다.
- 실기기 상호작용 결과는 [기기 QA 기록](09-device-qa.md)에 별도로 기록한다. 미러링 입력과 본체 화면 키보드 입력은 구분한다.

## 전용 시뮬레이터 Release — 2026-09-08 후속

사용자 요청으로 `Namgimeopsi QA iPhone 13 mini` / iOS 26.5에서 추가 검증했다. 실제 iPhone 설치와 별도 산출물이며 서명·기기 설치 검증을 대체하지 않는다.

```sh
mkdir -p .expo/ios-simulator-preview
xcodebuild -workspace ios/app.xcworkspace -scheme app \
  -configuration Release \
  -destination 'id=6B38D865-7C34-45E2-9A8E-D425754394D9' \
  -derivedDataPath .expo/ios-simulator-preview/DerivedData \
  CODE_SIGNING_ALLOWED=NO build > .expo/ios-simulator-preview/build.log 2>&1
xcrun simctl install 6B38D865-7C34-45E2-9A8E-D425754394D9 \
  .expo/ios-simulator-preview/DerivedData/Build/Products/Release-iphonesimulator/app.app
xcrun simctl launch 6B38D865-7C34-45E2-9A8E-D425754394D9 com.parkjsoo.namgimeopsi
```

- 빌드·기존 앱 위 설치·내장 JS 실행 성공. 원래 앱을 삭제하거나 시뮬레이터를 초기화하지 않았다.
- 원래 Release `main.jsbundle` SHA-256: `2e761e1f82d394d58b429c819e897467a407fb5ceee67a9b334fd8ee4f22630b`.
- [기기 QA 기록](09-device-qa.md)의 영수증·남은 음식·조리 시트 소프트웨어 한글 입력, 저장·부분/전량 차감·종료 후 재실행 유지를 확인했다. 원격 DB 직접 조회 결과는 아니다.
- 진행 중 닫기 확인에만 성공 응답 전달을 각 15초 지연한 임시 QA 빌드를 사용했다. 해당 번들 해시는 `05418b25221886e4cdef8ada8e9f306511fd1df602ae01c936646cd1c11f2b2f`이며 최종 설치가 아니다. 실제 업로드·fixture 분석은 유지했다. 상세 조건과 늦은 응답 검증은 QA 기록을 따른다.
- 임시 소스는 빌드 직후 복원했고, 검증 후 원래 소스를 다시 Release 빌드·갱신 설치했다. 최종 산출물은 위 경로이며 해시가 최초 원래 Release와 일치한다. 복원 로그는 `.expo/ios-simulator-preview/restored-build.log`에 있다.
- 최종 실행 시 Metro를 시작하지 않았고 로컬 8081 listening 프로세스도 없었다. 복원 설치 후 홈과 냉장 목록에서 `QA SIM 카레 2인분`·두부 `반 모`·애호박 활성 목록 제외가 유지됐다. 실제 iPhone의 설치 상태는 이번 시뮬레이터 QA에서 바꾸지 않았다.
