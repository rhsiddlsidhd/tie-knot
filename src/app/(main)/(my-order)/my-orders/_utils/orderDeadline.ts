import { MOBILE_INVITATION_INPUT_DEADLINE_DAYS } from "@/core/domain/order";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * 청첩장 정보 미입력 자동취소까지 남은 일수 — 결제완료(confirmedAt) 시각에 기한을 더해
 * 계산한다. 하루가 채 안 남았으면 0(오늘 마감), 이미 지났으면 음수를 리턴해 호출부가
 * "기한 경과"를 구분할 수 있게 한다.
 */
export const getMobileInvitationInputDaysLeft = (
  confirmedAt: Date | string,
  now: Date = new Date(),
): number => {
  const deadline =
    new Date(confirmedAt).getTime() + MOBILE_INVITATION_INPUT_DEADLINE_DAYS * DAY_IN_MS;

  return Math.floor((deadline - now.getTime()) / DAY_IN_MS);
};
