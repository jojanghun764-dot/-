# 새싹 원정대 — 소유자가 직접 할 일

기준: 2026-09-26. PR `feature/capacitor-android`의 debug APK는 설치 시험용이다. Play 업로드 파일이 아니다.

## 지금 먼저 할 일

1. [Android Debug Build 실행 결과](https://github.com/jojanghun764-dot/-/actions/runs/36207025893)에서 `sprout-android-debug-apk` ZIP을 내려받아 압축을 풀고, 본인 갤럭시에 APK를 설치한다. 새 게임 시작, 터치 전투, 화면 회전/노치, 뒤로가기, 세이브 내보내기·가져오기, 앱 종료 후 이어하기, 데모 보상 광고를 확인한다. 문제가 보이면 **기기 모델·Android 버전·재현 단계·스크린샷**을 알려준다. 데모 광고는 수익을 발생시키지 않는다.
2. 개인 명의로 운영할지 실제 사업자/법인 명의로 운영할지 결정한다. 본인 Google 계정으로 [Play Console 등록](https://play.google.com/console/signup)에 접속해 약관, 일회성 등록비, 신원·기기 확인을 직접 진행한다. 결제 카드 번호, 주민등록번호, 비밀번호, 2단계 인증 코드, 서비스 계정 비밀 키는 채팅이나 저장소에 보내지 않는다.
3. 원본 웹게임 이미지 50개의 **제작 파일·작업 기록·라이선스·상업 사용 허락** 중 해당 증빙을 찾는다. 파일 목록은 `release/asset-ledger.json`에 있다. 없으면 기존 웹 공개본도 코드로 그린 대체 그림으로 전환할지 결정한다. 현재 Android APK는 이 50개를 포함하지 않는다.
4. 공개할 개발자 표시 이름과 문의 이메일, 개인정보처리방침에 넣을 운영 주체를 결정한다. 공개 표시 정보만 공유하면 초안에 반영할 수 있다. 게임명과 패키지 ID `com.sproutexpedition.game`도 최종 확인한다.

## 계정 등록 후 전달할 정보

| 항목 | 필요한 값 | 취급 |
|---|---|---|
| Play Console | 등록 완료 여부, 개인/조직 유형, 확정 패키지 ID | 비밀정보 아님 |
| 스토어 | 공개 개발자 이름, 공개 문의 이메일, 개인정보처리방침 공개 URL | 공개 정보만 |
| 상품 | Play Console에서 만든 상품 ID·실제 국가별 가격 | 상품 ID는 공개 가능, 결제 자격 증명은 공유 금지 |
| AdMob | Android 앱 ID와 보상형 광고 단위 ID | ID만 전달, 계정 로그인·비밀 키는 공유 금지 |
| 서버 | 선택한 호스팅·인증·DB 제공자, 서버 URL | 관리자 자격 증명은 비밀 저장소로 설정 |

상품 ID 제안은 `monetization/catalog.json`에 있다. 상품을 만들기 전에는 **스타터팩·광고 건너뛰기만 우선 출시**하고 시즌/월간 상품은 운영 기간, 복구 정책, 외형 원본이 정해질 때까지 보류하는 편이 안전하다. 실제 결제 지급은 서버 계정 인증, Google 구매 확인/승인, 환불 처리, 영구 권리 복구가 완료되어야 켠다.

AdMob은 앱 등록 후 `shop_opt_in` 보상형 단위 하나부터 만들고 서버 측 검증 URL을 연결해야 한다. 클라이언트 완료 콜백만으로 유료 재화를 지급하지 않는다.

## 비공개 테스트 준비

새 개인 개발자 계정에 해당하면 Google의 현재 안내는 12명 이상이 14일 연속 참여하는 비공개 테스트를 요구한다. 테스트 참가자를 미리 확보하고, 실제 플레이 피드백을 기록한다. Play Console의 계정별 요구사항을 최종 확인한다. 서명 키는 계정 소유자가 안전하게 보관하고 Play App Signing 설정과 연계한다.

## 공식 안내

- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/admob/answer/7311747
