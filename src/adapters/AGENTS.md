# AGENTS.md — src/adapters/

> 외부 SDK와 브라우저·프레임워크 API 경계를 감싸는 계층.
> Last updated: 2026-08-19

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
| `browser/cloudinary/` | 브라우저 업로드 | client-only |
| `browser/daum/` | 주소 팝업 | client-only |
| `browser/deeplink/` | 지도 앱 딥링크 | client-only |
| `browser/kakao/` | 지도 SDK 로더 | client-only |
| `browser/portone/` | 브라우저 결제 SDK | client-only |

## 경계

비즈니스 규칙과 DB 접근을 두지 않는다. 공용 타입과 순수 계산은 `src/core/`를 사용한다.

같은 런타임 폴더 안에서는 배럴을 둘 수 있다. 단일 구현 파일만 있는 `browser/portone/`은 불필요한 배럴을 만들지 않고 `request-payment`를 직접 import한다.
