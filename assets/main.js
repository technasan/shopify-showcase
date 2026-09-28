// Список проектов берётся из projects/index.json (порядок = порядок на сайте),
// данные каждого проекта — из projects/<папка>/project.json.
const PROJECTS_DIR = 'projects';
// скриншот считается «длинным», если высота больше ширины в это число раз
const TALL_RATIO = 1.3;

const grid = document.getElementById('projects');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const projects = {};

document.getElementById('year').textContent = new Date().getFullYear();

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const tagsHtml = (tags = []) =>
  tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

const domain = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

async function loadProjects() {
  try {
    const folders = await fetch(`${PROJECTS_DIR}/index.json`, { cache: 'no-cache' }).then((r) => r.json());
    const list = await Promise.all(
      folders.map(async (folder) => {
        const data = await fetch(`${PROJECTS_DIR}/${folder}/project.json`, { cache: 'no-cache' }).then((r) => r.json());
        const base = `${PROJECTS_DIR}/${folder}/`;
        data.screenshots = (data.screenshots || []).map((s) => ({ ...s, src: base + s.file }));
        return { folder, ...data };
      })
    );
    grid.innerHTML = list.map(cardHtml).join('');
    list.forEach((p) => (projects[p.folder] = p));
  } catch (e) {
    console.error(e);
    grid.innerHTML = location.protocol === 'file:'
      ? '<p class="muted">Файл открыт напрямую с диска — браузер не даёт загрузить проекты. Запустите локальный сервер: <code>serve.ps1</code> (см. README).</p>'
      : '<p class="muted">Не удалось загрузить проекты.</p>';
  }
}

function metaLine(p) {
  return [p.platform, p.year].filter(Boolean).map(esc).join(' · ');
}

function cardHtml(p) {
  const cover = p.screenshots[0];
  const meta = metaLine(p);
  return `
    <button class="card" data-project="${esc(p.folder)}">
      <div class="card__img">${cover ? `<img src="${esc(cover.src)}" alt="${esc(p.brand)}" loading="lazy">` : ''}</div>
      ${meta ? `<div class="card__meta">${meta}</div>` : ''}
      <div class="card__title">${esc(p.brand)}</div>
      <div class="card__summary">${esc(p.summary)}</div>
      ${tagsHtml(p.stack)}
    </button>`;
}

function projectHtml(p) {
  const meta = metaLine(p);
  const tasks = p.tasks?.length
    ? `<h3>Что сделано</h3><ul class="tasks">${p.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '';
  const link = p.url
    ? `<a class="project__link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(domain(p.url) || 'Открыть сайт')} ↗</a>`
    : '';
  const tabs = p.screenshots.length > 1
    ? `<div class="tabs" role="tablist">${p.screenshots.map((s, i) =>
        `<button class="tab" role="tab" data-shot="${i}" aria-selected="${i === 0}">${esc(s.title || `Скриншот ${i + 1}`)}</button>`
      ).join('')}</div>`
    : '';

  return `
    <article class="project">
      <header class="project__head">
        ${meta ? `<p class="project__meta">${meta}</p>` : ''}
        <h2>${esc(p.brand)}</h2>
        ${p.brandDescription ? `<p class="project__brand">${esc(p.brandDescription)}</p>` : ''}
      </header>
      ${p.role ? `<p class="project__role"><span>Моя роль</span>${esc(p.role)}</p>` : ''}
      ${p.summary ? `<p class="project__summary">${esc(p.summary)}</p>` : ''}
      ${tasks}
      ${tagsHtml(p.stack)}
      ${link}
      ${p.screenshots.length ? `
      <div class="viewer">
        ${tabs}
        <div class="browser">
          <div class="browser__bar">
            <span class="browser__dots"><i></i><i></i><i></i></span>
            <span class="browser__url">${esc(domain(p.url))}</span>
            <a class="browser__full" target="_blank" rel="noopener">Полный размер ↗</a>
          </div>
          <div class="browser__screen"><img alt=""></div>
        </div>
        <p class="viewer__hint">Прокрутите скриншот, чтобы увидеть всю страницу</p>
      </div>` : ''}
    </article>`;
}

function showShot(p, i) {
  const shot = p.screenshots[i];
  const screen = modalBody.querySelector('.browser__screen');
  const img = screen.querySelector('img');
  const viewer = modalBody.querySelector('.viewer');
  modalBody.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', t.dataset.shot == i));
  modalBody.querySelector('.browser__full').href = shot.src;
  viewer.classList.remove('is-tall');
  img.onload = () => viewer.classList.toggle('is-tall', img.naturalHeight / img.naturalWidth > TALL_RATIO);
  img.src = shot.src;
  img.alt = `${p.brand} — ${shot.title || ''}`;
  screen.scrollTop = 0;
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('[data-project]');
  if (!card) return;
  const p = projects[card.dataset.project];
  modalBody.innerHTML = projectHtml(p);
  modalBody.dataset.project = p.folder;
  if (p.screenshots.length) showShot(p, 0);
  modal.showModal();
  modal.scrollTop = 0;
});

modalBody.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) showShot(projects[modalBody.dataset.project], +tab.dataset.shot);
});

// «листание» длинной обложки при наведении: сдвиг = высота картинки − высота окна
grid.addEventListener('mouseover', (e) => {
  const box = e.target.closest('.card__img');
  const img = box?.querySelector('img');
  if (!img) return;
  const shift = Math.max(0, img.offsetHeight - box.offsetHeight);
  img.style.setProperty('--shift', `-${shift}px`);
  img.style.setProperty('--dur', `${Math.min(8, Math.max(1, shift / 400))}s`);
});

modal.querySelector('.modal__close').addEventListener('click', () => modal.close());
// закрытие по клику на затемнённый фон
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// кнопка «наверх» появляется после первого экрана
const toTop = document.getElementById('to-top');
const updateToTop = () => toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
window.addEventListener('scroll', updateToTop, { passive: true });
updateToTop();
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', location.pathname);
});

loadProjects();
