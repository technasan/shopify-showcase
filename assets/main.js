// Список проектов берётся из projects/index.json (порядок = порядок на сайте),
// данные каждого проекта — из projects/<папка>/project.json.
const PROJECTS_DIR = 'projects';

const grid = document.getElementById('projects');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const projects = {};

document.getElementById('year').textContent = new Date().getFullYear();

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const tagsHtml = (tags = []) =>
  tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

async function loadProjects() {
  try {
    const folders = await fetch(`${PROJECTS_DIR}/index.json`).then((r) => r.json());
    const list = await Promise.all(
      folders.map(async (folder) => {
        const data = await fetch(`${PROJECTS_DIR}/${folder}/project.json`).then((r) => r.json());
        const base = `${PROJECTS_DIR}/${folder}/`;
        data.cover = base + (data.cover || data.images?.[0]?.src);
        data.images = (data.images || []).map((img) => ({ ...img, src: base + img.src }));
        return { folder, ...data };
      })
    );
    grid.innerHTML = list.map(cardHtml).join('');
    list.forEach((p) => (projects[p.folder] = p));
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p class="muted">Не удалось загрузить проекты.</p>';
  }
}

function cardHtml(p) {
  return `
    <button class="card" data-project="${esc(p.folder)}">
      <div class="card__img"><img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy"></div>
      <div class="card__title">${esc(p.title)}</div>
      <div class="card__summary">${esc(p.summary)}</div>
      ${tagsHtml(p.tags)}
    </button>`;
}

function projectHtml(p) {
  const meta = [p.client, p.year].filter(Boolean).map(esc).join(' · ');
  const desc = (Array.isArray(p.description) ? p.description : [p.description || ''])
    .map((d) => `<p>${esc(d)}</p>`).join('');
  const tasks = p.tasks?.length
    ? `<h3>Что сделано</h3><ul class="tasks">${p.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '';
  const link = p.url
    ? `<a class="project__link" href="${esc(p.url)}" target="_blank" rel="noopener">Открыть сайт →</a>`
    : '';
  const gallery = p.images.map((img) => `
    <figure>
      <img src="${esc(img.src)}" alt="${esc(img.caption || p.title)}" loading="lazy">
      ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ''}
    </figure>`).join('');

  return `
    <article class="project">
      <h2>${esc(p.title)}</h2>
      ${meta ? `<p class="project__meta">${meta}</p>` : ''}
      ${tagsHtml(p.tags)}
      <div class="project__desc">${desc}</div>
      ${tasks}
      ${link}
      <div class="gallery">${gallery}</div>
    </article>`;
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('[data-project]');
  if (!card) return;
  modalBody.innerHTML = projectHtml(projects[card.dataset.project]);
  modal.showModal();
  modal.scrollTop = 0;
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
