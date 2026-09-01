"use client";

import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { createAppStore, type AppStoreApi } from "./app.store";

export const AppStoreContext = createContext<AppStoreApi | null>(null);

export function StoreProvider({
  children,
  // 테스트에서 미리 만든 store 인스턴스를 주입해 getState()/setState()로 직접
  // arrange/assert하기 위한 시드 — production에서는 넘기지 않는다.
  store,
}: {
  children: ReactNode;
  store?: AppStoreApi;
}) {
  const [appStore] = useState(() => store ?? createAppStore());

  return (
    <AppStoreContext.Provider value={appStore}>
      {children}
    </AppStoreContext.Provider>
  );
}
