const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    if (
      response.status === 401 &&
      !options._retried &&
      path !== "/users/refresh_token"
    ) {
      const refreshed = await fetch(`${API_BASE}/api/v1/users/refresh_token`, {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
      if (refreshed?.ok) return request(path, { ...options, _retried: true });
    }
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload.data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
export const api = {
  request,
  videos: (params = {}) => request(`/videos?${new URLSearchParams(params)}`),
  video: (id) => request(`/videos/${id}`),
  comments: (id) => request(`/comments/${id}?limit=30`),
  addComment: (id, content) =>
    request(`/comments/${id}`, json("POST", { content })),
  toggleLike: (id) => request(`/likes/toggle/v/${id}`, { method: "POST" }),
  liked: () => request("/likes/videos"),
  subscribe: (id) => request(`/subscriptions/c/${id}`, { method: "POST" }),
  subscriptions: (id) => request(`/subscriptions/u/${id}`),
  channel: (username) => request(`/users/c/${encodeURIComponent(username)}`),
  currentUser: () => request("/users/current_user"),
  login: (username, password) =>
    request("/users/login", json("POST", { username, password })),
  register: (data) =>
    request("/users/register", { method: "POST", body: data }),
  logout: () => request("/users/logout", { method: "POST" }),
  history: () => request("/users/watchHistory"),
  clearHistory: () => request("/users/watchHistory", { method: "DELETE" }),
  addHistory: (id) => request(`/users/watchHistory/${id}`, { method: "POST" }),
  playlists: (id) => request(`/playlist/user/${id}`),
  playlist: (id) => request(`/playlist/${id}`),
  createPlaylist: (name, description) =>
    request("/playlist", json("POST", { name, description })),
  addToPlaylist: (video, playlist) =>
    request(`/playlist/add/${video}/${playlist}`, { method: "PATCH" }),
  deletePlaylist: (id) => request(`/playlist/${id}`, { method: "DELETE" }),
  dashboard: () => request("/dashboard/stats"),
  creatorVideos: () => request("/dashboard/videos"),
  upload: (form, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/v1/videos`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) =>
        event.lengthComputable &&
        onProgress(Math.round((event.loaded / event.total) * 100));
      xhr.onload = () => {
        const payload = JSON.parse(xhr.responseText || "{}");
        xhr.status >= 200 && xhr.status < 300
          ? resolve(payload.data)
          : reject(new Error(payload.message || "Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload connection failed"));
      xhr.send(form);
    }),
  updateVideo: (id, form) =>
    request(`/videos/${id}`, { method: "PATCH", body: form }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: "DELETE" }),
  togglePublish: (id) =>
    request(`/videos/toggle/publish/${id}`, { method: "PATCH" }),
};
