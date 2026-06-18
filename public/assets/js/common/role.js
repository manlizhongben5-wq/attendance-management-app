// =============================
// role管理ユーティリティ
// =============================
export function getCurrentRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get("role") ?? "student";
}

// どの画面へ行くときも必ずroleを付ける
export function withRole(url) {
  const role = getCurrentRole();
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}role=${role}`;
}