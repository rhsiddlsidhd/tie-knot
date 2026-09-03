import type { GuestbookDemoAction, GuestbookDemoEntry, GuestbookDemoState } from "./type";

// 데모 페이지 새로고침 시 이 목데이터로 복원된다 — DB/localStorage에 저장하지 않는다.
// DEFAULT_PAGE_SIZE(10) 기준 3페이지 분량(10/10/4)이라 무한스크롤 이어붙임과
// 마지막 페이지 이후 중단을 모두 데모에서 확인할 수 있다.
export const INITIAL_GUESTBOOK_DEMO_STATE: GuestbookDemoState = {
  entries: [
    { id: "demo-24", author: "박서준", message: "두 분의 새로운 시작을 진심으로 축하드립니다. 늘 행복하세요!", password: "0000" },
    { id: "demo-23", author: "김하은", message: "결혼 축하해! 오늘 정말 예쁘다, 앞으로도 지금처럼 행복하길 바랄게.", password: "0000" },
    { id: "demo-22", author: "이도윤", message: "축하합니다! 두 분이서 함께 만들어갈 앞날을 응원합니다.", password: "0000" },
    { id: "demo-21", author: "최지우", message: "결혼을 진심으로 축하드려요. 사랑 가득한 가정 이루시길 바랍니다.", password: "0000" },
    { id: "demo-20", author: "정민서", message: "너무 잘 어울리는 두 사람! 결혼 축하하고 늘 웃음 가득하길.", password: "0000" },
    { id: "demo-19", author: "강수아", message: "결혼 축하합니다. 서로 아끼고 존중하며 오래오래 행복하세요.", password: "0000" },
    { id: "demo-18", author: "조은우", message: "축하해요! 두 분의 결혼식, 정말 아름다울 것 같아요.", password: "0000" },
    { id: "demo-17", author: "윤서연", message: "결혼 진심으로 축하드립니다. 건강하고 행복한 나날 되세요.", password: "0000" },
    { id: "demo-16", author: "임하준", message: "축하합니다! 두 분 앞날에 늘 좋은 일만 가득하시길 바랍니다.", password: "0000" },
    { id: "demo-15", author: "한지민", message: "결혼 축하해요. 함께라서 더 빛나는 두 사람이 되길 응원해요.", password: "0000" },
    { id: "demo-14", author: "오세훈", message: "결혼 축하드립니다! 서로에게 최고의 동반자가 되시길 바랍니다.", password: "0000" },
    { id: "demo-13", author: "신유나", message: "축하해! 오늘부터 시작될 두 사람의 이야기를 응원할게.", password: "0000" },
    { id: "demo-12", author: "장도현", message: "결혼을 축하드립니다. 늘 지금처럼 다정한 부부 되세요.", password: "0000" },
    { id: "demo-11", author: "권나윤", message: "축하합니다! 두 분의 새 출발을 마음 다해 응원합니다.", password: "0000" },
    { id: "demo-10", author: "배준혁", message: "결혼 축하해요. 웃음이 끊이지 않는 가정 이루시길 바랍니다.", password: "0000" },
    { id: "demo-9", author: "문소율", message: "축하드립니다! 서로 사랑하며 건강하게 지내시길 바랍니다.", password: "0000" },
    { id: "demo-8", author: "서준서", message: "결혼 축하해! 두 사람이 함께라서 더 행복할 앞날을 응원해.", password: "0000" },
    { id: "demo-7", author: "홍예은", message: "축하합니다. 오늘의 설렘이 오래도록 이어지길 바랍니다.", password: "0000" },
    { id: "demo-6", author: "황지호", message: "결혼 축하드려요! 두 분 앞날에 행복만 가득하시길 바랍니다.", password: "0000" },
    { id: "demo-5", author: "안유진", message: "축하해요! 서로 의지하며 평생 행복하게 사세요.", password: "0000" },
    { id: "demo-4", author: "송민준", message: "결혼 진심으로 축하드립니다. 늘 건강하고 행복하시길 바랍니다.", password: "0000" },
    { id: "demo-3", author: "전지호", message: "축하합니다! 두 사람의 새로운 챕터를 응원해요.", password: "0000" },
    { id: "demo-2", author: "노하람", message: "결혼 축하해! 오래오래 지금처럼 알콩달콩 지내길 바랄게.", password: "0000" },
    { id: "demo-1", author: "유채원", message: "축하드립니다. 두 분의 결혼을 진심으로 축복합니다.", password: "0000" },
  ],
};

const DEMO_ID_PATTERN = /^demo-(\d+)$/;

// 삭제 뒤 재추가되는 항목이 id 충돌 없이 이어지도록, entries.length가 아니라
// 현재 존재하는 demo-N의 최댓값에서 다음 id를 결정한다.
function nextDemoId(entries: GuestbookDemoEntry[]): string {
  const maxN = entries.reduce((max, entry) => {
    const matched = DEMO_ID_PATTERN.exec(entry.id);
    return matched ? Math.max(max, Number(matched[1])) : max;
  }, 0);
  return `demo-${maxN + 1}`;
}

export function guestbookDemoReducer(
  state: GuestbookDemoState,
  action: GuestbookDemoAction,
): GuestbookDemoState {
  switch (action.type) {
    case "ADD_ENTRY": {
      const newEntry: GuestbookDemoEntry = {
        id: nextDemoId(state.entries),
        author: action.payload.author,
        message: action.payload.message,
        password: action.payload.password,
      };
      return { ...state, entries: [newEntry, ...state.entries] };
    }

    case "REMOVE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload.id),
      };

    default:
      return state;
  }
}
