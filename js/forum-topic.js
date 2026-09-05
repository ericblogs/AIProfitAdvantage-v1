import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const root = document.querySelector('#forum-topic');

const REACTIONS = Object.freeze([
  ['like', '👍', 'Like'],
  ['love', '❤️', 'Love'],
  ['helpful', '🤝', 'Helpful'],
  ['insightful', '💡', 'Insightful'],
  ['celebrate', '🎉', 'Celebrate']
]);

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
const formatDate = (value) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const safeAvatarUrl = (value = '') => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  try {
    const url = new URL(String(value), window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};
const renderAuthor = (profile) => {
  const name = String(profile?.full_name || '').trim() || 'Community member';
  const safeName = escapeHtml(name);
  const avatar = safeAvatarUrl(profile?.avatar_url);
  return `<span class="forum-author" aria-label="Posted by ${safeName}">${avatar ? `<img class="forum-author-avatar" src="${escapeHtml(avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}<span class="forum-author-name">${safeName}</span></span>`;
};

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

function renderReactionBar(postId, counts = {}, mine = new Set()) {
  return `<div class="forum-reactions" data-reaction-post="${escapeHtml(postId)}" aria-label="Reactions to this post"><span class="forum-reactions-label">React to this post</span><div class="forum-reaction-list">${REACTIONS.map(([type, emoji, label]) => {
    const count = Number(counts[type] || 0);
    const active = mine.has(type);
    return `<button class="forum-reaction${active ? ' is-active' : ''}" type="button" data-reaction-type="${type}" aria-pressed="${active}" title="${label}"><span class="forum-reaction-emoji" aria-hidden="true">${emoji}</span><span class="forum-reaction-name">${label}</span><span class="forum-reaction-count">${count}</span></button>`;
  }).join('')}</div></div>`;
}

async function loadReactionState(postIds, userId) {
  const state = { counts: new Map(), mine: new Map() };
  if (!postIds.length) return state;
  const { data: countRows, error: countError } = await supabase.from('forum_post_reaction_counts').select('post_id,reaction,reaction_count').in('post_id', postIds);
  if (countError) throw countError;
  (countRows || []).forEach((row) => {
    if (!state.counts.has(row.post_id)) state.counts.set(row.post_id, {});
    state.counts.get(row.post_id)[row.reaction] = row.reaction_count;
  });
  if (userId) {
    const { data: mineRows, error: mineError } = await supabase.from('forum_post_reactions').select('post_id,reaction').eq('user_id', userId).in('post_id', postIds);
    if (mineError) throw mineError;
    (mineRows || []).forEach((row) => {
      if (!state.mine.has(row.post_id)) state.mine.set(row.post_id, new Set());
      state.mine.get(row.post_id).add(row.reaction);
    });
  }
  return state;
}

async function handleReaction(button) {
  const bar = button.closest('[data-reaction-post]');
  const postId = bar?.dataset.reactionPost;
  const reaction = button.dataset.reactionType;
  if (!postId || !reaction) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `../auth/login.html?next=${encodeURIComponent(next)}`;
    return;
  }
  const wasActive = button.getAttribute('aria-pressed') === 'true';
  button.disabled = true;
  const status = document.querySelector('#forum-topic-reaction-status');
  if (status) status.textContent = 'Saving reaction…';
  try {
    if (wasActive) {
      const { error } = await supabase.from('forum_post_reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction', reaction);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('forum_post_reactions').insert({ post_id: postId, user_id: user.id, reaction });
      if (error) throw error;
    }
    const countNode = button.querySelector('.forum-reaction-count');
    const currentCount = Number(countNode?.textContent || 0);
    button.classList.toggle('is-active', !wasActive);
    button.setAttribute('aria-pressed', String(!wasActive));
    if (countNode) countNode.textContent = String(Math.max(0, currentCount + (wasActive ? -1 : 1)));
    if (status) status.textContent = '';
  } catch (error) {
    console.error('Forum reaction failed:', error);
    if (status) status.textContent = 'Your reaction could not be saved. Please try again.';
  } finally {
    button.disabled = false;
  }
}

async function loadTopic() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) throw new Error('This discussion link is missing its topic ID.');
  const { data: topic, error: topicError } = await supabase.from('forum_topics').select('id,title,user_id,status,is_pinned,view_count,created_at,updated_at,forum_categories(name),forum_posts(id,user_id,body,status,created_at,updated_at,parent_post_id)').eq('id', id).in('status', ['open', 'locked']).single();
  if (topicError) throw topicError;
  document.title = `${topic.title} | APEP Community`;
  const posts = (topic.forum_posts || []).filter((post) => post.status === 'visible').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const { data: { user } } = await supabase.auth.getUser();
  const reactionState = await loadReactionState(posts.map((post) => post.id), user?.id || null);
  const authorIds = [...new Set([topic.user_id, ...posts.map((post) => post.user_id)].filter(Boolean))];
  let profileMap = new Map();
  if (authorIds.length) {
    const { data: profiles, error: profileError } = await supabase.from('forum_public_profiles').select('id,full_name,avatar_url').in('id', authorIds);
    if (profileError) console.warn('Forum member identity unavailable:', profileError);
    profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  }
  root.innerHTML = `<p class="eyebrow">${escapeHtml(topic.forum_categories?.name || 'COMMUNITY')}</p><h1>${topic.is_pinned ? '📌 ' : ''}${escapeHtml(topic.title)}</h1><div class="forum-topic-meta"><span>${escapeHtml(topic.status)}</span><span>${topic.view_count || 0} views</span><time datetime="${topic.created_at}">${formatDate(topic.created_at)}</time></div><div id="forum-topic-reaction-status" class="forum-reaction-status" role="status" aria-live="polite"></div><div class="forum-posts">${posts.length ? posts.map((post, index) => `<article class="forum-post"><div class="forum-post-number">#${index + 1}</div><div><div class="forum-post-body">${renderPostBody(post.body)}</div><p class="forum-post-meta">${renderAuthor(profileMap.get(post.user_id))} <span aria-hidden="true">·</span> <time datetime="${post.created_at}">${formatDate(post.created_at)}</time></p>${renderReactionBar(post.id, reactionState.counts.get(post.id) || {}, reactionState.mine.get(post.id) || new Set())}</div></article>`).join('') : '<div class="forum-empty">No visible posts are available for this discussion.</div>'}</div>`;
}

root.addEventListener('click', (event) => {
  const button = event.target.closest('.forum-reaction');
  if (button) handleReaction(button);
});

loadTopic().catch((error) => { console.error(error); root.innerHTML = '<div class="forum-empty">This discussion could not be loaded. Please return to the forum and try again.</div>'; });
