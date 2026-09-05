import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const categoriesEl = document.querySelector('#forum-categories');
const topicsEl = document.querySelector('#forum-topics');
const statusEl = document.querySelector('#forum-status');
const categoryCountEl = document.querySelector('#forum-category-count');
const modal = document.querySelector('#forum-topic-modal');
const categorySelect = document.querySelector('#forum-topic-category');
let categories = [];
let activeCategory = null;

const CATEGORY_VISUALS = Object.freeze({
  'apep-academy': ['🎓', 'Learning & certification'],
  'ai-chatgpt': ['🤖', 'AI knowledge & ChatGPT'],
  'ai-automation': ['⚙️', 'Workflows & automation'],
  'ai-agents-intelligent-automation': ['🧠', 'Agents & intelligent systems'],
  'digital-business-income': ['💰', 'Business & income'],
  'prompt-engineering': ['✍️', 'Prompts & AI control'],
  'digital-marketing': ['📣', 'Marketing & campaigns'],
  'ai-powered-digital-marketing-growth': ['🚀', 'AI-powered growth'],
  'data-analytics-generative-ai': ['📊', 'Data & AI analytics'],
  'entrepreneurship-business': ['🏢', 'Entrepreneurship & leadership'],
  'tools-resources-support': ['🛠️', 'Tools & community support'],
  'community-wins-introductions': ['🌟', 'Introductions & wins'],
  'ai-business-strategy-transformation': ['🧭', 'Strategy & transformation'],
  'ai-powered-content-copy-systems': ['📝', 'Content & copy systems'],
  'ai-sales-lead-generation-conversion': ['🎯', 'Sales & conversion'],
  'ai-productivity-personal-operating-systems': ['⚡', 'Productivity & workflows'],
  'ai-development-app-building': ['💻', 'Development & apps'],
  'ai-research-evaluation-prompt-testing': ['🔬', 'Research & testing'],
  'ai-monetization-freelancing-client-services': ['💵', 'Monetization & services'],
  'ai-governance-security-responsible-ai': ['🔐', 'Governance & responsible AI']
});

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
const getVisual = (category) => CATEGORY_VISUALS[category.slug] || ['💬', 'Community discussion'];
const setStatus = (message = '') => { statusEl.textContent = message; };
const formatDate = (value) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));

async function loadCategories() {
  const { data, error } = await supabase.from('forum_categories').select('id,name,slug,description,display_order').eq('is_active', true).order('display_order');
  if (error) throw error;
  categories = data || [];
  categoryCountEl.textContent = `${categories.length}`;
  categoriesEl.innerHTML = categories.length ? categories.map((category) => {
    const [icon, visualLabel] = getVisual(category);
    return `<button class="forum-category" type="button" data-category-id="${category.id}"><span class="forum-category-icon" aria-hidden="true">${icon}</span><span class="forum-category-copy"><strong>${escapeHtml(category.name)}</strong><small>${escapeHtml(category.description || visualLabel)}</small></span></button>`;
  }).join('') : '<div class="forum-empty">No forum categories are available yet.</div>';
  categorySelect.innerHTML = categories.map((category) => {
    const [icon] = getVisual(category);
    return `<option value="${category.id}">${icon} ${escapeHtml(category.name)}</option>`;
  }).join('');
  categoriesEl.querySelectorAll('[data-category-id]').forEach((button) => button.addEventListener('click', () => { activeCategory = button.dataset.categoryId; categoriesEl.querySelectorAll('.forum-category').forEach((item) => item.classList.toggle('is-active', item === button)); loadTopics(); }));
}

async function loadTopics() {
  topicsEl.innerHTML = '<div class="forum-skeleton large"></div><div class="forum-skeleton large"></div>';
  let query = supabase.from('forum_topics').select('id,title,slug,status,is_pinned,view_count,created_at,forum_categories(name,slug)').in('status', ['open','locked']).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30);
  if (activeCategory) query = query.eq('category_id', activeCategory);
  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) { topicsEl.innerHTML = '<div class="forum-empty"><strong>No discussions yet.</strong><br>Be the first to start a useful community conversation.</div>'; return; }
  topicsEl.innerHTML = data.map((topic) => {
    const category = categories.find((item) => item.slug === topic.forum_categories?.slug) || { slug: topic.forum_categories?.slug || '' };
    const [icon] = getVisual(category);
    return `<article class="forum-topic"><h4><a href="forum-topic.html?id=${encodeURIComponent(topic.id)}">${topic.is_pinned ? '📌 ' : ''}${escapeHtml(topic.title)}</a></h4><div class="forum-topic-meta"><span class="forum-topic-category">${icon} ${escapeHtml(topic.forum_categories?.name || 'Community')}</span><span>${escapeHtml(topic.status)}</span><span>${topic.view_count || 0} views</span><time datetime="${topic.created_at}">${formatDate(topic.created_at)}</time></div></article>`;
  }).join('');
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
  try { await loadCategories(); await loadTopics(); }
  catch (error) { console.error(error); setStatus('The forum could not load. Please try again.'); topicsEl.innerHTML = '<div class="forum-empty">Forum data could not be loaded.</div>'; }
})();
