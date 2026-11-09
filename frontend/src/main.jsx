import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import "./style.css";

const CATS = [
  "For you",
  "Music",
  "Design",
  "Technology",
  "Gaming",
  "Travel",
  "Podcasts",
  "Live",
];
const fmt = (n = 0) =>
  Intl.NumberFormat("en", {
    notation: n > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n || 0);
const ago = (date) => {
  if (!date) return "Recently";
  const d = Math.max(0, (Date.now() - new Date(date)) / 86400000);
  return d < 1
    ? "Today"
    : d < 30
      ? `${Math.floor(d)} days ago`
      : d < 365
        ? `${Math.floor(d / 30)} months ago`
        : `${Math.floor(d / 365)} years ago`;
};
const initials = (name = "M") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
const icons = {
  menu: "☰",
  home: "⌂",
  shorts: "◈",
  subs: "◎",
  history: "◷",
  playlist: "▤",
  liked: "♡",
  upload: "＋",
  settings: "⚙",
  search: "⌕",
  bell: "♧",
  more: "···",
  play: "▶",
  close: "×",
};

function useRouter() {
  const [url, setUrl] = useState(location.pathname + location.search);
  useEffect(() => {
    const pop = () => setUrl(location.pathname + location.search);
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);
  const go = useCallback((path) => {
    history.pushState({}, "", path);
    setUrl(path);
    window.scrollTo(0, 0);
  }, []);
  return [url, go];
}
function Avatar({ user, size = "md" }) {
  return user?.avatar ? (
    <img className={`avatar ${size}`} src={user.avatar} alt="" />
  ) : (
    <span className={`avatar avatar-fallback ${size}`}>
      {initials(user?.fullname || user?.username || "M")}
    </span>
  );
}
function Topbar({ go, user, onMenu, onAuth, query, setQuery }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    go(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };
  return (
    <header className="topbar">
      <div className="brandgroup">
        <button
          className="iconbtn menu-btn"
          onClick={onMenu}
          aria-label="Toggle navigation"
        >
          {icons.menu}
        </button>
        <button className="brand" onClick={() => go("/")}>
          <img className="brandmark" src="/mytube-mark.png" alt="" />
          <span>mytube</span>
          <small>STUDIO</small>
        </button>
      </div>
      <form
        className={`searchbar ${searchOpen ? "open" : ""}`}
        onSubmit={search}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, creators..."
        />
        <button className="search-submit" aria-label="Search">
          ⌕
        </button>
        <button
          type="button"
          className="mobile-search iconbtn"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          ⌕
        </button>
      </form>
      <div className="top-actions">
        <button
          className="iconbtn upload-top"
          title="Upload video"
          onClick={() => (user ? go("/studio/upload") : onAuth())}
        >
          {icons.upload}
        </button>
        {user ? (
          <button className="profile-trigger" onClick={() => go("/profile")}>
            <Avatar user={user} />
          </button>
        ) : (
          <button className="signin-btn" onClick={onAuth}>
            Sign in <span>↗</span>
          </button>
        )}
      </div>
    </header>
  );
}
function Sidebar({ active, collapsed, setCollapsed, go, user, onAuth }) {
  const links = [
    ["Home", "/", "⌂"],
    ["Explore", "/explore", "✳"],
    ["Subscriptions", "/subscriptions", "◎"],
  ];
  const library = [
    ["History", "/history", "◷"],
    ["Playlists", "/playlists", "▤"],
    ["Liked videos", "/liked", "♡"],
  ];
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <nav>
        {links.map(([name, path, icon]) => (
          <button
            key={path}
            className={`navitem ${active === path ? "active" : ""}`}
            onClick={() => go(path)}
          >
            <span>{icon}</span>
            <b>{name}</b>
          </button>
        ))}
        <div className="nav-divider" />
        <p className="nav-label">YOUR LIBRARY</p>
        {library.map(([name, path, icon]) => (
          <button
            key={path}
            className={`navitem ${active === path ? "active" : ""}`}
            onClick={() => (user ? go(path) : onAuth())}
          >
            <span>{icon}</span>
            <b>{name}</b>
          </button>
        ))}
        <div className="nav-divider" />
        <div className="sidebar-promo">
          <span className="promo-orb">✦</span>
          <strong>
            Make something
            <br />
            worth watching.
          </strong>
          <p>Share your perspective with the community.</p>
          <button onClick={() => (user ? go("/studio/upload") : onAuth())}>
            Create video <span>↗</span>
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className="navitem"
            onClick={() => (user ? go("/studio") : onAuth())}
          >
            <span>▦</span>
            <b>Creator studio</b>
          </button>
          <button
            className="navitem"
            onClick={() => (user ? go("/profile") : onAuth())}
          >
            <span>⚙</span>
            <b>Profile</b>
          </button>
          <p>© 2026 MyTube</p>
        </div>
      </nav>
    </aside>
  );
}
function Skeletons() {
  return (
    <div className="video-grid">
      {Array.from({ length: 8 }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="sk-thumb" />
          <div className="sk-row">
            <i />
            <div>
              <b />
              <small />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function VideoCard({ video, go, compact = false, onMenu }) {
  const owner = video.owner || {};
  return (
    <article className={`video-card ${compact ? "compact" : ""}`}>
      <button className="thumb-wrap" onClick={() => go(`/watch/${video._id}`)}>
        <img
          src={video.thumbnail || "/video-placeholder.svg"}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/video-placeholder.svg";
          }}
        />
        <span className="duration">
          {video.duration
            ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, "0")}`
            : "HD"}
        </span>
        <span className="thumb-play">▶</span>
      </button>
      <div className="video-meta">
        <button
          className="avatar-link"
          onClick={() => owner.username && go(`/channel/${owner.username}`)}
        >
          <Avatar user={owner} />
        </button>
        <div className="video-copy">
          <button
            className="video-title"
            onClick={() => go(`/watch/${video._id}`)}
          >
            {video.title}
          </button>
          <button
            className="channel-name"
            onClick={() => owner.username && go(`/channel/${owner.username}`)}
          >
            {owner.fullname || owner.username || "MyTube creator"}
          </button>
          <p>
            {fmt(video.views)} views <i>·</i> {ago(video.createdAt)}
          </p>
        </div>
        {onMenu && (
          <button className="card-menu" onClick={() => onMenu(video)}>
            ···
          </button>
        )}
      </div>
    </article>
  );
}
function VideoGrid({
  videos,
  go,
  loading,
  emptyTitle = "Nothing here yet",
  emptyText = "Videos will show here when they are available.",
}) {
  if (loading) return <Skeletons />;
  if (!videos?.length) return <Empty title={emptyTitle} text={emptyText} />;
  return (
    <div className="video-grid">
      {videos.map((v) => (
        <VideoCard key={v._id} video={v} go={go} />
      ))}
    </div>
  );
}
function Empty({ title, text, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◌</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="primary-btn" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
function PageHeading({ eyebrow, title, sub, actions }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
function Home({ go, user, onAuth, query }) {
  const [videos, setVideos] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [category, setCategory] = useState("For you");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api
      .videos({ limit: 24, ...(query ? { query } : {}) })
      .then((d) => alive && setVideos(d?.docs || []))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [query]);
  const visible = useMemo(
    () =>
      category === "For you"
        ? videos
        : videos.filter((v) =>
            `${v.title} ${v.description}`
              .toLowerCase()
              .includes(category.toLowerCase())
          ),
    [videos, category]
  );
  return (
    <>
      <PageHeading
        eyebrow={query ? "SEARCH RESULTS" : "MONDAY, NOVEMBER 9"}
        title={
          query ? (
            `Results for “${query}”`
          ) : (
            <>
              Find your next
              <br />
              <em>favorite thing.</em>
            </>
          )
        }
        sub={
          query
            ? `${videos.length} videos found`
            : "A little inspiration for wherever your curiosity takes you."
        }
        actions={
          !query && (
            <button
              className="outline-btn"
              onClick={() => (user ? go("/studio/upload") : onAuth())}
            >
              ＋ Upload a video
            </button>
          )
        }
      />
      <div className="category-row">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={category === c ? "selected" : ""}
          >
            {c}
          </button>
        ))}
      </div>
      {error && (
        <div className="inline-error">
          <span>Couldn’t load videos</span>
          <p>{error}</p>
          <button onClick={() => location.reload()}>Try again</button>
        </div>
      )}
      <div className="section-title">
        <div>
          <span className="live-dot" />{" "}
          {query ? "SEARCHED FOR YOU" : "CURATED FOR YOU"}
        </div>
        <button onClick={() => go("/explore")}>
          View all <span>↗</span>
        </button>
      </div>
      <VideoGrid
        videos={visible}
        go={go}
        loading={loading}
        emptyTitle={
          error ? "We couldn’t reach MyTube" : "No videos to show yet"
        }
        emptyText={
          error
            ? "Check your API connection, then try again."
            : "Published videos from your community will appear here."
        }
      />
    </>
  );
}
function AuthDialog({ close, onLogin }) {
  const [mode, setMode] = useState("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      if (mode === "login")
        await onLogin(form.get("username"), form.get("password"));
      else {
        const fd = new FormData();
        ["fullname", "username", "email", "password"].forEach((k) =>
          fd.append(k, form.get(k))
        );
        const avatar = form.get("avatar");
        if (avatar?.size) fd.append("avatar", avatar);
        await api.register(fd);
        await onLogin(form.get("username"), form.get("password"));
      }
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="auth-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          ×
        </button>
        <div className="brand modal-brand">
          <img className="brandmark" src="/mytube-mark.png" alt="" />
          <span>mytube</span>
        </div>
        <div className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}
        </div>
        <h2>
          {mode === "login" ? "Good to see you." : "Your story starts here."}
        </h2>
        <p>
          {mode === "login"
            ? "Sign in to pick up where you left off."
            : "Create an account to watch, save, and share."}
        </p>
        {mode === "register" && (
          <>
            <label>
              Full name
              <input name="fullname" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Profile photo{" "}
              <input type="file" name="avatar" accept="image/*" required />
            </label>
          </>
        )}
        <label>
          Username or email
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength="6"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-btn wide" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}{" "}
          <span>↗</span>
        </button>
        <div className="auth-switch">
          {mode === "login" ? "New to MyTube?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
function WatchPage({ id, go, user, onAuth }) {
  const [video, setVideo] = useState(null),
    [comments, setComments] = useState([]),
    [error, setError] = useState(""),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [related, setRelated] = useState([]),
    [notice, setNotice] = useState(""),
    [playlists, setPlaylists] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all([api.video(id), api.comments(id), api.videos({ limit: 12 })])
      .then(([v, c, r]) => {
        if (!live) return;
        setVideo(v);
        setComments(c?.docs || []);
        setRelated((r?.docs || []).filter((x) => x._id !== id));
        api.addHistory(id).catch(() => {});
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id]);
  const like = async () => {
    if (!user) return onAuth();
    try {
      const result = await api.toggleLike(id);
      setVideo((v) => ({
        ...v,
        isLiked: result.isLiked,
        likesCount: Math.max(
          0,
          (v.likesCount || 0) + (result.isLiked ? 1 : -1)
        ),
      }));
    } catch (e) {
      setNotice(e.message);
    }
  };
  const subscribe = async () => {
    if (!user) return onAuth();
    try {
      const result = await api.subscribe(video.owner._id);
      setVideo((v) => ({
        ...v,
        owner: {
          ...v.owner,
          isSubscribed: result.isSubscribed,
          subscribersCount:
            (v.owner.subscribersCount || 0) + (result.isSubscribed ? 1 : -1),
        },
      }));
    } catch (e) {
      setNotice(e.message);
    }
  };
  const sendComment = async (e) => {
    e.preventDefault();
    if (!user) return onAuth();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.addComment(id, comment);
      setComment("");
      setComments(await api.comments(id).then((x) => x?.docs || []));
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (error)
    return (
      <Empty
        title="This video is unavailable"
        text={error}
        action={
          error.toLowerCase().includes("unauthorized")
            ? "Sign in"
            : "Back to home"
        }
        onAction={
          error.toLowerCase().includes("unauthorized") ? onAuth : () => go("/")
        }
      />
    );
  if (!video)
    return (
      <>
        <div className="player-skeleton" />
        <div className="watch-skeleton" />
      </>
    );
  const openSave = async () => {
    if (!user) return onAuth();
    try {
      setPlaylists((await api.playlists(user._id)) || []);
    } catch (e) {
      setNotice(e.message);
    }
  };
  const saveTo = async (playlistId) => {
    try {
      await api.addToPlaylist(id, playlistId);
      setPlaylists(null);
      setNotice("Added to playlist");
    } catch (e) {
      setNotice(e.message);
    }
  };
  return (
    <div className="watch-layout">
      <main className="watch-main">
        <div className="player">
          <video
            controls
            playsInline
            poster={video.thumbnail}
            src={video.videoFile}
          />
        </div>
        <div className="watch-title-row">
          <div>
            <div className="eyebrow">NOW PLAYING</div>
            <h1>{video.title}</h1>
          </div>
          <div className="watch-actions">
            <button className={video.isLiked ? "liked" : ""} onClick={like}>
              ♡ <span>{fmt(video.likesCount)}</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(location.href);
                setNotice("Video link copied");
              }}
            >
              ↗ <span>Share</span>
            </button>
            <button onClick={openSave}>
              ＋ <span>Save</span>
            </button>
          </div>
        </div>
        <div className="watch-channel">
          <button
            className="channel-identity"
            onClick={() => go(`/channel/${video.owner?.username}`)}
          >
            <Avatar user={video.owner} size="lg" />
            <span>
              <b>{video.owner?.fullname || video.owner?.username}</b>
              <small>{fmt(video.owner?.subscribersCount)} subscribers</small>
            </span>
          </button>
          <button
            className={`subscribe-btn ${video.owner?.isSubscribed ? "subscribed" : ""}`}
            onClick={subscribe}
          >
            {video.owner?.isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
          <div className="watch-stats">
            {fmt(video.views)} views <i>·</i> {ago(video.createdAt)}
          </div>
        </div>
        <div className="description-box">
          <div>{video.description || "No description provided."}</div>
          <button
            onClick={(e) =>
              e.currentTarget.previousSibling.classList.toggle("expanded")
            }
          >
            Show more
          </button>
        </div>
        {notice && (
          <div className="notice" onClick={() => setNotice("")}>
            {notice} <button>×</button>
          </div>
        )}
        <section className="comments">
          <h2>
            {comments.length} <span>Comments</span>
          </h2>
          <form className="comment-form" onSubmit={sendComment}>
            <Avatar user={user} />
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                user ? "Add a comment..." : "Sign in to join the conversation"
              }
              onFocus={() => !user && onAuth()}
            />
            <button disabled={busy || !comment.trim()}>Post</button>
          </form>
          {comments.map((c) => (
            <div className="comment" key={c._id}>
              <Avatar user={c.owner} />
              <div>
                <b>
                  {c.owner?.fullname || c.owner?.username || "Viewer"}{" "}
                  <small>{ago(c.createdAt)}</small>
                </b>
                <p>{c.content}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
      <aside className="related">
        <h3>
          Up next{" "}
          <span>
            Autoplay <i />
          </span>
        </h3>
        {related.slice(0, 8).map((v) => (
          <VideoCard key={v._id} video={v} go={go} compact />
        ))}
      </aside>
      {playlists && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setPlaylists(null)
          }
        >
          <div className="auth-modal playlist-picker">
            <button className="modal-close" onClick={() => setPlaylists(null)}>
              ×
            </button>
            <div className="eyebrow">SAVE FOR LATER</div>
            <h2>Add to playlist</h2>
            {playlists.length ? (
              playlists.map((p) => (
                <button
                  className="playlist-option"
                  key={p._id}
                  onClick={() => saveTo(p._id)}
                >
                  <span>▤</span>
                  <b>{p.name}</b>
                  <small>{p.videos?.length || 0} videos</small>
                </button>
              ))
            ) : (
              <>
                <p>
                  Create a playlist first to save this video to a collection.
                </p>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setPlaylists(null);
                    go("/playlists");
                  }}
                >
                  Open playlists ↗
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function LibraryPage({ type, user, go, onAuth }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [playlists, setPlaylists] = useState([]),
    [modal, setModal] = useState(false);
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (type === "History") setItems((await api.history()) || []);
      else if (type === "Liked videos")
        setItems(
          ((await api.liked()) || []).map((x) => x.video).filter(Boolean)
        );
      else if (type === "Subscriptions")
        setItems(
          ((await api.subscriptions(user._id)) || [])
            .map((x) => x.channel)
            .filter(Boolean)
        );
      else if (type === "Playlists")
        setPlaylists((await api.playlists(user._id)) || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [type, user]);
  useEffect(() => {
    load();
  }, [load]);
  async function clear() {
    try {
      await api.clearHistory();
      setItems([]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function create(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createPlaylist(f.get("name"), f.get("description"));
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  if (!user)
    return (
      <Empty
        title="Your library is waiting"
        text="Sign in to keep your history, playlists, subscriptions, and liked videos together."
        action="Sign in"
        onAction={onAuth}
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="YOUR SPACE"
        title={type}
        sub={
          type === "History"
            ? "Pick up right where you left off."
            : type === "Liked videos"
              ? "A collection of videos you love."
              : type === "Subscriptions"
                ? "Creators you follow, all in one place."
                : "Collections made for every mood."
        }
        actions={
          type === "History" && items.length > 0 ? (
            <button className="outline-btn" onClick={clear}>
              Clear history
            </button>
          ) : type === "Playlists" ? (
            <button className="primary-btn" onClick={() => setModal(true)}>
              ＋ New playlist
            </button>
          ) : null
        }
      />
      {error && <div className="inline-error">{error}</div>}
      {type === "Playlists" ? (
        loading ? (
          <div className="playlist-grid">
            {[1, 2, 3].map((x) => (
              <div className="playlist-skeleton" key={x} />
            ))}
          </div>
        ) : playlists.length ? (
          <div className="playlist-grid">
            {playlists.map((p) => (
              <button
                className="playlist-card"
                key={p._id}
                onClick={() => go(`/playlist/${p._id}`)}
              >
                <div className="playlist-art">▤</div>
                <b>{p.name}</b>
                <small>{p.videos?.length || 0} videos</small>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="Your first playlist is a click away"
            text="Create a collection for your favorite videos."
            action="Create playlist"
            onAction={() => setModal(true)}
          />
        )
      ) : type === "Subscriptions" ? (
        loading ? (
          <div className="subscription-grid">
            {[1, 2, 3, 4].map((n) => (
              <div className="playlist-skeleton" key={n} />
            ))}
          </div>
        ) : items.length ? (
          <div className="subscription-grid">
            {items.map((channel) => (
              <button
                className="subscription-card"
                key={channel._id}
                onClick={() => go(`/channel/${channel.username}`)}
              >
                <Avatar user={channel} size="lg" />
                <span>
                  <b>{channel.fullname || channel.username}</b>
                  <small>@{channel.username}</small>
                </span>
                <i>↗</i>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="No subscriptions yet"
            text="Explore channels and follow creators to see them here."
            action="Explore videos"
            onAction={() => go("/explore")}
          />
        )
      ) : (
        <VideoGrid
          videos={items}
          go={go}
          loading={loading}
          emptyTitle={`No ${type.toLowerCase()} yet`}
          emptyText="As you watch and explore, your videos will be collected here."
        />
      )}
      {modal && (
        <div className="modal-backdrop">
          <form className="auth-modal" onSubmit={create}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setModal(false)}
            >
              ×
            </button>
            <div className="eyebrow">NEW COLLECTION</div>
            <h2>Create a playlist</h2>
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Description
              <textarea name="description" required />
            </label>
            <button className="primary-btn wide">Create playlist ↗</button>
          </form>
        </div>
      )}
    </>
  );
}
function ChannelPage({ username, go, user, onAuth }) {
  const [channel, setChannel] = useState(null),
    [videos, setVideos] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .channel(username)
      .then(async (c) => {
        setChannel(c);
        const v = await api.videos({ userId: c._id, limit: 50 });
        setVideos(v?.docs || []);
      })
      .catch((e) => setError(e.message));
  }, [username]);
  async function subscribe() {
    if (!user) return onAuth();
    try {
      const d = await api.subscribe(channel._id);
      setChannel((c) => ({
        ...c,
        isSubscribed: d.isSubscribed,
        subscriberCount: (c.subscriberCount || 0) + (d.isSubscribed ? 1 : -1),
      }));
    } catch (e) {
      setError(e.message);
    }
  }
  if (error) return <Empty title="Channel unavailable" text={error} />;
  if (!channel) return <div className="channel-skeleton" />;
  return (
    <>
      <div
        className="cover"
        style={{
          backgroundImage: channel.coverimage
            ? `linear-gradient(90deg,#0d0f12aa,#0d0f1255),url(${channel.coverimage})`
            : "",
        }}
      />
      <div className="channel-header">
        <Avatar user={channel} size="xl" />
        <div className="channel-copy">
          <h1>{channel.fullname}</h1>
          <p>
            @{channel.username} <i>·</i> {fmt(channel.subscriberCount)}{" "}
            subscribers <i>·</i> {videos.length} videos
          </p>
        </div>
        <button
          className={`subscribe-btn ${channel.isSubscribed ? "subscribed" : ""}`}
          onClick={subscribe}
        >
          {channel.isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>
      <div className="channel-tabs">
        <button className="active">Videos</button>
        <button>About</button>
      </div>
      <VideoGrid videos={videos} go={go} />
      {!videos.length && (
        <Empty
          title="No public videos yet"
          text="This creator has not published any videos."
        />
      )}
    </>
  );
}
function Studio({ user, go, onAuth }) {
  const [stats, setStats] = useState(null),
    [videos, setVideos] = useState([]),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Overview"),
    [editing, setEditing] = useState(null);
  const load = useCallback(
    () =>
      Promise.all([api.dashboard(), api.creatorVideos()])
        .then(([s, v]) => {
          setStats(s);
          setVideos(v || []);
        })
        .catch((e) => setError(e.message)),
    []
  );
  useEffect(() => {
    if (user) load();
  }, [user, load]);
  if (!user)
    return (
      <Empty
        title="Creator studio"
        text="Sign in to manage your channel and videos."
        action="Sign in"
        onAction={onAuth}
      />
    );
  const del = async (id) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      await api.deleteVideo(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const toggle = async (id) => {
    try {
      await api.togglePublish(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  async function saveVideo(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.updateVideo(editing._id, form);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MYTUBE FOR CREATORS"
        title="Studio"
        sub="Your channel, at a glance."
        actions={
          <button className="primary-btn" onClick={() => go("/studio/upload")}>
            ＋ Upload video
          </button>
        }
      />
      <div className="studio-tabs">
        {["Overview", "Content"].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {error && <div className="inline-error">{error}</div>}
      {tab === "Overview" && (
        <div className="stat-grid">
          {[
            ["Total views", stats?.totalViews],
            ["Subscribers", stats?.totalSubscribers],
            ["Videos", stats?.totalVideos],
            ["Likes", stats?.totalLikes],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <small>{label}</small>
              <strong>{stats ? fmt(value) : "—"}</strong>
              <span>Lifetime</span>
            </div>
          ))}
        </div>
      )}
      <div className="section-title">
        <div>{tab === "Overview" ? "RECENT CONTENT" : "YOUR CONTENT"}</div>
        <button onClick={() => setTab("Content")}>
          View all <span>↗</span>
        </button>
      </div>
      <div className="manage-list">
        {videos.length ? (
          videos.map((v) => (
            <div className="manage-row" key={v._id}>
              <button
                className="manage-thumb"
                onClick={() => go(`/watch/${v._id}`)}
              >
                <img src={v.thumbnail || "/video-placeholder.svg"} />
              </button>
              <div className="manage-title">
                <b>{v.title}</b>
                <small>{ago(v.createdAt)}</small>
              </div>
              <div className="manage-stat">
                {fmt(v.views)} <small>views</small>
              </div>
              <div
                className={`publish-status ${v.isPublished ? "published" : "draft"}`}
              >
                {v.isPublished ? "Published" : "Draft"}
              </div>
              <button className="more-btn" onClick={() => setEditing(v)}>
                Edit
              </button>
              <button className="more-btn" onClick={() => toggle(v._id)}>
                {v.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button className="more-btn" onClick={() => del(v._id)}>
                Delete
              </button>
            </div>
          ))
        ) : (
          <Empty
            title="Your channel starts here"
            text="Upload your first video and share your point of view."
            action="Upload a video"
            onAction={() => go("/studio/upload")}
          />
        )}
      </div>
      {editing && (
        <div className="modal-backdrop">
          <form className="auth-modal" onSubmit={saveVideo}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(null)}
            >
              ×
            </button>
            <div className="eyebrow">CONTENT DETAILS</div>
            <h2>Edit video</h2>
            <label>
              Title
              <input name="title" defaultValue={editing.title} required />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={editing.description}
                rows="5"
                required
              />
            </label>
            <label>
              Replace thumbnail
              <input name="thumbnail" type="file" accept="image/*" />
            </label>
            <button className="primary-btn wide">Save changes ↗</button>
          </form>
        </div>
      )}
    </>
  );
}
function UploadPage({ user, go, onAuth }) {
  const [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!user) return onAuth();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api.upload(fd, setProgress);
      go("/studio");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <Empty
        title="Ready to share?"
        text="Sign in to upload videos to your channel."
        action="Sign in"
        onAction={onAuth}
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="CREATOR STUDIO"
        title="Upload a video"
        sub="Bring your next idea to the community."
      />
      <form className="upload-form" onSubmit={submit}>
        <label className="file-drop">
          <span className="upload-icon">⇧</span>
          <b>Choose a video file</b>
          <small>MP4, MOV or WebM · select a file to get started</small>
          <input type="file" name="videoFile" accept="video/*" required />
        </label>
        <div className="upload-fields">
          <label>
            Video title
            <input
              name="title"
              placeholder="Give your video a clear, compelling title"
              required
              maxLength="120"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              placeholder="Tell viewers what this video is about"
              required
              rows="6"
            />
          </label>
          <label>
            Thumbnail
            <input type="file" name="thumbnail" accept="image/*" required />
          </label>
          <div className="upload-note">
            <span>ⓘ</span> Your video and thumbnail are uploaded to the existing
            Cloudinary integration. This server does not currently support tags
            or category metadata.
          </div>
          {error && <div className="form-error">{error}</div>}
          {busy && (
            <div className="progress">
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => go("/studio")}
            >
              Cancel
            </button>
            <button className="primary-btn" disabled={busy}>
              {busy ? `Uploading ${progress}%` : "Publish video ↗"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
function ProfilePage({ user, go, onAuth, onLogout, setUser }) {
  const [name, setName] = useState(user?.fullname || ""),
    [username, setUsername] = useState(user?.username || ""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (!user)
    return (
      <Empty
        title="Your profile"
        text="Sign in to view and update your profile."
        action="Sign in"
        onAction={onAuth}
      />
    );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const d = await api.request("/users/update_details", {
        method: "PATCH",
        body: JSON.stringify({ fullname: name }),
      });
      setUser(d.user || d);
      setMessage("Profile saved.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT"
        title="Your profile"
        sub="The details people see around MyTube."
      />
      <div className="profile-panel">
        <Avatar user={user} size="xl" />
        <div>
          <h2>{user.fullname}</h2>
          <p>@{user.username}</p>
        </div>
        <button
          className="outline-btn"
          onClick={() => go(`/channel/${user.username}`)}
        >
          View channel ↗
        </button>
      </div>
      <form className="profile-form" onSubmit={save}>
        <label>
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Username
          <input value={username} disabled />
        </label>
        <label>
          Email
          <input value={user.email || ""} disabled />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="primary-btn" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="logout-link" onClick={onLogout}>
          Sign out
        </button>
      </form>
    </>
  );
}
function PlaylistPage({ id, go, user }) {
  const [playlist, setPlaylist] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .playlist(id)
      .then(setPlaylist)
      .catch((e) => setError(e.message));
  }, [id]);
  if (error) return <Empty title="Playlist unavailable" text={error} />;
  if (!playlist) return <Skeletons />;
  return (
    <>
      <PageHeading
        eyebrow="PLAYLIST"
        title={playlist.name}
        sub={`${playlist.videos?.length || 0} videos · ${playlist.description || ""}`}
        actions={
          user?._id === playlist.owner?._id && (
            <button
              className="outline-btn"
              onClick={async () => {
                await api.deletePlaylist(id);
                go("/playlists");
              }}
            >
              Delete playlist
            </button>
          )
        }
      />
      <VideoGrid videos={playlist.videos} go={go} />
    </>
  );
}
function App() {
  const [url, go] = useRouter(),
    [user, setUser] = useState(null),
    [auth, setAuth] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [query, setQuery] = useState("");
  useEffect(() => {
    api
      .currentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(url.split("?")[1] || "").get("q");
    if (q != null) setQuery(q);
  }, [url]);
  const path = url.split("?")[0],
    params = new URLSearchParams(url.split("?")[1] || "");
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      go("/");
    }
  };
  let page;
  if (path.startsWith("/watch/"))
    page = (
      <WatchPage
        id={path.split("/")[2]}
        go={go}
        user={user}
        onAuth={() => setAuth(true)}
      />
    );
  else if (path.startsWith("/channel/"))
    page = (
      <ChannelPage
        username={decodeURIComponent(path.split("/")[2])}
        go={go}
        user={user}
        onAuth={() => setAuth(true)}
      />
    );
  else if (path.startsWith("/playlist/"))
    page = <PlaylistPage id={path.split("/")[2]} go={go} user={user} />;
  else if (
    path === "/history" ||
    path === "/liked" ||
    path === "/subscriptions" ||
    path === "/playlists"
  )
    page = (
      <LibraryPage
        type={
          {
            "/history": "History",
            "/liked": "Liked videos",
            "/subscriptions": "Subscriptions",
            "/playlists": "Playlists",
          }[path]
        }
        user={user}
        go={go}
        onAuth={() => setAuth(true)}
      />
    );
  else if (path === "/studio" || path === "/studio/videos")
    page = <Studio user={user} go={go} onAuth={() => setAuth(true)} />;
  else if (path === "/studio/upload")
    page = <UploadPage user={user} go={go} onAuth={() => setAuth(true)} />;
  else if (path === "/profile")
    page = (
      <ProfilePage
        user={user}
        go={go}
        onAuth={() => setAuth(true)}
        onLogout={logout}
        setUser={setUser}
      />
    );
  else
    page = (
      <Home
        go={go}
        user={user}
        onAuth={() => setAuth(true)}
        query={path === "/search" ? params.get("q") || "" : ""}
      />
    );
  return (
    <div className="app-shell">
      <Topbar
        go={go}
        user={user}
        onMenu={() => setCollapsed(!collapsed)}
        onAuth={() => setAuth(true)}
        query={query}
        setQuery={setQuery}
      />
      <Sidebar
        active={path}
        collapsed={collapsed}
        go={go}
        user={user}
        onAuth={() => setAuth(true)}
      />
      <main
        className={`content ${collapsed ? "wide" : ""} ${path.startsWith("/watch/") ? "watch-content" : ""}`}
      >
        {page}
      </main>
      {auth && (
        <AuthDialog
          close={() => setAuth(false)}
          onLogin={async (username, password) => {
            await api.login(username, password);
            setUser(await api.currentUser());
          }}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
