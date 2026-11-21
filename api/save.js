import { authed, readBooks, commit, booksFile, cleanBook, slug, deny } from "./_lib.js";

const img = (x) => x && typeof x.data === "string" && /^[A-Za-z0-9+/=]+$/.test(x.data) && ["webp", "jpg"].includes(x.ext) ? x : null;

export default async function handler(req, res) {
  if (req.method !== "POST") return deny(res, 405, "Тільки POST");
  if (!authed(req)) return deny(res, 401, "Потрібно увійти");
  try {
    const { book, cover: c1, thumb: c2 } = req.body || {};
    if (!book || !String(book.title || "").trim()) return deny(res, 400, "Немає назви");
    const cover = img(c1), thumb = img(c2);

    const books = await readBooks();
    const i = /^[a-z0-9-]{1,80}$/.test(book.id || "") ? books.findIndex((b) => b.id === book.id) : -1;
    const prev = i >= 0 ? books[i] : null;
    const id = prev ? prev.id : `${slug(book.title)}-${Math.random().toString(36).slice(2, 6)}`;
    const next = { id, ...cleanBook({ ...book, addedAt: prev?.addedAt || book.addedAt }), cover: prev?.cover || null, thumb: prev?.thumb || null };

    const changes = [];
    if (cover) {
      const v = Date.now().toString(36);
      next.cover = `covers/${id}-${v}.${cover.ext}`;
      changes.push({ path: next.cover, content: cover.data });
      next.thumb = thumb ? `covers/${id}-${v}-400.${thumb.ext}` : null;
      if (thumb) changes.push({ path: next.thumb, content: thumb.data });
      for (const old of [prev?.cover, prev?.thumb]) {
        if (old && old.startsWith("covers/") && old !== next.cover && old !== next.thumb) changes.push({ path: old, content: null });
      }
    }

    if (i >= 0) books[i] = next; else books.push(next);
    changes.push(booksFile(books));
    await commit(changes, `${prev ? "Оновлено" : "Додано"}: ${next.title}`);
    res.status(200).json({ ok: true, book: next });
  } catch (e) {
    deny(res, 500, e.message);
  }
}
