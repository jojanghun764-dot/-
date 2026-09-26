# UI 타이포그래피·프레임 기준

2026-09-26. `ui-theme.css`는 기존 게임 UI 위에 적용하는 표시 전용 레이어다. 게임 보상·저장·전투 로직은 변경하지 않는다.

| 역할 | 색 | 프레임 | 서체 |
|---|---|---|---|
| 기본 정보·전투 데이터 | 먹청록, 회녹 | 얇은 평면 테두리 | Pretendard 550–800 |
| 성장·스킬 | 청록 | 절제된 강조선 | 제목/버튼 Galmuri11 Bold, 본문 Pretendard |
| 장비·소환·강화 | 금색·황토 | 두꺼운 이중 테두리 | 제목/버튼 Galmuri11 Bold, 수치 Pretendard 800 |
| 각인·동료 잠재 | 보라 | 왼쪽 장식선 | 본문 Pretendard |
| 동료 | 민트 | 둥근 보조 카드 | 제목/버튼 Galmuri11 Bold, 본문 Pretendard |
| 상점 | 짙은 녹색·금색 | 얇은 가격 행 | 숫자 Pretendard 800 |
| 환생·세계수 균열 | 남보라·은색 | 상단 장식선 | 제목 Galmuri11 Bold, 본문 Pretendard |
| 월드보스 | 진홍·금색 | 두꺼운 모달·돌출 헤더 | 제목 Galmuri11 Bold, 수치 Pretendard |
| 실패·부족 | 붉은색 | 버튼과 경고 상태에 한정 | Pretendard |

폰트는 오프라인 앱에서도 표시되도록 로컬 WOFF2로 포함한다. Galmuri11 Bold는 npm `galmuri@2.40.3`의 `dist/Galmuri11-Bold.woff2`, Pretendard Variable은 npm `pretendard@1.3.9`의 `dist/web/variable/woff2/PretendardVariable.woff2`에서 추출했다. SHA-256은 각각 `8643094f395aa2dbad6bc4385cc043314801eaec2e759d549435ec8ac4f2d078`, `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4`다. 두 원본의 SIL OFL 1.1 전문과 저작권 표시는 `fonts/*-LICENSE.txt`에 함께 둔다.

Galmuri: https://github.com/quiple/galmuri  
Pretendard: https://github.com/orioncactus/pretendard
