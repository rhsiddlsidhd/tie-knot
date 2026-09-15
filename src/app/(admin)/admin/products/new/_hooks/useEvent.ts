"use client";

import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * 항상 같은 참조를 유지하면서 호출 시점의 최신 클로저를 실행하는 핸들러를 만든다.
 * memo된 자식에 콜백을 내려보낼 때 props 참조가 매 렌더 바뀌는 것을 막는 용도다.
 *
 * 렌더 중에는 호출하지 않는다 — ref 갱신이 커밋 이후에 일어나므로 렌더 단계에서는
 * 이전 렌더의 클로저를 읽게 된다(React `useEffectEvent` 제안과 같은 제약).
 */
const useEvent = <Args extends unknown[], Result>(
  handler: (...args: Args) => Result,
) => {
  const handlerRef = useRef(handler);

  // 다른 effect가 읽기 전에 갱신되도록 insertion 단계에서 덮어쓴다.
  useInsertionEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args: Args) => handlerRef.current(...args), []);
};

export { useEvent };
