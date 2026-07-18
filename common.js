/* ここも宇宙だよクイズ — 共通処理(ログインレス版) */

/* ▼▼▼ ここを自分のSupabaseプロジェクトの値に書き換えてください ▼▼▼ */
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";
/* ▲▲▲ Settings → API で確認できます(anon public キーはRLS前提で公開可)▲▲▲ */

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---- ペンネーム(この端末のlocalStorageにだけ保存。サーバーには送らない) ---- */
const PEN_KEY = "uchu_quiz_penname";
const DEFAULT_PEN = "名無しの宇宙人";

function getPenName() {
  try { return (localStorage.getItem(PEN_KEY) || "").trim() || DEFAULT_PEN; }
  catch (_) { return DEFAULT_PEN; }
}
function savePenName(name) {
  const n = (name || "").trim().slice(0, 20) || DEFAULT_PEN;
  try { localStorage.setItem(PEN_KEY, n); } catch (_) {}
  return n;
}

/* ---- 自分の投稿ID(端末側でだけ記録) ---- */
const SUB_KEY = "uchu_quiz_my_submissions";
function getMySubmissionIds() {
  try { return JSON.parse(localStorage.getItem(SUB_KEY) || "[]"); }
  catch (_) { return []; }
}
function addMySubmissionId(id) {
  const ids = getMySubmissionIds();
  ids.unshift(id);
  try { localStorage.setItem(SUB_KEY, JSON.stringify(ids.slice(0, 50))); } catch (_) {}
}

/* ---- クイズ本体(最初の公開クイズ)を取得 ---- */
async function getQuiz() {
  const { data, error } = await sb.from("quizzes")
    .select("id, title, description").eq("is_published", true)
    .order("created_at").limit(1).single();
  if (error || !data) { alert("クイズの読み込みに失敗しました。"); throw error; }
  return data;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---- 夜空ヘッダーに星を散らす(装飾) ---- */
function scatterStars() {
  const sky = document.querySelector(".sky");
  if (!sky) return;
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("span");
    const r = Math.random();
    s.className = "star-dot" +
      (r < 0.14 ? " spark" : r < 0.32 ? " big" : r < 0.48 ? " lemon" : "");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 62 + "%";
    s.style.animationDelay = (Math.random() * 3.4).toFixed(2) + "s";
    s.setAttribute("aria-hidden", "true");
    sky.appendChild(s);
  }
}
document.addEventListener("DOMContentLoaded", scatterStars);

/* ---- SNS共有 ---- */
function shareToX(text, url) {
  window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) +
    "&url=" + encodeURIComponent(url), "_blank");
}
function shareToLine(text, url) {
  window.open("https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(url) +
    "&text=" + encodeURIComponent(text), "_blank");
}
async function shareNative(text, url) {
  if (navigator.share) {
    try { await navigator.share({ text, url }); } catch (_) { /* キャンセルは無視 */ }
  } else {
    try {
      await navigator.clipboard.writeText(text + " " + url);
      alert("共有テキストをコピーしました!");
    } catch (_) { alert(text + " " + url); }
  }
}
