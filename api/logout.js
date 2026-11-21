import { COOKIE } from "./_lib.js";

export default function handler(req, res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.status(200).json({ ok: true });
}
