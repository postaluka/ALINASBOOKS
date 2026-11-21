// Спільні функції для адмінки. Файли з "_" Vercel не робить окремими адресами.
import crypto from "node:crypto";

const env = (k, d) => process.env[k] || d;
const REPO = () => env("GITHUB_REPO", "postaluka/ALINASBOOKS");
const BRANCH = () => env("GITHUB_BRANCH", "main");
const SECRET = () => env("SESSION_SECRET", env("ADMIN_PASSWORD", ""));

export const COOKIE = "ab_s";
const DAYS = 30;

export function sign(exp) {
  return exp + "." + crypto.createHmac("sha256", SECRET()).update(String(exp)).digest("hex");
}

export function sessionCookie() {
  const exp = Date.now() + DAYS * 864e5;
  return `${COOKIE}=${encodeURIComponent(sign(exp))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`;
}

export function authed(req) {
  if (!SECRET()) return false;
  const raw = (req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!raw) return false;
  const v = decodeURIComponent(raw.slice(COOKIE.length + 1));
  const exp = v.split(".")[0];
  if (!exp || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return v.length === good.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(good));
}

async function gh(path, opt = {}) {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("На Vercel не задано GITHUB_TOKEN");
  const r = await fetch(`https://api.github.com/repos/${REPO()}${path}`, {
    ...opt,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: opt.accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opt.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return opt.accept ? r.text() : r.json();
}

export async function readBooks() {
  const txt = await gh(`/contents/data/books.json?ref=${BRANCH()}`, { accept: "application/vnd.github.raw+json" });
  return JSON.parse(txt);
}

// Один коміт з кількома файлами. content: base64 або null (видалити файл).
export async function commit(changes, message) {
  const ref = await gh(`/git/ref/heads/${BRANCH()}`);
  const base = await gh(`/git/commits/${ref.object.sha}`);
  const tree = [];
  for (const c of changes) {
    if (c.content == null) {
      tree.push({ path: c.path, mode: "100644", type: "blob", sha: null });
    } else {
      const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: c.content, encoding: "base64" }) });
      tree.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha });
    }
  }
  const t = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
  const cm = await gh("/git/commits", { method: "POST", body: JSON.stringify({ message, tree: t.sha, parents: [ref.object.sha] }) });
  await gh(`/git/refs/heads/${BRANCH()}`, { method: "PATCH", body: JSON.stringify({ sha: cm.sha }) });
  return cm.sha;
}

export const booksFile = (books) => ({
  path: "data/books.json",
  content: Buffer.from(JSON.stringify(books, null, 1) + "\n").toString("base64"),
});

const TR = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia",ё:"e",ы:"y",э:"e",ъ:"" };
export function slug(s) {
  return String(s).toLowerCase().split("").map((c) => (c in TR ? TR[c] : c)).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "book";
}

const str = (v, n = 300) => String(v ?? "").trim().slice(0, n);
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) && x > 0 ? x : null; };

export function cleanBook(b) {
  const year = parseInt(b.year, 10);
  const pages = parseInt(b.pages, 10);
  const h = num(b.heightCm);
  return {
    title: str(b.title),
    author: str(b.author),
    genre: str(b.genre, 60).toLowerCase(),
    year: Number.isFinite(year) ? year : null,
    pages: pages > 0 ? pages : null,
    heightCm: h ? Math.round(h * 10) / 10 : null,
    lang: str(b.lang, 20),
    shelf: str(b.shelf, 120),
    tags: [...new Set((Array.isArray(b.tags) ? b.tags : []).map((t) => str(t, 40).toLowerCase()).filter(Boolean))].slice(0, 12),
    description: str(b.description, 2000),
    color: /^#[0-9a-f]{6}$/i.test(b.color || "") ? b.color : null,
    addedAt: str(b.addedAt, 40) || new Date().toISOString(),
  };
}

export function deny(res, code, error) {
  res.status(code).json({ error });
}
