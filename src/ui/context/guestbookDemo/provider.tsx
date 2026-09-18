"use client";

import { useReducer } from "react";
import { createStateContext } from "../createStateContext";
import { guestbookDemoReducer } from "./reducer";
import type { GuestbookDemoState } from "./type";

const [GuestbookDemoProvider, useGuestbookDemo] = createStateContext(
  (init: GuestbookDemoState) => useReducer(guestbookDemoReducer, init),
);

export { GuestbookDemoProvider, useGuestbookDemo };
