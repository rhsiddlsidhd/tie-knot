const CLAUDE_EDIT_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);

export function extractClaudePaths(payload) {
  if (!CLAUDE_EDIT_TOOLS.has(payload?.tool_name)) return [];
  const filePath = payload.tool_input?.file_path;
  return typeof filePath === "string" && filePath ? [filePath] : [];
}
