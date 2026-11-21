import crypto from "node:crypto";
import { sessionCookie, deny } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return deny(res, 405, "Тільки POST");
  const pass = process.env.ADMIN_PASSWORD || "";
  const given = String((req.body || {}).password || "");
  const ok = pass && given.length === pass.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(pass));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800));
    return deny(res, 401, pass ? "Невірний пароль" : "На Vercel не задано ADMIN_PASSWORD");
  }
  res.setHeader("Set-Cookie", sessionCookie());
  res.status(200).json({ ok: true });
}
