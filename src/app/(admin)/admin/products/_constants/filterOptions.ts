const VIEW_FILTER_OPTIONS: ReadonlyArray<{
  value: "active" | "trash";
  label: string;
}> = [
  { value: "active", label: "상품 목록" },
  { value: "trash", label: "휴지통" },
];

export { VIEW_FILTER_OPTIONS };
