"use client";

import { useEffect } from "react";

// Radix Dialog(라이트박스/방명록 모달/연락처 모달)는 document.body에 직접 포탈된다 —
// data-theme는 이 페이지의 wrapper div에만 있어서, 모달은 그 상속 체인 밖에 위치해
// 항상 default 색으로만 렌더됐다(blossom 청첩장이어도 모달만 테라코타). 페이지 진입 시
// 같은 theme 값을 documentElement에도 반영해서 포탈된 모달도 상속받게 한다.
export function ThemeSync({ theme }: { theme: string }): null {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (prev) {
        root.setAttribute("data-theme", prev);
      } else {
        root.removeAttribute("data-theme");
      }
    };
  }, [theme]);

  return null;
}
