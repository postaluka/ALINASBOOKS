import { authed, readBooks, commit, booksFile, deny } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return deny(res, 405, "Тільки POST");
  if (!authed(req)) return deny(res, 401, "Потрібно увійти");
  try {
    const id = String((req.body || {}).id || "");
    const books = await readBooks();
    const b = books.find((x) => x.id === id);
    if (!b) return deny(res, 404, "Книжку не знайдено");
    const changes = [booksFile(books.filter((x) => x.id !== id))];
    for (const f of [b.cover, b.thumb]) if (f && f.startsWith("covers/")) changes.push({ path: f, content: null });
    await commit(changes, `Видалено: ${b.title}`);
    res.status(200).json({ ok: true });
  } catch (e) {
    deny(res, 500, e.message);
  }
}
