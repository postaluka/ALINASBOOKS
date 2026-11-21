// Свіжий список прямо з GitHub (щоб після збереження не чекати редеплою).
import { authed, readBooks, deny } from "./_lib.js";

export default async function handler(req, res) {
  if (!authed(req)) return deny(res, 401, "Потрібно увійти");
  try {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ books: await readBooks() });
  } catch (e) {
    deny(res, 500, e.message);
  }
}
