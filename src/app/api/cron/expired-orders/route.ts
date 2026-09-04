import { timingSafeEqual } from "node:crypto";
import {
  cancelExpiredAwaitingMobileInvitationOrdersForAllUsers,
  cancelExpiredPendingOrdersForAllUsers,
} from "@/services/payment";

// 이 라우트는 src/app/api/AGENTS.md의 routeSuccess/routeError 계약을 따르지 않는다 —
// 세션이 아니라 스케줄러 시크릿으로 인증하므로 AppError(UNAUTHENTICATED)와 의미가 다르고,
// 응답을 읽는 주체도 사용자가 아니라 Vercel Cron이다. webhooks/portone/route.ts와 동일한 예외.
//
// Vercel Cron은 설정된 CRON_SECRET을 Authorization: Bearer 헤더로 실어 GET으로 호출한다.
// GH #82가 문제 삼은 "GET이 부수효과를 낸다"는 사용자 페이지 렌더 경로 이야기이고,
// 이 엔드포인트는 인증된 전용 배치 진입점이라 해당하지 않는다(메서드 선택권도 없다).

export const maxDuration = 60;

const runBatch = async <T>(
  name: string,
  run: () => Promise<T>,
): Promise<T | null> => {
  try {
    return await run();
  } catch (e) {
    // 한 배치의 전체 실패가 다른 배치 실행을 막지 않는다 — PortOne 실환불이 죽어도
    // DB-only인 PENDING 만료 처리는 계속돼야 한다.
    console.error(`[cron/expired-orders] ${name} 배치 실패:`, e);
    return null;
  }
};

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "Cron is not configured" }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;
  const isAuthorized =
    authorization !== null &&
    authorization.length === expected.length &&
    timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));

  if (!isAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 두 배치는 서로 다른 주문 집합(PENDING vs CONFIRMED)을 다뤄 순서 의존이 없으므로
  // 병렬로 돌린다 — runBatch가 실패를 흡수해 절대 reject하지 않으므로 Promise.all로
  // 충분하다. 순차 실행은 maxDuration(60초) 예산을 불필요하게 두 배로 소모한다.
  const [pending, awaitingInvitation] = await Promise.all([
    runBatch("expired-pending", cancelExpiredPendingOrdersForAllUsers),
    runBatch("awaiting-invitation", cancelExpiredAwaitingMobileInvitationOrdersForAllUsers),
  ]);

  const ok = pending !== null && awaitingInvitation !== null;

  console.log("[cron/expired-orders] 실행 완료", { pending, awaitingInvitation });

  // 배치가 통째로 실패하면 non-2xx로 알린다 — Vercel Cron 대시보드/로그에서 실패한
  // 실행으로 표시되는 유일한 신호다(자동 재시도는 없다). 개별 주문 실패는 각 배치의
  // failed/heldForReview 카운트로만 보고하고 실행 자체는 성공으로 친다.
  return Response.json(
    { ok, pending, awaitingInvitation },
    { status: ok ? 200 : 500 },
  );
}
