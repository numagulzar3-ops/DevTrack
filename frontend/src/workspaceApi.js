export async function workspaceRequest(path, { body, ...options } = {}) {
  const headers = { Authorization: `Bearer ${localStorage.getItem("devtrack_token")}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : data.detail?.[0]?.msg;
    throw new Error(detail || "The request could not be completed.");
  }
  return data;
}
