// 이름 가운데 글자를 마스킹한다: "김민준" → "김*준", "김수" → "김*".
// 2글자 미만은 마스킹할 가운데 구간이 없어 원문 그대로 리턴한다.
export const maskName = (name: string): string => {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
};
