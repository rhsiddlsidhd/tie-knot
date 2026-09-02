# AGENTS.md — src/adapters/

> 외부 SDK와 브라우저·프레임워크 API 경계를 감싸는 계층.
> Last updated: 2026-09-02

## 공통 디렉토리 컨벤션

`adapters/` 바로 아래의 `server/`와 `browser/`가 런타임을 나타내고, 그 아래 폴더 하나는 외부 서비스 또는 런타임 경계 하나를 담당한다. **폴더 하나에는 한 런타임의 구현만 둔다.** 서버 구현에는 `import "server-only"`, 브라우저 구현에는 `import "client-only"`를 선언한다.

## 디렉토리

| 디렉토리 | 담당 | 런타임 |
|---|---|---|
| `server/bcrypt/` | 비밀번호 해시 | server-only |
| `server/cloudinary/` | 서명·정리·서버 업로드 | server-only |
| `server/cookies/` | Next.js 쿠키 API | server-only |
| `server/jose/` | JWT 암복호화 | server-only |
| `server/nodemailer/` | 이메일 전송 | server-only |
| `server/seoul-open-api/` | 서울 열린데이터광장 API 호출·가드·에러분류 | server-only |
| `browser/clipboard/` | 클립보드 쓰기 | client-only |
| `browser/cloudinary/` | 브라우저 업로드 | client-only |
| `browser/daum/` | 주소 팝업 | client-only |
| `browser/deeplink/` | 지도 앱 딥링크 | client-only |
| `browser/geolocation/` | 현재 위치 조회 | client-only |
| `browser/kakao/` | 지도 SDK 로더 | client-only |
| `browser/portone/` | 브라우저 결제 SDK | client-only |

## 경계

비즈니스 규칙과 DB 접근을 두지 않는다. 공용 타입과 순수 계산은 `src/core/`를 사용한다.

`browser/`는 **대체·스텁이 필요한 capability**를 감싼다 — 권한 게이트가 있거나(`navigator.clipboard`, `navigator.geolocation`), 비결정적이거나(`crypto.randomUUID`), 외부 SDK·앱을 호출하는(portone, daum, kakao, deeplink) 것이다. 렌더 부수효과로서의 DOM 조작·이벤트 리스너·미디어쿼리(`document.body.style`, `addEventListener`, `matchMedia`, `document.cookie`)는 Adapter 대상이 아니며 컴포넌트나 `src/ui/hooks/`에 남긴다.

판정 기준은 "브라우저 전역을 쓰는가"가 아니라 "이름 붙는 capability 하나를 이루고 통째로 바꿔치기할 수 있는가"다. `browser/deeplink/`가 SDK 없이 `window.open`·`window.location`만 쓰고도 Adapter인 이유는 "지도 앱 열기"라는 capability와 티맵 실패 시 폴백 정책을 소유하기 때문이다. `document.body.style.overflow = "hidden"` 한 줄은 그런 단위가 아니다.

전역 접근을 전부 Adapter로 감싸면 서로 무관한 API가 `browser/dom/` 같은 자루 폴더에 모여 "폴더 하나 = 경계 하나" 불변식이 깨진다.

소비자는 구현 파일을 직접 지정해 import한다(`@/adapters/browser/portone/request-payment`).
