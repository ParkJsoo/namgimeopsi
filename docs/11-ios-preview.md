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
