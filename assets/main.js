// Контент сайта (тексты, услуги, контакты, список проектов) — content/site.json.
// Проекты — самостоятельные папки projects/<папка>/ (project.json + скриншоты),
// формат описан в projects/README.md.
//
// Любое текстовое поле в обоих файлах — либо строка (одинакова для всех языков),
// либо объект по языкам: { "ru": "...", "en": "..." }.
const SITE_URL = 'content/site.json';
// скриншот считается «длинным», если высота больше ширины в это число раз
const TALL_RATIO = 1.3;

const FLAGS = {
  ru: '<svg viewBox="0 0 9 6" preserveAspectRatio="none"><path fill="#fff" d="M0 0h9v2H0z"/><path fill="#0039A6" d="M0 2h9v2H0z"/><path fill="#D52B1E" d="M0 4h9v2H0z"/></svg>',
  gb: '<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="gb-t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><path fill="#012169" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="M0 0l60 30m0-30L0 30"/><path stroke="#C8102E" stroke-width="4" d="M0 0l60 30m0-30L0 30" clip-path="url(#gb-t)"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#C8102E" stroke-width="6" d="M30 0v30M0 15h60"/></svg>',
};

const grid = document.getElementById('projects');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');

let site = null;
let lang = 'ru';
let projects = [];          // проекты в порядке site.projects, без скрытых
const byId = {};

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const domain = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

// ---------- языки ----------

const langCodes = () => site.languages.map((l) => l.code);

// объект вида { ru, en } — локализованное значение; любой другой — как есть
const isLocalized = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length > 0 && Object.keys(v).every((k) => langCodes().includes(k));

function t(v) {
  if (!isLocalized(v)) return v;
  return v[lang] ?? v[site.defaultLanguage] ?? Object.values(v)[0];
}

// значение из site.json по пути вида "nav.work"
const s = (path) => t(path.split('.').reduce((o, k) => o?.[k], site)) ?? '';

function pickLang() {
  const codes = langCodes();
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (codes.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem('lang');
    if (codes.includes(saved)) return saved;
  } catch {}
  // язык браузера учитывается, только если это включено в site.json
  const browser = (navigator.language || '').slice(0, 2);
  return site.detectBrowserLanguage && codes.includes(browser) ? browser : site.defaultLanguage;
}

function setLang(code) {
  lang = code;
  try { localStorage.setItem('lang', code); } catch {}
  const url = new URL(location.href);
  url.searchParams.set('lang', code);
  history.replaceState(null, '', url);
  render();
}

// ---------- загрузка ----------

async function load() {
  try {
    site = await fetch(SITE_URL, { cache: 'no-cache' }).then((r) => r.json());
    lang = pickLang();
    render();

    const dir = site.projectsDir || 'projects';
    const all = await Promise.all(site.projects.map(async (id) => {
      const data = await fetch(`${dir}/${id}/project.json`, { cache: 'no-cache' }).then((r) => r.json());
      const base = `${dir}/${id}/`;
      data.screenshots = (data.screenshots || []).map((shot) => ({ ...shot, src: base + shot.file }));
      return { id, ...data };
    }));
    // "hidden": true в project.json — проект не показывается на сайте
    projects = all.filter((p) => !p.hidden);
    projects.forEach((p) => (byId[p.id] = p));
    renderProjects();
  } catch (e) {
    console.error(e);
    const msg = location.protocol === 'file:'
      ? (site ? s('ui.fileError') : 'Open the site via a local server: serve.ps1 (see README).')
      : (site ? s('ui.loadError') : 'Error loading content.');
    grid.innerHTML = `<p class="muted">${esc(msg)}</p>`;
  }
}

// ---------- страница ----------

function render() {
  document.documentElement.lang = lang;
  document.title = s('meta.title');
  document.querySelector('meta[name="description"]').content = s('meta.description');

  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = s(el.dataset.i18n)));
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('to-top').setAttribute('aria-label', s('ui.toTop'));
  modal.querySelector('.modal__close').setAttribute('aria-label', s('ui.close'));

  const langBox = document.getElementById('lang');
  langBox.setAttribute('aria-label', s('ui.language'));
  langBox.innerHTML = site.languages.map((l) => `
    <button class="lang__btn" data-lang="${esc(l.code)}" aria-pressed="${l.code === lang}" title="${esc(l.label)}">
      <span class="lang__flag">${FLAGS[l.flag] || ''}</span><span class="lang__label">${esc(l.label)}</span>
    </button>`).join('');

  document.getElementById('services-list').innerHTML = (site.services || []).map((item) => `
    <div class="service">
      <h3>${esc(t(item.title))}</h3>
      <p>${esc(t(item.text))}</p>
    </div>`).join('');

  document.getElementById('contacts-list').innerHTML = (site.contacts?.items || []).map((c) => {
    const external = /^https?:/.test(c.href);
    return `<li><span>${esc(t(c.label))}</span><a href="${esc(c.href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(t(c.text))}</a></li>`;
  }).join('');

  renderProjects();
  // если открыт проект — перерисовать его на новом языке, сохранив скриншот
  if (modal.open && byId[modalBody.dataset.project]) {
    openProject(byId[modalBody.dataset.project], +modalBody.dataset.shot || 0, false);
  }
}

// ---------- проекты ----------

const tagsHtml = (tags = []) =>
  tags.length ? `<ul class="tags">${tags.map((tag) => `<li>${esc(t(tag))}</li>`).join('')}</ul>` : '';

function metaLine(p) {
  const platform = [].concat(p.platform || []).map(t);
  return [...platform, p.year].filter(Boolean).map(esc).join(' · ');
}

