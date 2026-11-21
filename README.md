# Alina's books

Домашня бібліотека: книжки стоять корінцями на полиці, при наведенні видно обкладинку, клік відкриває сторінку книжки.

Сайт без збірки: `index.html` + `data/books.json` + `covers/`.
Адмінка: кнопка «Увійти» → пароль → можна додавати, редагувати й видаляти книжки та міняти обкладинки.
Кожна зміна — це коміт у цей репозиторій (через `api/`), Vercel оновлює сайт приблизно за хвилину.

## Як додати книжку вручну (без адмінки)

1. Додайте запис у `data/books.json`:

```json
{
  "id": "nazva-latynytseyu",
  "title": "Назва",
  "author": "Ім'я Прізвище",
  "genre": "артбук",
  "year": 2024,
  "pages": 240,
  "heightCm": 29,
  "lang": "укр",
  "shelf": "Вітальня, шафа 1",
  "tags": ["тег", "ще тег"],
  "description": "2–3 речення про книжку.",
  "cover": "covers/nazva-latynytseyu.jpg",
  "color": "#7a1f2b"
}
```

2. Покладіть обкладинку в `covers/` (JPG, ~460 px заввишки). Якщо обкладинки немає, ставте `"cover": null`.
3. `color` — колір корінця. Якщо `null`, підбереться автоматично.

## Пропорції корінців

1 см = 12 px для висоти й товщини.
Товщина (мм) = сторінки × 0,06 + 3. Висота = `heightCm`.
Без даних: 300 сторінок; 29 см для артбуків, 21 см для решти.

## Налаштування адмінки (один раз)

1. **GitHub-токен.** github.com → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Repository access: **Only select repositories** → `ALINASBOOKS`.
   - Permissions → Repository permissions → **Contents: Read and write**.
   - Скопіюйте токен (`github_pat_…`).
2. **Vercel → Project → Settings → Environment Variables**, додайте:
   - `GITHUB_TOKEN` — токен з кроку 1;
   - `ADMIN_PASSWORD` — пароль для входу на сайті;
   - `SESSION_SECRET` — будь-який довгий випадковий рядок;
   - (необов'язково) `GITHUB_REPO` = `postaluka/ALINASBOOKS`, `GITHUB_BRANCH` = `main`.
3. **Redeploy** (Deployments → ⋯ → Redeploy), щоб змінні підхопились.

Обкладинки з адмінки стискаються в браузері у WebP: 1200 px (сторінка книжки) і 400 px (полиця).

## Деплой

Vercel: New Project → імпорт цього репозиторію → Framework Preset: **Other**, без build-команди, Output Directory — корінь. Готово.
