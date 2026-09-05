import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const root = document.querySelector('#forum-topic');

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
const formatDate = (value) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function sanitizePostHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A']);
  template.content.querySelectorAll('*').forEach((node) => {
    if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      if (node.tagName !== 'A' || attribute.name !== 'href') node.removeAttribute(attribute.name);
    });
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      try {
        const url = new URL(href, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) node.replaceWith(...node.childNodes);
        else { node.setAttribute('href', url.href); node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer nofollow'); }
      } catch { node.replaceWith(...node.childNodes); }
    }
  });
  return template.innerHTML;
}

function renderPostBody(body = '') {
  const looksLikeHtml = /<\/?(p|br|strong|b|em|i|u|h3|blockquote|ul|ol|li|a)(\s|>)/i.test(body);
  return looksLikeHtml ? sanitizePostHtml(body) : escapeHtml(body).replace(/\n/g, '<br>');
}

async function loadTopic() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) throw new Error('This discussion link is missing its topic ID.');
  const { data: topic, error: topicError } = await supabase.from('forum_topics').select('id,title,status,is_pinned,view_count,created_at,updated_at,forum_categories(name),forum_posts(id,user_id,body,status,created_at,updated_at,parent_post_id)').eq('id', id).in('status', ['open', 'locked']).single();
  if (topicError) throw topicError;
  document.title = `${topic.title} | APEP Community`;
  const posts = (topic.forum_posts || []).filter((post) => post.status === 'visible').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  root.innerHTML = `<p class="eyebrow">${escapeHtml(topic.forum_categories?.name || 'COMMUNITY')}</p><h1>${topic.is_pinned ? '📌 ' : ''}${escapeHtml(topic.title)}</h1><div class="forum-topic-meta"><span>${escapeHtml(topic.status)}</span><span>${topic.view_count || 0} views</span><time datetime="${topic.created_at}">${formatDate(topic.created_at)}</time></div><div class="forum-posts">${posts.length ? posts.map((post, index) => `<article class="forum-post"><div class="forum-post-number">#${index + 1}</div><div><p class="forum-post-meta">Community member · ${formatDate(post.created_at)}</p><div class="forum-post-body">${renderPostBody(post.body)}</div></div></article>`).join('') : '<div class="forum-empty">No visible posts are available for this discussion.</div>'}</div>`;
}

loadTopic().catch((error) => { console.error(error); root.innerHTML = '<div class="forum-empty">This discussion could not be loaded. Please return to the forum and try again.</div>'; });
