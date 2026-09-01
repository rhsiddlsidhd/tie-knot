"use client";

import { useReducer } from "react";
import { createStateContext } from "../createStateContext";
import { guestbookDemoReducer } from "./reducer";
import type { GuestbookDemoState } from "./type";

export const [GuestbookDemoProvider, useGuestbookDemo] = createStateContext(
  (init: GuestbookDemoState) => useReducer(guestbookDemoReducer, init),
);
