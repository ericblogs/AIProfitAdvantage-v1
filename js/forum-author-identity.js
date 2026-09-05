import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const root = document.querySelector('#forum-topic');
const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
const initials = (name = '') => { const parts = String(name).trim().split(/\s+/).filter(Boolean); return escapeHtml((parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0]?.slice(0, 2) || 'CM')).toUpperCase()); };
const safeAvatarUrl = (value = '') => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  try { const url = new URL(String(value), window.location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
const renderAuthor = (profile) => {
  const name = String(profile?.full_name || '').trim() || 'Community member';
  const safeName = escapeHtml(name);
  const avatar = safeAvatarUrl(profile?.avatar_url);
  return `<div class="forum-author" aria-label="Posted by ${safeName}">${avatar ? `<img class="forum-author-avatar" src="${escapeHtml(avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ''}<span class="forum-author-avatar forum-author-avatar--initials"${avatar ? ' hidden' : ''} aria-hidden="true">${initials(name)}</span><span class="forum-author-name">${safeName}</span></div>`;
};

async function hydrateAuthors() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id || !root || root.dataset.authorsHydrated === 'true') return;
  const { data: topic, error } = await supabase.from('forum_topics').select('id,user_id,forum_posts(id,user_id,created_at,status)').eq('id', id).single();
  if (error) { console.warn('Forum author identity unavailable:', error); return; }
  const posts = (topic.forum_posts || []).filter((post) => post.status === 'visible').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const ids = [...new Set([topic.user_id, ...posts.map((post) => post.user_id)].filter(Boolean))];
  if (!ids.length) return;
  const { data: profiles, error: profileError } = await supabase.from('forum_public_profiles').select('id,full_name,avatar_url').in('id', ids);
  if (profileError) { console.warn('Forum public profile projection unavailable:', profileError); return; }
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const postMeta = root.querySelectorAll('.forum-post-meta');
  posts.forEach((post, index) => {
    const meta = postMeta[index];
    if (!meta || meta.dataset.authorHydrated === 'true') return;
    const time = meta.querySelector('time');
    meta.innerHTML = renderAuthor(profileMap.get(post.user_id));
    if (time) { meta.appendChild(document.createTextNode(' · ')); meta.appendChild(time); }
    meta.dataset.authorHydrated = 'true';
  });
  root.dataset.authorsHydrated = 'true';
}

const observer = new MutationObserver(() => { if (root?.querySelector('.forum-post-meta')) hydrateAuthors(); });
if (root) observer.observe(root, { childList: true, subtree: true });
hydrateAuthors();
