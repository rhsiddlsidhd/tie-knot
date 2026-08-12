export function buildPreEditResponse(result, command) {
  let reason;
  try { reason = JSON.parse(result.stdout).reason; } catch {}
  reason ||= `TDD Guard 실행 오류. 편집을 차단합니다. node scripts/tdd-guard/bin/guard.mjs ${command}를 직접 실행하세요.`;

  return {
    reason,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  };
}
