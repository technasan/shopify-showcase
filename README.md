# Shopify Showcase

Одностраничное портфолио Shopify-разработчика на двух языках (RU / EN). Чистый HTML/CSS/JS,
без сборки — публикуется через GitHub Pages.

## Структура

Сайт и проекты разделены: проекты — самостоятельная библиотека, которую можно перенести
на другой сайт как есть.

```
index.html            — каркас страницы (тексты подставляются из content/site.json)
assets/style.css      — стили
assets/main.js        — вывод контента, проектов и переключение языка
content/site.json     — контент сайта: имя, первый экран, услуги, контакты,
                        подписи интерфейса, языки и список проектов
projects/             — библиотека проектов, формат — в projects/README.md
  <папка>/project.json
  <папка>/*.jpg       — скриншоты
```

## Языки

Любое текстовое поле в `site.json` и `project.json` — либо строка (одинакова для всех
языков), либо объект по языкам:

```json
"title": { "ru": "Работы", "en": "Work" }
```

Список языков — `languages` в `content/site.json`. Язык выбирается так: `?lang=en` в адресе → последний выбранный посетителем →
`defaultLanguage` (сейчас `ru`). Если в `site.json` включить `"detectBrowserLanguage": true`,
перед языком по умолчанию будет учитываться язык браузера.
Ссылка для иностранного заказчика: https://technasan.github.io/shopify-showcase/?lang=en

## Как добавить проект

1. Создать папку `projects/my-project/`, положить туда скриншоты и `project.json`
   (формат и пример — в [projects/README.md](projects/README.md)).
2. Добавить `"my-project"` в список `projects` в `content/site.json` — на нужное место,
   порядок в списке = порядок на сайте.

Скрыть проект, не удаляя его: `"hidden": true` в его `project.json`.

Скриншоты лучше сохранять шириной ~1440px в JPG/WebP (качество ~80%): скрин всей страницы
в PNG весит 5–10 МБ, в JPG — около 0,5–1 МБ.

## Локальный просмотр

Если открыть `index.html` двойным кликом, ничего не загрузится: браузер не даёт читать JSON
с диска. Нужен локальный сервер. В папке проекта выполнить в терминале:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

и открыть http://localhost:8000 (остановить — Ctrl+C).

Другой вариант — расширение **Live Server** в VS Code: правый клик по `index.html` → *Open with Live Server*.

## Публикация

Сайт публикуется автоматически после каждого `git push` в `main` (1–2 минуты).
Адрес: https://technasan.github.io/shopify-showcase/
