"use client";

import { useReducer } from "react";
import { createStateContext } from "../createStateContext";
import { filterReducer } from "./reducer";
import type { ProductFilterState } from "./type";

const [ProductFilterProvider, useProductFilter] = createStateContext(
  (init: ProductFilterState) => useReducer(filterReducer, init),
);

export { ProductFilterProvider, useProductFilter };
