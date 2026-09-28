# Shopify Showcase

Одностраничное портфолио Shopify-разработчика. Чистый HTML/CSS/JS, без сборки — публикуется через GitHub Pages.

## Структура

```
index.html            — страница (имя, услуги, контакты правятся здесь)
assets/style.css      — стили
assets/main.js        — загрузка и показ проектов
projects/index.json   — список папок проектов (порядок = порядок на сайте)
projects/<папка>/
  project.json        — описание проекта
  *.png / *.jpg       — скриншоты
```

## Как добавить проект

1. Создать папку `projects/my-project/` и положить туда скриншоты.
2. Создать `projects/my-project/project.json`:

```json
{
  "title": "Название",
  "summary": "Одна строка для карточки",
  "client": "Заказчик",
  "year": 2025,
  "url": "https://ссылка-на-магазин",
  "tags": ["Liquid", "Shopify 2.0"],
  "description": ["Абзац 1", "Абзац 2"],
  "tasks": ["Что сделано 1", "Что сделано 2"],
  "cover": "home.png",
  "images": [
    { "src": "home.png", "caption": "Главная" },
    { "src": "product.png", "caption": "Карточка товара" }
  ]
}
```

Необязательные поля: `client`, `year`, `url`, `tags`, `tasks`, `caption`. Если нет `cover`, обложкой станет первая картинка.

3. Добавить `"my-project"` в `projects/index.json`.

Скриншоты лучше сохранять шириной ~1600px в JPG/WebP, чтобы страница грузилась быстро.

## Локальный просмотр

Из-за загрузки JSON страницу нельзя открыть двойным кликом — нужен локальный сервер:

```
python -m http.server 8000
```

и открыть http://localhost:8000

## Публикация

Settings → Pages → Source: *Deploy from a branch*, ветка `main`, папка `/ (root)`.
Сайт появится по адресу https://technasan.github.io/shopify-showcase/
