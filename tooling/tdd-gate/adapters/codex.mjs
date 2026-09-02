export function extractCodexPaths(payload) {
  if (payload?.tool_name !== "apply_patch") return [];
  const command = payload.tool_input?.command;
  if (typeof command !== "string") return [];

  const paths = new Set();
  const pathPattern =
    /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;
  for (const match of command.matchAll(pathPattern)) paths.add(match[1].trim());
  return [...paths];
}
