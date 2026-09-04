import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_QA_CONFIG } from '../config/forum-qa-config.js';

const supabase = createClient(FORUM_QA_CONFIG.url, FORUM_QA_CONFIG.publishableKey);
const categoriesEl = document.querySelector('#forum-categories');
const topicsEl = document.querySelector('#forum-topics');
const statusEl = document.querySelector('#forum-status');
const categoryCountEl = document.querySelector('#forum-category-count');
const modal = document.querySelector('#forum-topic-modal');
const categorySelect = document.querySelector('#forum-topic-category');
let categories = [];
let activeCategory = null;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
const setStatus = (message = '') => { statusEl.textContent = message; };
const formatDate = (value) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));

function setupMobileNavigation() {
  const nav = document.querySelector('.primary-nav');
  if (!nav || document.querySelector('.menu-toggle')) return;
  const button = document.createElement('button');
  button.className = 'menu-toggle'; button.type = 'button'; button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span aria-hidden="true">☰</span><span class="sr-only">Toggle navigation</span>';
  document.querySelector('.header-inner')?.appendChild(button);
  button.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); button.setAttribute('aria-expanded', String(open)); });
}

async function loadCategories() {
  const { data, error } = await supabase.from('forum_categories').select('id,name,slug,description,display_order').eq('is_active', true).order('display_order');
  if (error) throw error;
  categories = data || [];
  categoryCountEl.textContent = `${categories.length}`;
  categoriesEl.innerHTML = categories.length ? categories.map((category) => `<button class="forum-category" type="button" data-category-id="${category.id}"><strong>${escapeHtml(category.name)}</strong><br><small>${escapeHtml(category.description || '')}</small></button>`).join('') : '<div class="forum-empty">No forum categories are available yet.</div>';
  categorySelect.innerHTML = categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join('');
  categoriesEl.querySelectorAll('[data-category-id]').forEach((button) => button.addEventListener('click', () => { activeCategory = button.dataset.categoryId; categoriesEl.querySelectorAll('.forum-category').forEach((item) => item.classList.toggle('is-active', item === button)); loadTopics(); }));
}

async function loadTopics() {
  topicsEl.innerHTML = '<div class="forum-skeleton large"></div><div class="forum-skeleton large"></div>';
  let query = supabase.from('forum_topics').select('id,title,slug,status,is_pinned,view_count,created_at,forum_categories(name)').in('status', ['open','locked']).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30);
  if (activeCategory) query = query.eq('category_id', activeCategory);
  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) { topicsEl.innerHTML = '<div class="forum-empty"><strong>No discussions yet.</strong><br>Be the first to start a useful community conversation.</div>'; return; }
  topicsEl.innerHTML = data.map((topic) => `<article class="forum-topic"><h4><a href="forum-topic.html?id=${encodeURIComponent(topic.id)}">${topic.is_pinned ? '📌 ' : ''}${escapeHtml(topic.title)}</a></h4><div class="forum-topic-meta"><span class="forum-topic-category">${escapeHtml(topic.forum_categories?.name || 'Community')}</span><span>${escapeHtml(topic.status)}</span><span>${topic.view_count || 0} views</span><time datetime="${topic.created_at}">${formatDate(topic.created_at)}</time></div></article>`).join('');
}

function openModal() { modal.hidden = false; document.body.style.overflow = 'hidden'; categorySelect.focus(); }
function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }

document.querySelector('#forum-new-topic')?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = '../auth/login.html?next=' + encodeURIComponent('../pages/forum.html'); return; }
  openModal();
});
document.querySelectorAll('[data-close-forum-modal]').forEach((element) => element.addEventListener('click', closeModal));
document.querySelector('#forum-refresh')?.addEventListener('click', () => loadTopics().catch((error) => setStatus(error.message)));
document.querySelector('#forum-topic-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setStatus('Please sign in before publishing a topic.'); return; }
  const title = document.querySelector('#forum-topic-title').value.trim();
  const body = document.querySelector('#forum-topic-body').value.trim();
  const categoryId = categorySelect.value;
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: topic, error: topicError } = await supabase.from('forum_topics').insert({ category_id: categoryId, user_id: user.id, title, slug }).select('id').single();
  if (topicError) { setStatus(topicError.message); return; }
  const { error: postError } = await supabase.from('forum_posts').insert({ topic_id: topic.id, user_id: user.id, body });
  if (postError) { setStatus(postError.message); return; }
  closeModal(); event.target.reset(); setStatus('Topic published successfully.'); activeCategory = categoryId; await loadTopics();
});

(async () => {
  try { setupMobileNavigation(); await loadCategories(); await loadTopics(); }
  catch (error) { console.error(error); setStatus('The QA forum could not load. Please inspect the browser console and Supabase request.'); topicsEl.innerHTML = '<div class="forum-empty">Forum data could not be loaded.</div>'; }
})();
