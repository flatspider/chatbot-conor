const STORAGE_KEY = "visitorId";

export function getVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-visitor-id", getVisitorId());
  return fetch(input, { ...init, headers });
}
