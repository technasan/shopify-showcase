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
  "brand": "Название бренда",
  "brandDescription": "Кто они и чем занимаются",
  "year": 2025,
  "url": "https://ссылка-на-сайт",
  "platform": "Shopify",
  "summary": "Коротко о проекте",
  "stack": ["Liquid", "Shopify 2.0"],
  "tasks": ["Что сделано 1", "Что сделано 2"],
  "screenshots": [
    { "file": "home.jpg", "title": "Главная" },
    { "file": "product.jpg", "title": "Карточка товара" }
  ]
}
```

Необязательные поля: `year`, `url`, `tasks`, `brandDescription`. Первый скриншот — обложка карточки.
Длинные скриншоты (вся страница) определяются автоматически и прокручиваются внутри «окна браузера».

3. Добавить `"my-project"` в `projects/index.json`.

Скриншоты лучше сохранять шириной ~1440px в JPG/WebP (качество ~80%): скрин всей страницы в PNG весит 5–10 МБ, в JPG — около 0,5–1 МБ.

## Локальный просмотр

Из-за загрузки JSON страницу нельзя открыть двойным кликом — нужен локальный сервер:

```
python -m http.server 8000
```

и открыть http://localhost:8000

## Публикация

Settings → Pages → Source: *Deploy from a branch*, ветка `main`, папка `/ (root)`.
Сайт появится по адресу https://technasan.github.io/shopify-showcase/
