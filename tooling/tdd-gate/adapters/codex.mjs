/**
 * apply_patch 명령을 파싱해 `{ path, op }[]`를 반환한다.
 * "Move to:"는 직전 "Update File:" 줄과 짝지어 하나의 rename으로 다룬다 —
 * 옛 경로는 delete, 새 경로는 add로 갈라 gate가 각각 독립적으로 판단하게 한다.
 */
const LINE_PATTERN =
  /^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/gm;

function extractCodexPaths(payload) {
  if (payload?.tool_name !== "apply_patch") return [];
  const command = payload.tool_input?.command;
  if (typeof command !== "string") return [];

  const results = [];
  const indexByPath = new Map();
  let pendingUpdatePath = null;

  const upsert = (path, op) => {
    if (indexByPath.has(path)) {
      results[indexByPath.get(path)].op = op;
      return;
    }
    indexByPath.set(path, results.length);
    results.push({ path, op });
  };

  for (const match of command.matchAll(LINE_PATTERN)) {
    const [, kind, rawPath] = match;
    const path = rawPath.trim();

    if (kind === "Move to") {
      if (pendingUpdatePath) upsert(pendingUpdatePath, "delete");
      upsert(path, "add");
    } else if (kind === "Update File") {
      upsert(path, "update");
    } else if (kind === "Add File") {
      upsert(path, "add");
    } else if (kind === "Delete File") {
      upsert(path, "delete");
    }

    pendingUpdatePath = kind === "Update File" ? path : null;
  }

  return results;
}

export { extractCodexPaths };
