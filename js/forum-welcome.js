import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const WELCOME_TOPIC_ID = 'c6c5872f-1722-4bfb-a5fb-73dcadba76c7';
const root = document.querySelector('#forum-topic');
if (!root || new URLSearchParams(window.location.search).get('id') !== WELCOME_TOPIC_ID) return;

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));

function sanitizeHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI']);
  template.content.querySelectorAll('*').forEach((node) => {
    if (!allowed.has(node.tagName)) node.replaceWith(...node.childNodes);
    else [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));
  });
  return template.innerHTML;
}

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function render() {
  if (document.querySelector('#forum-welcome-cta')) return;
  const meta = root.querySelector('.forum-topic-meta');
  if (!meta) return;

  const cta = document.createElement('section');
  cta.id = 'forum-welcome-cta';
  cta.className = 'forum-welcome-cta';
  cta.innerHTML = `<div><p class="eyebrow">Your turn</p><h2>Introduce yourself to the APEP community</h2><p>Tell us who you are, what you do, your AI or business goal, what you want to learn and how you hope to contribute.</p></div><button class="button button-primary" id="forum-introduce" type="button">✍️ Introduce Yourself</button>`;
  meta.insertAdjacentElement('afterend', cta);

  cta.querySelector('#forum-introduce').addEventListener('click', async () => {
    const user = await getUser();
    if (!user) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.href = `../auth/login.html?next=${encodeURIComponent(next)}`;
      return;
    }
    openComposer();
  });
}

function openComposer() {
  let composer = document.querySelector('#forum-intro-composer');
  if (!composer) {
    composer = document.createElement('section');
    composer.id = 'forum-intro-composer';
    composer.className = 'forum-intro-composer';
    composer.setAttribute('aria-labelledby', 'forum-intro-title');
    composer.innerHTML = `<div class="forum-intro-heading"><div><p class="eyebrow">Community introduction</p><h3 id="forum-intro-title">Write your introduction</h3><p>Keep it practical and authentic. Share a recent win or milestone if you have one.</p></div><button class="forum-close-composer" id="forum-intro-close" type="button" aria-label="Close introduction form">×</button></div><div class="forum-editor"><div class="forum-editor-content" id="forum-intro-body" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Your introduction" data-placeholder="Start with your name, what you do, your AI goal and how you hope to contribute…" tabindex="0"></div><div class="forum-editor-footer"><span>Published as a reply in this welcome discussion.</span><span id="forum-intro-count">0 / 10,000</span></div></div><div class="forum-intro-template"><button type="button" class="button button-secondary" id="forum-use-intro-template">Use introduction template</button><span>Optional — edit every line before publishing.</span></div><div id="forum-intro-status" class="forum-intro-status" role="status" aria-live="polite"></div><div class="forum-form-actions"><button class="button button-secondary" id="forum-intro-cancel" type="button">Cancel</button><button class="button button-primary" id="forum-intro-submit" type="button">Publish Introduction</button></div>`;
    const posts = root.querySelectorAll('.forum-post');
    const postsWrap = root.querySelector('.forum-posts');
    if (postsWrap) postsWrap.insertAdjacentElement('beforebegin', composer);
    else root.appendChild(composer);

    const editor = composer.querySelector('#forum-intro-body');
    const count = composer.querySelector('#forum-intro-count');
    const status = composer.querySelector('#forum-intro-status');
    const updateCount = () => {
      const length = editor.innerText.trim().length;
      count.textContent = `${length} / 10,000`;
      editor.classList.toggle('is-over-limit', length > 10000);
    };
    editor.addEventListener('input', updateCount);
    composer.querySelector('#forum-use-intro-template').addEventListener('click', () => {
      editor.innerHTML = '<p><strong>Name:</strong></p><p><strong>Where I’m from:</strong></p><p><strong>What I do:</strong></p><p><strong>My AI experience:</strong></p><p><strong>My 90-day goal:</strong></p><p><strong>What I want to learn:</strong></p><p><strong>How I can contribute:</strong></p><p><strong>My latest win or milestone:</strong></p>';
      editor.focus();
      updateCount();
    });
    const close = () => { composer.hidden = true; };
    composer.querySelector('#forum-intro-close').addEventListener('click', close);
    composer.querySelector('#forum-intro-cancel').addEventListener('click', close);
    composer.querySelector('#forum-intro-submit').addEventListener('click', async () => {
      const plainText = editor.innerText.trim();
      const body = sanitizeHtml(editor.innerHTML.trim());
      if (!plainText) { status.textContent = 'Please write your introduction before publishing.'; editor.focus(); return; }
      if (plainText.length > 10000) { status.textContent = 'Your introduction is over the 10,000-character limit.'; editor.focus(); return; }
      const user = await getUser();
      if (!user) { const next = `${window.location.pathname}${window.location.search}`; window.location.href = `../auth/login.html?next=${encodeURIComponent(next)}`; return; }
      const submit = composer.querySelector('#forum-intro-submit');
      submit.disabled = true;
      status.textContent = 'Publishing your introduction…';
      const firstPost = root.querySelector('.forum-post');
      const postId = firstPost?.querySelector('[data-reaction-post]')?.dataset.reactionPost || null;
      try {
        const { error } = await supabase.from('forum_posts').insert({
          topic_id: WELCOME_TOPIC_ID,
          user_id: user.id,
          parent_post_id: postId,
          body,
          status: 'visible'
        });
        if (error) throw error;
        status.textContent = 'Your introduction is live. Welcome to APEP! 🎉';
        window.setTimeout(() => window.location.reload(), 700);
      } catch (error) {
        console.error('APEP welcome introduction failed:', error);
        status.textContent = 'Your introduction could not be published. Please try again.';
        submit.disabled = false;
      }
    });
  }
  composer.hidden = false;
  composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => composer.querySelector('#forum-intro-body')?.focus(), 350);
}

const observer = new MutationObserver(() => render());
observer.observe(root, { childList: true, subtree: true });
render();
