# AGENTS.md — src/adapters/

> 외부 SDK와 브라우저·프레임워크 API 경계를 감싸는 계층.
> Last updated: 2026-08-17

## 공통 디렉토리 컨벤션

폴더 하나는 외부 서비스 또는 런타임 경계 하나를 담당한다. 서버 구현에는 `import "server-only"`, 브라우저 구현에는 `import "client-only"`를 선언한다.

## 디렉토리

| 디렉토리 | 담당 | 런타임 |
|---|---|---|
| `bcrypt/` | 비밀번호 해시 | server-only |
| `cloudinary/` | 서명·정리·서버 업로드·브라우저 업로드 | 파일별 경계 |
| `cookies/` | Next.js 쿠키 API | server-only |
| `daum/` | 주소 팝업 | client-only |
| `deeplink/` | 지도 앱 딥링크 | client-only |
| `jose/` | JWT 암복호화 | server-only |
| `kakao/` | 지도 SDK 로더 | client-only |
| `nodemailer/` | 이메일 전송 | server-only |
| `portone/` | 브라우저 결제 SDK | client-only |

## 경계

비즈니스 규칙과 DB 접근을 두지 않는다. 공용 타입과 순수 계산은 `src/core/`를 사용한다.

`cloudinary/`에는 배럴을 두지 않는다. server-only와 client-only 파일을 한 배럴에서 재수출하면 반대 런타임 모듈이 함께 번들링된다.
