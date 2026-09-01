"use client";

import { useReducer } from "react";
import { createStateContext } from "../createStateContext";
import { filterReducer } from "./reducer";
import type { ProductFilterState } from "./type";

export const [ProductFilterProvider, useProductFilter] = createStateContext(
  (init: ProductFilterState) => useReducer(filterReducer, init),
);