function renderProjects() {
  if (!projects.length) {
    if (!grid.innerHTML.trim()) grid.innerHTML = `<p class="muted">${esc(s('ui.loading'))}</p>`;
    return;
  }
  grid.innerHTML = projects.map((p) => {
    const cover = p.screenshots[0];
    const meta = metaLine(p);
    return `
      <button class="card" data-project="${esc(p.id)}">
        <div class="card__img">${cover ? `<img src="${esc(cover.src)}" alt="${esc(t(p.brand))}" loading="lazy">` : ''}</div>
        ${meta ? `<div class="card__meta">${meta}</div>` : ''}
        <div class="card__title">${esc(t(p.brand))}</div>
        <div class="card__summary">${esc(t(p.summary))}</div>
        ${tagsHtml(p.stack)}
      </button>`;
  }).join('');
}

function projectHtml(p) {
  const meta = metaLine(p);
  // tasks — список строк или групп { "title": "...", "items": [...] }
  const taskList = t(p.tasks) || [];
  const list = (items) => `<ul class="tasks">${items.map((item) => `<li>${esc(t(item))}</li>`).join('')}</ul>`;
  const tasks = taskList.length
    ? `<h3>${esc(s('ui.tasks'))}</h3>${taskList.map((g) => (g && g.items)
        ? `<h4 class="tasks__group">${esc(t(g.title))}</h4>${list(g.items)}`
        : list([g])).join('')}`
    : '';
  const link = p.url
    ? `<a class="project__link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(domain(p.url) || s('ui.openSite'))} ↗</a>`
    : '';
  const arrow = (dir, label, path) =>
    `<button class="shot-arrow" data-step="${dir}" aria-label="${esc(label)}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>
    </button>`;
  const tabs = p.screenshots.length > 1
    ? `<div class="shot-nav">
        ${arrow(-1, s('ui.prev'), 'M15 18l-6-6 6-6')}
        <div class="tabs" role="tablist">${p.screenshots.map((shot, i) =>
          `<button class="tab" role="tab" data-shot="${i}">${esc(t(shot.title) || `${s('ui.screenshot')} ${i + 1}`)}</button>`
        ).join('')}</div>
        ${arrow(1, s('ui.next'), 'M9 18l6-6-6-6')}
      </div>`
    : '';

  return `
    <article class="project">
      <header class="project__head">
        ${meta ? `<p class="project__meta">${meta}</p>` : ''}
        <h2>${esc(t(p.brand))}</h2>
        ${p.brandDescription ? `<p class="project__brand">${esc(t(p.brandDescription))}</p>` : ''}
      </header>
      ${p.role ? `<p class="project__role"><span>${esc(s('ui.role'))}</span>${esc(t(p.role))}</p>` : ''}
      ${p.summary ? `<p class="project__summary">${esc(t(p.summary))}</p>` : ''}
      ${tasks}
      ${tagsHtml(p.stack)}
      ${link}
      ${p.screenshots.length ? `
      <div class="viewer">
        ${tabs}
        <div class="browser">
          <div class="browser__bar">
            <span class="browser__dots"><i></i><i></i><i></i></span>
            <span class="browser__url"></span>
            <a class="browser__full" target="_blank" rel="noopener">${esc(s('ui.fullSize'))} ↗</a>
          </div>
          <div class="browser__screen"><img alt=""></div>
        </div>
        <p class="viewer__hint">${esc(s('ui.scrollHint'))}</p>
      </div>` : ''}
    </article>`;
}

function showShot(p, i) {
  const shot = p.screenshots[i];
  const screen = modalBody.querySelector('.browser__screen');
  const img = screen.querySelector('img');
  const viewer = modalBody.querySelector('.viewer');
  modalBody.dataset.shot = i;
  modalBody.querySelectorAll('.tab').forEach((tab) => tab.setAttribute('aria-selected', tab.dataset.shot == i));
  modalBody.querySelector('.browser__full').href = shot.src;
  // у скриншота может быть свой адрес (например, другой домен того же бренда)
  modalBody.querySelector('.browser__url').textContent = shot.url || domain(p.url);
  viewer.classList.remove('is-tall');
  img.onload = () => viewer.classList.toggle('is-tall', img.naturalHeight / img.naturalWidth > TALL_RATIO);
  img.src = shot.src;
  img.alt = `${t(p.brand)} — ${t(shot.title) || ''}`;
  screen.scrollTop = 0;
}

function openProject(p, shot = 0, scrollTop = true) {
  modalBody.innerHTML = projectHtml(p);
  modalBody.dataset.project = p.id;
  if (p.screenshots.length) showShot(p, shot);
  if (!modal.open) modal.showModal();
  if (scrollTop) modal.scrollTop = 0;
}

// ---------- события ----------

document.getElementById('lang').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lang]');
  if (btn && btn.dataset.lang !== lang) setLang(btn.dataset.lang);
});

grid.addEventListener('click', (e) => {
  const card = e.target.closest('[data-project]');
  if (card) openProject(byId[card.dataset.project]);
});

modalBody.addEventListener('click', (e) => {
  const p = byId[modalBody.dataset.project];
  const tab = e.target.closest('.tab');
  if (tab) return showShot(p, +tab.dataset.shot);
  // стрелки листают по кругу
  const arrow = e.target.closest('.shot-arrow');
  if (arrow) {
    const n = p.screenshots.length;
    showShot(p, (+modalBody.dataset.shot + +arrow.dataset.step + n) % n);
  }
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
  history.replaceState(null, '', location.pathname + location.search); // убрать #якорь, оставить ?lang
});

load();
