import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const root = document.querySelector('#forum-reply');
const params = new URLSearchParams(window.location.search);
const topicId = params.get('id');
const parentPostId = params.get('parent');

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));
function sanitizeHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['P','BR','STRONG','B','EM','I','U','H3','BLOCKQUOTE','UL','OL','LI','A']);
  template.content.querySelectorAll('*').forEach((node) => {
    if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      if (node.tagName !== 'A' || attribute.name !== 'href') node.removeAttribute(attribute.name);
    });
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      try {
        const url = new URL(href, window.location.href);
        if (!['http:','https:'].includes(url.protocol)) node.replaceWith(...node.childNodes);
        else { node.setAttribute('href', url.href); node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer nofollow'); }
      } catch { node.replaceWith(...node.childNodes); }
    }
  });
  return template.innerHTML;
}
function renderBody(body = '') {
  return sanitizeHtml(body);
}
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
async function load() {
  if (!topicId) throw new Error('This reply link is missing its topic ID.');
  const { data: topic, error } = await supabase.from('forum_topics').select('id,title,status,forum_categories(name)').eq('id', topicId).in('status',['open','locked']).single();
  if (error) throw error;
  document.title = `Reply to ${topic.title} | APEP Community`;
  document.querySelector('#forum-reply-back').href = `forum-topic.html?id=${encodeURIComponent(topic.id)}`;
  if (topic.status !== 'open') {
    root.innerHTML = `<div class="forum-empty"><h1>Replies are closed</h1><p>This discussion is locked and no new replies can be published.</p><p><a class="button button-secondary" href="forum-topic.html?id=${encodeURIComponent(topic.id)}">Return to discussion</a></p></div>`;
    return;
  }
  let parent = null;
  if (parentPostId) {
    const { data, error: parentError } = await supabase.from('forum_posts').select('id,body,status').eq('id', parentPostId).eq('topic_id', topic.id).eq('status','visible').maybeSingle();
    if (parentError) throw parentError;
    parent = data;
  }
  const user = await getUser();
  root.innerHTML = `<p class="eyebrow">${escapeHtml(topic.forum_categories?.name || 'COMMUNITY')}</p><h1>Reply to this discussion</h1><div class="forum-reply-context"><span>Topic</span><strong>${escapeHtml(topic.title)}</strong>${parent ? `<div class="forum-reply-parent"><span>Replying to an existing post</span><div>${renderBody(parent.body)}</div></div>` : ''}</div><section class="forum-reply-composer" aria-labelledby="forum-reply-title"><div class="forum-intro-heading"><div><p class="eyebrow">Community reply</p><h2 id="forum-reply-title">Add your contribution</h2><p>Ask a useful question, share an experience, explain a solution, or build on another member’s idea.</p></div></div><div class="forum-editor"><div class="forum-editor-toolbar" role="toolbar" aria-label="Formatting tools"><button type="button" data-command="bold"><strong>B</strong></button><button type="button" data-command="italic"><em>I</em></button><button type="button" data-command="underline"><u>U</u></button><span class="forum-editor-divider" aria-hidden="true"></span><button type="button" data-command="insertUnorderedList">• List</button><button type="button" data-command="insertOrderedList">1. List</button><button type="button" data-command="formatBlock" data-value="blockquote">Quote</button></div><div class="forum-editor-content" id="forum-reply-body" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Your reply" data-placeholder="Write your reply…" tabindex="0"></div><div class="forum-editor-footer"><span>Your reply will be published in this discussion.</span><span id="forum-reply-count">0 / 10,000</span></div></div><div id="forum-reply-status" class="forum-intro-status" role="status" aria-live="polite"></div><div class="forum-form-actions"><a class="button button-secondary" href="forum-topic.html?id=${encodeURIComponent(topic.id)}">Cancel</a><button class="button button-primary" id="forum-reply-submit" type="button">Publish Reply</button></div></section>`;
  const editor = root.querySelector('#forum-reply-body');
  const count = root.querySelector('#forum-reply-count');
  const status = root.querySelector('#forum-reply-status');
  const updateCount = () => { const length = editor.innerText.trim().length; count.textContent = `${length} / 10,000`; editor.classList.toggle('is-over-limit', length > 10000); };
  editor.addEventListener('input', updateCount);
  root.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => { editor.focus(); const command = button.dataset.command; document.execCommand(command, false, button.dataset.value || null); updateCount(); }));
  root.querySelector('#forum-reply-submit').addEventListener('click', async () => {
    const plainText = editor.innerText.trim();
    const body = sanitizeHtml(editor.innerHTML.trim());
    if (!plainText) { status.textContent = 'Please write your reply before publishing.'; editor.focus(); return; }
    if (plainText.length > 10000) { status.textContent = 'Your reply is over the 10,000-character limit.'; editor.focus(); return; }
    const currentUser = await getUser();
    if (!currentUser) { const next = `${window.location.pathname}${window.location.search}`; window.location.href = `../auth/login.html?next=${encodeURIComponent(next)}`; return; }
    const submit = root.querySelector('#forum-reply-submit');
    submit.disabled = true;
    status.textContent = 'Publishing your reply…';
    try {
      const payload = { topic_id: topic.id, user_id: currentUser.id, body, status: 'visible' };
      if (parent?.id) payload.parent_post_id = parent.id;
      const { error: insertError } = await supabase.from('forum_posts').insert(payload);
      if (insertError) throw insertError;
      status.textContent = 'Reply published successfully.';
      window.setTimeout(() => { window.location.href = `forum-topic.html?id=${encodeURIComponent(topic.id)}`; }, 500);
    } catch (publishError) {
      console.error('APEP forum reply failed:', publishError);
      status.textContent = publishError?.message ? `Your reply could not be published: ${publishError.message}` : 'Your reply could not be published. Please try again.';
      submit.disabled = false;
    }
  });
  if (!user) { status.textContent = 'Sign in is required to publish a reply.'; }
}
load().catch((error) => { console.error('APEP forum reply page failed:', error); root.innerHTML = '<div class="forum-empty">This discussion could not be prepared for a reply. Please return to the forum and try again.</div>'; });
